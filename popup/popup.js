// 弹窗脚本

document.addEventListener('DOMContentLoaded', function() {
    console.log('抢票助手弹窗已加载');
    
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
    date.value = today; // 默认设置为今天
    
    // 设置默认刷新间隔
    refreshInterval.value = 5;
    
    // 添加一条初始日志
    addLog('抢票助手已准备就绪，请填写信息并开始抢票');
    
    // 从存储中加载上次的设置
    try {
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
            if (chrome.runtime.lastError) {
                console.error('加载设置失败:', chrome.runtime.lastError);
                return;
            }
            
            console.log('加载设置:', result);
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
    } catch (error) {
        console.error('设置加载出错:', error);
    }
    
    // 保存设置到存储
    function saveSettings() {
        try {
            const selectedSeats = Array.from(seatCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
                
            const settings = {
                fromStation: fromStation.value,
                toStation: toStation.value,
                date: date.value,
                trainNumbers: trainNumbers.value,
                refreshInterval: refreshInterval.value,
                autoSubmit: autoSubmit.checked,
                autoSelectSeat: autoSelectSeat.checked,
                selectedSeats: selectedSeats
            };
            
            console.log('保存设置:', settings);
            chrome.storage.local.set(settings, function() {
                if (chrome.runtime.lastError) {
                    console.error('保存设置失败:', chrome.runtime.lastError);
                }
            });
        } catch (error) {
            console.error('设置保存出错:', error);
        }
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
        console.log('点击开始抢票按钮');
        
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
            trainNumbers: trainNumbers.value ? trainNumbers.value.split(',').map(n => n.trim()).filter(n => n) : [],
            refreshInterval: parseInt(refreshInterval.value) || 5,
            autoSubmit: autoSubmit.checked,
            autoSelectSeat: autoSelectSeat.checked,
            selectedSeats: selectedSeats.map(cb => cb.value)
        };
        
        console.log('抢票参数:', params);
        
        try {
            // 发送消息给background script
            addLog('正在启动抢票...');
            chrome.runtime.sendMessage({
                action: 'startGrabbing',
                params: params
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error('发送消息失败:', chrome.runtime.lastError);
                    addLog('启动失败：' + chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.success) {
                    startBtn.disabled = true;
                    stopBtn.disabled = false;
                    addLog('开始抢票...');
                } else {
                    const errorMsg = (response && response.error) ? response.error : '未知错误';
                    addLog('启动失败：' + errorMsg);
                    console.error('启动失败:', response);
                }
            });
        } catch (error) {
            console.error('发送启动消息时出错:', error);
            addLog('启动失败：' + error.message);
        }
    });
    
    // 停止抢票
    stopBtn.addEventListener('click', function() {
        console.log('点击停止抢票按钮');
        try {
            chrome.runtime.sendMessage({
                action: 'stopGrabbing'
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error('发送停止消息失败:', chrome.runtime.lastError);
                    addLog('停止失败：' + chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.success) {
                    startBtn.disabled = false;
                    stopBtn.disabled = true;
                    addLog('已停止抢票');
                } else {
                    const errorMsg = (response && response.error) ? response.error : '未知错误';
                    addLog('停止失败：' + errorMsg);
                }
            });
        } catch (error) {
            console.error('发送停止消息时出错:', error);
            addLog('停止失败：' + error.message);
        }
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
        
        console.log(`日志: [${time}] ${message}`);
    }
    
    // 监听来自background script的消息
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        console.log('接收到消息:', message);
        if (message.type === 'log') {
            addLog(message.content);
        }
        // 确保返回true保持消息通道开放
        return true;
    });
});
