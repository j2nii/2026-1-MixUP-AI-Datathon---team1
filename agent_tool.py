import openai

def call_solar_agent(system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
    """
    모든 에이전트가 공통으로 사용할 Upstage Solar Pro 3 호출 코어 함수
    """
    client = openai.OpenAI(
        base_url="https://api.upstage.ai/v1/solar",
        api_key="YOUR_SOLAR_API_KEY"
    )
    
    response = client.chat.completions.create(
        model="solar-pro-3",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=temperature # SQL이나 라우팅은 정밀해야 하므로 낮은 값(0.0~0.2) 추천
    )
    return response.choices[0].message.content