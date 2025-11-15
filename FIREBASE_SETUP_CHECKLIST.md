# Firebase 설정 체크리스트

Firebase 설정을 단계별로 진행하세요. 각 단계를 완료하면 ✅ 표시를 해주세요.

## ✅ 1단계: Firebase 프로젝트 생성

- [ ] [Firebase Console](https://console.firebase.google.com/) 접속
- [ ] "프로젝트 추가" 클릭
- [ ] 프로젝트 이름 입력 (예: "ai-region-drawing")
- [ ] Google Analytics 설정 (선택사항)
- [ ] 프로젝트 생성 완료

**현재 상태:** 프로젝트 생성 필요

---

## ✅ 2단계: 웹 앱 추가 및 설정 정보 가져오기

- [ ] Firebase Console에서 생성한 프로젝트 선택
- [ ] 프로젝트 설정(⚙️ 톱니바퀴 아이콘) 클릭
- [ ] "내 앱" 섹션에서 웹 앱 추가 (</> 아이콘) 클릭
- [ ] 앱 닉네임 입력 (예: "AI Region Drawing Web")
- [ ] "Firebase Hosting도 설정" 체크 해제 (선택사항)
- [ ] "앱 등록" 클릭  
- [ ] 설정 정보 복사 (아래 형식)

**복사할 설정 정보 형식:**
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**현재 상태:** 설정 정보 필요

---

## ✅ 3단계: firebase-config.js 파일 수정

- [ ] `firebase-config.js` 파일 열기
- [ ] 위에서 복사한 설정 정보로 값 교체
- [ ] 파일 저장

**현재 상태:** 설정 정보 입력 필요

---

## ✅ 4단계: Authentication 활성화

- [ ] Firebase Console에서 "Authentication" 메뉴 클릭
- [ ] "시작하기" 클릭
- [ ] "Sign-in method" 탭 클릭
- [ ] "이메일/비밀번호" 클릭
- [ ] "사용 설정" 토글 활성화
- [ ] "저장" 클릭

**현재 상태:** Authentication 설정 필요

---

## ✅ 5단계: Firestore Database 생성

- [ ] Firebase Console에서 "Firestore Database" 메뉴 클릭
- [ ] "데이터베이스 만들기" 클릭
- [ ] "테스트 모드로 시작" 선택 ⚠️ (개발용)
- [ ] 위치 선택 (가장 가까운 지역, 예: "asia-northeast3 (Seoul)")
- [ ] "사용 설정" 클릭
- [ ] 데이터베이스 생성 완료 대기

**현재 상태:** Firestore Database 생성 필요

---

## ✅ 6단계: Firestore 보안 규칙 설정

- [ ] Firebase Console > Firestore Database > "규칙" 탭 클릭
- [ ] 아래 보안 규칙 복사하여 붙여넣기
- [ ] "게시" 클릭

**보안 규칙:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 정보 읽기/쓰기
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 반 정보
    match /classes/{classId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                       request.resource.data.teacherId == request.auth.uid;
      allow update: if request.auth != null && 
                       (request.resource.data.teacherId == request.auth.uid ||
                        request.auth.uid in resource.data.students);
    }
    
    // 학생 작업
    match /studentWorks/{workId} {
      allow read: if request.auth != null && 
                     (resource.data.studentId == request.auth.uid ||
                      get(/databases/$(database)/documents/classes/$(resource.data.classCode)).data.teacherId == request.auth.uid);
      allow create: if request.auth != null && 
                       request.resource.data.studentId == request.auth.uid;
    }
  }
}
```

**현재 상태:** 보안 규칙 설정 필요

---

## ✅ 7단계: 테스트

- [ ] 로컬 서버 실행 (`python -m http.server 8000`)
- [ ] 브라우저에서 `http://localhost:8000/login.html` 열기
- [ ] 교사 계정으로 회원가입 테스트
- [ ] 학생 계정으로 회원가입 테스트
- [ ] 교사로 로그인하여 반코드 생성 테스트
- [ ] 학생으로 로그인하여 반 가입 테스트
- [ ] 이미지 생성 및 작업 저장 테스트
- [ ] 교사 대시보드에서 학생 작업 확인 테스트

**현재 상태:** 테스트 필요

---

## 완료 확인

모든 단계를 완료했는지 확인하세요:
- [ ] Firebase 프로젝트 생성 완료
- [ ] 웹 앱 추가 및 설정 정보 입력 완료
- [ ] Authentication 활성화 완료
- [ ] Firestore Database 생성 완료
- [ ] 보안 규칙 설정 완료
- [ ] 테스트 완료

---

## 문제 해결

### 설정 정보를 찾을 수 없어요
→ Firebase Console > 프로젝트 설정 > 내 앱 > 웹 앱에서 설정 정보 확인

### Authentication이 작동하지 않아요
→ Firebase Console > Authentication > Sign-in method에서 이메일/비밀번호가 활성화되어 있는지 확인

### Firestore 접근 오류가 발생해요
→ Firebase Console > Firestore Database > 규칙에서 보안 규칙이 올바르게 설정되었는지 확인

### CORS 오류가 발생해요
→ Firebase 설정이 올바른지 확인하고, 브라우저 콘솔에서 오류 메시지 확인

