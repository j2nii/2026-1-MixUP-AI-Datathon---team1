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

절대 clarification 으로 처리하면 안 되는 경우:
- 데이터 수정 요청
- 삭제 요청
- 추가 요청
- 테이블 변경 요청

예시:
- "1000원 이상 구매 고객들을 0원으로 수정해줘"
- "회원 정보 삭제해줘"
- "orders 테이블 삭제해줘"

이런 요청은 모호한 요청이 아니다.
추가 질문을 하지 말고 SQL 요청으로 분류하라.

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
    # dataset.py의 실제 인메모리 패션 이커머스 DB 스펙 정보
    schema = """
table 'users'
- user_id INT (Primary Key)
- username VARCHAR (이름)
- age INT (나이)
- gender VARCHAR (성별: M/F)
- membership_level VARCHAR (회원 등급: VIP/일반)
- signup_date DATE (가입일)

table 'products'
- product_id INT (Primary Key)
- product_name VARCHAR (상품명)
- category VARCHAR (카테고리: 상의/아우터/바지/잡화)
- price INT (가격)
- stock_quantity INT (재고 수량)
- view_count INT (조회수)
- register_date DATE (등록일)

table 'coupons'
- coupon_id VARCHAR (Primary Key)
- coupon_name VARCHAR (쿠폰명)
- discount_rate FLOAT (할인율: 0.10=10%)
- min_order_amount INT (최소 주문 금액)

table 'orders'
- order_id INT (Primary Key)
- user_id INT (Foreign Key → users.user_id)
- coupon_id VARCHAR (Foreign Key → coupons.coupon_id, nullable)
- total_amount INT (총 주문 금액)
- discount_amount INT (할인 금액)
- order_status VARCHAR (주문 상태: 배송완료/취소)
- order_date DATE (주문일)

table 'order_items'
- item_id INT (Primary Key)
- order_id INT (Foreign Key → orders.order_id)
- product_id INT (Foreign Key → products.product_id)
- quantity INT (수량)
- price INT (단가)

table 'reviews'
- review_id INT (Primary Key)
- product_id INT (Foreign Key → products.product_id)
- user_id INT (Foreign Key → users.user_id)
- review_score INT (평점: 1~5)
- comment VARCHAR (리뷰 내용)
- write_date DATE (작성일)
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
    반드시 결과물 앞뒤에 어떠한 부연설명, 괄호, 한글 설명(예: "UPDATE 문은 규칙에 따라...")도 작성하지 말 것.

    7.
    만약 사용자의 요청이 데이터 수정/삭제/변경 등 금지된 규칙에 해당하여 SQL을 생성할 수 없다면, 절대 다른 문장을 쓰지 말고 오직 아래의 조회문 딱 한 줄만 출력하라:
    SELECT '허용되지 않은 요청입니다' AS error;

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