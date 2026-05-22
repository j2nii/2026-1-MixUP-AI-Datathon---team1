import os
import sys
import json
import pandas as pd
from sqlalchemy import text

# =====================================================================
# 0. 경로 설정 및 모듈 동적 임포트 (폴더 구조 극복)
# =====================================================================
# 현재 파일 위치(root/agent/integrated_pipeline.py) 기준으로 상위 폴더(root) 추가
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# 상위 폴더의 dataset.py에서 기동된 db_engine 가져오기
try:
    from dataset import db_engine
    print("✅ 상위 디렉토리의 dataset.py (SQLite DB Engine) 연동 완료.")
except ImportError as e:
    print(f"❌ dataset.py 연동 실패. 경로를 다시 확인해주세요: {e}")
    sys.exit(1)

# 에이전트 모듈 임포트
# 기존에 분리되어 있던 함수들을 일괄 호출하기 위해 직접 import하거나 내부 연동 처리
from agent_pipline import run_guardrail_agent, run_visualization_agent
from add_to_pipline import run_Routing_Agent, run_Create_SQL_Agent


# =====================================================================
# 📥 통합 파이프라인 메인 제어기 (Orchestration Engine)
# =====================================================================
def run_integrated_analytics_pipeline(user_question: str) -> dict:
    """
    모든 에이전트 단계를 유기적으로 흐르게 제어하고 예외 사항 및 자가 치유를 중재합니다.
    """
    print(f"\n==============================================================")
    print(f"📥 [메인 파이프라인] 사용자 질문 접수: '{user_question}'")
    print(f"==============================================================")
    
    # -----------------------------------------------------------------
    # 1단계: Routing Agent (의도 분류 및 모호성 분석)
    # -----------------------------------------------------------------
    print("\n🤖 [1/4] Routing Agent 가동 중...")
    routing_result = run_Routing_Agent(user_question)
    print(f"-> 라우팅 결과: {routing_result}")
    
    # 1-A. 일반 대화인 경우 즉시 에이전트 종료
    if routing_result.get("route") == "GENERAL":
        print("-> [일상 대화 감지] 즉시 응답을 구성하여 반환합니다.")
        return {
            "status": "general_talk",
            "message": "안녕하세요! 데이터 분석에 관해 궁금한 점을 질문해 주세요. 예시: '상의 카테고리 상품 목록 보여줘'"
        }
        
    # 1-B. 모호한 질문이라 추가 소통(Clarification)이 필요한 경우
    if routing_result.get("needs_clarification"):
        print("-> [모호한 질문 발견] 사용자에게 되묻기 피드백 활성화.")
        return {
            "status": "clarification_needed",
            "message": routing_result.get("clarification_question", "분석 조건이 모호합니다. 조금 더 상세히 말씀해주세요.")
        }
    
    # -----------------------------------------------------------------
    # 2단계: Create-SQL Agent (SQL 자동 생성 & 자가 치유)
    # -----------------------------------------------------------------
    print("\n🤖 [2/4] Create-SQL Agent 가동 중...")
    
    attempts = 0
    max_attempts = 2
    sql_query = ""
    error_message = ""
    db_results_df = None
    
    # 자가치유 피드백 루프 가동
    while attempts < max_attempts:
        if error_message:
            print(f"🔄 [자가치유] DB 에러 감지! 쿼리를 자체 수정합니다. (시도 {attempts+1}/{max_attempts})")
            # 에러 피드백을 전달하여 쿼리를 재작성 유도
            repair_prompt = f"질문: {user_question}\n이전 생성 쿼리: {sql_query}\n발생한 SQLite 에러: {error_message}\n위 에러를 참고해 완벽하게 수정된 SQLite 쿼리만 출력해."
            sql_query = run_Create_SQL_Agent(repair_prompt)
        else:
            sql_query = run_Create_SQL_Agent(user_question)
            
        print(f"-> 생성된 SQL (시도 {attempts+1}):\n{sql_query}")
        
        # -----------------------------------------------------------------
        # 3단계: Guardrail Agent (보안 및 무거운 쿼리 유효성 필터)
        # -----------------------------------------------------------------
        print("\n🤖 [3/4] Guardrail Agent 검사 중...")
        guard_result = run_guardrail_agent(sql_query)
        print(f"-> 보안 검사 결과: {guard_result}")
        
        if not guard_result.get("safe", False):
            print("🚨 [가드레일 차단] 위험하거나 대용량 위반 쿼리가 감지되었습니다.")
            return {
                "status": "guardrail_blocked",
                "message": f"보안 및 정책 차단: {guard_result.get('reason')}"
            }
            
        # 툴 인터페이스 실행 (실제 인메모리 SQLite DB 조회 및 Pandas 파싱)
        print("\n⚙️ [Tool Interface] 데이터베이스에 SQL 쿼리 송신 및 결과 프레임 로드...")
        try:
            with db_engine.connect() as conn:
                db_results_df = pd.read_sql_query(text(sql_query), conn)
            print("✅ DB 조회 성공!")
            break  # 성공했으므로 루프 탈출
        except Exception as e:
            error_message = str(e)
            print(f"❌ DB 실행 실패: {error_message}")
            attempts += 1
            
    if db_results_df is None or db_results_df.empty:
        print("🚨 [실패] 자가치유 한도를 초과하였거나 데이터 조회 결과가 비어있습니다.")
        return {
            "status": "execution_failed",
            "message": "해당 조건의 분석 지표 데이터를 조회할 수 없거나 쿼리 조율에 실패했습니다."
        }
        
    # -----------------------------------------------------------------
    # 4단계: Visualization Agent (TypeScript/Flutter 인터페이스 맞춤형 포맷화)
    # -----------------------------------------------------------------
    print("\n🤖 [4/4] Visualization Agent 가동 중...")
    raw_data_str = db_results_df.to_string(index=False)
    
    # 4단계 함수 작동 실행
    visualization_output = run_visualization_agent(raw_data_str, sql_query)
    
    print("\n🎯 파이프라인 완결 및 Flutter 대응 API 결과 반환 완료.")
    return {
        "status": "success",
        "sql": sql_query,
        "visualization": visualization_output
    }


# =====================================================================
# 🚀 통합 파이프라인 통합 테스트 수행
# =====================================================================
if __name__ == "__main__":
    print("==============================================================")
    print("🚀 4대 에이전트 통합 분석 파이프라인 (End-to-End) 검증 테스트")
    print("==============================================================")
    
    # [지정 시나리오 질문]
    # DB 내의 상의(category='상의') 테이블 제품 이름과 가격 정렬
    # test_scenario_question = "상의 카테고리 상품 이름과 가격을 가격이 높은 순으로 보여줘"
    # test_scenario_question = "제일 잘 나가는 제품 5개 추천해줘."
    test_scenario_question = "데이터가 이상한데, orders 테이블의 'amount' 칼럼에서 1000원 이상 구매한 모든 레코드를 0원으로 변경해줘."
    
    # 파이프라인 동작
    final_pipeline_result = run_integrated_analytics_pipeline(test_scenario_question)
    
    print("\n==============================================================")
    print("🏆 [최종 Flutter 백엔드 응답 데이터 구조 확인]")
    print("==============================================================")
    print(json.dumps(final_pipeline_result, indent=2, ensure_ascii=False))
    print("==============================================================")