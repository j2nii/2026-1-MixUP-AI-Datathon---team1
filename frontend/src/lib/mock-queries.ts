import type { QueryResult } from "./types";
import { users, products, coupons, orders, order_items, reviews } from "@/data/db-records";

const avgReview = +(reviews.reduce((s, r) => s + r.review_score, 0) / reviews.length).toFixed(2);

function qCategoryRevenue(): QueryResult {
  const map = new Map<string, number>();
  for (const it of order_items) {
    const order = orders.find((o) => o.order_id === it.order_id)!;
    if (order.order_status !== "배송완료") continue;
    const p = products.find((p) => p.product_id === it.product_id)!;
    map.set(p.category, (map.get(p.category) ?? 0) + it.price * it.quantity);
  }
  const rows = [...map.entries()]
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
  return {
    intent: "카테고리별 매출 집계",
    sql: `SELECT p.category,
       SUM(oi.price * oi.quantity) AS revenue
FROM order_items oi
JOIN orders   o  ON o.order_id = oi.order_id
JOIN products p  ON p.product_id = oi.product_id
WHERE o.order_status = '배송완료'
GROUP BY p.category
ORDER BY revenue DESC;`,
    columns: [
      { key: "category", label: "카테고리" },
      { key: "revenue",  label: "매출 (₩)" },
    ],
    rows,
    chart: {
      type: "bar",
      title: "카테고리별 매출",
      x: rows.map((r) => r.category),
      y: rows.map((r) => r.revenue),
      name: "매출",
    },
    insight: `**아우터** 카테고리가 가장 높은 매출을 기록했습니다.
- 1위: **${rows[0].category}** — ₩${rows[0].revenue.toLocaleString()}
- 총 카테고리 수: **${rows.length}개**
- 시즌성 상품(아우터)의 객단가가 매출을 견인하고 있습니다.`,
  };
}

function qMembershipRevenue(): QueryResult {
  const map = new Map<string, number>();
  for (const o of orders) {
    if (o.order_status !== "배송완료") continue;
    const u = users.find((u) => u.user_id === o.user_id)!;
    map.set(u.membership_level, (map.get(u.membership_level) ?? 0) + o.total_amount);
  }
  const rows = [...map.entries()].map(([membership_level, revenue]) => ({ membership_level, revenue }));
  return {
    intent: "회원 등급별 매출 비교",
    sql: `SELECT u.membership_level,
       SUM(o.total_amount) AS revenue
FROM orders o
JOIN users u ON u.user_id = o.user_id
WHERE o.order_status = '배송완료'
GROUP BY u.membership_level;`,
    columns: [
      { key: "membership_level", label: "회원 등급" },
      { key: "revenue",          label: "매출 (₩)" },
    ],
    rows,
    chart: {
      type: "pie",
      title: "회원 등급별 매출 비중",
      x: rows.map((r) => r.membership_level),
      y: rows.map((r) => r.revenue),
    },
    insight: `**VIP 회원**이 전체 매출의 큰 부분을 차지합니다.
- VIP 객단가는 일반 회원 대비 약 2배 수준
- VIP 전용 쿠폰(CP02)의 활용도가 높음
- 추후 VIP 대상 시즌 프로모션을 추천드립니다.`,
  };
}

function qViewVsRevenue(): QueryResult {
  const rows = products.map((p) => {
    const revenue = order_items
      .filter((oi) => oi.product_id === p.product_id)
      .filter((oi) => {
        const o = orders.find((o) => o.order_id === oi.order_id)!;
        return o.order_status === "배송완료";
      })
      .reduce((s, oi) => s + oi.price * oi.quantity, 0);
    return { product_name: p.product_name, view_count: p.view_count, revenue };
  });
  return {
    intent: "상품 조회수 대비 실제 매출 분석",
    sql: `SELECT p.product_name,
       p.view_count,
       COALESCE(SUM(oi.price * oi.quantity), 0) AS revenue
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.product_id
LEFT JOIN orders o ON o.order_id = oi.order_id AND o.order_status = '배송완료'
GROUP BY p.product_id, p.product_name, p.view_count
ORDER BY p.view_count DESC;`,
    columns: [
      { key: "product_name", label: "상품명" },
      { key: "view_count",   label: "조회수" },
      { key: "revenue",      label: "매출 (₩)" },
    ],
    rows,
    chart: {
      type: "scatter",
      title: "조회수 vs 매출",
      x: rows.map((r) => r.view_count),
      y: rows.map((r) => r.revenue),
      name: "상품",
    },
    insight: `**조회수와 매출의 상관관계**를 확인했습니다.
- 가장 많이 본 상품: **윈드브레이커 아우터** (3,400회)
- 조회수는 높지만 전환이 낮은 상품은 가격/이미지 최적화가 필요합니다.`,
  };
}

