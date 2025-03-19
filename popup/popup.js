// 弹窗脚本

document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const logContent = document.getElementById('logContent');
    
    // 获取表单元素
    const fromStation = document.getElementById('fromStation');
    const toStation = document.getElementById('toStation');
    const date = document.getElementById('date');
    const trainNumbers = document.getElementById('trainNumbers');
    const refreshInterval = document.getElementById('refreshInterval');
    const autoSubmit = document.getElementById('autoSubmit');
    const autoSelectSeat = document.getElementById('autoSelectSeat');
    
    // 获取所有座位类型复选框
    const seatCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    
    // 设置日期输入框的最小值为今天
    const today = new Date().toISOString().split('T')[0];
    date.min = today;
    
    // 从存储中加载上次的设置
    chrome.storage.local.get([
        'fromStation',
        'toStation',
        'date',
        'trainNumbers',
        'refreshInterval',
        'autoSubmit',
        'autoSelectSeat',
        'selectedSeats'
    ], function(result) {
        if (result.fromStation) fromStation.value = result.fromStation;
        if (result.toStation) toStation.value = result.toStation;
        if (result.date) date.value = result.date;
        if (result.trainNumbers) trainNumbers.value = result.trainNumbers;
        if (result.refreshInterval) refreshInterval.value = result.refreshInterval;
        if (result.autoSubmit) autoSubmit.checked = result.autoSubmit;
        if (result.autoSelectSeat) autoSelectSeat.checked = result.autoSelectSeat;
        if (result.selectedSeats) {
            result.selectedSeats.forEach(seat => {
                const checkbox = Array.from(seatCheckboxes).find(cb => cb.value === seat);
                if (checkbox) checkbox.checked = true;
            });
        }
    });
    
    // 保存设置到存储
    function saveSettings() {
        const selectedSeats = Array.from(seatCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
            
        chrome.storage.local.set({
            fromStation: fromStation.value,
            toStation: toStation.value,
            date: date.value,
            trainNumbers: trainNumbers.value,
            refreshInterval: refreshInterval.value,
            autoSubmit: autoSubmit.checked,
            autoSelectSeat: autoSelectSeat.checked,
            selectedSeats: selectedSeats
        });
    }
    
    // 添加输入事件监听器
    [fromStation, toStation, date, trainNumbers, refreshInterval].forEach(input => {
        input.addEventListener('change', saveSettings);
    });
    
    [autoSubmit, autoSelectSeat].forEach(checkbox => {
        checkbox.addEventListener('change', saveSettings);
    });
    
    seatCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', saveSettings);
    });
    
    // 开始抢票
    startBtn.addEventListener('click', function() {
        // 验证必填字段
        if (!fromStation.value || !toStation.value || !date.value) {
            addLog('请填写出发站、到达站和出发日期！');
            return;
        }
        
        // 验证是否选择了座位类型
        const selectedSeats = Array.from(seatCheckboxes).filter(cb => cb.checked);
        if (selectedSeats.length === 0) {
            addLog('请至少选择一种座位类型！');
            return;
        }
        
        // 准备抢票参数
        const params = {
            fromStation: fromStation.value,
            toStation: toStation.value,
            date: date.value,
            trainNumbers: trainNumbers.value.split(',').map(n => n.trim()).filter(n => n),
            refreshInterval: parseInt(refreshInterval.value),
            autoSubmit: autoSubmit.checked,
            autoSelectSeat: autoSelectSeat.checked,
            selectedSeats: selectedSeats.map(cb => cb.value)
        };
        
        // 发送消息给background script
        chrome.runtime.sendMessage({
            action: 'startGrabbing',
            params: params
        }, function(response) {
            if (response && response.success) {
                startBtn.disabled = true;
                stopBtn.disabled = false;
                addLog('开始抢票...');
            } else {
                addLog('启动失败：' + (response ? response.error : '未知错误'));
            }
        });
    });
    
    // 停止抢票
    stopBtn.addEventListener('click', function() {
        chrome.runtime.sendMessage({
            action: 'stopGrabbing'
        }, function(response) {
            if (response && response.success) {
                startBtn.disabled = false;
                stopBtn.disabled = true;
                addLog('已停止抢票');
            } else {
                addLog('停止失败：' + (response ? response.error : '未知错误'));
            }
        });
    });
    
    // 添加日志
    function addLog(message) {
        const time = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${time}] ${message}`;
        logContent.insertBefore(logEntry, logContent.firstChild);
        
        // 限制日志数量
        while (logContent.children.length > 100) {
            logContent.removeChild(logContent.lastChild);
        }
    }
    
    // 监听来自background script的消息
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.type === 'log') {
            addLog(message.content);
        }
    });
});
