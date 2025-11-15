// Firebase 설정 파일
// Firebase Console에서 프로젝트 설정을 가져와서 아래 값들을 채워주세요

const firebaseConfig = {
  apiKey: "AIzaSyB0XMsvkB68xjCNuYlZLoQveLbAxMp1Fik",
  authDomain: "ai-region-drawing.firebaseapp.com",
  projectId: "ai-region-drawing",
  storageBucket: "ai-region-drawing.firebasestorage.app",
  messagingSenderId: "29353134992",
  appId: "1:29353134992:web:4b8fb734555b8b78ed4115",
  measurementId: "G-HZ0JPBV1PY"
};
// Firebase 초기화
const primaryApp = firebase.apps.find(app => app.name === '[DEFAULT]') || firebase.initializeApp(firebaseConfig);

// Firebase 서비스 참조
const auth = primaryApp.auth();
const db = primaryApp.firestore();
const storage = primaryApp.storage();

// 학생 계정 생성을 위한 보조 앱 (교사 세션 유지용)
let secondaryApp = firebase.apps.find(app => app.name === 'SecondaryApp');
if (!secondaryApp) {
  secondaryApp = firebase.initializeApp(firebaseConfig, 'SecondaryApp');
}
const secondaryAuth = secondaryApp.auth();

