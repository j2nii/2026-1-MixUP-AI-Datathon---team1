import type { Kpi } from "@/lib/types";
import { orders, reviews } from "./db-records";

const completed = orders.filter((o) => o.order_status === "배송완료");
const grossRevenue = completed.reduce((s, o) => s + o.total_amount, 0);
const totalDiscount = completed.reduce((s, o) => s + o.discount_amount, 0);
const avgReview = +(reviews.reduce((s, r) => s + r.review_score, 0) / reviews.length).toFixed(2);

export const mockKpis: Kpi[] = [
  { label: "총 결제 금액",   value: grossRevenue,   prefix: "₩", change: 18.2, trend: "up" },
  { label: "완료 주문 수",   value: completed.length,             change: 25.0, trend: "up" },
  { label: "총 할인 금액",   value: totalDiscount,  prefix: "₩", change: 9.4,  trend: "up" },
  { label: "평균 리뷰 점수", value: avgReview,      suffix: "점", change: 0.3,  trend: "up" },
];
