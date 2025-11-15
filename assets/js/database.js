// Firestore 데이터베이스 작업 모듈

class DatabaseManager {
  // 학생 작업 저장 (프롬프트 + 이미지)
  async saveStudentWork(overallPrompt, regions, generatedImageBase64) {
    if (!authManager.currentUser || authManager.userRole !== 'student') {
      return { success: false, error: '학생만 작업을 저장할 수 있습니다.' };
    }

    if (!authManager.classCode) {
      return { success: false, error: '반에 가입되어 있지 않습니다.' };
    }

    try {
      const workData = {
        studentId: authManager.currentUser.uid,
        studentName: authManager.currentUser.displayName || '익명',
        studentEmail: authManager.currentUser.email,
        studentNumber: authManager.studentNumber || null,
        className: authManager.className || null,
        classCode: authManager.classCode,
        overallPrompt: overallPrompt,
        regions: regions.map(r => ({
          id: r.id,
          type: r.type,
          prompt: r.prompt,
          // 이미지는 base64로 저장 (큰 데이터이므로 나중에 Storage로 옮길 수 있음)
          imageBase64: r.imageBase64 || null
        })),
        generatedImageBase64: generatedImageBase64,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('studentWorks').add(workData);
      
      return { success: true };
    } catch (error) {
      console.error('작업 저장 오류:', error);
      return { success: false, error: error.message };
    }
  }

  // 교사: 특정 반의 모든 학생 작업 가져오기
  async getStudentWorksByClass(classCode) {
    if (!authManager.currentUser || authManager.userRole !== 'teacher') {
      return [];
    }

    try {
      const snapshot = await db.collection('studentWorks')
        .where('classCode', '==', classCode)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('학생 작업 가져오기 오류:', error);
      return [];
    }
  }

  // 교사: 특정 학생의 모든 작업 가져오기
  async getStudentWorksByStudent(studentId) {
    if (!authManager.currentUser || authManager.userRole !== 'teacher') {
      return [];
    }

    try {
      const snapshot = await db.collection('studentWorks')
        .where('studentId', '==', studentId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('학생 작업 가져오기 오류:', error);
      return [];
    }
  }

  // 교사: 반의 학생 목록 가져오기
  async getStudentsByClass(classCode) {
    if (!authManager.currentUser || authManager.userRole !== 'teacher') {
      return [];
    }

    try {
      const snapshot = await db.collection('classes')
        .doc(classCode)
        .collection('students')
        .orderBy('studentNumber')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('학생 목록 가져오기 오류:', error);
      return [];
    }
  }
}

// 전역 인스턴스 생성
const databaseManager = new DatabaseManager();

