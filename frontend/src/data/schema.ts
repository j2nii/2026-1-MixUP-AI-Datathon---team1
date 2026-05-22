import type { Table } from "@/lib/types";

export const mockSchema: Table[] = [
  {
    name: "users",
    description: "회원 정보",
    rowCount: 5,
    columns: [
      { name: "user_id",          type: "int",     isPrimary: true, description: "회원 ID (1001~)" },
      { name: "username",         type: "varchar",                  description: "회원 이름" },
      { name: "age",              type: "int",                      description: "나이" },
      { name: "gender",           type: "char",                     description: "성별 F/M" },
      { name: "membership_level", type: "varchar",                  description: "VIP / 일반" },
      { name: "signup_date",      type: "date",                     description: "가입일" },
    ],
  },
  {
    name: "products",
    description: "상품 카탈로그",
    rowCount: 6,
    columns: [
      { name: "product_id",    type: "int",     isPrimary: true, description: "상품 ID (2001~)" },
      { name: "product_name",  type: "varchar",                  description: "상품명" },
      { name: "category",      type: "varchar",                  description: "상의 / 아우터 / 바지 / 잡화" },
      { name: "price",         type: "int",                      description: "판매가 (KRW)" },
      { name: "stock_quantity",type: "int",                      description: "재고 수량" },
      { name: "view_count",    type: "int",                      description: "누적 조회수" },
    ],
  },
  {
    name: "orders",
    description: "주문 헤더",
    rowCount: 5,
    columns: [
      { name: "order_id",       type: "int",     isPrimary: true,                                   description: "주문 ID (30001~)" },
      { name: "user_id",        type: "int",     isForeign: true, references: "users.user_id",      description: "주문자" },
      { name: "coupon_id",      type: "varchar", isForeign: true, references: "coupons.coupon_id",  description: "사용 쿠폰" },
      { name: "total_amount",   type: "int",                                                        description: "최종 결제 금액" },
      { name: "discount_amount",type: "int",                                                        description: "할인 금액" },
      { name: "order_status",   type: "varchar",                                                    description: "배송완료 / 취소" },
      { name: "order_date",     type: "date",                                                       description: "주문일" },
    ],
  },
  {
    name: "order_items",
    description: "주문 상세 (상품 단위)",
    rowCount: 8,
    columns: [
      { name: "item_id",   type: "int", isPrimary: true,                                   description: "주문 상세 ID" },
      { name: "order_id",  type: "int", isForeign: true, references: "orders.order_id",   description: "주문 ID" },
      { name: "product_id",type: "int", isForeign: true, references: "products.product_id",description: "상품 ID" },
      { name: "quantity",  type: "int",                                                    description: "수량" },
      { name: "price",     type: "int",                                                    description: "단가" },
    ],
  },
  {
    name: "reviews",
    description: "상품 리뷰",
    rowCount: 6,
    columns: [
      { name: "review_id",   type: "int",  isPrimary: true,                                    description: "리뷰 ID" },
      { name: "product_id",  type: "int",  isForeign: true, references: "products.product_id", description: "상품 ID" },
      { name: "user_id",     type: "int",  isForeign: true, references: "users.user_id",        description: "작성자" },
      { name: "review_score",type: "int",                                                       description: "1~5점" },
      { name: "comment",     type: "text",                                                      description: "리뷰 본문" },
      { name: "write_date",  type: "date",                                                      description: "작성일" },
    ],
  },
  {
    name: "coupons",
    description: "할인 쿠폰",
    rowCount: 3,
    columns: [
      { name: "coupon_id",        type: "varchar",  isPrimary: true, description: "쿠폰 코드 (CP01~)" },
      { name: "coupon_name",      type: "varchar",                   description: "쿠폰명" },
      { name: "discount_rate",    type: "decimal",                   description: "할인율 (0~1)" },
      { name: "min_order_amount", type: "int",                       description: "최소 주문 금액" },
    ],
  },
];
