import sqlite3
import pandas as pd
from datetime import datetime

def init_ecommerce_database():
    # 1. 인메모리 SQLite 연결 생성
    # Lovable 내부에 내장하거나 백엔드 파이썬 서버에 올릴 메모리 DB
    conn = sqlite3.connect(':memory:', check_same_thread=False)

    # 2. 가상 데이터셋 (Mock Data) 정의
    # [Table 1] Users
    users_data = {
        'user_id': [1001, 1002, 1003, 1004, 1005],
        'username': ['이민지', '박준서', '최수아', '정우진', '한지원'],
        'age': [23, 31, 19, 27, 34],
        'gender': ['F', 'M', 'F', 'M', 'F'],
        'membership_level': ['VIP', '일반', '일반', 'VIP', '일반'],
        'signup_date': ['2025-03-01', '2025-06-15', '2025-11-20', '2026-01-10', '2026-02-05']
    }

    # [Table 2] Products
    products_data = {
        'product_id': [2001, 2002, 2003, 2004, 2005, 2006],
        'product_name': ['오버핏 셔츠', '윈드브레이커 아우터', '와이드 데님 팬츠', '링클프리 슬랙스', '미니 크로스백', '캔버스 스니커즈'],
        'category': ['상의', '아우터', '바지', '바지', '잡화', '잡화'],
        'price': [39000, 89000, 49000, 45000, 55000, 65000],
        'stock_quantity': [120, 45, 80, 150, 30, 60],
        'view_count': [1520, 3400, 2100, 980, 1850, 1200], # Router Agent가 '인기 상품' 판단할 때 사용
        'register_date': ['2025-05-01', '2025-09-10', '2025-10-01', '2025-12-15', '2026-01-20', '2026-03-02']
    }

    # [Table 3] Coupons
    coupons_data = {
        'coupon_id': ['CP01', 'CP02', 'CP03'],
        'coupon_name': ['웰컴 신규가입 쿠폰', '봄맞이 아우터 세일', 'VIP 감사 쿠폰'],
        'discount_rate': [0.10, 0.15, 0.20],
        'min_order_amount': [30000, 70000, 50000]
    }

    # [Table 4] Orders (2026년 4월~5월 데이터 집중 배치하여 '지난달/이번달' 조회 유도)
    orders_data = {
        'order_id': [30001, 30002, 30003, 30004, 30005],
        'user_id': [1001, 1003, 1004, 1002, 1005],
        'coupon_id': ['CP03', None, 'CP01', 'CP02', None],
        'total_amount': [31200, 49000, 111600, 75650, 65000],
        'discount_amount': [7800, 0, 12400, 13350, 0],
        'order_status': ['배송완료', '배송완료', '배송완료', '취소', '배송완료'],
        'order_date': ['2026-04-12', '2026-04-28', '2026-04-30', '2026-05-11', '2026-05-18']
    }

    # [Table 5] Order Items
    order_items_data = {
        'item_id': [40001, 40002, 40003, 40004, 40005, 40006],
        'order_id': [30001, 30002, 30003, 30003, 30004, 30005],
        'product_id': [2001, 2003, 2002, 2004, 2002, 2006],
        'quantity': [1, 1, 1, 1, 1, 1],
        'price': [39000, 49000, 89000, 45000, 89000, 65000]
    }

    # [Table 6] Reviews
    reviews_data = {
        'review_id': [5001, 5002, 5003, 5004],
        'product_id': [2001, 2002, 2003, 2002],
        'user_id': [1001, 1004, 1003, 1002],
        'review_score': [5, 4, 5, 2], # Router Agent가 '리뷰 좋은 상품' 판단할 때 사용
        'comment': ['핏이 딱 좋아요', '따뜻한데 약간 무거워요', '인생 데님입니다', '사이즈 미스네요'],
        'write_date': ['2026-04-15', '2026-05-02', '2026-05-03', '2026-05-14']
    }

    # 3. Pandas를 통해 SQLite 테이블로 벌크 인서트 (적재)
    pd.DataFrame(users_data).to_sql('users', conn, index=False, if_exists='replace')
    pd.DataFrame(products_data).to_sql('products', conn, index=False, if_exists='replace')
    pd.DataFrame(coupons_data).to_sql('coupons', conn, index=False, if_exists='replace')
    pd.DataFrame(orders_data).to_sql('orders', conn, index=False, if_exists='replace')
    pd.DataFrame(order_items_data).to_sql('order_items', conn, index=False, if_exists='replace')
    pd.DataFrame(reviews_data).to_sql('reviews', conn, index=False, if_exists='replace')

    print("🚀 가상 패션 이커머스 DB가 인메모리에 성공적으로 적재되었습니다.")
    return conn

# 데이터베이스 엔진 초기화 테스트
db_conn = init_ecommerce_database()