# Firebase 설정 가이드

이 프로젝트는 Firebase Authentication과 Firestore를 사용합니다. 아래 단계를 따라 Firebase를 설정하세요.

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 후 생성

## 2. Firebase 설정 정보 가져오기

1. Firebase Console에서 프로젝트 선택
2. 프로젝트 설정(톱니바퀴 아이콘) 클릭
3. "내 앱" 섹션에서 웹 앱 추가 (</> 아이콘)
4. 앱 닉네임 입력 후 "앱 등록"
5. 설정 정보 복사 (아래와 같은 형식)

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

## 3. firebase-config.js 파일 수정

`firebase-config.js` 파일을 열고 위에서 복사한 설정 정보로 교체하세요.

## 4. Authentication 설정

1. Firebase Console에서 "Authentication" 메뉴 클릭
2. "시작하기" 클릭
3. "이메일/비밀번호" 인증 방법 활성화
   - "이메일/비밀번호" 클릭
   - "사용 설정" 토글 활성화
   - 저장

## 5. Firestore Database 설정

1. Firebase Console에서 "Firestore Database" 메뉴 클릭
2. "데이터베이스 만들기" 클릭
3. "테스트 모드로 시작" 선택 (개발 중)
4. 위치 선택 (가까운 지역 선택)
5. "사용 설정" 클릭

## 6. Firestore 보안 규칙 설정

Firebase Console > Firestore Database > 규칙 탭에서 다음 규칙을 설정하세요:

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

## 7. 데이터베이스 구조

### users 컬렉션
```
users/{userId}
  - email: string
  - name: string
  - role: "teacher" | "student"
  - classCode: string (학생인 경우)
  - createdAt: timestamp
```

### classes 컬렉션
```
classes/{classCode}
  - className: string
  - teacherId: string
  - teacherName: string
  - students: array<string> (학생 UID 배열)
  - createdAt: timestamp
```

### studentWorks 컬렉션
```
studentWorks/{workId}
  - studentId: string
  - studentName: string
  - studentEmail: string
  - classCode: string
  - overallPrompt: string
  - regions: array
  - generatedImageBase64: string
  - createdAt: timestamp
```

## 8. 테스트

1. `login.html` 페이지를 열어 회원가입/로그인 테스트
2. 교사 계정으로 로그인하여 반코드 생성 테스트
3. 학생 계정으로 로그인하여 반코드 입력 및 작업 저장 테스트
4. 교사 대시보드에서 학생 작업 확인 테스트

## 주의사항

- 프로덕션 환경에서는 Firestore 보안 규칙을 더 엄격하게 설정하세요
- 이미지 데이터가 크므로, 프로덕션에서는 Firebase Storage를 사용하는 것을 권장합니다
- API 키는 클라이언트에 노출되지만, 보안 규칙으로 데이터 접근을 제어합니다

