// 后台常驻进程

// 存储抢票状态
let isGrabbing = false;
let grabInterval = null;
let currentParams = null;

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('收到消息:', message);
    try {
        if (message.action === 'startGrabbing') {
            startGrabbing(message.params);
            sendResponse({ success: true });
        } else if (message.action === 'stopGrabbing') {
            stopGrabbing();
            sendResponse({ success: true });
        }
    } catch (error) {
        console.error('处理消息时出错:', error);
        sendResponse({ success: false, error: error.message });
    }
    return true; // 保持消息通道开放
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
            sendLog('抢票助手已准备就绪，开始监控车票...');
            
            // 开始定时刷新
            grabInterval = setInterval(function() {
                if (!isGrabbing) {
                    return;
                }
                
                // 发送消息给content script
                chrome.tabs.sendMessage(tabId, {
                    action: 'checkTickets',
                    params: currentParams
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('发送消息失败:', chrome.runtime.lastError);
                        sendLog('检查车票失败：' + chrome.runtime.lastError.message);
                        return;
                    }
                    
                    if (response && response.log) {
                        sendLog(response.log);
                    }
                });
            }, currentParams.refreshInterval * 1000);
        });
    } catch (error) {
        console.error('启动抢票流程出错:', error);
        sendLog('启动抢票流程出错: ' + error.message);
        isGrabbing = false;
    }
}

// 发送日志
function sendLog(message) {
    console.log('发送日志:', message);
    chrome.runtime.sendMessage({
        type: 'log',
        content: message
    });
}
