const { ipcRenderer } = require('electron');

let serials = [];
let editingSerial = null;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  checkServerConnection();
  loadSerials();
  setupEventListeners();

  // 5초마다 서버 연결 상태 확인
  setInterval(checkServerConnection, 5000);

  // 오늘 날짜를 기본값으로 설정
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('expiryDate').value = today;
});

// 이벤트 리스너 설정
function setupEventListeners() {
  // 추가 폼 제출
  document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const serialNumber = document.getElementById('serialNumber').value.trim();
    const expiryDate = document.getElementById('expiryDate').value;
    const description = document.getElementById('description').value.trim();

    if (editingSerial) {
      await updateSerial(editingSerial, expiryDate, description);
    } else {
      await addSerial(serialNumber, expiryDate, description);
    }
  });

  // 수정 취소
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    cancelEdit();
  });

  // 검색
  document.getElementById('searchInput').addEventListener('input', (e) => {
    filterSerials(e.target.value);
  });
}

// 서버 연결 확인
async function checkServerConnection() {
  const result = await ipcRenderer.invoke('test-connection');
  const indicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');

  if (result.success) {
    indicator.classList.add('connected');
    statusText.textContent = '서버 연결됨';
  } else {
    indicator.classList.remove('connected');
    statusText.textContent = '서버 연결 안됨';
  }
}

// 시리얼 목록 로드
async function loadSerials() {
  const result = await ipcRenderer.invoke('get-all-serials');

  if (result.success) {
    serials = result.data;
    renderSerials(serials);
  } else {
    showError('시리얼 목록을 불러올 수 없습니다: ' + result.message);
  }
}

// 시리얼 목록 렌더링
function renderSerials(data) {
  const tbody = document.getElementById('serialTableBody');
  const countEl = document.getElementById('serialCount');

  countEl.textContent = `${data.length}개`;

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>등록된 시리얼 번호가 없습니다.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(serial => {
    const isExpired = new Date(serial.expiry_date) < new Date();
    const statusClass = isExpired ? 'status-expired' : 'status-valid';
    const statusText = isExpired ? '만료됨' : '유효함';

    return `
      <tr>
        <td><strong>${escapeHtml(serial.serial_number)}</strong></td>
        <td>${formatDate(serial.expiry_date)}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${escapeHtml(serial.description || '-')}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-small btn-verify" onclick="verifySerial('${escapeHtml(serial.serial_number)}')">검증</button>
            <button class="btn-small btn-edit" onclick="editSerial('${escapeHtml(serial.serial_number)}')">수정</button>
            <button class="btn-small btn-delete" onclick="deleteSerial('${escapeHtml(serial.serial_number)}')">삭제</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// 시리얼 추가
async function addSerial(serialNumber, expiryDate, description) {
  const result = await ipcRenderer.invoke('add-serial', {
    serial_number: serialNumber,
    expiry_date: expiryDate,
    description: description
  });

  if (result.success) {
    showSuccess('시리얼 번호가 추가되었습니다.');
    document.getElementById('addForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expiryDate').value = today;
    loadSerials();
  } else {
    showError(result.message);
  }
}

// 시리얼 수정
async function editSerial(serialNumber) {
  const serial = serials.find(s => s.serial_number === serialNumber);
  if (!serial) return;

  editingSerial = serialNumber;
  document.getElementById('serialNumber').value = serial.serial_number;
  document.getElementById('serialNumber').disabled = true;
  document.getElementById('expiryDate').value = serial.expiry_date;
  document.getElementById('description').value = serial.description || '';
  document.getElementById('cancelEditBtn').style.display = 'block';

  const sidebar = document.querySelector('.sidebar h2');
  sidebar.textContent = '✏️ 시리얼 번호 수정';

  // 스크롤을 폼으로 이동
  document.querySelector('.sidebar').scrollTop = 0;
}

async function updateSerial(serialNumber, expiryDate, description) {
  const result = await ipcRenderer.invoke('update-serial', serialNumber, {
    expiry_date: expiryDate,
    description: description
  });

  if (result.success) {
    showSuccess('시리얼 번호가 수정되었습니다.');
    cancelEdit();
    loadSerials();
  } else {
    showError(result.message);
  }
}

function cancelEdit() {
  editingSerial = null;
  document.getElementById('addForm').reset();
  document.getElementById('serialNumber').disabled = false;
  document.getElementById('cancelEditBtn').style.display = 'none';
  const sidebar = document.querySelector('.sidebar h2');
  sidebar.textContent = '➕ 시리얼 번호 추가';
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('expiryDate').value = today;
}

// 시리얼 삭제
async function deleteSerial(serialNumber) {
  if (!confirm(`정말로 시리얼 번호 "${serialNumber}"를 삭제하시겠습니까?`)) {
    return;
  }

  const result = await ipcRenderer.invoke('delete-serial', serialNumber);

  if (result.success) {
    showSuccess('시리얼 번호가 삭제되었습니다.');
    loadSerials();
  } else {
    showError(result.message);
  }
}

// 시리얼 검증
async function verifySerial(serialNumber) {
  const result = await ipcRenderer.invoke('verify-serial', serialNumber);

  if (result.success) {
    const data = result.data;
    const modal = document.getElementById('verifyModal');
    const resultDiv = document.getElementById('verifyResult');

    let html = `
      <div style="padding: 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">
          ${data.valid ? '✅' : '❌'}
        </div>
        <h3 style="margin-bottom: 10px; color: ${data.valid ? '#10b981' : '#ef4444'};">
          ${data.message}
        </h3>
    `;

    if (data.valid && data.daysRemaining !== undefined) {
      html += `
        <p style="color: #666; margin-top: 10px;">
          남은 기간: <strong>${data.daysRemaining}일</strong>
        </p>
      `;
    }

    if (data.serial) {
      html += `
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: left;">
          <p><strong>시리얼 번호:</strong> ${escapeHtml(data.serial.serial_number)}</p>
          <p><strong>유효기간:</strong> ${formatDate(data.serial.expiry_date)}</p>
          ${data.serial.description ? `<p><strong>설명:</strong> ${escapeHtml(data.serial.description)}</p>` : ''}
        </div>
      `;
    }

    html += `</div>`;
    resultDiv.innerHTML = html;
    modal.classList.add('active');
  } else {
    showError(result.message);
  }
}

function closeVerifyModal() {
  document.getElementById('verifyModal').classList.remove('active');
}

// 검색 필터
function filterSerials(query) {
  const filtered = serials.filter(serial =>
    serial.serial_number.toLowerCase().includes(query.toLowerCase()) ||
    (serial.description && serial.description.toLowerCase().includes(query.toLowerCase()))
  );
  renderSerials(filtered);
}

// 유틸리티 함수
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showSuccess(message) {
  alert('✅ ' + message);
}

function showError(message) {
  alert('❌ ' + message);
}

// 모달 외부 클릭시 닫기
document.getElementById('verifyModal').addEventListener('click', (e) => {
  if (e.target.id === 'verifyModal') {
    closeVerifyModal();
  }
});
