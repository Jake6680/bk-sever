const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const axios = require('axios');

let mainWindow;

// 서버 URL 설정 (환경에 맞게 수정하세요)
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#1a1a2e',
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('index.html');

  // 개발자 도구 (필요시 주석 해제)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ==================== IPC 핸들러 ====================

// 모든 시리얼 조회
ipcMain.handle('get-all-serials', async () => {
  try {
    const response = await axios.get(`${SERVER_URL}/api/serials`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
});

// 시리얼 추가
ipcMain.handle('add-serial', async (event, serialData) => {
  try {
    const response = await axios.post(`${SERVER_URL}/api/serials`, serialData);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
});

// 시리얼 수정
ipcMain.handle('update-serial', async (event, serialNumber, serialData) => {
  try {
    const response = await axios.put(`${SERVER_URL}/api/serials/${serialNumber}`, serialData);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
});

// 시리얼 삭제
ipcMain.handle('delete-serial', async (event, serialNumber) => {
  try {
    const response = await axios.delete(`${SERVER_URL}/api/serials/${serialNumber}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
});

// 시리얼 검증
ipcMain.handle('verify-serial', async (event, serialNumber) => {
  try {
    const response = await axios.post(`${SERVER_URL}/api/verify`, {
      serial_number: serialNumber
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
});

// 서버 연결 테스트
ipcMain.handle('test-connection', async () => {
  try {
    const response = await axios.get(`${SERVER_URL}/api/health`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: '서버에 연결할 수 없습니다: ' + (error.message || '알 수 없는 오류')
    };
  }
});
