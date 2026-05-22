# QueryTalk (쿼리토크)

> 비전문가를 위한 Text-to-SQL 기반 실시간 데이터 시각화 에이전트

자연어로 질문하면 AI가 자동으로 SQL을 생성하고, 데이터를 조회하여 인터랙티브한 차트로 시각화해주는 셀프 서비스 분석 플랫폼입니다.

---

## 프로젝트 개요

**QueryTalk**는 SQL 지식이 없는 비즈니스 사용자도 자연어만으로 데이터베이스를 분석하고 시각화할 수 있도록 돕는 AI 기반 데이터 분석 플랫폼입니다.

### 핵심 가치

- **진입장벽 제거**: SQL 문법을 몰라도 "지난달 매출 상위 5개 상품 보여줘"와 같은 자연어로 데이터 분석
- **실시간 피드백**: 4단계 에이전트 파이프라인을 통한 쿼리 자동 생성, 검증, 실행 및 시각화
- **안전한 분석**: 악의적 쿼리 차단 및 읽기 전용 권한 보장으로 데이터 무결성 보호

---

## 해결하고자 하는 문제

### 비즈니스 현장의 데이터 접근성 격차

| 문제점 | QueryTalk의 해결 방안 |
|--------|---------------------|
| SQL을 모르는 비즈니스 사용자는 데이터 분석가에게 의존 | 자연어 기반 Text-to-SQL로 누구나 즉시 분석 가능 |
| 복잡한 BI 도구의 높은 학습 곡선 | 대화형 인터페이스로 직관적인 질의응답 |
| 실시간 의사결정을 위한 신속한 데이터 접근 불가 | 4단계 에이전트 파이프라인으로 수 초 내 결과 시각화 |
| 데이터베이스 보안 우려 (악의적 쿼리 실행 위험) | 다층 보안 가드레일로 읽기 전용 쿼리만 허용 |

---

## 주요 기능

### 1. 자연어 기반 데이터 조회
- 사용자가 한국어로 질문하면 AI가 자동으로 SQL 쿼리 생성
- 예시: "상의 카테고리 상품 이름과 가격을 가격이 높은 순으로 보여줘"

### 2. 4단계 지능형 에이전트 파이프라인
1. **Routing Agent**: 사용자 의도 분류 (SQL 조회 / 일반 대화 / 모호한 질문 감지)
2. **Create SQL Agent**: 동적 DB 스키마 기반 Text-to-SQL 자동 생성 + 자가치유
3. **Guardrail Agent**: 악의적 쿼리 차단 (DROP, DELETE, UPDATE 등 금지)
4. **Visualization Agent**: 데이터 특성 분석 후 최적 차트 타입 자동 선택 (Bar/Line/Pie)

### 3. 실시간 인터랙티브 시각화
- Plotly.js 기반 동적 차트 렌더링
- 데이터 패턴에 따른 자동 차트 타입 추천
- 핵심 인사이트 요약 제공

### 4. DB 스키마 자동 탐색
- SQLAlchemy Inspector로 테이블 구조 자동 파싱
- Primary Key / Foreign Key 관계도 자동 인식
- 프론트엔드에서 실시간 스키마 확인 가능

---

## 기술 스택

| 분류 | 기술 | 역할 |
|------|------|------|
| **AI 엔진** | Upstage Solar Pro 3 | Text-to-SQL 변환, NLU 파싱, 쿼리 검증 |
| **백엔드** | FastAPI | RESTful API 서버 |
| | SQLAlchemy | SQLite 인메모리 DB 연동 |
| | Pandas | 쿼리 결과 데이터 프레임 처리 |
| | Python-dotenv | API 키 환경변수 관리 |
| **프론트엔드** | React 19 | UI 컴포넌트 렌더링 |
| | TanStack Router | SPA 라우팅 |
| | TypeScript | 타입 안전성 보장 |
| | Tailwind CSS | 반응형 스타일링 |
| | Radix UI | 접근성 높은 UI 프리미티브 |
| **시각화** | Plotly.js | 인터랙티브 차트 라이브러리 |
| | Recharts | 보조 차트 컴포넌트 |
| **데이터베이스** | SQLite (In-Memory) | 가상 패션 이커머스 DB |
| **배포** | Vite | 프론트엔드 빌드 도구 |
| | Uvicorn | ASGI 서버 |

