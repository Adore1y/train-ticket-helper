// 后台常驻进程
console.log('铁路抢票助手后台脚本已加载', new Date().toLocaleTimeString());

// 调试信息
let debugLogs = [];
function logDebug(message) {
    const time = new Date().toLocaleTimeString();
    const logEntry = `[${time}] ${message}`;
    console.log(logEntry);
    debugLogs.push(logEntry);
    
    // 保留最近的100条日志
    if (debugLogs.length > 100) {
        debugLogs.shift();
    }
}

// 立即记录启动信息
logDebug('后台服务启动');

// 存储抢票状态
let isGrabbing = false;
let grabInterval = null;
let currentParams = null;

// 用于测试后台脚本是否正常工作
function testBackgroundScript() {
    console.log('后台脚本测试：正常工作中');
    return true;
}

// 监听扩展安装
chrome.runtime.onInstalled.addListener(function() {
    console.log('铁路抢票助手已安装/更新');
});

// 确保 service worker 在第一次加载完成时发送自身状态
chrome.runtime.onStartup.addListener(function() {
    console.log('浏览器启动，服务已就绪');
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    logDebug(`收到消息: ${JSON.stringify(message)} 来自: ${sender.id || 'unknown'}`);
    
    // 确保始终响应ping请求
    if (message && message.action === 'ping') {
        logDebug('响应ping请求');
        sendResponse({ success: true, pong: true, time: new Date().toISOString() });
        return true;
    }
    
    // 响应testBackground请求
    if (message && message.action === 'testBackground') {
        logDebug('响应测试请求');
        sendResponse({ 
            success: true, 
            working: true, 
            time: new Date().toISOString(),
            logs: debugLogs.slice(-5) // 发送最近5条日志
        });
        return true;
    }
    
    // 对于其他请求，先记录后续处理
    if (message && message.action) {
        logDebug(`处理${message.action}请求`);
    }
    
    // 为了保持消息通道开放，返回true
    return true;
});

// 开始抢票
function startGrabbing(params) {
    console.log('开始抢票，参数:', params);
    if (isGrabbing) {
        console.log('已经在抢票中');
        return;
    }
    
    isGrabbing = true;
    currentParams = params;
    
    try {
        // 打开12306网站
        chrome.tabs.create({
            url: 'https://www.12306.cn/index/'
        }, function(tab) {
            if (chrome.runtime.lastError) {
                console.error('创建标签页出错:', chrome.runtime.lastError);
                isGrabbing = false;
                sendLog('打开12306网站失败: ' + chrome.runtime.lastError.message);
                return;
            }
            
            // 等待页面加载完成
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    // 延迟一下再执行，确保页面完全加载
                    setTimeout(function() {
                        startGrabbingProcess(tab.id);
                    }, 1000);
                }
            });
            
            // 直接给用户反馈
            sendLog('已打开12306网站，准备开始抢票...');
        });
    } catch (error) {
        console.error('开始抢票过程中出错:', error);
        isGrabbing = false;
        sendLog('启动抢票失败: ' + error.message);
    }
}

// 停止抢票
function stopGrabbing() {
    console.log('停止抢票');
    if (!isGrabbing) {
        return;
    }
    
    isGrabbing = false;
    if (grabInterval) {
        clearInterval(grabInterval);
        grabInterval = null;
    }
    
    // 发送日志
    sendLog('已停止抢票');
}

// 抢票主流程
function startGrabbingProcess(tabId) {
    console.log('开始抢票流程，标签ID:', tabId);
    try {
        // 尝试发送消息给已经存在的内容脚本
        chrome.tabs.sendMessage(tabId, { action: 'ping' }, function(response) {
            if (chrome.runtime.lastError) {
                console.log('内容脚本尚未加载，正在注入');
                
                // 注入内容脚本
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content/content.js']
                }, function(results) {
                    if (chrome.runtime.lastError) {
                        console.error('注入脚本失败:', chrome.runtime.lastError);
                        sendLog('注入脚本失败：' + chrome.runtime.lastError.message);
                        isGrabbing = false;
                        return;
                    }
                    
                    console.log('脚本注入成功，设置定时刷新');
                    startRefreshInterval(tabId);
                });
            } else {
                console.log('内容脚本已加载，直接开始监控');
                startRefreshInterval(tabId);
            }
        });
    } catch (error) {
        console.error('启动抢票流程出错:', error);
        sendLog('启动抢票流程出错: ' + error.message);
        isGrabbing = false;
    }
}

// 开始定时刷新
function startRefreshInterval(tabId) {
    sendLog('抢票助手已准备就绪，开始监控车票...');
    
    // 确保之前的定时器被清除
    if (grabInterval) {
        clearInterval(grabInterval);
    }
    
    // 立即执行一次检查
    sendTicketCheckMessage(tabId);
    
    // 设置定时执行
    grabInterval = setInterval(function() {
        if (!isGrabbing) {
            return;
        }
        sendTicketCheckMessage(tabId);
    }, (currentParams.refreshInterval || 5) * 1000);
}

// 发送车票检查消息
function sendTicketCheckMessage(tabId) {
    if (!isGrabbing || !currentParams) {
        return;
    }
    
    chrome.tabs.get(tabId, function(tab) {
        if (chrome.runtime.lastError || !tab) {
            console.error('标签页已关闭或出错:', chrome.runtime.lastError);
            stopGrabbing();
            sendLog('抢票标签页已关闭，已停止抢票');
            return;
        }
        
        // 发送消息给content script
        chrome.tabs.sendMessage(tabId, {
            action: 'checkTickets',
            params: currentParams
        }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('发送消息失败:', chrome.runtime.lastError);
                // 不立即停止，因为可能是临时错误
                sendLog('检查车票失败，将在下次刷新时重试');
                return;
            }
            
            if (response && response.log) {
                sendLog(response.log);
            }
        });
    });
}

// 发送日志
function sendLog(message) {
    console.log('发送日志:', message);
    try {
        chrome.runtime.sendMessage({
            type: 'log',
            content: message
        });
    } catch (error) {
        console.error('发送日志出错:', error);
    }
}

// 保持活跃状态
setInterval(function() {
    logDebug('心跳检查 - 服务正在运行');
}, 25000);

// 记录启动完成
logDebug('后台脚本初始化完成');
