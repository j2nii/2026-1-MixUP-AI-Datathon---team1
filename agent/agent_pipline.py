# agent pipline 

## Guardrail Agent, Vizualization Agent 함수

import json
import re
import pandas as pd
from sqlalchemy import text  # create_engine은 dataset.py에서 가져오므로 text만 유지
from agent_tool import call_solar_agent

import os
import sys

# 프로젝트 루트 폴더를 파이썬 라이브러리 검색 경로에 추가합니다.
# 현재 파일(agent/agent_pipeline.py)의 부모의 부모 폴더가 루트입니다.
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# 이제 상위 폴더에 있는 dataset 모듈을 문제없이 임포트할 수 있습니다.
from dataset import db_engine

# =====================================================================
# 1. Guardrail Agent (SQLite 보안 및 풀스캔 차단 밸리데이터)
# =====================================================================
def run_guardrail_agent(sql_query: str) -> dict:
    """
    입력된 SQLite 쿼리의 보안 및 무거운 풀스캔(Full Scan) 위험성을 검사합니다.
    
    Returns:
        dict: {"safe": True, "reason": ""} 또는 {"safe": False, "reason": "에러 사유"}
    """
    # # [1차 가드레일] Python 레벨에서 하드코딩 키워드 고속 검사 (API 비용 및 속도 절감)
    # dangerous_keywords = ["drop", "delete", "truncate", "update", "alter", "insert", "replace", "vacuum"]
    # query_lower = sql_query.lower()
    
    # for kw in dangerous_keywords:
    #     if re.search(rf"\b{kw}\b", query_lower):
    #         return {
    #             "safe": False, 
    #             "reason": f"보안 위반: 데이터 변경/삭제 명령 키워드({kw.upper()})가 감지되었습니다."
    #         }

    # [2차 가드레일] Solar Pro를 이용한 지능형 위험성 및 무거운 SQLite 쿼리(풀스캔) 검사
    guardrail_system = (
        "너는 SQLite 데이터베이스 보안 및 성능 최적화를 담당하는 가드레일 에이전트야.\n"
        "입력된 SQL 쿼리가 안전한 조회(SELECT) 쿼리인지, 아니면 위험하거나 성능을 저하시키는 쿼리인지 판단해줘.\n"
        "특히 WHERE 절 조건 없이 대량의 테이블 데이터를 통째로 조회하는 무거운 풀 스캔(Full Scan) 위험이 있는지도 엄격히 검사해야 해.\n\n"
        "반드시 아래의 JSON 포맷으로만 답변해. 다른 설명이나 마크다운 백틱(```)은 절대 붙이지 마.\n"
        "{\n"
        '  "safe": true 또는 false,\n'
        '  "reason": "위험하다고 판단한 구체적인 이유 (safe가 true이면 빈 문자열)"\n'
        "}"
    )
    
    try:
        response_text = call_solar_agent(guardrail_system, f"검사할 SQL 쿼리:\n{sql_query}", temperature=0.0)
        
        # JSON 파싱 안전장치 (마크다운 백틱 및 공백 제거)
        clean_json = response_text.replace("```json", "").replace("```", "").strip()
        result = json.loads(clean_json)
        return result
        
    except Exception as e:
        # LLM 파싱 에러나 통신 에러 발생 시, 안전을 위해 기본값으로 차단(False) 처리하는 가드레일 설계
        return {"safe": False, "reason": f"가드레일 에이전트 구동 실패: {str(e)}"}


# =====================================================================
# 2. Visualization Agent (데이터 맞춤형 시각화 코드 생성기)
# =====================================================================
def run_visualization_agent(data_sample_str: str, sql_query: str) -> dict:
    """
    DB 조회 결과 전체 데이터와 실행된 SQL을 분석하여,
    프론트엔드에서 요구하는 JSON/TypeScript 스펙 구조에 맞게 시각화 정보 및 결과를 가공해 리턴합니다.
    
    Args:
        data_sample_str (str): DB에서 추출한 전체 데이터셋 문자열 (예: df.to_string() 혹은 JSON String)
        sql_query (str): 데이터를 추출할 때 사용한 SQL 쿼리문
        
    Returns:
        dict: 요구되는 인터페이스 규격을 갖춘 JSON 구조체
    """
    
    viz_system = (
        "너는 전송받은 데이터셋의 구조와 SQL 컨텍스트를 분석하여, "
        "프론트엔드가 필요로 하는 시각화 데이터 및 구조화된 차트 사양서(JSON)를 작성하는 시각화 에이전트야.\n\n"
        
        "[시각화 유형 결정 규칙]\n"
        "- 날짜, 월, 연도 등 시간 흐름에 따른 추세 데이터 패턴인 경우 -> 'line'\n"
        "- 항목, 카테고리, 이름 간의 수치적인 크기 비교가 목적인 경우 -> 'bar'\n"
        "- 전체 비율 분석이나 점유율 분석인 경우 -> 'pie'\n\n"
        
        "[출력 가이드라인]\n"
        "반드시 하단의 명시된 JSON 스펙 포맷으로만 응답해야 해. 인사말, 마크다운 코드 블록(```json) 등은 절대 붙이지 말고 순수 JSON만 반환해.\n\n"
        "{\n"
        '  "intent": "사용자 질문을 통해 도출해낸 원본 분석 의도 핵심 요약",\n'
        '  "columns": ["행렬_컬럼1", "행렬_컬럼2"],\n'
        '  "rows": [\n'
        '    ["값1_1", 값1_2],\n'
        '    ["값2_1", 값2_2]\n'
        '  ],\n'
        '  "chart": {\n'
        '    "type": "bar" 또는 "line" 또는 "pie",\n'
        '    "title": "데이터의 흐름을 반영한 직관적인 차트 타이틀",\n'
        '    "name": "y축 혹은 데이터 계열의 이름(예: 매출액, 가입자수 등)",\n'
        '    "x": ["항목1", "항목2", "항목3"],\n'
        '    "y": [150000, 230000, 90000]\n'
        '  }\n'
        "}"
    )
    
    user_prompt = f"실행된 SQL문:\n{sql_query}\n\n추출된 데이터셋:\n{data_sample_str}"
    
    try:
        response_text = call_solar_agent(viz_system, user_prompt, temperature=0.1)
        
        # 텍스트 정제 및 JSON 파싱 처리
        clean_json = response_text.replace("```json", "").replace("```", "").strip()
        chart_specification = json.loads(clean_json)
        return chart_specification
        
    except Exception as e:
        # 런타임 혹은 예외 에러 발생 시 시스템 붕괴를 막기 위한 기본 폴백(Fallback) 구조 리턴
        return {
            "intent": "에러 발생에 따른 기본 데이터 복구",
            "columns": ["category", "sales"],
            "rows": [["에러", 0]],
            "chart": {
                "type": "bar",
                "title": f"시각화 구성 중 에러 발생: {str(e)}",
                "name": "Error Status",
                "x": ["에러"],
                "y": [0]
            }
        }



