// Firebase 인증 및 사용자 관리 모듈

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.userRole = null; // 'teacher' or 'student'
    this.classCode = null; // 학생의 경우 반코드
    this.studentNumber = null;
    this.className = null;
    
    // 인증 상태 변경 감지
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.currentUser = user;
        await this.loadUserData();
        this.onAuthStateChanged();
      } else {
        this.currentUser = null;
        this.userRole = null;
        this.classCode = null;
        this.onAuthStateChanged();
      }
    });
  }

  async loadUserData() {
    if (!this.currentUser) return;
    
    try {
      const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const normalizedRole = this.normalizeRoleValue(userData.role);
        this.userRole = normalizedRole;
        this.classCode = userData.classCode || null;
        this.studentNumber = userData.studentNumber || null;
        this.className = userData.className || null;

        // Firestore에 저장된 role 값이 정규화된 값과 다르면 업데이트
        if (normalizedRole && normalizedRole !== userData.role) {
          await db.collection('users').doc(this.currentUser.uid).update({
            role: normalizedRole
          });
        }
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
    }
  }

  onAuthStateChanged() {
    // 인증 상태 변경 시 호출되는 콜백
    // app.js에서 오버라이드하여 사용
    if (typeof window.onAuthStateChanged === 'function') {
      window.onAuthStateChanged(this.currentUser, this.userRole, this.classCode);
    }
  }

  // 교사 회원가입
  async signUpTeacher(email, password, name) {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // 사용자 프로필 업데이트
      await user.updateProfile({ displayName: name });
      
      // Firestore에 사용자 정보 저장
      await db.collection('users').doc(user.uid).set({
        email: email,
        name: name,
        role: 'teacher',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      this.currentUser = user;
      this.userRole = 'teacher';
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 학생 회원가입
  async signUpStudent(email, password, name, classCode) {
    try {
      // 반코드 유효성 검사
      const classDoc = await db.collection('classes').doc(classCode).get();
      if (!classDoc.exists) {
        return { success: false, error: '유효하지 않은 반코드입니다.' };
      }

      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      await user.updateProfile({ displayName: name });
      
      // Firestore에 사용자 정보 저장
      await db.collection('users').doc(user.uid).set({
        email: email,
        name: name,
        role: 'student',
        classCode: classCode,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // 반에 학생 추가
      await db.collection('classes').doc(classCode).update({
        students: firebase.firestore.FieldValue.arrayUnion(user.uid)
      });
      
      this.currentUser = user;
      this.userRole = 'student';
      this.classCode = classCode;
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 로그인
  async signIn(email, password) {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      await this.loadUserData();
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 로그아웃
  async signOut() {
    try {
      await auth.signOut();
      this.currentUser = null;
      this.userRole = null;
      this.classCode = null;
      this.studentNumber = null;
      this.className = null;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 교사: 반코드 생성
  async createClassCode(className) {
    if (this.userRole !== 'teacher') {
      return { success: false, error: '교사만 반코드를 생성할 수 있습니다.' };
    }

    try {
      const slug = this.generateClassSlug(className);
      if (!slug) {
        return { success: false, error: '반 이름이 올바르지 않습니다.' };
      }

      // 동일 슬러그 존재 여부 확인 (반 이름 중복 방지)
      const existing = await db.collection('classes').where('classSlug', '==', slug).limit(1).get();
      if (!existing.empty) {
        return { success: false, error: '이미 존재하는 반 이름입니다. 다른 이름을 사용하세요.' };
      }

      // 랜덤 반코드 생성 (6자리)
      const classCode = this.generateClassCode();
      
      await db.collection('classes').doc(classCode).set({
        className: className,
        classSlug: slug,
        classNameLower: className.trim().toLowerCase(),
        teacherId: this.currentUser.uid,
        teacherName: this.currentUser.displayName,
        students: [],
        studentCount: 0,
        lastStudentNumber: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, classCode };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 랜덤 반코드 생성
  generateClassCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 학생: 반코드로 반 가입
  async joinClass(classCode) {
    if (this.userRole !== 'student' || !this.currentUser) {
      return { success: false, error: '학생만 반에 가입할 수 있습니다.' };
    }

    try {
      const classDoc = await db.collection('classes').doc(classCode).get();
      if (!classDoc.exists) {
        return { success: false, error: '유효하지 않은 반코드입니다.' };
      }

      // 이미 가입된 반이 있으면 업데이트
      const oldClassCode = this.classCode;
      
      await db.collection('users').doc(this.currentUser.uid).update({
        classCode: classCode
      });

      // 새 반에 학생 추가
      await db.collection('classes').doc(classCode).update({
        students: firebase.firestore.FieldValue.arrayUnion(this.currentUser.uid)
      });

      // 이전 반에서 학생 제거
      if (oldClassCode) {
        await db.collection('classes').doc(oldClassCode).update({
          students: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid)
        });
      }

      this.classCode = classCode;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 교사: 자신이 생성한 반 목록 가져오기
  async getTeacherClasses() {
    if (this.userRole !== 'teacher') {
      return [];
    }

    try {
      const snapshot = await db.collection('classes')
        .where('teacherId', '==', this.currentUser.uid)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('반 목록 가져오기 오류:', error);
      return [];
    }
  }

  async createStudentAccount(classId, studentName) {
    if (this.userRole !== 'teacher') {
      return { success: false, error: '교사만 학생을 생성할 수 있습니다.' };
    }

    if (!secondaryAuth) {
      return { success: false, error: '학생 생성용 인증을 초기화할 수 없습니다.' };
    }

    const classRef = db.collection('classes').doc(classId);

    try {
      const { classData, studentNumber } = await db.runTransaction(async (txn) => {
        const classSnap = await txn.get(classRef);
        if (!classSnap.exists) {
          throw new Error('반을 찾을 수 없습니다.');
        }
        const data = classSnap.data();
        const nextNumber = (data.lastStudentNumber || 0) + 1;
        txn.update(classRef, {
          lastStudentNumber: nextNumber,
          studentCount: (data.studentCount || 0) + 1
        });
        return {
          classData: data,
          studentNumber: this.normalizeStudentNumber(nextNumber)
        };
      });

      if (!studentNumber) {
        throw new Error('학생 번호를 생성하지 못했습니다.');
      }

      const password = this.generateStudentPassword();
      const classSlug = classData.classSlug || this.generateClassSlug(classData.className || classId);
      const studentEmail = this.generateStudentEmail(classSlug, studentNumber);
      const studentDisplayName = studentName && studentName.trim() ? studentName.trim() : `학생${studentNumber}`;

      const userCredential = await secondaryAuth.createUserWithEmailAndPassword(studentEmail, password);
      if (studentDisplayName) {
        await userCredential.user.updateProfile({ displayName: studentDisplayName });
      }

      const userData = {
        email: studentEmail,
        name: studentDisplayName,
        role: 'student',
        classCode: classId,
        className: classData.className,
        studentNumber: studentNumber,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: this.currentUser.uid
      };

      await db.collection('users').doc(userCredential.user.uid).set(userData);
      await classRef.collection('students').doc(studentNumber).set({
        studentNumber,
        studentName: studentDisplayName,
        password,
        email: studentEmail,
        authUid: userCredential.user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return {
        success: true,
        credentials: {
          className: classData.className,
          studentNumber,
          password,
          email: studentEmail
        }
      };
    } catch (error) {
      console.error('학생 생성 오류:', error);
      return { success: false, error: error.message || '학생 생성 실패' };
    }
  }

  generateStudentPassword() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  normalizeStudentNumber(value) {
    if (typeof value === 'number') {
      return value.toString().padStart(3, '0');
    }
    const digits = (value || '').toString().replace(/[^0-9]/g, '');
    if (!digits) return null;
    return digits.padStart(3, '0');
  }

  generateClassSlug(name) {
    if (!name) return null;
    const normalized = name.toString().trim().toLowerCase().replace(/\s+/g, ' ');
    let slug = '';
    for (const ch of normalized) {
      if (/[a-z0-9]/.test(ch)) {
        slug += ch;
      } else if (/\s/.test(ch)) {
        slug += '-';
      } else {
        slug += ch.charCodeAt(0).toString(16);
      }
    }
    slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
    return slug || normalized.replace(/\s+/g, '');
  }

  generateStudentEmail(classSlug, studentNumber) {
    const slug = classSlug || 'class';
    const number = this.normalizeStudentNumber(studentNumber) || '000';
    const domain = firebaseConfig?.projectId ? `${firebaseConfig.projectId}.students.local` : 'students.local';
    return `${number}.${slug}@${domain}`;
  }

  getStudentLoginEmail(classNameInput, studentNumberInput) {
    const slug = this.generateClassSlug(classNameInput);
    const number = this.normalizeStudentNumber(studentNumberInput);
    if (!slug || !number) return null;
    return this.generateStudentEmail(slug, number);
  }

  normalizeRoleValue(roleValue) {
    if (!roleValue) return null;
    const normalized = roleValue.toString().trim().toLowerCase();
    if (['teacher', '교사', 't', 'teacher_admin', 'admin'].includes(normalized)) {
      return 'teacher';
    }
    if (['student', '학생', 's'].includes(normalized)) {
      return 'student';
    }
    return null;
  }
}

// 전역 인스턴스 생성
const authManager = new AuthManager();

