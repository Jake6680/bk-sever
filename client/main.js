const { app, BrowserWindow, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');

// 설정
const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const CHECK_INTERVAL = 60 * 60 * 1000; // 1시간 (밀리초)

let mainWindow = null;
let tray = null;
let serialNumber = null;
let checkIntervalId = null;

// 설정 로드
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('설정 로드 실패:', error);
  }
  return { serverUrl: SERVER_URL, checkInterval: CHECK_INTERVAL };
}

// 설정 저장
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('설정 저장 실패:', error);
  }
}

// PC 시리얼 번호 가져오기
function getSerialNumber() {
  return new Promise((resolve, reject) => {
    // Windows에서 BIOS 시리얼 번호 가져오기
    exec('wmic bios get serialnumber', (error, stdout, stderr) => {
      if (error) {
        // Windows가 아니거나 wmic 명령이 실패한 경우
        // 대체 방법: machineId 사용
        const { machineIdSync } = require('node-machine-id');
        try {
          const machineId = machineIdSync();
          resolve(machineId);
        } catch (err) {
          reject(new Error('시리얼 번호를 가져올 수 없습니다: ' + err.message));
        }
        return;
      }

      // wmic 출력 파싱
      const lines = stdout.split('\n');
      if (lines.length >= 2) {
        const serial = lines[1].trim();
        if (serial && serial !== 'SerialNumber') {
          resolve(serial);
        } else {
          // 시리얼 번호가 없는 경우 machineId 사용
          const { machineIdSync } = require('node-machine-id');
          resolve(machineIdSync());
        }
      } else {
        reject(new Error('시리얼 번호를 파싱할 수 없습니다.'));
      }
    });
  });
}

// 시리얼 번호 검증
async function verifySerial() {
  if (!serialNumber) {
    console.error('시리얼 번호가 설정되지 않았습니다.');
    return;
  }

  try {
    const response = await axios.post(`${SERVER_URL}/api/verify`, {
      serial_number: serialNumber
    }, {
      timeout: 10000
    });

    const result = response.data;
    console.log('검증 결과:', result);

    if (result.valid) {
      showNotification('✅ 유효한 라이선스',
        `시리얼 번호가 유효합니다.\n남은 기간: ${result.daysRemaining}일`);
      updateTrayIcon(true);
    } else {
      showNotification('❌ 라이선스 만료',
        result.message || '시리얼 번호가 유효하지 않습니다.');
      updateTrayIcon(false);
    }

    return result;
  } catch (error) {
    console.error('검증 실패:', error.message);
    showNotification('⚠️ 서버 연결 실패',
      '서버에 연결할 수 없습니다.\n네트워크 연결을 확인하세요.');
    updateTrayIcon(null);
    return null;
  }
}

// 트레이 아이콘 업데이트
function updateTrayIcon(valid) {
  if (!tray) return;

  let iconPath;
  if (valid === true) {
    // 유효한 경우 녹색 아이콘
    tray.setToolTip('Serial Client - 유효함');
  } else if (valid === false) {
    // 만료된 경우 빨간색 아이콘
    tray.setToolTip('Serial Client - 만료됨');
  } else {
    // 연결 안됨
    tray.setToolTip('Serial Client - 연결 안됨');
  }
}

// 알림 표시
function showNotification(title, body) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('notification', { title, body });
  }
}

// 메인 윈도우 생성
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 600,
    show: false, // 시작시 숨김
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 트레이 생성
function createTray() {
  // 간단한 트레이 아이콘 생성 (실제로는 이미지 파일 사용 권장)
  const icon = nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('Serial Client');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '상태 확인',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: '지금 검증',
      click: async () => {
        await verifySerial();
      }
    },
    { type: 'separator' },
    {
      label: `시리얼: ${serialNumber || 'N/A'}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: '종료',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.show();
  });
}

// 앱 시작
app.whenReady().then(async () => {
  try {
    // 시리얼 번호 가져오기
    serialNumber = await getSerialNumber();
    console.log('시리얼 번호:', serialNumber);

    // 윈도우 및 트레이 생성
    createWindow();
    createTray();

    // 초기 검증
    await verifySerial();

    // 주기적 검증 시작
    checkIntervalId = setInterval(async () => {
      console.log('자동 검증 실행...');
      await verifySerial();
    }, CHECK_INTERVAL);

    console.log(`검증 주기: ${CHECK_INTERVAL / 1000 / 60}분`);

  } catch (error) {
    console.error('앱 시작 실패:', error);
    dialog.showErrorBox('시작 실패', error.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // 윈도우가 모두 닫혀도 앱은 계속 실행 (트레이에서 실행)
});

app.on('before-quit', () => {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
