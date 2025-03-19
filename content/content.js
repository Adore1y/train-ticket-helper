// 内容脚本

console.log('铁路抢票助手内容脚本已加载');

// 监听来自background script的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('内容脚本收到消息:', message);
    try {
        if (message.action === 'checkTickets') {
            checkTickets(message.params);
            sendResponse({ success: true, log: '正在检查车票...' });
        } else if (message.action === 'ping') {
            // 响应ping请求
            sendResponse({ success: true, pong: true });
        }
    } catch (error) {
        console.error('处理消息时出错:', error);
        sendResponse({ success: false, error: error.message, log: '检查车票出错: ' + error.message });
    }
    return true;
});

// 检查车票
function checkTickets(params) {
    console.log('检查车票，参数:', params);
    
    // 检查是否在12306网站
    if (!window.location.hostname.includes('12306.cn')) {
        sendLog('当前不在12306网站，无法抢票');
        return;
    }
    
    // 检查是否已登录
    if (!isLoggedIn()) {
        sendLog('请先登录12306账号');
        // 尝试跳转到登录页面
        if (window.location.pathname !== '/index/' && !window.location.pathname.includes('login')) {
            window.location.href = 'https://kyfw.12306.cn/otn/login/init';
            sendLog('正在跳转到登录页面...');
        }
        return;
    }
    
    // 检查是否在查询页面
    if (!isQueryPage()) {
        sendLog('正在跳转到车票查询页面...');
        window.location.href = 'https://kyfw.12306.cn/otn/leftTicket/init';
        return;
    }
    
    sendLog('开始查询车票...');
    
    // 填写查询表单
    fillQueryForm(params);
    
    // 点击查询按钮
    clickQueryButton();
    
    // 等待查询结果
    waitForResults(params);
}

// 检查是否已登录
function isLoggedIn() {
    // 检查是否存在登录状态元素
    const loginElement = document.querySelector('.login-hd-account') || 
                        document.querySelector('.user-name') ||
                        document.getElementById('login_user');
    
    console.log('登录状态检查:', !!loginElement);
    return !!loginElement;
}

// 检查是否在查询页面
function isQueryPage() {
    // 检查是否存在查询表单元素
    const queryButton = document.querySelector('#query_ticket') ||
                       document.querySelector('button[id$="query_ticket"]');
    
    console.log('查询页面检查:', !!queryButton);
    return !!queryButton;
}

// 填写查询表单
function fillQueryForm(params) {
    console.log('填写查询表单');
    
    // 填写出发站
    const fromStationInput = document.querySelector('#fromStationText') ||
                            document.querySelector('input[id$="fromStationText"]');
    if (fromStationInput) {
        fromStationInput.value = params.fromStation;
        fromStationInput.dispatchEvent(new Event('input'));
        console.log('已填写出发站:', params.fromStation);
    } else {
        console.error('未找到出发站输入框');
    }
    
    // 填写到达站
    const toStationInput = document.querySelector('#toStationText') ||
                          document.querySelector('input[id$="toStationText"]');
    if (toStationInput) {
        toStationInput.value = params.toStation;
        toStationInput.dispatchEvent(new Event('input'));
        console.log('已填写到达站:', params.toStation);
    } else {
        console.error('未找到到达站输入框');
    }
    
    // 填写出发日期
    const dateInput = document.querySelector('#train_date') ||
                     document.querySelector('input[id$="train_date"]');
    if (dateInput) {
        dateInput.value = params.date;
        dateInput.dispatchEvent(new Event('change'));
        console.log('已填写出发日期:', params.date);
    } else {
        console.error('未找到出发日期输入框');
    }
}

// 点击查询按钮
function clickQueryButton() {
    console.log('点击查询按钮');
    const queryButton = document.querySelector('#query_ticket') ||
                       document.querySelector('button[id$="query_ticket"]');
    if (queryButton) {
        queryButton.click();
        console.log('已点击查询按钮');
    } else {
        console.error('未找到查询按钮');
        sendLog('未找到查询按钮，请手动点击查询');
    }
}

// 等待查询结果
function waitForResults(params) {
    console.log('等待查询结果');
    // 设置超时时间
    const timeout = setTimeout(function() {
        sendLog('查询超时，请检查网络连接');
    }, 10000);
    
    // 监听查询结果
    setTimeout(function() {
        try {
            const trainList = document.querySelector('.train-list') ||
                              document.querySelector('#trainum') ||
                              document.querySelector('.ticket-info');
            
            if (trainList) {
                clearTimeout(timeout);
                processResults(params);
            } else {
                console.log('未找到车次列表，可能仍在加载中');
            }
        } catch (error) {
            console.error('等待查询结果时出错:', error);
        }
    }, 3000);
}

// 处理查询结果
function processResults(params) {
    console.log('处理查询结果');
    const trainRows = document.querySelectorAll('.train-list tr') ||
                     document.querySelectorAll('#ticket_tabel_id tr:not(.thead)');
    let found = false;
    
    if (!trainRows || trainRows.length === 0) {
        sendLog('未找到车次信息，可能没有符合条件的车次');
        return;
    }
    
    console.log('找到', trainRows.length, '个车次');
    
    trainRows.forEach(function(row) {
        try {
            // 获取车次号
            const trainNumberElement = row.querySelector('.train-number') ||
                                       row.querySelector('.number');
            
            if (!trainNumberElement) {
                console.log('未找到车次号元素，跳过此行');
                return;
            }
            
            const trainNumber = trainNumberElement.textContent.trim();
            console.log('处理车次:', trainNumber);
            
            // 检查是否是目标车次
            if (params.trainNumbers.length === 0 || params.trainNumbers.includes(trainNumber)) {
                // 检查座位类型
                params.selectedSeats.forEach(function(seat) {
                    const seatSelector = `.${seat}` || `[id*="${seat}"]`;
                    const seatCell = row.querySelector(seatSelector);
                    
                    if (seatCell && seatCell.textContent.trim() !== '--' && seatCell.textContent.trim() !== '无') {
                        found = true;
                        console.log('找到有票的座位类型:', seat);
                        sendLog(`车次 ${trainNumber} 的 ${seat} 有票！`);
                        
                        // 如果配置了自动提交订单
                        if (params.autoSubmit) {
                            const bookButton = row.querySelector('.btn72') ||
                                               row.querySelector('.btn-primary');
                            
                            if (bookButton) {
                                sendLog(`正在预订车次 ${trainNumber}...`);
                                bookButton.click();
                            } else {
                                sendLog('未找到预订按钮，请手动点击预订');
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('处理车次行时出错:', error);
        }
    });
    
    if (!found) {
        sendLog('未找到符合条件的有票车次，将继续监控...');
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
