import sqlite3
import pandas as pd
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, inspect, text

# =========================================================================
# 1. 가상 데이터베이스(SQLite) 구축 및 적재 레이어
# =========================================================================
def init_ecommerce_database():
    # 인메모리 SQLite 연결 생성 (SQLAlchemy 엔진 활용)
    # 멀티스레드 환경에서도 FastAPI와 안정적으로 통신하기 위해 부가 옵션 설정
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    
    # 가상 데이터셋 (Mock Data) 정의
    users_data = {
        'user_id': [1001, 1002, 1003, 1004, 1005],
        'username': ['이민지', '박준서', '최수아', '정우진', '한지원'],
        'age': [23, 31, 19, 27, 34],
        'gender': ['F', 'M', 'F', 'M', 'F'],
        'membership_level': ['VIP', '일반', '일반', 'VIP', '일반'],
        'signup_date': ['2025-03-01', '2025-06-15', '2025-11-20', '2026-01-10', '2026-02-05']
    }

    products_data = {
        'product_id': [2001, 2002, 2003, 2004, 2005, 2006],
        'product_name': ['오버핏 셔츠', '윈드브레이커 아우터', '와이드 데님 팬츠', '링클프리 슬랙스', '미니 크로스백', '캔버스 스니커즈'],
        'category': ['상의', '아우터', '바지', '바지', '잡화', '잡화'],
        'price': [39000, 89000, 49000, 45000, 55000, 65000],
        'stock_quantity': [120, 45, 80, 150, 30, 60],
        'view_count': [1520, 3400, 2100, 980, 1850, 1200], 
        'register_date': ['2025-05-01', '2025-09-10', '2025-10-01', '2025-12-15', '2026-01-20', '2026-03-02']
    }

    coupons_data = {
        'coupon_id': ['CP01', 'CP02', 'CP03'],
        'coupon_name': ['웰컴 신규가입 쿠폰', '봄맞이 아우터 세일', 'VIP 감사 쿠폰'],
        'discount_rate': [0.10, 0.15, 0.20],
        'min_order_amount': [30000, 70000, 50000]
    }

    orders_data = {
        'order_id': [30001, 30002, 30003, 30004, 30005],
        'user_id': [1001, 1003, 1004, 1002, 1005],
        'coupon_id': ['CP03', None, 'CP01', 'CP02', None],
        'total_amount': [31200, 49000, 111600, 75650, 65000],
        'discount_amount': [7800, 0, 12400, 13350, 0],
        'order_status': ['배송완료', '배송완료', '배송완료', '취소', '배송완료'],
        'order_date': ['2026-04-12', '2026-04-28', '2026-04-30', '2026-05-11', '2026-05-18']
    }

    order_items_data = {
        'item_id': [40001, 40002, 40003, 40004, 40005, 40006],
        'order_id': [30001, 30002, 30003, 30003, 30004, 30005],
        'product_id': [2001, 2003, 2002, 2004, 2002, 2006],
        'quantity': [1, 1, 1, 1, 1, 1],
        'price': [39000, 49000, 89000, 45000, 89000, 65000]
    }

    reviews_data = {
        'review_id': [5001, 5002, 5003, 5004],
        'product_id': [2001, 2002, 2003, 2002],
        'user_id': [1001, 1004, 1003, 1002],
        'review_score': [5, 4, 5, 2], 
        'comment': ['핏이 딱 좋아요', '따뜻한데 약간 무거워요', '인생 데님입니다', '사이즈 미스네요'],
        'write_date': ['2026-04-15', '2026-05-02', '2026-05-03', '2026-05-14']
    }

    # Pandas 데이터프레임을 엔진을 통해 SQLite 메모리에 로드
    pd.DataFrame(users_data).to_sql('users', engine, index=False, if_exists='replace')
    pd.DataFrame(products_data).to_sql('products', engine, index=False, if_exists='replace')
    pd.DataFrame(coupons_data).to_sql('coupons', engine, index=False, if_exists='replace')
    pd.DataFrame(orders_data).to_sql('orders', engine, index=False, if_exists='replace')
    pd.DataFrame(order_items_data).to_sql('order_items', engine, index=False, if_exists='replace')
    pd.DataFrame(reviews_data).to_sql('reviews', engine, index=False, if_exists='replace')

    print("🚀 가상 패션 이커머스 DB가 인메모리에 성공적으로 적재되었습니다.")
    return engine

# 전역 변수로 데이터베이스 엔진 기동
db_engine = init_ecommerce_database()

# =========================================================================
# 2. FastAPI API 서버 및 에이전트 인터페이스 레이어
# =========================================================================
app = FastAPI(title="Self-service Analytics 가상 DB 실행 서버")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SQLRequest(BaseModel):
    sql: str

class AnalyzeRequest(BaseModel):
    prompt: str


@app.post("/execute-sql")
def execute_sql(request: SQLRequest):
    # [흐름도 4단계: DB 실행 레이어]
    try:
        # 1차 백엔드 SQL 가드레일 (데이터 변형/삭제 목적의 해킹 차단)
        forbidden_keywords = ["drop", "delete", "update", "insert", "alter", "truncate"]
        query_lower = request.sql.lower()
        if any(keyword in query_lower for keyword in forbidden_keywords):
            raise HTTPException(status_code=400, detail="보안 위반: 데이터 무결성을 위해 읽기(SELECT) 전용 권한만 허용됩니다.")

        # SQLite 인메모리 DB 실행 후 Pandas로 결과 수집
        with db_engine.connect() as connection:
            df = pd.read_sql_query(text(request.sql), connection)
            
        # Lovable(웹 프론트)이 바로 화면에 뿌릴 수 있도록 JSON(Dict 배열) 형태로 리턴
        return df.to_dict(orient="records")

    except Exception as e:
        # [흐름도 4단계: SQL 문법 에러 발생 시 에러 전문을 반환 -> 자가 치유 에이전트의 피드백 소스가 됨]
        raise HTTPException(status_code=500, detail=str(e))


