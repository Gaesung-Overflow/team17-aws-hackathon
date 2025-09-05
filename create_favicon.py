from PIL import Image
import os

def create_favicon():
    input_file = "kitsch_team_logo_20250905_231057.png"
    
    if not os.path.exists(input_file):
        print(f"❌ {input_file} 파일을 찾을 수 없습니다.")
        return
    
    # 원본 이미지 열기
    img = Image.open(input_file)
    
    # 파비콘 크기들
    sizes = [16, 32, 48, 64, 128, 256]
    
    for size in sizes:
        # 이미지 리사이즈 (고품질 리샘플링)
        favicon = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # 파일명 생성
        filename = f"favicon-{size}x{size}.png"
        
        # 저장
        favicon.save(filename, "PNG")
        print(f"✅ {filename} 생성 완료")
    
    # 표준 favicon.ico 생성 (16x16, 32x32 포함)
    favicon_16 = img.resize((16, 16), Image.Resampling.LANCZOS)
    favicon_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
    
    favicon_16.save("favicon.ico", format="ICO", sizes=[(16, 16), (32, 32)])
    print("✅ favicon.ico 생성 완료")

if __name__ == "__main__":
    create_favicon()