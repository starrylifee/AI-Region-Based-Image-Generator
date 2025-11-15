# AI Region Drawing App

AI 기반 이미지 생성 애플리케이션으로, Firebase를 통한 교사/학생 관리 시스템이 포함되어 있습니다.

## 주요 기능

- **교사 기능**
  - 회원가입 및 로그인
  - 반코드 생성 및 관리
  - 학생들의 작업 확인 대시보드

- **학생 기능**
  - 회원가입 및 로그인
  - 반코드 입력으로 반 가입
  - 프롬프트 입력 및 이미지 생성
  - 생성한 작업 저장

- **이미지 생성**
  - 영역 기반 이미지 생성
  - 여러 영역에 각각 프롬프트 설정 가능
  - 참조 이미지 업로드 지원

## 프로젝트 구조

```
├── index.html              # 메인 애플리케이션 페이지
├── login.html              # 로그인/회원가입 페이지
├── dashboard.html          # 교사용 대시보드
├── firebase-config.js      # Firebase 설정 파일
├── config.js              # API 키 설정 파일
├── assets/
│   ├── css/
│   │   └── styles.css     # 스타일시트
│   └── js/
│       ├── app.js         # 메인 애플리케이션 로직
│       ├── auth.js        # Firebase 인증 관리
│       └── database.js    # Firestore 데이터베이스 관리
└── FIREBASE_SETUP.md      # Firebase 설정 가이드
```

## 시작하기

### 1. Firebase 설정

먼저 Firebase 프로젝트를 설정해야 합니다. 자세한 내용은 `FIREBASE_SETUP.md` 파일을 참조하세요.

1. Firebase Console에서 프로젝트 생성
2. Authentication 활성화 (이메일/비밀번호)
3. Firestore Database 생성
4. `firebase-config.js` 파일에 설정 정보 입력

### 2. API 키 설정

#### 로컬 테스트
`config.js` 파일을 열고 Gemini API 키를 설정하세요:

```javascript
window.__ENV__ = {
  API_KEY: "your_gemini_api_key_here",
  API_URL: "" // 기본값 사용 시 빈 문자열
};
```

#### Vercel 배포
1. Vercel 프로젝트 설정 → Environment Variables에 `GEMINI_API_KEY`(필수)와 `GEMINI_API_URL`(선택)을 추가합니다.
2. 배포된 클라이언트는 `/api/env` 서버리스 함수로부터 값을 받아 `window.__ENV__`에 주입하므로, 별도의 하드코딩이 필요 없습니다.
3. 톱니 모양 설정창을 통해 입력한 값은 여전히 로컬 스토리지에 저장되어 우선순위가 낮으며, Vercel 환경변수가 존재하면 이를 자동으로 덮어씁니다.

### 3. 로컬 서버 실행

Python 3를 사용하는 경우:

```cmd
python -m http.server 8000
```

브라우저에서 `http://localhost:8000/login.html`을 열어 시작하세요.

## 사용 방법

### 교사

1. `login.html`에서 "회원가입" 탭 선택
2. 이름, 이메일, 비밀번호를 입력해 회원가입
3. 로그인 후 대시보드에서 반코드 생성
4. 생성된 반코드를 학생들에게 공유
5. 대시보드에서 학생 계정 생성 및 작업 확인

### 학생

1. 교사가 생성해 준 반 이름/학생 번호/비밀번호를 받음
2. `login.html`의 "학생 로그인" 모드를 선택
3. 반 이름, 학생 번호, 비밀번호를 입력해 로그인
4. 필요 시 "반 가입" 버튼으로 반코드 입력
5. 프롬프트를 작성하고 이미지 생성
6. "작업 저장" 버튼으로 작업 저장

## 보안 주의사항

- Firebase API 키는 클라이언트에 노출되지만, Firestore 보안 규칙으로 데이터 접근을 제어합니다
- 프로덕션 환경에서는 Firestore 보안 규칙을 더 엄격하게 설정하세요
- API 키는 절대 Git에 커밋하지 마세요
- `config.js`와 `firebase-config.js` 파일에는 실제 키를 입력하되, Git에 커밋하지 않도록 주의하세요
# AI-Region-Based-Image-Generator