if __name__ == "__main__":
    print("📋 [컴포넌트 테스트 1] Guardrail Agent 작동 검증")
    
    # 테스트 1: 위험한 SQLite 쿼리 차단 검증
    bad_sql = "DROP TABLE IF EXISTS users;"
    print(f"입력 쿼리: {bad_sql}")
    print(f"결과: {run_guardrail_agent(bad_sql)}")
    
    # 테스트 2: dataset.py 연동 및 실데이터 추출
    print("\n📦 [dataset.py 패션 이커머스 DB 연동 시작]")
    
    try:
        # [수정 사항] dataset.py 파일 내부의 전역 변수인 db_engine을 직접 임포트합니다.
        from dataset import db_engine
        print("✅ dataset.py의 실시간 db_engine을 성공적으로 연동했습니다.")
        
        # dataset.py에 실제 존재하는 'products' 테이블을 대상으로 하는 분석용 SQL문
        real_query = "SELECT category, AVG(price) as avg_price, COUNT(product_id) as total_count FROM products GROUP BY category"
        print(f"\n실행할 분석 쿼리: {real_query}")
        
        # 1. 가드레일 검사
        guard_result = run_guardrail_agent(real_query)
        print(f"가드레일 검증 통과 여부: {guard_result.get('safe')}")
        
        if guard_result.get("safe"):
            # 2. SQLite 연동 후 Pandas 데이터 수집
            with db_engine.connect() as connection:
                df = pd.read_sql_query(text(real_query), connection)
            print("\n[DB 조회 성공] 실제 데이터프레임 아웃풋:")
            print(df)
            
            # 3. 수집된 실데이터를 시각화 에이전트로 전송 (TypeScript 대응 JSON 포맷)
            print("\n🚀 [컴포넌트 테스트 2] 이커머스 실데이터 기반 시각화 사양서 추출 테스트...")
            dataframe_str = df.to_string(index=False)
            api_response = run_visualization_agent(dataframe_str, real_query)
            
            print("\n================= [ 백엔드 API 최종 리턴 (TypeScript Spec) ] =================")
            print(json.dumps(api_response, indent=2, ensure_ascii=False))
            print("==========================================================================")
        else:
            print(f"🚨 가드레일 검증 실패: {guard_result.get('reason')}")
            
    except Exception as e:
        print(f"❌ 데이터베이스 조회 혹은 에이전트 구동 중 에러 발생: {e}")

# # =====================================================================
# # 개별 컴포넌트 단위 기능 테스트
# # =====================================================================
# if __name__ == "__main__":
#     print("📋 [컴포넌트 테스트 1] Guardrail Agent 작동 검증")
    
#     # 테스트 1: 위험한 쿼리 차단 검증
#     bad_sql = "DROP TABLE users;"
#     print(f"입력 쿼리: {bad_sql}")
#     print(f"결과: {run_guardrail_agent(bad_sql)}")
    
#     # 테스트 2: WHERE 절 없는 무거운 쿼리(풀스캔) 차단 검증
#     mock_sql = "SELECT category, SUM(sales) as total_sales FROM orders GROUP BY category"
#     mock_dataframe_str = (
#         "     category  total_sales\n"
#         "0   웹툰/판타지     15000000\n"
#         "1   웹툰/로맨스     23000000\n"
#         "2   웹툰/액션        9000000"
#     )
    
#     print("🚀 Flutter 연동용 시각화 사양서 추출 테스트 시작...")
#     api_response = run_visualization_agent(mock_dataframe_str, mock_sql)
    
#     print("\n================= [ 백엔드 API 응답 결과 ] =================")
#     print(json.dumps(api_response, indent=2, ensure_ascii=False))
#     print("===========================================================")