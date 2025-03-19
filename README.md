# 铁路抢票助手

这是一个Chrome浏览器扩展，用于辅助在12306网站抢票。通过自动刷新和智能识别，提高抢票成功率。

## 功能特点

- **自动刷新监控**：定时自动刷新12306余票查询页面，频率可自定义
- **多车次筛选**：支持同时监控多个车次，提高抢票成功率
- **多席别选择**：同时监控多种座位类型，按照优先级顺序抢票
- **自动下单提交**：发现符合条件的车票后自动提交订单
- **自动选座功能**：可配置是否自动选择座位
- **实时操作日志**：详细记录每一步操作，方便跟踪抢票进度
- **桌面通知提醒**：重要状态变更时推送桌面通知

## 详细安装步骤

1. **下载扩展**:
   - 将本仓库克隆或下载到本地：`git clone [仓库地址]`
   - 或直接下载ZIP文件并解压到本地文件夹

2. **安装到Chrome浏览器**:
   - 打开Chrome浏览器，在地址栏输入：`chrome://extensions/`
   - 确保右上角的"开发者模式"已开启（滑块显示蓝色）
   - 点击左上角的"加载已解压的扩展程序"按钮
   - 在弹出的文件选择器中，选择含有`manifest.json`文件的文件夹
   - 成功安装后，浏览器右上角扩展栏会显示铁路抢票助手图标

## 详细使用方法

1. **准备工作**:
   - 登录12306官网 (https://www.12306.cn) 并保持登录状态
   - 确保已在12306添加了常用联系人，抢票时会自动选择

2. **打开抢票助手**:
   - 点击浏览器右上角的铁路抢票助手图标，打开控制面板

3. **设置车票信息**:
   - **出发站**：输入完整的出发站名称，如"北京西"、"上海"
   - **到达站**：输入完整的到达站名称，如"广州南"、"杭州东"
   - **出发日期**：选择您要出行的日期
   - **车次号**：(可选) 输入特定的车次，多个车次用英文逗号分隔，如"G101,G103,G105"，留空则监控所有车次

4. **选择座位类型**:
   - 勾选您希望购买的座位类型，可多选
   - 系统会按照从上到下的优先级尝试购票

5. **抢票设置**:
   - **刷新间隔**：设置自动刷新的时间间隔，建议5-10秒，避免过于频繁导致IP被限制
   - **自动提交订单**：勾选后发现符合条件的车票会自动下单，不勾选则只提醒不下单
   - **自动选座**：勾选后系统会自动选择座位，不勾选则使用系统默认分配

6. **开始抢票**:
   - 点击"开始抢票"按钮，系统会自动打开12306官网并开始监控
   - 抢票过程中，可随时点击"停止抢票"按钮停止监控
   - 操作日志区域会实时显示抢票进度和状态

7. **抢票成功后**:
   - 系统会自动提交订单并发出通知
   - 请在规定时间内完成支付，否则订单会自动取消

## 高级技巧

- **多人抢票**：添加多个常用联系人，系统会自动勾选第一个联系人
- **高峰期抢票**：在高铁列车开售前5分钟开始运行抢票助手，提高成功率
- **候补抢票策略**：若直接购票失败，可尝试候补策略
- **错峰抢票**：选择热门线路的小站作为出发站或到达站，然后在列车上实际上下车
- **夜间抢票**：夜间（23:00-凌晨1:00）系统负载较低，抢票成功率更高

## 常见问题

- **为什么会自动退出登录？**
  - 12306有自动退出机制，建议在抢票前重新登录并勾选"记住我"
  
- **为什么抢到票后没有自动下单？**
  - 确认是否勾选了"自动提交订单"选项
  - 请检查是否已在12306添加常用联系人

- **为什么设置了特定车次却没有抢到？**
  - 确认车次号输入格式正确，多个车次使用英文逗号分隔
  - 热门车次竞争激烈，可以尝试增加更多备选车次

- **如何避免频繁刷新导致的IP限制？**
  - 建议将刷新间隔设置在5秒以上
  - 避免同时运行多个抢票工具

## 注意事项

- 使用前请确保已登录12306官网并添加常用联系人
- 刷新间隔不建议设置过短（建议≥5秒），以免被12306网站限制访问
- 抢票过程中不要关闭浏览器或正在运行抢票的标签页
- 抢票成功后请在规定时间内完成支付
- 本插件仅供学习研究使用，请勿用于商业用途

## 隐私说明

本扩展不会收集或上传任何个人信息，所有操作均在本地完成。不需要任何服务器支持，完全在用户浏览器内运行。

## 技术实现

- 使用Chrome Extension Manifest V3 开发，符合最新浏览器扩展规范
- 后台服务使用Service Worker，减少资源占用
- 内容脚本通过DOM操作与12306网站交互，无需破解或绕过安全措施
- 使用Chrome存储API保存用户设置，关闭浏览器后设置仍然保留

## 如何贡献代码

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个Pull Request

## 许可证

MIT License
