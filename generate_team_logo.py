import boto3
import json
import base64
from datetime import datetime

def generate_team_logo():
    bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
    
    prompt = """
    Create a playful, kitsch-style logo with ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS. 
    The design should be:
    - Retro-futuristic with neon colors (hot pink, electric blue, lime green, bright yellow)
    - Include cute pixelated elements or 8-bit style graphics
    - Feature adorable kawaii-style ghosts as the main characters
    - Cute ghosts with big sparkly eyes and happy expressions
    - Mix of digital glitch effects and smooth gradients
    - NO text anywhere including bottom, top, or sides
    - NO "VARCRON" or any other text
    - NO letters, NO typography - only visual elements
    - Overall vibe: fun, energetic, slightly chaotic but charming
    Style: Vaporwave meets kawaii culture, digital art, maximalist design, completely text-free logo
    """
    
    models = [
        'amazon.nova-canvas-v1:0',
        'amazon.titan-image-generator-v1'
    ]
    
    for model_id in models:
        try:
            print(f"🔄 {model_id} 모델로 시도 중...")
            
            body = {
                "taskType": "TEXT_IMAGE",
                "textToImageParams": {
                    "text": prompt
                },
                "imageGenerationConfig": {
                    "numberOfImages": 1,
                    "quality": "standard",
                    "height": 1024,
                    "width": 1024,
                    "cfgScale": 8.0,
                    "seed": 42
                }
            }
            
            response = bedrock.invoke_model(
                modelId=model_id,
                body=json.dumps(body),
                contentType='application/json',
                accept='application/json'
            )
            
            response_body = json.loads(response['body'].read())
            image_data = base64.b64decode(response_body['images'][0])
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"kitsch_team_logo_{timestamp}.png"
            
            with open(filename, 'wb') as f:
                f.write(image_data)
            
            print(f"✅ 키치한 팀 로고가 성공적으로 생성되었습니다: {filename}")
            print(f"📍 사용된 모델: {model_id}")
            return filename
            
        except Exception as e:
            print(f"❌ {model_id} 모델 실패: {str(e)}")
            continue
    
    print("❌ 모든 모델에서 이미지 생성에 실패했습니다.")
    return None

if __name__ == "__main__":
    generate_team_logo()