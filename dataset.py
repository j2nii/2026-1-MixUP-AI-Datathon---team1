import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, inspect as sa_inspect, text

# =========================================================================
# 1. 가상 데이터베이스(SQLite) 구축 및 적재 레이어
# =========================================================================
def init_ecommerce_database():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})

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

    pd.DataFrame(users_data).to_sql('users', engine, index=False, if_exists='replace')
    pd.DataFrame(products_data).to_sql('products', engine, index=False, if_exists='replace')
    pd.DataFrame(coupons_data).to_sql('coupons', engine, index=False, if_exists='replace')
    pd.DataFrame(orders_data).to_sql('orders', engine, index=False, if_exists='replace')
    pd.DataFrame(order_items_data).to_sql('order_items', engine, index=False, if_exists='replace')
    pd.DataFrame(reviews_data).to_sql('reviews', engine, index=False, if_exists='replace')

    print("🚀 가상 패션 이커머스 DB가 인메모리에 성공적으로 적재되었습니다.")
    return engine


db_engine = init_ecommerce_database()

# =========================================================================
# 컬럼 메타데이터 (SQLite가 description / FK 정보를 저장하지 않으므로 별도 관리)
# =========================================================================
TABLE_META: dict = {
    "users": {
        "description": "회원 정보",
        "columns": {
            "user_id":          {"isPrimary": True,  "description": "회원 ID (1001~)"},
            "username":         {"description": "회원 이름"},
            "age":              {"description": "나이"},
            "gender":           {"description": "성별 F/M"},
            "membership_level": {"description": "VIP / 일반"},
            "signup_date":      {"description": "가입일"},
        },
    },
    "products": {
        "description": "상품 카탈로그",
        "columns": {
            "product_id":    {"isPrimary": True,  "description": "상품 ID (2001~)"},
            "product_name":  {"description": "상품명"},
            "category":      {"description": "상의 / 아우터 / 바지 / 잡화"},
            "price":         {"description": "판매가 (KRW)"},
            "stock_quantity":{"description": "재고 수량"},
            "view_count":    {"description": "누적 조회수"},
            "register_date": {"description": "등록일"},
        },
    },
    "coupons": {
        "description": "할인 쿠폰",
        "columns": {
            "coupon_id":        {"isPrimary": True,  "description": "쿠폰 코드 (CP01~)"},
            "coupon_name":      {"description": "쿠폰명"},
            "discount_rate":    {"description": "할인율 (0~1)"},
            "min_order_amount": {"description": "최소 주문 금액"},
        },
    },
    "orders": {
        "description": "주문 헤더",
        "columns": {
            "order_id":       {"isPrimary": True,  "description": "주문 ID (30001~)"},
            "user_id":        {"isForeign": True, "references": "users.user_id",     "description": "주문자"},
            "coupon_id":      {"isForeign": True, "references": "coupons.coupon_id", "description": "사용 쿠폰"},
            "total_amount":   {"description": "최종 결제 금액"},
            "discount_amount":{"description": "할인 금액"},
            "order_status":   {"description": "배송완료 / 취소"},
            "order_date":     {"description": "주문일"},
        },
    },
    "order_items": {
        "description": "주문 상세 (상품 단위)",
        "columns": {
            "item_id":   {"isPrimary": True,  "description": "주문 상세 ID"},
            "order_id":  {"isForeign": True, "references": "orders.order_id",    "description": "주문 ID"},
            "product_id":{"isForeign": True, "references": "products.product_id","description": "상품 ID"},
            "quantity":  {"description": "수량"},
            "price":     {"description": "단가"},
        },
    },
    "reviews": {
        "description": "상품 리뷰",
        "columns": {
            "review_id":   {"isPrimary": True,  "description": "리뷰 ID"},
            "product_id":  {"isForeign": True, "references": "products.product_id", "description": "상품 ID"},
            "user_id":     {"isForeign": True, "references": "users.user_id",        "description": "작성자"},
            "review_score":{"description": "1~5점"},
            "comment":     {"description": "리뷰 본문"},
            "write_date":  {"description": "작성일"},
        },
    },
}

# =========================================================================
# 2. FastAPI 서버
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


# ── DB 스키마 ──────────────────────────────────────────────────────────────
@app.get("/schema")
def get_schema():
    inspector = sa_inspect(db_engine)
    result = []

    for table_name in inspector.get_table_names():
        meta = TABLE_META.get(table_name, {})
        col_meta: dict = meta.get("columns", {})

        with db_engine.connect() as conn:
            row_count = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()

        columns = []
        for col in inspector.get_columns(table_name):
            col_name: str = col["name"]
            cm: dict = col_meta.get(col_name, {})

            entry: dict = {
                "name": col_name,
                "type": str(col["type"]).lower().split("(")[0],
                "description": cm.get("description", ""),
            }
            if cm.get("isPrimary"):
                entry["isPrimary"] = True
            if cm.get("isForeign"):
                entry["isForeign"] = True
                entry["references"] = cm["references"]

            columns.append(entry)

        result.append({
            "name": table_name,
            "description": meta.get("description", table_name),
            "rowCount": row_count,
            "columns": columns,
        })

    return result


# ── SQL 실행 ───────────────────────────────────────────────────────────────
@app.post("/execute-sql")
def execute_sql(request: SQLRequest):
    forbidden = ["drop", "delete", "update", "insert", "alter", "truncate"]
    if any(kw in request.sql.lower() for kw in forbidden):
        raise HTTPException(status_code=400, detail="보안 위반: SELECT 전용 권한만 허용됩니다.")

    try:
        with db_engine.connect() as conn:
            df = pd.read_sql_query(text(request.sql), conn)
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
