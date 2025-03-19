// 后台常驻进程

// 存储抢票状态
let isGrabbing = false;
let grabInterval = null;
let currentParams = null;

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'startGrabbing') {
        startGrabbing(message.params);
        sendResponse({ success: true });
    } else if (message.action === 'stopGrabbing') {
        stopGrabbing();
        sendResponse({ success: true });
    }
    return true; // 保持消息通道开放
});

// 开始抢票
function startGrabbing(params) {
    if (isGrabbing) {
        return;
    }
    
    isGrabbing = true;
    currentParams = params;
    
    // 打开12306网站
    chrome.tabs.create({
        url: 'https://www.12306.cn/index/'
    }, function(tab) {
        // 等待页面加载完成
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                startGrabbingProcess(tab.id);
            }
        });
    });
}

// 停止抢票
function stopGrabbing() {
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
    // 注入内容脚本
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content/content.js']
    }, function(results) {
        if (chrome.runtime.lastError) {
            sendLog('注入脚本失败：' + chrome.runtime.lastError.message);
            return;
        }
        
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
                    sendLog('检查车票失败：' + chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.log) {
                    sendLog(response.log);
                }
            });
        }, currentParams.refreshInterval * 1000);
    });
}

// 发送日志
function sendLog(message) {
    chrome.runtime.sendMessage({
        type: 'log',
        content: message
    });
}
