# 🍚 밥계획 (Bob-Plan) - MVP

> **"오늘 뭐 먹지?" 고민 끝! 자취생을 위한 초간단 AI 맞춤형 식단 플래너**

자취생의 한정된 예산과 식재료, 그리고 귀찮음을 해결해 주기 위해 만들어진 **AI 기반 식생활 매니저**입니다.
몇 가지 조건만 입력하면, 똑똑한 인공지능(Gemini)이 당신의 상황에 딱 맞는 1주일치 식단과 레시피를 제안합니다.

---

## ✨ 핵심 기능 (Features)

* **🤖 초개인화 AI 식단 생성**: 예산, 요리 실력, 못 먹는 음식 등을 고려해 완벽한 맞춤형 식단을 짜줍니다.
* **🔄 원클릭 식단 교체**: "이건 너무 비싸요", "이건 너무 귀찮아요" 등 피드백을 주면 즉석에서 다른 메뉴로 대체해 줍니다.
* **📈 식사 달성도 트래킹**: 추천받은 식단을 얼마나 잘 지켰는지 대시보드에서 직관적으로 확인할 수 있습니다.
* **💰 누적 절약 금액 계산**: 배달 음식 대신 직접 요리함으로써 절약한 식비를 마이페이지에서 한눈에 보여줍니다.

---

## 🛠 사용된 기술 (Tech Stack)

* **Frontend**: Next.js 14, React, Tailwind CSS
* **Backend**: Next.js App Router (Serverless API)
* **Database**: Prisma ORM, Neon DB (PostgreSQL)
* **AI Model**: Google Gemini (1.5 Flash)
* **Authentication**: JWT, HTTP-only Cookies
* **Deployment**: Vercel

---

## 🚀 시작하기 (Getting Started)

로컬 환경에서 프로젝트를 실행하는 방법입니다.

```bash
# 1. 패키지 설치
npm install

# 2. 환경 변수 세팅 (.env 파일 생성)
# DATABASE_URL="..."
# GEMINI_API_KEY="..."
# JWT_SECRET="..."

# 3. 데이터베이스 초기화
npx prisma generate
npx prisma db push

# 4. 개발 서버 실행
npm run dev
```

접속 주소: [http://localhost:3000](http://localhost:3000)

---

> **Note**: 이 프로젝트는 MVP(Minimum Viable Product) 버전으로 지속적으로 업데이트될 예정입니다!
