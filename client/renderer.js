const { ipcRenderer } = require('electron');
const { exec } = require('child_process');

let logs = [];

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  addLog('프로그램 초기화 중...');

  // 시리얼 번호 가져오기
  await loadSerialNumber();

  // 서버 URL 표시
  const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
  document.getElementById('serverUrl').textContent = serverUrl;

  addLog('초기화 완료');

  // 알림 수신
  ipcRenderer.on('notification', (event, data) => {
    handleNotification(data);
  });
});

// 시리얼 번호 로드
async function loadSerialNumber() {
  try {
    const serial = await getSerialNumber();
    document.getElementById('serialNumber').textContent = serial;
    addLog(`시리얼 번호 확인: ${serial}`);
  } catch (error) {
    document.getElementById('serialNumber').textContent = '가져오기 실패';
    addLog(`에러: ${error.message}`, 'error');
  }
}

// PC 시리얼 번호 가져오기
function getSerialNumber() {
  return new Promise((resolve, reject) => {
    exec('wmic bios get serialnumber', (error, stdout, stderr) => {
      if (error) {
        // machineId 사용
        const { machineIdSync } = require('node-machine-id');
        try {
          resolve(machineIdSync());
        } catch (err) {
          reject(err);
        }
        return;
      }

      const lines = stdout.split('\n');
      if (lines.length >= 2) {
        const serial = lines[1].trim();
        if (serial && serial !== 'SerialNumber') {
          resolve(serial);
        } else {
          const { machineIdSync } = require('node-machine-id');
          resolve(machineIdSync());
        }
      } else {
        reject(new Error('시리얼 번호 파싱 실패'));
      }
    });
  });
}

// 지금 검증
async function checkNow() {
  addLog('수동 검증 요청...');
  updateStatus('unknown', '검증 중...', '서버에 요청하는 중입니다');

  try {
    const serial = document.getElementById('serialNumber').textContent;
    const serverUrl = document.getElementById('serverUrl').textContent;

    const axios = require('axios');
    const response = await axios.post(`${serverUrl}/api/verify`, {
      serial_number: serial
    }, {
      timeout: 10000
    });

    const result = response.data;

    if (result.valid) {
      updateStatus('valid', '✅ 유효한 라이선스',
        `남은 기간: ${result.daysRemaining}일`);
      addLog(`검증 성공 - 남은 기간: ${result.daysRemaining}일`);
    } else {
      updateStatus('invalid', '❌ 라이선스 만료',
        result.message);
      addLog(`검증 실패 - ${result.message}`, 'error');
    }

  } catch (error) {
    updateStatus('invalid', '⚠️ 연결 실패',
      '서버에 연결할 수 없습니다');
    addLog(`에러: ${error.message}`, 'error');
  }
}

// 상태 업데이트
function updateStatus(type, text, detail) {
  const statusBox = document.getElementById('statusBox');
  statusBox.className = 'status-box status-' + type;

  let icon = '⏳';
  if (type === 'valid') icon = '✅';
  else if (type === 'invalid') icon = '❌';
  else if (type === 'unknown') icon = '⏳';

  statusBox.innerHTML = `
    <div class="status-icon">${icon}</div>
    <div class="status-text">${text}</div>
    <div class="status-detail">${detail}</div>
  `;
}

// 알림 처리
function handleNotification(data) {
  const { title, body } = data;

  // 상태 업데이트
  if (title.includes('유효한')) {
    const match = body.match(/남은 기간: (\d+)일/);
    const days = match ? match[1] : '?';
    updateStatus('valid', '✅ 유효한 라이선스', `남은 기간: ${days}일`);
    addLog(`검증 성공 - ${body}`);
  } else if (title.includes('만료')) {
    updateStatus('invalid', '❌ 라이선스 만료', body);
    addLog(`검증 실패 - ${body}`, 'error');
  } else {
    updateStatus('invalid', '⚠️ 연결 실패', body);
    addLog(`에러 - ${body}`, 'error');
  }

  // 시스템 알림
  new Notification(title, { body: body });
}

// 로그 추가
function addLog(message, type = 'info') {
  const now = new Date();
  const time = now.toLocaleTimeString('ko-KR');

  logs.push({ time, message, type });

  // 최근 50개만 유지
  if (logs.length > 50) {
    logs = logs.slice(-50);
  }

  renderLogs();
}

// 로그 렌더링
function renderLogs() {
  const container = document.getElementById('logContainer');
  container.innerHTML = logs.map(log => `
    <div class="log-entry" style="${log.type === 'error' ? 'border-left-color: #ef4444;' : ''}">
      <span class="log-time">[${log.time}]</span>
      <span>${log.message}</span>
    </div>
  `).join('');

  // 스크롤을 맨 아래로
  container.scrollTop = container.scrollHeight;
}