def _build_query_result(pipeline_result: dict, prompt: str) -> dict:
    """
    에이전트 파이프라인 성공 응답을 프론트엔드 QueryResult 타입으로 변환한다.

    파이프라인 반환 형식:
      visualization.columns = ["col1", "col2"]          (문자열 리스트)
      visualization.rows    = [["v1", 42], ["v2", 55]]  (중첩 리스트)

    프론트엔드 기대 형식:
      columns = [{ key: "col1", label: "col1" }]
      rows    = [{ col1: "v1", col2: 42 }]
    """
    viz = pipeline_result.get("visualization", {})

    raw_columns: list = viz.get("columns", [])
    raw_rows: list = viz.get("rows", [])

    columns = [{"key": str(c), "label": str(c)} for c in raw_columns]
    col_keys = [c["key"] for c in columns]

    rows = []
    for raw_row in raw_rows:
        if isinstance(raw_row, (list, tuple)):
            row = {col_keys[i]: v for i, v in enumerate(raw_row) if i < len(col_keys)}
        elif isinstance(raw_row, dict):
            row = raw_row
        else:
            continue
        rows.append(row)

    return {
        "intent":   viz.get("intent", prompt),
        "sql":      pipeline_result.get("sql", ""),
        "columns":  columns,
        "rows":     rows,
        "chart":    viz.get("chart"),
        "insight":  viz.get("insight", f"**{len(rows)}건** 반환됐습니다."),
    }


# ── 자연어 분석 (에이전트 파이프라인 호출) ──────────────────────────────
@app.post("/analyze")
async def analyze_endpoint(request: AnalyzeRequest):
    # 순환 임포트 방지: pipeline_scenario가 이 모듈의 db_engine을 import하므로
    # 모듈 최상단이 아닌 함수 내부에서 lazy import 수행
    try:
        from agent.pipeline_scenario import run_integrated_analytics_pipeline
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"에이전트 모듈 로드 실패: {e}")

    try:
        result = run_integrated_analytics_pipeline(request.prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파이프라인 실행 오류: {e}")

    status = result.get("status")

    if status == "success":
        return _build_query_result(result, request.prompt)

    # SQL 분석 이외의 케이스(일상 대화, 추가 질문 요청, 가드레일 차단 등)
    # chart 없이 insight(메시지)만 반환 → 프론트 챗 말풍선에만 표시됨
    return {
        "intent":  request.prompt,
        "sql":     "",
        "columns": [],
        "rows":    [],
        "chart":   None,
        "insight": result.get("message", "처리할 수 없습니다."),
    }


# ── DB 스키마 ─────────────────────────────────────────────────────────
@app.get("/schema")
def get_schema():
    inspector = inspect(db_engine)
    tables = []

    for table_name in inspector.get_table_names():
        pk_cols = set(inspector.get_pk_constraint(table_name).get("constrained_columns", []))
        fk_map  = {
            fk["constrained_columns"][0]: fk["referred_table"]
            for fk in inspector.get_foreign_keys(table_name)
            if fk["constrained_columns"]
        }

        columns = []
        for col in inspector.get_columns(table_name):
            name = col["name"]
            columns.append({
                "name":        name,
                "type":        str(col["type"]),
                "isPrimary":   name in pk_cols,
                "isForeign":   name in fk_map,
                "references":  fk_map.get(name),
                "description": name,
            })

        tables.append({
            "name":        table_name,
            "description": f"{table_name} 테이블",
            "rowCount":    0,
            "columns":     columns,
        })

    with db_engine.connect() as conn:
        for tbl in tables:
            tbl["rowCount"] = conn.execute(
                text(f"SELECT COUNT(*) FROM {tbl['name']}")
            ).scalar()

    return tables


# ── KPI 집계 ──────────────────────────────────────────────────────────
@app.get("/kpis")
def get_kpis():
    with db_engine.connect() as conn:
        total_orders  = conn.execute(text(
            "SELECT COUNT(*) FROM orders WHERE order_status = '배송완료'"
        )).scalar() or 0

        total_revenue = conn.execute(text(
            "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE order_status = '배송완료'"
        )).scalar() or 0

        total_users   = conn.execute(text("SELECT COUNT(*) FROM users")).scalar() or 0

        avg_review    = conn.execute(text(
            "SELECT ROUND(AVG(CAST(review_score AS FLOAT)), 1) FROM reviews"
        )).scalar() or 0.0

    return [
        {"label": "완료 주문",  "value": total_orders,           "suffix": "건", "change": 12, "trend": "up"},
        {"label": "총 매출",    "value": total_revenue, "prefix": "₩",            "change": 8,  "trend": "up"},
        {"label": "전체 회원",  "value": total_users,            "suffix": "명", "change": 5,  "trend": "up"},
        {"label": "평균 리뷰",  "value": float(avg_review),      "suffix": "점", "change": 2,  "trend": "up"},
    ]