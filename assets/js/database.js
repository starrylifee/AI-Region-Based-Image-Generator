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
      let uploadResult = null;
      if (generatedImageBase64) {
        uploadResult = await this.uploadGeneratedImage(generatedImageBase64);
      }

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
          imageBase64: r.imageBase64 || null,
          x: typeof r.x === 'number' ? r.x : null,
          y: typeof r.y === 'number' ? r.y : null,
          width: typeof r.w === 'number' ? r.w : null,
          height: typeof r.h === 'number' ? r.h : null,
          cx: typeof r.cx === 'number' ? r.cx : null,
          cy: typeof r.cy === 'number' ? r.cy : null,
          radius: typeof r.radius === 'number' ? r.radius : null,
          color: r.color || null
        })),
        generatedImageBase64: null,
        generatedImageUrl: uploadResult?.downloadURL || null,
        generatedImageStoragePath: uploadResult?.storagePath || null,
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

  async uploadGeneratedImage(base64Data) {
    if (!storage) {
      throw new Error('Firebase Storage가 초기화되지 않았습니다.');
    }
    const user = authManager.currentUser;
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    const classCode = authManager.classCode || 'unassigned';
    const timestamp = Date.now();
    const path = `studentWorks/${classCode}/${user.uid}/${timestamp}.png`;
    const dataUrl = base64Data.startsWith('data:')
      ? base64Data
      : `data:image/png;base64,${base64Data}`;
    const storageRef = storage.ref().child(path);
    const snapshot = await storageRef.putString(dataUrl, 'data_url', {
      contentType: 'image/png',
      customMetadata: {
        studentId: user.uid,
        classCode: authManager.classCode || ''
      }
    });
    const downloadURL = await snapshot.ref.getDownloadURL();
    return {
      downloadURL,
      storagePath: path
    };
  }
}

// 전역 인스턴스 생성
const databaseManager = new DatabaseManager();