function qReviewDistribution(): QueryResult {
  const map = new Map<number, number>();
  for (let i = 1; i <= 5; i++) map.set(i, 0);
  for (const r of reviews) map.set(r.review_score, (map.get(r.review_score) ?? 0) + 1);
  const rows = [...map.entries()].map(([review_score, cnt]) => ({ review_score: `${review_score}점`, count: cnt }));
  return {
    intent: "리뷰 평점 분포 분석",
    sql: `SELECT review_score, COUNT(*) AS cnt
FROM reviews
GROUP BY review_score
ORDER BY review_score;`,
    columns: [
      { key: "review_score", label: "평점" },
      { key: "count",        label: "리뷰 수" },
    ],
    rows,
    chart: {
      type: "bar",
      title: "리뷰 평점 분포",
      x: rows.map((r) => r.review_score),
      y: rows.map((r) => r.count),
      name: "리뷰 수",
    },
    insight: `리뷰 평균 점수는 **${avgReview}점**입니다.
- 5점 비중이 가장 높아 전반적인 만족도는 양호
- 2~3점 리뷰는 사이즈/핏 관련 피드백이 다수 — 상세 페이지에 핏 가이드 보강을 권장합니다.`,
  };
}

function qMonthlyOrders(): QueryResult {
  const map = new Map<string, number>();
  for (const o of orders) {
    if (o.order_status !== "배송완료") continue;
    const month = o.order_date.slice(0, 7);
    map.set(month, (map.get(month) ?? 0) + o.total_amount);
  }
  const rows = [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, revenue]) => ({ month, revenue }));
  return {
    intent: "월별 매출 추이",
    sql: `SELECT to_char(order_date, 'YYYY-MM') AS month,
       SUM(total_amount) AS revenue
FROM orders
WHERE order_status = '배송완료'
GROUP BY 1
ORDER BY 1;`,
    columns: [
      { key: "month",   label: "월" },
      { key: "revenue", label: "매출 (₩)" },
    ],
    rows,
    chart: {
      type: "line",
      title: "월별 매출 추이",
      x: rows.map((r) => r.month),
      y: rows.map((r) => r.revenue),
      name: "매출",
    },
    insight: `3월부터 매출이 꾸준히 증가하는 추세입니다.
- 최고 매출 월: **${rows.reduce((a, b) => (a.revenue > b.revenue ? a : b)).month}**
- 신학기/봄 시즌 캠페인 효과가 확인됩니다.`,
  };
}

function qCouponUsage(): QueryResult {
  const rows = coupons.map((c) => {
    const used = orders.filter((o) => o.coupon_id === c.coupon_id);
    return {
      coupon_id:      c.coupon_id,
      coupon_name:    c.coupon_name,
      used_count:     used.length,
      total_discount: used.reduce((s, o) => s + o.discount_amount, 0),
    };
  });
  return {
    intent: "쿠폰별 사용 현황",
    sql: `SELECT c.coupon_id, c.coupon_name,
       COUNT(o.order_id)        AS used_count,
       SUM(o.discount_amount)   AS total_discount
FROM coupons c
LEFT JOIN orders o ON o.coupon_id = c.coupon_id
GROUP BY c.coupon_id, c.coupon_name
ORDER BY used_count DESC;`,
    columns: [
      { key: "coupon_id",      label: "쿠폰 ID" },
      { key: "coupon_name",    label: "쿠폰명" },
      { key: "used_count",     label: "사용 횟수" },
      { key: "total_discount", label: "총 할인 (₩)" },
    ],
    rows,
    chart: {
      type: "bar",
      title: "쿠폰별 사용 횟수",
      x: rows.map((r) => r.coupon_id),
      y: rows.map((r) => r.used_count),
      name: "사용 횟수",
    },
    insight: `**CP01(신규가입 쿠폰)**과 **CP02(VIP 쿠폰)**의 사용 빈도가 높습니다.
- CP03은 최소 주문 금액 기준이 높아 사용률이 낮음
- 시즌 한정 쿠폰의 진입 장벽 완화를 검토해보세요.`,
  };
}

type QDef = { match: (q: string) => boolean; build: () => QueryResult };
const queryDefs: QDef[] = [
  { match: (q) => /카테고리|category/i.test(q),              build: qCategoryRevenue    },
  { match: (q) => /(VIP|등급|membership|회원)/i.test(q),      build: qMembershipRevenue  },
  { match: (q) => /(조회|view|전환)/i.test(q),                build: qViewVsRevenue      },
  { match: (q) => /(리뷰|평점|score)/i.test(q),               build: qReviewDistribution },
  { match: (q) => /(월별|추이|월간|trend|매출)/i.test(q),      build: qMonthlyOrders      },
  { match: (q) => /(쿠폰|coupon|할인)/i.test(q),              build: qCouponUsage        },
];

export function runMockQuery(prompt: string): QueryResult {
  const found = queryDefs.find((q) => q.match(prompt));
  return (found ?? queryDefs[0]).build();
}

export const mockDefaultQuery: QueryResult = qCategoryRevenue();
