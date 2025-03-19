// 内容脚本

// 监听来自background script的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'checkTickets') {
        checkTickets(message.params);
        sendResponse({ success: true });
    }
    return true;
});

// 检查车票
function checkTickets(params) {
    // 检查是否在12306网站
    if (!window.location.hostname.includes('12306.cn')) {
        sendLog('请在12306网站使用抢票助手');
        return;
    }
    
    // 检查是否已登录
    if (!isLoggedIn()) {
        sendLog('请先登录12306账号');
        return;
    }
    
    // 检查是否在查询页面
    if (!isQueryPage()) {
        sendLog('请先进入车票查询页面');
        return;
    }
    
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
    return !!document.querySelector('.login-hd-account');
}

// 检查是否在查询页面
function isQueryPage() {
    // 检查是否存在查询表单元素
    return !!document.querySelector('#query_ticket');
}

// 填写查询表单
function fillQueryForm(params) {
    // 填写出发站
    const fromStationInput = document.querySelector('#fromStationText');
    if (fromStationInput) {
        fromStationInput.value = params.fromStation;
        fromStationInput.dispatchEvent(new Event('input'));
    }
    
    // 填写到达站
    const toStationInput = document.querySelector('#toStationText');
    if (toStationInput) {
        toStationInput.value = params.toStation;
        toStationInput.dispatchEvent(new Event('input'));
    }
    
    // 填写出发日期
    const dateInput = document.querySelector('#train_date');
    if (dateInput) {
        dateInput.value = params.date;
        dateInput.dispatchEvent(new Event('change'));
    }
}

// 点击查询按钮
function clickQueryButton() {
    const queryButton = document.querySelector('#query_ticket');
    if (queryButton) {
        queryButton.click();
    }
}

// 等待查询结果
function waitForResults(params) {
    // 设置超时时间
    const timeout = setTimeout(function() {
        sendLog('查询超时，请检查网络连接');
    }, 10000);
    
    // 监听查询结果
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.target.classList.contains('train-list')) {
                clearTimeout(timeout);
                observer.disconnect();
                processResults(params);
            }
        });
    });
    
    // 开始观察
    const trainList = document.querySelector('.train-list');
    if (trainList) {
        observer.observe(trainList, { childList: true });
    }
}

// 处理查询结果
function processResults(params) {
    const trainRows = document.querySelectorAll('.train-list tr');
    let found = false;
    
    trainRows.forEach(function(row) {
        // 获取车次号
        const trainNumber = row.querySelector('.train-number').textContent;
        
        // 检查是否是目标车次
        if (params.trainNumbers.length === 0 || params.trainNumbers.includes(trainNumber)) {
            // 检查座位类型
            params.selectedSeats.forEach(function(seat) {
                const seatCell = row.querySelector(`.${seat}`);
                if (seatCell && seatCell.textContent !== '--' && seatCell.textContent !== '无') {
                    found = true;
                    // 点击预订按钮
                    const bookButton = row.querySelector('.book-btn');
                    if (bookButton) {
                        bookButton.click();
                    }
                }
            });
        }
    });
    
    if (!found) {
        sendLog('未找到符合条件的车票');
    }
}

// 发送日志
function sendLog(message) {
    chrome.runtime.sendMessage({
        type: 'log',
        content: message
    });
}
