(function(){
  document.addEventListener('DOMContentLoaded', () => {
    // 체험 모드 확인
    const isTrialMode = localStorage.getItem('trial_mode') === 'true';
    
    // 인증 체크 - 로그인하지 않은 경우 로그인 페이지로 리다이렉트 (체험 모드가 아닐 때만)
    auth.onAuthStateChanged(async (user) => {
      if (!user && !isTrialMode) {
        window.location.href = 'login.html';
        return;
      }
      if (user) {
        authManager.currentUser = user;
        await authManager.loadUserData();
      }
      updateUIForUser();
    });

    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    const canvasWrapper = document.getElementById('canvas-wrapper');

    const rectToolBtn = document.getElementById('rect-tool');
    const circleToolBtn = document.getElementById('circle-tool');
    const aspect16_9Btn = document.getElementById('aspect-16-9');
    const aspect9_16Btn = document.getElementById('aspect-9-16');
    const regionList = document.getElementById('region-list');
    const overallPromptEl = document.getElementById('overall-prompt');
    const overallPromptCard = document.getElementById('overall-prompt-card');
    const overallPromptBody = document.getElementById('overall-prompt-body');
    const overallPromptToggle = document.getElementById('overall-prompt-toggle');
    const overallPromptToggleLabel = document.getElementById('overall-prompt-toggle-label');
    const overallPromptToggleIcon = document.getElementById('overall-prompt-toggle-icon');
    const generateBtn = document.getElementById('generate-btn');
    const clearBtn = document.getElementById('clear-btn');
    const saveWorkBtn = document.getElementById('save-work-btn');

    const outputContainer = document.getElementById('output-container');
    const outputPlaceholder = document.getElementById('output-placeholder');
    const loadingSpinner = document.getElementById('loading-spinner');
    const outputImage = document.getElementById('output-image');
    const errorMessage = document.getElementById('error-message');
    const generationModal = document.getElementById('generation-modal');
    const generationModalTitle = document.getElementById('generation-modal-title');
    const generationModalSpinner = document.getElementById('generation-modal-spinner');
    const generationModalMessage = document.getElementById('generation-modal-message');
    const generationModalActions = document.getElementById('generation-modal-actions');
    const closeGenerationModalBtn = document.getElementById('close-generation-modal');
    const confirmGenerationModalBtn = document.getElementById('confirm-generation-modal');

    // 인증 관련 UI 요소
    const userInfo = document.getElementById('user-info');
    const dashboardBtn = document.getElementById('dashboard-btn');
    const joinClassBtn = document.getElementById('join-class-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const joinClassModal = document.getElementById('join-class-modal');
    const joinClassCodeInput = document.getElementById('join-class-code-input');
    const confirmJoinClassBtn = document.getElementById('confirm-join-class');
    const cancelJoinClassBtn = document.getElementById('cancel-join-class');
    const closeJoinModalBtn = document.getElementById('close-join-modal');
    const joinErrorMessage = document.getElementById('join-error-message');

    // Modal elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const saveSettingsBtn = document.getElementById('save-settings');
    const cancelSettingsBtn = document.getElementById('cancel-settings');
    const apiKeyInput = document.getElementById('api-key-input');
    const apiUrlInput = document.getElementById('api-url-input');

    // Tab elements
    const tabToolsBtn = document.getElementById('tab-tools');
    const tabRegionsBtn = document.getElementById('tab-regions');
    const tabContentTools = document.getElementById('tab-content-tools');
    const tabContentRegions = document.getElementById('tab-content-regions');

    let currentTool = 'rectangle';
    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let regions = [];
    let nextRegionId = 1;
    let currentAspectRatio = '16:9'; // 기본 비율

    const regionColors = ['#34D399','#F87171','#60A5FA','#FBBF24','#A78BFA','#EC4899'];
    let currentGeneratedImageBase64 = null; // 생성된 이미지 base64 저장

    if (canvas) {
      canvas.style.touchAction = 'none';
    }

    async function waitForRemoteEnv() {
      const promise = window.__ENV_PROMISE;
      if (!promise || typeof promise.then !== 'function') {
        return;
      }
      try {
        await promise;
      } catch (err) {
        console.warn('원격 환경 변수 로드 실패:', err);
      }
    }

    // 사용자 역할에 따른 UI 업데이트
    function updateUIForUser() {
      const isTrialMode = localStorage.getItem('trial_mode') === 'true';
      const user = authManager.currentUser;
      const role = authManager.userRole;
      const normalizedRole = (role || '').toString().trim().toLowerCase();
      const isStudent = normalizedRole === 'student' || Boolean(authManager.studentNumber || authManager.classCode);
      const isTeacher = normalizedRole === 'teacher' || (!isStudent && !!user);
      let roleLabel = '';
      if (isTeacher) {
        roleLabel = '교사';
      } else if (isStudent) {
        roleLabel = '학생';
      }
      
      if (isTrialMode) {
        // 체험 모드 UI
        userInfo.textContent = '체험 모드 (비회원)';
        userInfo.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        dashboardBtn.classList.add('hidden');
        joinClassBtn.classList.add('hidden');
        saveWorkBtn.classList.add('hidden');
        
        // 체험 모드 알림 표시
        if (!document.getElementById('trial-notice')) {
          const notice = document.createElement('div');
          notice.id = 'trial-notice';
          notice.className = 'bg-yellow-900/50 border border-yellow-700 rounded-lg p-3 mb-4 text-yellow-300 text-sm max-w-7xl mx-auto';
          notice.innerHTML = '<strong>체험 모드:</strong> 이미지 생성만 가능합니다. 작업 저장 및 반 가입 기능은 회원가입 후 이용하실 수 있습니다.';
          const mainContent = document.querySelector('main');
          if (mainContent) {
            mainContent.insertBefore(notice, mainContent.firstChild);
          }
        }
        
        // 체험 모드 종료 버튼 추가
        addTrialExitButton();
      } else if (user) {
        // 일반 사용자 UI
        let roleDisplay = roleLabel;
        if (isStudent && authManager.studentNumber) {
          roleDisplay += ` #${authManager.studentNumber}`;
        }
        const baseLabel = user.displayName || user.email;
        userInfo.textContent = roleDisplay ? `${baseLabel} (${roleDisplay})` : baseLabel;
        userInfo.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        
        if (isTeacher) {
          dashboardBtn.classList.remove('hidden');
          saveWorkBtn.classList.add('hidden');
          joinClassBtn.classList.add('hidden');
        } else if (isStudent) {
          saveWorkBtn.classList.remove('hidden');
          if (!authManager.classCode) {
            joinClassBtn.classList.remove('hidden');
          } else {
            joinClassBtn.classList.add('hidden');
          }
        } else {
          // 역할 미지정: 버튼들을 숨김 처리
          dashboardBtn.classList.add('hidden');
          saveWorkBtn.classList.add('hidden');
          joinClassBtn.classList.add('hidden');
        }
      } else {
        // 로그인하지 않은 경우 (이론적으로는 도달하지 않아야 함)
        userInfo.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        dashboardBtn.classList.add('hidden');
        joinClassBtn.classList.add('hidden');
        saveWorkBtn.classList.add('hidden');
        
        // 체험 모드 종료 버튼 제거
        const exitBtn = document.getElementById('exit-trial-btn');
        if (exitBtn) {
          exitBtn.remove();
        }
      }
    }

    // 인증 상태 변경 콜백
    window.onAuthStateChanged = function(user, role, classCode) {
      updateUIForUser();
      addTrialExitButton();
    };

    // 대시보드 버튼 클릭
    dashboardBtn.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });

    // 반 가입 버튼 클릭
    joinClassBtn.addEventListener('click', () => {
      joinClassModal.classList.remove('hidden');
    });

    // 반 가입 모달 닫기
    closeJoinModalBtn.addEventListener('click', () => {
      joinClassModal.classList.add('hidden');
      joinClassCodeInput.value = '';
      joinErrorMessage.classList.add('hidden');
    });

    cancelJoinClassBtn.addEventListener('click', () => {
      joinClassModal.classList.add('hidden');
      joinClassCodeInput.value = '';
      joinErrorMessage.classList.add('hidden');
    });

    joinClassModal.addEventListener('click', (e) => {
      if (e.target === joinClassModal) {
        joinClassModal.classList.add('hidden');
        joinClassCodeInput.value = '';
        joinErrorMessage.classList.add('hidden');
      }
    });

    // 반 가입 확인
    confirmJoinClassBtn.addEventListener('click', async () => {
      const classCode = joinClassCodeInput.value.trim().toUpperCase();
      if (!classCode) {
        joinErrorMessage.textContent = '반코드를 입력하세요.';
        joinErrorMessage.classList.remove('hidden');
        return;
      }

      const result = await authManager.joinClass(classCode);
      if (result.success) {
        joinClassModal.classList.add('hidden');
        joinClassCodeInput.value = '';
        joinClassBtn.classList.add('hidden');
        alert('반 가입이 완료되었습니다!');
        updateUIForUser();
      } else {
        joinErrorMessage.textContent = result.error || '반 가입에 실패했습니다.';
        joinErrorMessage.classList.remove('hidden');
      }
    });

    // 로그아웃
    logoutBtn.addEventListener('click', async () => {
      await authManager.signOut();
      window.location.href = 'login.html';
    });

    // 체험 모드 종료 버튼 (체험 모드일 때만 표시)
    function addTrialExitButton() {
      const isTrialMode = localStorage.getItem('trial_mode') === 'true';
      if (isTrialMode && !document.getElementById('exit-trial-btn')) {
        const exitBtn = document.createElement('button');
        exitBtn.id = 'exit-trial-btn';
        exitBtn.className = 'bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all duration-200';
        exitBtn.textContent = '체험 종료';
        exitBtn.addEventListener('click', () => {
          localStorage.removeItem('trial_mode');
          window.location.href = 'login.html';
        });
        const headerDiv = document.querySelector('header > div > div');
        if (headerDiv) {
          headerDiv.appendChild(exitBtn);
        }
      }
    }

    function setOverallPromptCollapsed(collapsed) {
      if (!overallPromptBody || !overallPromptCard) return;
      overallPromptBody.classList.toggle('hidden', collapsed);
      overallPromptCard.classList.toggle('opacity-80', collapsed);
      overallPromptCard.classList.toggle('border-dashed', collapsed);
      if (overallPromptToggle) {
        overallPromptToggle.setAttribute('aria-expanded', (!collapsed).toString());
      }
      if (overallPromptToggleLabel) {
        overallPromptToggleLabel.textContent = collapsed ? '펼치기' : '접기';
      }
      if (overallPromptToggleIcon) {
        overallPromptToggleIcon.classList.toggle('rotate-180', !collapsed);
      }
    }

    function initializeOverallPromptCollapsible() {
      if (!overallPromptCard || !overallPromptBody || !overallPromptToggle) return;
      let collapsedState = true;
      setOverallPromptCollapsed(collapsedState);

      overallPromptToggle.addEventListener('click', () => {
        collapsedState = !collapsedState;
        setOverallPromptCollapsed(collapsedState);
      });
    }

    initializeOverallPromptCollapsible();

    const generationModalMessages = {
      loading: 'AI가 이미지를 생성하고 있습니다...',
      success: '만들어졌습니다. 아래쪽을 확인하세요.',
      error: '이미지를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.'
    };
    const generationModalTitles = {
      loading: '이미지 생성 중',
      success: '이미지 생성 완료',
      error: '이미지 생성 실패'
    };
    let generationModalClosable = false;
    let currentGenerationModalState = 'idle';

    function setGenerationModalState(state = 'loading', customMessage) {
      if (!generationModal) return;
      currentGenerationModalState = state;
      const isLoading = state === 'loading';
      const message = customMessage || generationModalMessages[state] || '';
      const title = generationModalTitles[state] || '이미지 생성';
      if (generationModalSpinner) {
        generationModalSpinner.classList.toggle('hidden', !isLoading);
      }
      if (generationModalActions) {
        generationModalActions.classList.toggle('hidden', isLoading);
      }
      if (generationModalMessage) {
        generationModalMessage.textContent = message;
      }
      if (generationModalTitle) {
        generationModalTitle.textContent = title;
      }
      generationModalClosable = !isLoading;
      if (closeGenerationModalBtn) {
        closeGenerationModalBtn.classList.toggle('hidden', isLoading);
        closeGenerationModalBtn.disabled = isLoading;
      }
    }

    function openGenerationModal(state = 'loading', customMessage) {
      if (!generationModal) return;
      setGenerationModalState(state, customMessage);
      generationModal.classList.remove('hidden');
      generationModal.classList.add('show');
    }

    function closeGenerationModal(force = false) {
      if (!generationModal) return;
      if (!generationModalClosable && !force) return;
      generationModal.classList.add('hidden');
      generationModal.classList.remove('show');
      currentGenerationModalState = 'idle';
    }

    function handleGenerationModalClose() {
      const targetState = currentGenerationModalState;
      closeGenerationModal(true);
      if (targetState === 'success' && outputContainer) {
        outputContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    if (closeGenerationModalBtn) {
      closeGenerationModalBtn.addEventListener('click', handleGenerationModalClose);
    }
    if (confirmGenerationModalBtn) {
      confirmGenerationModalBtn.addEventListener('click', handleGenerationModalClose);
    }
    if (generationModal) {
      generationModal.addEventListener('click', (e) => {
        if (e.target === generationModal && generationModalClosable) {
          handleGenerationModalClose();
        }
      });
    }

    // Tab switching functionality
    function switchTab(tabName) {
      if (tabName === 'tools') {
        tabToolsBtn.classList.remove('bg-gray-700', 'text-gray-300', 'hover:bg-gray-600');
        tabToolsBtn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
        tabRegionsBtn.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        tabRegionsBtn.classList.add('bg-gray-700', 'text-gray-300', 'hover:bg-gray-600');
        tabContentTools.classList.remove('hidden');
        tabContentRegions.classList.add('hidden');
      } else if (tabName === 'regions') {
        tabRegionsBtn.classList.remove('bg-gray-700', 'text-gray-300', 'hover:bg-gray-600');
        tabRegionsBtn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
        tabToolsBtn.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        tabToolsBtn.classList.add('bg-gray-700', 'text-gray-300', 'hover:bg-gray-600');
        tabContentRegions.classList.remove('hidden');
        tabContentTools.classList.add('hidden');
      }
    }

    tabToolsBtn.addEventListener('click', () => switchTab('tools'));
    tabRegionsBtn.addEventListener('click', () => switchTab('regions'));

    // Modal functionality
    async function openModal() {
      settingsModal.classList.remove('hidden');
      settingsModal.classList.add('show');
      await waitForRemoteEnv();
      // Load current settings from window.__ENV__ or localStorage
      let apiKey = window.__ENV__?.API_KEY || '';
      let apiUrl = window.__ENV__?.API_URL || '';
      
      if (!apiKey) {
        try {
          apiKey = localStorage.getItem('api_key') || '';
        } catch (e) {}
      }
      
      if (!apiUrl) {
        try {
          apiUrl = localStorage.getItem('api_url') || '';
        } catch (e) {}
      }
      
      apiKeyInput.value = apiKey;
      apiUrlInput.value = apiUrl;
    }

    function closeModal() {
      settingsModal.classList.add('hidden');
      settingsModal.classList.remove('show');
    }

    settingsBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelSettingsBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        closeModal();
      }
    });

    // Save settings
    saveSettingsBtn.addEventListener('click', () => {
      const apiKey = apiKeyInput.value.trim();
      const apiUrl = apiUrlInput.value.trim();
      
      if (!window.__ENV__) {
        window.__ENV__ = {};
      }
      
      window.__ENV__.API_KEY = apiKey;
      window.__ENV__.API_URL = apiUrl || '';
      window.__ENV_PROMISE = Promise.resolve(window.__ENV__);
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('api_key', apiKey);
        localStorage.setItem('api_url', apiUrl);
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
      
      closeModal();
    });

    // Load settings from localStorage on page load
    try {
      const savedApiKey = localStorage.getItem('api_key');
      const savedApiUrl = localStorage.getItem('api_url');
      if (savedApiKey && !window.__ENV__?.API_KEY) {
        if (!window.__ENV__) window.__ENV__ = {};
        window.__ENV__.API_KEY = savedApiKey;
      }
      if (savedApiUrl && !window.__ENV__?.API_URL) {
        if (!window.__ENV__) window.__ENV__ = {};
        window.__ENV__.API_URL = savedApiUrl;
      }
    } catch (e) {
      console.warn('Could not load from localStorage:', e);
    }

    function syncOutputContainerSize(width, height) {
      if (!outputContainer) return;
      const safeWidth = Number(width) || 0;
      const safeHeight = Number(height) || 0;
      if (safeWidth > 0 && safeHeight > 0) {
        outputContainer.style.aspectRatio = `${safeWidth} / ${safeHeight}`;
        const targetHeight = Math.max(Math.round(safeHeight), 300);
        outputContainer.style.minHeight = `${targetHeight}px`;
        outputContainer.style.height = `${targetHeight}px`;
        outputContainer.style.maxHeight = `${targetHeight}px`;
      }
    }

    function resizeCanvas(){
      const wrapper = canvasWrapper;
      const wrapperWidth = wrapper.clientWidth;
      const wrapperHeight = wrapper.clientHeight;
      
      // 패딩 고려 (p-4 = 16px * 2 = 32px)
      const padding = 32;
      const availableWidth = wrapperWidth - padding;
      const availableHeight = wrapperHeight - padding;
      
      let canvasWidth, canvasHeight;
      
      // 선택된 비율에 따라 캔버스 크기 계산 (가능한 한 크게)
      if (currentAspectRatio === '16:9') {
        // 16:9 비율 - 가로가 더 긴 형태 (가로:세로 = 16:9)
        // 가로 기준으로 먼저 계산
        canvasWidth = availableWidth;
        canvasHeight = canvasWidth * 9 / 16;
        
        // 세로가 넘치면 세로 기준으로 재계산
        if (canvasHeight > availableHeight) {
          canvasHeight = availableHeight;
          canvasWidth = canvasHeight * 16 / 9;
        }
      } else if (currentAspectRatio === '9:16') {
        // 9:16 비율 - 세로가 더 긴 형태 (가로:세로 = 9:16)
        // 세로 기준으로 먼저 계산
        canvasHeight = availableHeight;
        canvasWidth = canvasHeight * 9 / 16;
        
        // 가로가 넘치면 가로 기준으로 재계산
        if (canvasWidth > availableWidth) {
          canvasWidth = availableWidth;
          canvasHeight = canvasWidth * 16 / 9;
        }
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // 캔버스 배경을 검정색으로 채우기
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      drawAllRegions();
      syncOutputContainerSize(canvasWidth, canvasHeight);
    }
    
    function selectAspectRatio(ratio) {
      currentAspectRatio = ratio;
      
      // 버튼 스타일 업데이트
      if (ratio === '16:9') {
        aspect16_9Btn.classList.remove('bg-gradient-to-br', 'from-gray-600', 'to-gray-700', 'hover:from-gray-500', 'hover:to-gray-600', 'border-gray-500');
        aspect16_9Btn.classList.add('bg-gradient-to-br', 'from-blue-600', 'to-blue-700', 'hover:from-blue-500', 'hover:to-blue-600', 'border-blue-500');
        aspect9_16Btn.classList.remove('bg-gradient-to-br', 'from-blue-600', 'to-blue-700', 'hover:from-blue-500', 'hover:to-blue-600', 'border-blue-500');
        aspect9_16Btn.classList.add('bg-gradient-to-br', 'from-gray-600', 'to-gray-700', 'hover:from-gray-500', 'hover:to-gray-600', 'border-gray-500');
      } else {
        aspect9_16Btn.classList.remove('bg-gradient-to-br', 'from-gray-600', 'to-gray-700', 'hover:from-gray-500', 'hover:to-gray-600', 'border-gray-500');
        aspect9_16Btn.classList.add('bg-gradient-to-br', 'from-blue-600', 'to-blue-700', 'hover:from-blue-500', 'hover:to-blue-600', 'border-blue-500');
        aspect16_9Btn.classList.remove('bg-gradient-to-br', 'from-blue-600', 'to-blue-700', 'hover:from-blue-500', 'hover:to-blue-600', 'border-blue-500');
        aspect16_9Btn.classList.add('bg-gradient-to-br', 'from-gray-600', 'to-gray-700', 'hover:from-gray-500', 'hover:to-gray-600', 'border-gray-500');
      }
      
      // 캔버스 크기 재조정
      resizeCanvas();
    }

    function selectTool(tool){
      currentTool = tool;
      if(tool==='rectangle'){
        rectToolBtn.classList.remove('bg-gradient-to-br', 'from-gray-600', 'to-gray-700', 'hover:from-gray-500', 'hover:to-gray-600', 'border-gray-500');
        rectToolBtn.classList.add('bg-gradient-to-br', 'from-blue-600', 'to-blue-700', 'hover:from-blue-500', 'hover:to-blue-600', 'border-blue-500', 'active');
        rectToolBtn.setAttribute('aria-pressed','true');
        circleToolBtn.classList.remove('bg-gradient-to-br', 'from-blue-600', 'to-blue-700', 'hover:from-blue-500', 'hover:to-blue-600', 'border-blue-500', 'active');
        circleToolBtn.classList.add('bg-gradient-to-br', 'from-gray-600', 'to-gray-700', 'hover:from-gray-500', 'hover:to-gray-600', 'border-gray-500');
        circleToolBtn.setAttribute('aria-pressed','false');
      } else {
        circleToolBtn.classList.remove('bg-gradient-to-br', 'from-gray-600', 'to-gray-700', 'hover:from-gray-500', 'hover:to-gray-600', 'border-gray-500');
        circleToolBtn.classList.add('bg-gradient-to-br', 'from-blue-600', 'to-blue-700', 'hover:from-blue-500', 'hover:to-blue-600', 'border-blue-500', 'active');
        circleToolBtn.setAttribute('aria-pressed','true');
        rectToolBtn.classList.remove('bg-gradient-to-br', 'from-blue-600', 'to-blue-700', 'hover:from-blue-500', 'hover:to-blue-600', 'border-blue-500', 'active');
        rectToolBtn.classList.add('bg-gradient-to-br', 'from-gray-600', 'to-gray-700', 'hover:from-gray-500', 'hover:to-gray-600', 'border-gray-500');
        rectToolBtn.setAttribute('aria-pressed','false');
      }
    }

    rectToolBtn.addEventListener('click', ()=>selectTool('rectangle'));
    circleToolBtn.addEventListener('click', ()=>selectTool('circle'));
    
    // 비율 선택 버튼 이벤트
    aspect16_9Btn.addEventListener('click', () => selectAspectRatio('16:9'));
    aspect9_16Btn.addEventListener('click', () => selectAspectRatio('9:16'));

    function getCanvasCoordinates(evt) {
      const rect = canvas.getBoundingClientRect();
      const clientX = typeof evt?.clientX === 'number'
        ? evt.clientX
        : (evt?.touches?.[0]?.clientX ?? evt?.changedTouches?.[0]?.clientX ?? rect.left);
      const clientY = typeof evt?.clientY === 'number'
        ? evt.clientY
        : (evt?.touches?.[0]?.clientY ?? evt?.changedTouches?.[0]?.clientY ?? rect.top);
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function beginDrawing(evt) {
      if (!canvas || !ctx) return;
      if (evt.button !== undefined && evt.button !== 0) return;
      evt.preventDefault();
      const { x, y } = getCanvasCoordinates(evt);
      isDrawing = true;
      startX = x;
      startY = y;
      if (typeof canvas.setPointerCapture === 'function' && evt.pointerId !== undefined) {
        try {
          canvas.setPointerCapture(evt.pointerId);
        } catch (err) {
          console.warn('setPointerCapture 실패:', err);
        }
      }
    }

    function drawPreview(evt) {
      if (!isDrawing || !canvas || !ctx) return;
      evt.preventDefault();
      const { x: currentX, y: currentY } = getCanvasCoordinates(evt);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawAllRegions();
      ctx.strokeStyle = regionColors[(nextRegionId-1)%regionColors.length];
      ctx.lineWidth = 2;
      ctx.setLineDash([5,5]);
      if(currentTool==='rectangle') {
        ctx.strokeRect(startX,startY,currentX-startX,currentY-startY);
      } else {
        const r=Math.hypot(currentX-startX,currentY-startY);
        ctx.beginPath();
        ctx.arc(startX,startY,r,0,2*Math.PI);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    function finishDrawing(evt, cancelOnly = false) {
      if (!isDrawing || !canvas) return;
      evt?.preventDefault();
      if (evt?.pointerId !== undefined && typeof canvas.releasePointerCapture === 'function') {
        try {
          canvas.releasePointerCapture(evt.pointerId);
        } catch (err) {
          console.warn('releasePointerCapture 실패:', err);
        }
      }
      isDrawing=false;
      if (cancelOnly) {
        drawAllRegions();
        return;
      }
      const { x: endX, y: endY } = getCanvasCoordinates(evt);
      const color = regionColors[(nextRegionId-1)%regionColors.length];
      let newRegion;
      if(currentTool==='rectangle'){
        newRegion={id:nextRegionId,type:'rectangle',x:Math.min(startX,endX),y:Math.min(startY,endY),w:Math.abs(endX-startX),h:Math.abs(endY-startY),color:color,prompt:'',imageBase64:null};
      } else {
        const radius = Math.hypot(endX-startX,endY-startY);
        newRegion={id:nextRegionId,type:'circle',cx:startX,cy:startY,radius:radius,color:color,prompt:'',imageBase64:null};
      }
      if((newRegion.type==='rectangle' && (newRegion.w<10||newRegion.h<10)) || (newRegion.type==='circle' && newRegion.radius<5)){
        drawAllRegions();
        return;
      }
      regions.push(newRegion); nextRegionId++; drawAllRegions(); updateRegionList();
    }

    if (canvas) {
      canvas.addEventListener('pointerdown', beginDrawing);
      canvas.addEventListener('pointermove', drawPreview);
      canvas.addEventListener('pointerup', finishDrawing);
      canvas.addEventListener('pointercancel', (evt) => finishDrawing(evt, true));
      canvas.addEventListener('pointerleave', (evt) => finishDrawing(evt, true));
    }

    function drawAllRegions(){
      // 검정 배경으로 채우기
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      regions.forEach(region=>{
        ctx.strokeStyle=region.color; ctx.lineWidth=2; ctx.setLineDash([5,5]);
        if(region.type==='rectangle') ctx.strokeRect(region.x,region.y,region.w,region.h);
        else { ctx.beginPath(); ctx.arc(region.cx,region.cy,region.radius,0,2*Math.PI); ctx.stroke(); }
        ctx.fillStyle=region.color; ctx.font='14px Inter'; ctx.textAlign='left'; ctx.textBaseline='top';
        const text=`ID: ${region.id}${region.prompt?`: ${region.prompt.substring(0,15)}...`:''}`;
        const textX=(region.type==='rectangle')?region.x+5:region.cx-region.radius; const textY=(region.type==='rectangle')?region.y+5:region.cy-region.radius;
        ctx.fillText(text,textX,textY); ctx.setLineDash([]);
      });
    }

    function updateRegionList(){
      if(regions.length===0){ 
        regionList.innerHTML='<div class="bg-gray-700/30 rounded-lg p-4 border border-gray-600 border-dashed"><p class="text-gray-400 text-center text-sm">Draw on the canvas to add regions.</p></div>'; 
        return; 
      }
      regionList.innerHTML='';
      regions.slice().reverse().forEach(region=>{
        const regionEl=document.createElement('div'); 
        regionEl.className='region-item bg-gradient-to-br from-gray-700/80 to-gray-800/80 p-4 rounded-xl shadow-lg border border-gray-600/50'; 
        regionEl.style.borderLeftColor=region.color; 
        regionEl.style.borderLeftWidth='4px';
        regionEl.innerHTML=`
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-semibold" style="color:${region.color}">Region ${region.id} (${region.type})</h3>
            <button class="delete-region-btn text-red-400 hover:text-red-300 font-bold transition-colors duration-200 px-2 py-1 rounded hover:bg-red-500/20" data-id="${region.id}">
              <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
          <div class="space-y-3">
            <input type="text" data-id="${region.id}" class="prompt-input w-full p-2 bg-gray-600/80 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-400" placeholder="Prompt for this region..." value="${region.prompt}">
            <input type="file" data-id="${region.id}" class="image-input w-full text-sm text-gray-300 bg-gray-600/50 p-2 rounded-lg border border-gray-500 cursor-pointer hover:bg-gray-600 transition-colors duration-200" accept="image/*">
            <div class="preview-container" data-id="${region.id}">${region.imageBase64?`<img src="${region.imageBase64}" class="w-20 h-20 object-cover rounded-lg mt-2 shadow-md border border-gray-600">`:''}</div>
          </div>
        `;
        regionList.appendChild(regionEl);
      });

      document.querySelectorAll('.delete-region-btn').forEach(btn=>btn.addEventListener('click',e=>{ const id=parseInt(e.target.closest('.delete-region-btn').dataset.id); regions=regions.filter(r=>r.id!==id); drawAllRegions(); updateRegionList(); }));
      document.querySelectorAll('.prompt-input').forEach(input=>input.addEventListener('input',e=>{ const id=parseInt(e.target.dataset.id); const region=regions.find(r=>r.id===id); if(region){ region.prompt=e.target.value; drawAllRegions(); }}));
      document.querySelectorAll('.image-input').forEach(input=>input.addEventListener('change',e=>{ const id=parseInt(e.target.dataset.id); const region=regions.find(r=>r.id===id); const file=e.target.files[0]; if(file && region){ const reader=new FileReader(); reader.onload=(ev)=>{ region.imageBase64=ev.target.result; const preview=document.querySelector(`.preview-container[data-id="${id}"]`); if(preview) preview.innerHTML=`<img src="${region.imageBase64}" class="w-20 h-20 object-cover rounded-lg mt-2 shadow-md border border-gray-600">`; }; reader.readAsDataURL(file); } else if(region){ region.imageBase64=null; const preview=document.querySelector(`.preview-container[data-id="${id}"]`); if(preview) preview.innerHTML=''; }}));
      
      // Switch to regions tab when a region is added
      if (regions.length > 0) {
        switchTab('regions');
      }
    }

    async function autoBackupStudentWork(imageBase64) {
      if (!imageBase64) return;
      if (!authManager.currentUser || authManager.userRole !== 'student') return;
      if (!authManager.classCode) return;
      try {
        await databaseManager.saveStudentWork(
          overallPromptEl.value.trim(),
          regions,
          imageBase64
        );
        console.info('학생 작업이 자동으로 저장되었습니다.');
      } catch (error) {
        console.error('자동 백업 실패:', error);
      }
    }

    clearBtn.addEventListener('click',()=>{ regions=[]; nextRegionId=1; overallPromptEl.value=''; ctx.fillStyle = '#000000'; ctx.fillRect(0,0,canvas.width,canvas.height); updateRegionList(); outputImage.classList.add('hidden'); outputPlaceholder.classList.remove('hidden'); errorMessage.classList.add('hidden'); });

    generateBtn.addEventListener('click', async ()=>{
      const overallPrompt = overallPromptEl.value;
      openGenerationModal('loading');
      loadingSpinner.classList.remove('hidden'); 
      outputPlaceholder.classList.add('hidden'); 
      outputImage.classList.add('hidden'); 
      errorMessage.classList.add('hidden'); 
      generateBtn.disabled=true; 
      const generateBtnText = generateBtn.querySelector('span') || generateBtn;
      const originalText = generateBtnText.innerHTML;
      generateBtnText.innerHTML='<svg class="w-5 h-5 mr-2 animate-spin inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>Generating...';

      await waitForRemoteEnv();
      // Read config from window.__ENV__ (config.js) or localStorage
      let apiKey = window.__ENV__?.API_KEY || '';
      if (!apiKey) {
        try {
          apiKey = localStorage.getItem('api_key') || '';
        } catch (e) {}
      }
      
      let apiBase = window.__ENV__?.API_URL || '';
      if (!apiBase) {
        try {
          apiBase = localStorage.getItem('api_url') || '';
        } catch (e) {}
      }
      
      apiBase = apiBase || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';
      const apiUrl = apiBase.includes('?') ? `${apiBase}&key=${apiKey}` : `${apiBase}?key=${apiKey}`;

      if(!apiKey){ 
        loadingSpinner.classList.add('hidden'); 
        generateBtn.disabled=false; 
        generateBtnText.innerHTML = originalText;
        errorMessage.textContent='Missing API_KEY. Please set it in Settings (gear icon).'; 
        errorMessage.classList.remove('hidden'); 
        setGenerationModalState('error', 'API KEY가 없습니다. 설정(톱니)에서 입력해주세요.');
        return; 
      }

      // API 페이로드 구성
      // gemini-2.5-flash-image-preview 모델은 텍스트 프롬프트와 참조 이미지를 함께 받아 이미지를 생성할 수 있습니다.
      // 사용자가 그린 영역을 텍스트로 설명하고, 첨부된 이미지를 참조로 제공합니다.
      
      let parts = [];
      
      // 1. 영역 메타데이터 계산 (위치, 범위, 면적 비율)
      const regionDetails = regions.map((region) => {
        const locationKey = getRegionLocation(region, canvas.width, canvas.height);
        return {
          data: region,
          locationKey,
          locationText: translateLocation(locationKey),
          bounds: getRegionBounds(region, canvas.width, canvas.height),
          coverage: getRegionCoverage(region, canvas.width, canvas.height)
        };
      });
      
      // 2. 자연스러운 이미지 설명 프롬프트 구성
      const regionInstructions = [];
      
      regionDetails.forEach(({ data, locationText, bounds, coverage }) => {
        const coverageText = `${clampPercentValue(coverage)}%`;
        const boundsText = `가로 ${bounds.left}%~${bounds.right}%, 세로 ${bounds.top}%~${bounds.bottom}%`;
        let instruction = `영역 ${data.id} (${locationText}, ${boundsText}, 약 ${coverageText}) - `;
        
        if (data.prompt) {
          instruction += `${data.prompt} 장면을 표현하세요.`;
        } else if (data.imageBase64) {
          instruction += `참조 이미지의 분위기와 구도를 그대로 반영하세요.`;
        } else {
          instruction += `배경과 자연스럽게 연결되도록 처리하세요.`;
        }
        
        if (data.imageBase64 && coverage > 0.4) {
          instruction += ' 이 영역은 전체 배경의 기준이 됩니다.';
        }
        
        regionInstructions.push(instruction);
      });
      
      let finalPrompt = '';
      if (overallPrompt) {
        finalPrompt = overallPrompt.trim();
      }
      
      if (regionInstructions.length > 0) {
        if (finalPrompt) finalPrompt += '\n\n';
        finalPrompt += '캔버스를 다음 지시에 맞춰 구성하세요:\n' + regionInstructions.join('\n');
      }
      
      if (!finalPrompt) {
        finalPrompt = 'Create a cohesive image based on the provided region directives.';
      }
      
      finalPrompt += '\n\n각 영역은 자연스럽게 연결하고, 새로운 텍스트 오버레이는 추가하지 마세요.';
      
      // 3. 참조 이미지 추가 (프롬프트가 없어도 참조 이미지가 있으면 추가)
      regionDetails.forEach(({ data, locationText, bounds, coverage }) => {
        if (data.imageBase64) {
          const coverageText = `${clampPercentValue(coverage)}%`;
          const boundsText = `가로 ${bounds.left}%~${bounds.right}%, 세로 ${bounds.top}%~${bounds.bottom}%`;
          
          let referenceInstruction = `영역 ${data.id} (${locationText}, ${boundsText}, 약 ${coverageText})에 대해 이 참조 이미지를 사용하세요.`;
          if (data.prompt) {
            referenceInstruction += ` "${data.prompt}" 표현 시 이 이미지를 반영하세요.`;
          } else {
            referenceInstruction += ' 참조 이미지의 분위기와 구도를 그대로 살려주세요.';
          }
          if (coverage > 0.4) {
            referenceInstruction += ' 이 이미지는 전체 배경의 기준입니다.';
          }
          referenceInstruction += ' 텍스트는 넣지 마세요.';
          
          const base64Data = data.imageBase64.split(',')[1];
          const mimeMatch = data.imageBase64.match(/data:(.*);/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
          
          parts.push({ text: referenceInstruction });
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          });
        }
      });
      
      // 최종 프롬프트를 parts 배열의 맨 앞에 추가
      parts.unshift({ text: finalPrompt });
      
      const payload = {
        contents: [{
          parts: parts
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      };

      try{
        const response = await fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        if(!response.ok){ const errorData = await response.json().catch(()=>null); throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`); }
        const result = await response.json();
        const base64Data = result?.candidates?.[0]?.content?.parts?.find(p=>p.inlineData)?.inlineData?.data;
        if(base64Data){ 
          outputImage.src = `data:image/png;base64,${base64Data}`; 
          outputImage.classList.remove('hidden'); 
          outputPlaceholder.classList.add('hidden');
          errorMessage.classList.add('hidden');
          currentGeneratedImageBase64 = base64Data; // 생성된 이미지 저장
          const isStudentUser = authManager.currentUser && authManager.userRole === 'student';
          setGenerationModalState('success', isStudentUser ? '이미지가 생성되었고 자동으로 교사에게 공유되었습니다.' : undefined);
          if (isStudentUser) {
            autoBackupStudentWork(base64Data);
          }
        }
        else { const textResponse = result?.candidates?.[0]?.content?.parts?.find(p=>p.text)?.text; throw new Error(textResponse || 'Failed to generate image. No image data received.'); }
      }catch(err){ 
        console.error('Error generating image:',err); 
        errorMessage.textContent = `Error: ${err.message}`; 
        errorMessage.classList.remove('hidden'); 
        outputImage.classList.add('hidden'); 
        outputPlaceholder.classList.remove('hidden'); 
        setGenerationModalState('error', `이미지를 생성하지 못했습니다: ${err.message}`);
      }
      finally{ 
        loadingSpinner.classList.add('hidden'); 
        generateBtn.disabled=false; 
        const generateBtnText = generateBtn.querySelector('span') || generateBtn;
        generateBtnText.innerHTML = '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>Generate Image';
      }
    });

    function getRegionLocation(region, canvasWidth, canvasHeight){ let cx, cy; if(region.type==='rectangle'){ cx = region.x + region.w/2; cy = region.y + region.h/2; } else { cx = region.cx; cy = region.cy; } const relX = cx / canvasWidth; const relY = cy / canvasHeight; let yPos = (relY < 0.33) ? 'top' : (relY > 0.66) ? 'bottom' : 'middle'; let xPos = (relX < 0.33) ? 'left' : (relX > 0.66) ? 'right' : 'center'; if(yPos==='middle' && xPos==='center') return 'center'; if(yPos==='middle') return xPos; if(xPos==='center') return yPos; return `${yPos}-${xPos}`; }

    function translateLocation(locationKey){
      const map = {
        'top-left':'좌상단','top':'상단','top-right':'우상단',
        'left':'좌측','center':'중앙','right':'우측',
        'bottom-left':'좌하단','bottom':'하단','bottom-right':'우하단'
      };
      return map[locationKey] || locationKey;
    }

    function clampPercentValue(value){
      const clamped = Math.max(0, Math.min(1, value || 0));
      return Math.round(clamped * 1000) / 10; // 0.1% 단위
    }

    function getRegionBounds(region, canvasWidth, canvasHeight){
      let left, right, top, bottom;
      if(region.type==='rectangle'){
        left = region.x / canvasWidth;
        right = (region.x + region.w) / canvasWidth;
        top = region.y / canvasHeight;
        bottom = (region.y + region.h) / canvasHeight;
      } else {
        left = (region.cx - region.radius) / canvasWidth;
        right = (region.cx + region.radius) / canvasWidth;
        top = (region.cy - region.radius) / canvasHeight;
        bottom = (region.cy + region.radius) / canvasHeight;
      }
      return {
        left: clampPercentValue(left),
        right: clampPercentValue(right),
        top: clampPercentValue(top),
        bottom: clampPercentValue(bottom)
      };
    }

    function getRegionCoverage(region, canvasWidth, canvasHeight){
      const totalArea = canvasWidth * canvasHeight;
      if(totalArea === 0) return 0;
      let area = 0;
      if(region.type==='rectangle'){
        area = Math.abs(region.w * region.h);
      } else {
        area = Math.PI * region.radius * region.radius;
      }
      return Math.max(0, Math.min(1, area / totalArea));
    }

    // 작업 저장 버튼 클릭
    saveWorkBtn.addEventListener('click', async () => {
      if (!authManager.currentUser || authManager.userRole !== 'student') {
        alert('학생만 작업을 저장할 수 있습니다.');
        return;
      }

      if (!authManager.classCode) {
        alert('반에 가입되어 있지 않습니다. 반코드를 입력하세요.');
        joinClassBtn.click();
        return;
      }

      const overallPrompt = overallPromptEl.value.trim();
      
      if (!overallPrompt && regions.length === 0 && !currentGeneratedImageBase64) {
        alert('저장할 내용이 없습니다. 프롬프트를 입력하거나 이미지를 생성하세요.');
        return;
      }

      if (!currentGeneratedImageBase64) {
        alert('먼저 이미지를 생성하세요.');
        return;
      }

      const result = await databaseManager.saveStudentWork(
        overallPrompt,
        regions,
        currentGeneratedImageBase64
      );

      if (result.success) {
        alert('작업이 저장되었습니다!');
      } else {
        alert('작업 저장 실패: ' + (result.error || '알 수 없는 오류'));
      }
    });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); selectTool('rectangle'); selectAspectRatio('16:9'); updateRegionList();
    
    // 체험 모드 종료 버튼 추가
    addTrialExitButton();
  });
})();
