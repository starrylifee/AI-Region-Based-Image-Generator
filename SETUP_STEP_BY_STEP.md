# Firebase 설정 단계별 가이드 (스크린샷 포함)

## 🚀 빠른 시작

Firebase 설정을 완료하려면 약 10-15분이 소요됩니다.

---

## 1단계: Firebase 프로젝트 생성

### 1-1. Firebase Console 접속
1. 브라우저에서 [Firebase Console](https://console.firebase.google.com/) 열기
2. Google 계정으로 로그인 (없으면 계정 생성)

### 1-2. 프로젝트 추가
1. "프로젝트 추가" 버튼 클릭
2. 프로젝트 이름 입력 (예: `ai-region-drawing-app`)
3. "계속" 클릭
4. Google Analytics 설정 (선택사항 - 필요 없으면 "이 프로젝트에 Google Analytics 사용 안 함" 선택)
5. "프로젝트 만들기" 클릭
6. 프로젝트 생성 완료 대기 (약 1-2분)

**✅ 완료 확인:** 프로젝트 목록에 새 프로젝트가 표시되면 완료

---

## 2단계: 웹 앱 추가 및 설정 정보 가져오기

### 2-1. 프로젝트 선택
1. 방금 생성한 프로젝트 클릭하여 선택

### 2-2. 웹 앱 추가
1. 프로젝트 홈 화면에서 **</> (웹 아이콘)** 클릭
   - 또는 프로젝트 설정(⚙️) > 내 앱 > 웹 앱 추가
2. 앱 닉네임 입력 (예: `AI Region Drawing Web`)
3. "Firebase Hosting도 설정" 체크박스는 **체크 해제** (선택사항)
4. "앱 등록" 클릭

### 2-3. 설정 정보 복사
1. 표시되는 설정 정보를 복사
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```
2. 이 정보를 복사해두세요 (다음 단계에서 사용)

**✅ 완료 확인:** 설정 정보를 복사했으면 완료

---

## 3단계: firebase-config.js 파일 수정

### 3-1. 파일 열기
1. 프로젝트 폴더에서 `firebase-config.js` 파일 열기

### 3-2. 설정 정보 입력
1. 2단계에서 복사한 설정 정보를 파일에 붙여넣기
2. 각 값이 올바르게 입력되었는지 확인:
   - `apiKey`: "AIza..."로 시작
   - `authDomain`: "프로젝트ID.firebaseapp.com" 형식
   - `projectId`: 프로젝트 ID
   - `storageBucket`: "프로젝트ID.appspot.com" 형식
   - `messagingSenderId`: 숫자
   - `appId`: "1:숫자:web:문자열" 형식
3. 파일 저장

**✅ 완료 확인:** `firebase-config.js` 파일에 실제 설정 값이 입력되었으면 완료

---

## 4단계: Authentication 활성화

### 4-1. Authentication 메뉴 접근
1. Firebase Console 왼쪽 메뉴에서 "Authentication" 클릭
2. "시작하기" 버튼 클릭 (처음인 경우)

### 4-2. 이메일/비밀번호 인증 활성화
1. "Sign-in method" 탭 클릭
2. "이메일/비밀번호" 항목 찾기
3. "이메일/비밀번호" 클릭
4. "사용 설정" 토글을 **ON**으로 변경
5. "저장" 버튼 클릭

**✅ 완료 확인:** "이메일/비밀번호" 항목에 "사용 설정됨" 표시되면 완료

---

## 5단계: Firestore Database 생성

### 5-1. Firestore Database 메뉴 접근
1. Firebase Console 왼쪽 메뉴에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 버튼 클릭

### 5-2. 데이터베이스 설정
1. **"테스트 모드로 시작"** 선택 ⚠️
   - 개발 중이므로 테스트 모드로 시작
   - 나중에 보안 규칙으로 보호할 예정
2. "다음" 클릭
3. 위치 선택:
   - **권장:** `asia-northeast3 (Seoul)` - 한국에서 가장 빠름
   - 또는 가장 가까운 지역 선택
4. "사용 설정" 클릭
5. 데이터베이스 생성 완료 대기 (약 1-2분)

**✅ 완료 확인:** Firestore Database 화면이 표시되면 완료

---

## 6단계: Firestore 보안 규칙 설정

### 6-1. 규칙 탭 접근
1. Firestore Database 화면에서 "규칙" 탭 클릭

### 6-2. 보안 규칙 입력
1. 기존 규칙을 모두 삭제
2. 아래 규칙을 복사하여 붙여넣기:

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

3. "게시" 버튼 클릭
4. 확인 대화상자에서 "게시" 클릭

**✅ 완료 확인:** 규칙이 저장되고 "규칙이 게시되었습니다" 메시지가 표시되면 완료

---

## 7단계: 테스트

### 7-1. 로컬 서버 실행
1. 터미널/명령 프롬프트에서 프로젝트 폴더로 이동
2. 다음 명령어 실행:
   ```bash
   python -m http.server 8000
   ```
3. 서버가 실행되면 브라우저에서 `http://localhost:8000/login.html` 열기

### 7-2. 교사 계정 테스트
1. "회원가입" 탭 클릭
2. 사용자 유형: **"교사"** 선택
3. 이름, 이메일, 비밀번호 입력
4. "회원가입" 클릭
5. 로그인 성공 확인
6. 대시보드에서 반코드 생성 테스트

### 7-3. 학생 계정 테스트
1. 로그아웃
2. "회원가입" 탭 클릭
3. 사용자 유형: **"학생"** 선택
4. 이름, 이메일, 비밀번호 입력
5. **반코드 입력** (교사가 생성한 반코드)
6. "회원가입" 클릭
7. 로그인 성공 확인
8. 이미지 생성 및 작업 저장 테스트

### 7-4. 교사 대시보드 테스트
1. 교사 계정으로 로그인
2. 대시보드에서 학생 작업 확인
3. 작업 상세 보기 테스트

**✅ 완료 확인:** 모든 기능이 정상 작동하면 설정 완료!

---

## 🎉 설정 완료!

모든 단계를 완료했다면 이제 앱을 사용할 수 있습니다.

### 다음 단계:
1. 교사 계정으로 반코드 생성
2. 학생들에게 반코드 공유
3. 학생들이 작업 저장
4. 교사 대시보드에서 확인

---

## 문제 해결

### 오류: "Firebase: Error (auth/invalid-api-key)"
→ `firebase-config.js` 파일의 설정 정보가 올바른지 확인하세요.

### 오류: "Firebase: Error (auth/operation-not-allowed)"
→ Firebase Console > Authentication > Sign-in method에서 이메일/비밀번호가 활성화되어 있는지 확인하세요.

### 오류: "Missing or insufficient permissions"
→ Firestore 보안 규칙이 올바르게 설정되었는지 확인하세요.

### 브라우저 콘솔에 오류가 표시됩니다
→ 브라우저 개발자 도구(F12) > Console 탭에서 오류 메시지를 확인하고, 위의 문제 해결 방법을 참고하세요.