---

## 시스템 아키텍처



### 데이터 흐름 (Data Flow)

1. **사용자 입력**: 자연어 질문 전송
2. **Routing**: 질문 의도 분류
3. **SQL 생성**: DB 스키마 기반 쿼리 자동 생성
4. **보안 검증**: 악의적 쿼리 차단
5. **DB 실행**: SQLAlchemy를 통한 쿼리 실행
6. **시각화**: Pandas DataFrame → JSON → Plotly 차트
7. **응답 반환**: 차트 + 인사이트 프론트엔드 렌더링

---

## 시작 가이드 (Getting Started)

### 사전 요구사항

- Python 3.12+
- Node.js 18+
- Upstage API Key ([Upstage Console](https://console.upstage.ai/)에서 발급)

### 1. 레포지토리 클론

```bash
git clone https://github.com/your-repo/2026-1-MixUP-AI-Datathon---team1.git
cd 2026-1-MixUP-AI-Datathon---team1
```

### 2. 백엔드 설정

```bash
cd backend/backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cd agent
echo "UP_STAGE_API=your_api_key_here" > .env

# 서버 실행
cd ..
uvicorn dataset:app --reload --host 0.0.0.0 --port 8000
```

### 3. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 4. 브라우저 접속

```
http://localhost:5173
```

---

## 디렉토리 구조 (Directory Structure)

```
2026-1-MixUP-AI-Datathon---team1/
├── backend/
│   └── backend/
│       ├── agent/
│       │   ├── agent_tool.py           # Solar Pro API 호출 코어 함수
│       │   ├── add_to_pipline.py       # Routing Agent, Create SQL Agent
│       │   ├── agent_pipline.py        # Guardrail Agent, Visualization Agent
│       │   ├── pipeline_scenario.py    # 4단계 통합 파이프라인 오케스트레이터
│       │   └── .env                    # Upstage API Key
│       ├── dataset.py                  # FastAPI 서버 + SQLite DB 초기화
│       └── requirements.txt            # Python 의존성
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── analytics/
│   │   │   │   ├── ChatWorkspace.tsx       # 채팅 인터페이스
│   │   │   │   ├── PlotlyChart.tsx         # Plotly 차트 렌더링
│   │   │   │   ├── ResultsDashboard.tsx    # 결과 대시보드
│   │   │   │   ├── SchemaSidebar.tsx       # DB 스키마 사이드바
│   │   │   │   └── SqlDebugPanel.tsx       # SQL 디버그 패널
│   │   │   └── ui/                         # Radix UI 컴포넌트
│   │   └── routes/                         # TanStack Router 페이지
│   ├── package.json
│   └── vite.config.ts
│
└── README.md                           # 프로젝트 문서 (본 파일)
```

---

## 데이터 보안 및 제한 사항 (Security & Guardrails)

### 다층 보안 아키텍처

QueryTalk은 사용자가 악의적인 자연어를 입력하더라도 데이터베이스를 안전하게 보호하기 위해 **3단계 보안 가드레일**을 구현합니다.

#### 1단계: SQL 생성 규칙 (Create SQL Agent)

```python
# add_to_pipline.py:157-195
"""
[규칙]
1. SELECT 기반 조회 SQL만 생성
2. DROP, DELETE, UPDATE, INSERT 사용 금지
3. 금지된 요청 시 에러 메시지 반환
"""
```

**예시 입력**: "회원 테이블 다 지워줘"
**처리 결과**: `SELECT '허용되지 않은 요청입니다' AS error;`

#### 2단계: Python 키워드 필터 (FastAPI Layer)

```python
# dataset.py:108-112
forbidden_keywords = ["drop", "delete", "update", "insert", "alter", "truncate"]
if any(keyword in query_lower for keyword in forbidden_keywords):
    raise HTTPException(status_code=400, detail="읽기(SELECT) 전용 권한만 허용")
```

#### 3단계: AI 기반 지능형 검증 (Guardrail Agent)

```python
# agent_pipline.py:28-74
"""
Solar Pro 3을 활용한 2차 보안 검사:
- 위험한 쿼리 패턴 감지
- WHERE 절 없는 무거운 풀스캔 차단
- SQL Injection 시도 탐지
"""
```

**예시 입력**: "1000원 이상 구매한 모든 레코드를 0원으로 변경해줘"
**Guardrail 판정**: `{"safe": false, "reason": "데이터 변경 명령 키워드 감지"}`

### 제한 사항

| 구분 | 제한 내용 |
|------|-----------|
| **쿼리 권한** | 읽기 전용 (SELECT만 허용) |
| **지원 DB** | SQLite In-Memory (프로토타입) |
| **데이터 규모** | 소규모 데이터셋 (~1000 rows) |
| **자가치유** | 최대 2회 재시도 후 실패 처리 |

---

## 주요 예시 및 데모 시나리오 (Usage Examples)

### 시나리오 1: 매출 분석

**사용자 질문**: "지난 달 매출 상위 5개 상품이랑 카테고리 보여줘"

**생성된 SQL**:
```sql
SELECT p.product_name, p.category, SUM(oi.price * oi.quantity) as total_sales
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_status = '배송완료'
GROUP BY p.product_id
ORDER BY total_sales DESC
LIMIT 5
```

**시각화 결과**:
- 차트 타입: Bar Chart
- X축: 상품명
- Y축: 매출액
- 인사이트: "윈드브레이커 아우터가 89,000원으로 가장 높은 매출을 기록했습니다."

---

### 시나리오 2: 고객 분석

**사용자 질문**: "VIP 회원들의 평균 주문 금액은?"

**생성된 SQL**:
```sql
SELECT u.membership_level, AVG(o.total_amount) as avg_order
FROM orders o
JOIN users u ON o.user_id = u.user_id
WHERE u.membership_level = 'VIP' AND o.order_status = '배송완료'
GROUP BY u.membership_level
```

**시각화 결과**:
- 차트 타입: Pie Chart
- 인사이트: "VIP 회원의 평균 주문 금액은 71,400원입니다."

---

### 시나리오 3: 악의적 쿼리 차단

**사용자 질문**: "orders 테이블 삭제해줘"

**Routing Agent 판정**: `route: "SQL"` (모호하지 않은 명확한 요청)
**Create SQL Agent 응답**: `SELECT '허용되지 않은 요청입니다' AS error;`
**Guardrail Agent 차단**: `safe: false, reason: "데이터 삭제 명령어 감지"`

**최종 응답**:
```json
{
  "status": "guardrail_blocked",
  "message": "보안 및 정책 차단: 데이터 삭제 명령어 감지"
}
```

---

### 시나리오 4: 모호한 질문 처리

**사용자 질문**: "인기 상품 알려줘"

**Routing Agent 판정**:
```json
{
  "route": "SQL",
  "needs_clarification": true,
  "clarification_question": "인기의 기준이 무엇인가요? (조회수, 판매량, 리뷰 평점 중 선택)"
}
```

**최종 응답**: 사용자에게 추가 질문 표시

---

## 팀원

| 이름 | 역할 |
|------|------|
| **김지은** | AI Agent 개발 |
| **김준이** | AI Agent 개발 |
| **조현진** | UI/UX |
| **최재은** | PM |

---

## 라이선스

본 프로젝트는 **MIT License** 하에 배포됩니다.


---

**Made with Upstage Solar Pro 3**
