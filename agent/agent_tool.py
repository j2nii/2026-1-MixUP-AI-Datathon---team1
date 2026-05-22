# agent_tool.py
import os
import openai
from dotenv import load_dotenv

# .env 파일의 환경변수를 시스템에 로드합니다.
load_dotenv()
def call_solar_agent(system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
    """
    모든 에이전트가 공통으로 사용할 Upstage Solar Pro 3 호출 코어 함수
    """
    api_key = os.environ.get("UP_STAGE_API")
    
    if not api_key:
        raise ValueError("Error: '.env' 파일에서 'UP_STAGE_API' 키를 찾을 수 없습니다.")

    # base_url 끝에 /v1을 추가하여 OpenAI Router 경로를 정확히 지정합니다.
    client = openai.OpenAI(
        base_url="https://api.upstage.ai/v1/solar",
        api_key=api_key
    )
    
    response = client.chat.completions.create(
        model="solar-pro",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=temperature
    )
    
    return response.choices[0].message.content

# =====================================================================
# 테스트 실행 로직 (이 파일이 직접 실행될 때만 동작합니다)
# =====================================================================
if __name__ == "__main__":
    print("🚀 Solar Agent API 통신 테스트를 시작합니다...")
    
    # 1. 테스트용 프롬프트 작성 (간단한 라우팅 에이전트 역할 부여)
    test_system = (
        "너는 사용자의 문장이 데이터베이스 조회를 요청하는 것인지 일반 대화인지 분류하는 라우팅 에이전트야. "
        "오직 'SQL' 또는 'GENERAL'이라는 단어 하나만 반환해."
    )
    test_user = "결제 금액이 가장 큰 5개만 보여줘"
    
    try:
        print(f"입력 문장: '{test_user}'")
        print("요청 송신 중...")
        
        # 2. 함수 호출
        result = call_solar_agent(system_prompt=test_system, user_prompt=test_user)
        
        # 3. 결과 출력
        print("\n================ [ 테스트 결과 ] ================")
        print(f"에이전트 응답: {result}")
        print("=================================================")
        print("✅ API 연결 및 응답이 정상적으로 완료되었습니다!")
        
    except Exception as e:
        print("\n❌ 테스트 중 에러가 발생했습니다.")
        print(f"에러 내용: {e}")