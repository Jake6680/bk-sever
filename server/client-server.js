const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { verifySerialWithIP } = require('./database');

const app = express();
const PORT = process.env.CLIENT_PORT || 8080;

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== 클라이언트 전용 API ====================

// 서버 상태 확인
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Client Validation Server is running',
    timestamp: new Date().toISOString(),
    serverType: 'client'
  });
});

// 시리얼 번호 검증 (클라이언트 전용 - IP 검증 포함)
app.post('/api/verify', (req, res) => {
  const { serial_number } = req.body;

  if (!serial_number) {
    return res.status(400).json({
      success: false,
      message: '시리얼 번호는 필수입니다.'
    });
  }

  // 클라이언트 IP 추출
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || req.ip
    || 'unknown';

  console.log(`[인증 시도] 시리얼: ${serial_number.substring(0, 16)}..., IP: ${clientIP}`);

  verifySerialWithIP(serial_number, clientIP, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '검증 실패',
        error: err.message
      });
    }

    res.json({
      success: true,
      ...result
    });
  });
});

// 404 처리
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '클라이언트 검증 서버입니다. /api/verify 엔드포인트만 사용 가능합니다.'
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('에러 발생:', err);
  res.status(500).json({
    success: false,
    message: '서버 에러가 발생했습니다.',
    error: err.message
  });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════════════');
  console.log('  🔐 Client Validation Server');
  console.log('═══════════════════════════════════════════════');
  console.log(`  서버 주소: http://0.0.0.0:${PORT}`);
  console.log(`  용도: 클라이언트 시리얼 검증 전용 (읽기 전용)`);
  console.log(`  시작 시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log('═══════════════════════════════════════════════');
});
