import json
import re
from agent_tool import call_solar_agent
import os
from dotenv import load_dotenv

# -----------------------------------------------------------------
# 1단계: Routing Agent (의도 분석 및 도메인 분류)
# -----------------------------------------------------------------
def run_Routing_Agent(user_question: str):
    routing_system_prompt = """

    너는 사용자 질문을 분석하는
    Router Agent이다.

    역할:
    1.
    질문이 SQL 조회 요청인지 판단

    2.
    SQL 생성을 위해 정보가 충분한지 판단

    =====================================
    [판단 기준]

    SQL:
    - 데이터 조회
    - 통계 요청
    - 매출 분석
    - 지표 확인

    GENERAL:
    - 일반 대화
    - 인사
    - 잡담

    =====================================
    [모호성 판단]

매우 중요한 규칙:

사용자 질문만으로
대략적인 SQL 생성이 가능하다면
needs_clarification=false 로 설정하라.

추가 질문은
정말 SQL 생성이 불가능할 때만 수행하라.

예시:

clarification 필요한 경우:
- "대박 난 웹툰 보여줘"
- "인기 상품 알려줘"

clarification 필요 없는 경우:
- "지난달 웹툰 매출 보여줘"
- "12월 액션 웹툰 매출"
- "네이버 웹툰 유저 수"

사용자가 세부 조건을 모두 말하지 않아도
기본적인 SQL 생성이 가능하면
그대로 진행하라.

    =====================================
    [출력 형식]

    반드시 순수 JSON 객체만 출력하라.
    ```json 같은 마크다운 코드블록 사용 금지.
    설명 금지.
    추가 문장 금지.

    {
      "route": "",
      "needs_clarification": true,
      "clarification_question": ""
    }

    """
    response = call_solar_agent(

        system_prompt=routing_system_prompt,

        user_prompt=user_question,

        temperature=0.0
    )

    print(response)

    return json.loads(response)
        
def run_Create_SQL_Agent(user_question: str, error_message: str = ""):
    # dataset.py의 실제 인메모리 패션 이커머스 DB 스펙 정보로 대체합니다.
    schema = """
table 'products'
- product_id VARCHAR (Primary Key)
- product_name VARCHAR (상품 이름)
- category VARCHAR (카테고리: 상의, 하의, 아우터, 스니커즈 등)
- price INT (가격)
- stock INT
- registration_date DATE

table 'users'
- user_id INT (Primary Key)
- username VARCHAR
- age INT
- gender VARCHAR
- membership_level VARCHAR
- signup_date DATE

table 'orders'
- order_id INT (Primary Key)
- user_id INT
- order_date DATE
- total_amount INT
- status VARCHAR

table 'order_items'
- order_item_id INT (Primary Key)
- order_id INT
- product_id VARCHAR
- quantity INT
- price INT
"""
    
    sql_system_prompt = f"""
    너는 Text-to-SQL 전문 Agent이다.

    아래 DB Schema를 참고하여
    정확한 SQL만 생성하라.

    =====================================
    [DB Schema]

    {schema}

    =====================================
    [규칙]

    1.
    SELECT 기반 조회 SQL만 생성

    2.
    DROP
    DELETE
    UPDATE
    INSERT
    사용 금지

    3.
    설명 금지

    4.
    마크다운 금지

    5.
    오직 순수 SQL만 출력

    6.
    반드시 결과물 앞뒤에 어떠한 부연설명, 괄호, 설명(예: "Note:", "Actually")도 작성하지 말 것.

    ===================================== """

    if error_message:
        user_prompt = f"""
        사용자 질문:
        {user_question}

        이전 SQL 실행 에러:
        {error_message}

        이전 에러를 분석하여
        올바른 SQL로 수정하라.
        """
    else:
        user_prompt = user_question

    sql_query = call_solar_agent(
        system_prompt=sql_system_prompt,
        user_prompt=user_prompt,
        temperature=0.0
    )

    # 마크다운 백틱 및 공백 정제 가드레일 추가
    sql_query = sql_query.replace("```sql", "").replace("```json", "").replace("```", "")
    return sql_query.strip()



# =========================================================
# 테스트 실행
# =========================================================

if __name__ == "__main__":

    print("🚀 Agent 테스트 시작")

    # =====================================================
    # 테스트 질문
    # =====================================================

    user_question = "지난달 네이버 12월 액션 웹툰 웹 매출 보여줘"

    # =====================================================
    # 1. Routing Agent 실행
    # =====================================================

    print("\n[1] Routing Agent 실행")

    routing_result = run_Routing_Agent(

        user_question
    )

    print("Routing 결과:")

    print(routing_result)

    # =====================================================
    # 2. SQL Agent 실행
    # =====================================================

    if (

        routing_result["route"] == "SQL"

        and

        routing_result["needs_clarification"] == False
    ):

        print("\n[2] Create SQL Agent 실행")

        sql_query = run_Create_SQL_Agent(

            user_question
        )

        print("\n생성된 SQL:")

        print(sql_query)

    # =====================================================
    # 모호한 질문 처리
    # =====================================================

    elif routing_result["needs_clarification"]:

        print("\n[추가 질문 필요]")

        print(

            routing_result[
                "clarification_question"
            ]
        )

    # =====================================================
    # 일반 대화 처리
    # =====================================================

    else:

        print("\n일반 대화로 판단됨")