export const users = [
  { user_id: 1001, username: "이민지", age: 23, gender: "F", membership_level: "VIP", signup_date: "2024-02-11" },
  { user_id: 1002, username: "박준서", age: 31, gender: "M", membership_level: "일반", signup_date: "2024-05-03" },
  { user_id: 1003, username: "최수아", age: 19, gender: "F", membership_level: "일반", signup_date: "2024-07-22" },
  { user_id: 1004, username: "정우진", age: 27, gender: "M", membership_level: "VIP", signup_date: "2023-12-09" },
  { user_id: 1005, username: "한지원", age: 34, gender: "F", membership_level: "일반", signup_date: "2025-01-18" },
];

export const products = [
  { product_id: 2001, product_name: "오버핏 셔츠",       category: "상의",   price: 39000, stock_quantity: 120, view_count: 1520 },
  { product_id: 2002, product_name: "윈드브레이커 아우터", category: "아우터", price: 89000, stock_quantity: 60,  view_count: 3400 },
  { product_id: 2003, product_name: "와이드 데님 팬츠",   category: "바지",   price: 59000, stock_quantity: 90,  view_count: 2100 },
  { product_id: 2004, product_name: "링클프리 슬랙스",    category: "바지",   price: 49000, stock_quantity: 75,  view_count: 980  },
  { product_id: 2005, product_name: "미니 크로스백",      category: "잡화",   price: 69000, stock_quantity: 40,  view_count: 1850 },
  { product_id: 2006, product_name: "캔버스 스니커즈",    category: "잡화",   price: 55000, stock_quantity: 110, view_count: 1200 },
];

export const coupons = [
  { coupon_id: "CP01", coupon_name: "신규가입 10% 할인",  discount_rate: 0.1,  min_order_amount: 30000 },
  { coupon_id: "CP02", coupon_name: "VIP 전용 15% 할인",  discount_rate: 0.15, min_order_amount: 50000 },
  { coupon_id: "CP03", coupon_name: "여름 시즌 20% 할인", discount_rate: 0.2,  min_order_amount: 80000 },
];

export const orders = [
  { order_id: 30001, user_id: 1001, coupon_id: "CP02", total_amount: 109650, discount_amount: 19350, order_status: "배송완료", order_date: "2025-03-04" },
  { order_id: 30002, user_id: 1002, coupon_id: "CP01", total_amount: 53100,  discount_amount: 5900,  order_status: "배송완료", order_date: "2025-03-11" },
  { order_id: 30003, user_id: 1003, coupon_id: null,   total_amount: 39000,  discount_amount: 0,     order_status: "취소",     order_date: "2025-04-02" },
  { order_id: 30004, user_id: 1004, coupon_id: "CP03", total_amount: 134400, discount_amount: 33600, order_status: "배송완료", order_date: "2025-04-19" },
  { order_id: 30005, user_id: 1005, coupon_id: "CP01", total_amount: 99900,  discount_amount: 11100, order_status: "배송완료", order_date: "2025-05-08" },
];

export const order_items = [
  { item_id: 40001, order_id: 30001, product_id: 2002, quantity: 1, price: 89000 },
  { item_id: 40002, order_id: 30001, product_id: 2005, quantity: 1, price: 69000 },
  { item_id: 40003, order_id: 30002, product_id: 2003, quantity: 1, price: 59000 },
  { item_id: 40004, order_id: 30003, product_id: 2001, quantity: 1, price: 39000 },
  { item_id: 40005, order_id: 30004, product_id: 2002, quantity: 1, price: 89000 },
  { item_id: 40006, order_id: 30004, product_id: 2006, quantity: 1, price: 55000 },
  { item_id: 40007, order_id: 30004, product_id: 2003, quantity: 1, price: 59000 },
  { item_id: 40008, order_id: 30005, product_id: 2004, quantity: 1, price: 49000 },
  { item_id: 40009, order_id: 30005, product_id: 2005, quantity: 1, price: 69000 },
];

export const reviews = [
  { review_id: 50001, product_id: 2002, user_id: 1001, review_score: 5, comment: "핏도 좋고 바람 잘 막아줘요!",     write_date: "2025-03-09" },
  { review_id: 50002, product_id: 2005, user_id: 1001, review_score: 4, comment: "사이즈 대비 수납이 좋아요",       write_date: "2025-03-10" },
  { review_id: 50003, product_id: 2003, user_id: 1002, review_score: 3, comment: "기장이 생각보다 길어요",          write_date: "2025-03-15" },
  { review_id: 50004, product_id: 2002, user_id: 1004, review_score: 5, comment: "VIP 할인까지 받아서 가성비 최고", write_date: "2025-04-22" },
  { review_id: 50005, product_id: 2006, user_id: 1004, review_score: 4, comment: "데일리로 신기 좋아요",            write_date: "2025-04-23" },
  { review_id: 50006, product_id: 2004, user_id: 1005, review_score: 2, comment: "구김은 적은데 핏이 아쉬워요",     write_date: "2025-05-12" },
];
