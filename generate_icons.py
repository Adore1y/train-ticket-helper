from PIL import Image, ImageDraw

def create_icon(size):
    # 创建一个新的图片，使用RGBA模式（支持透明度）
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # 绘制背景
    draw.rectangle([0, 0, size, size], fill='#4CAF50')
    
    # 绘制火车形状
    center = size // 2
    radius = size // 3
    draw.ellipse([center - radius, center - radius, 
                  center + radius, center + radius], 
                 fill='white')
    
    # 绘制车轮
    wheel_radius = size // 6
    draw.ellipse([center - wheel_radius, center - wheel_radius,
                  center + wheel_radius, center + wheel_radius],
                 fill='black')
    
    return image

# 生成不同尺寸的图标
sizes = [16, 48, 128]
for size in sizes:
    icon = create_icon(size)
    icon.save(f'assets/icons/icon{size}.png') 