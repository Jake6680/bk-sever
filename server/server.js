const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const {
  getAllSerials,
  getSerial,
  addSerial,
  updateSerial,
  deleteSerial,
  verifySerial,
  verifySerialWithIP,
  clearSerialIP,
  getAllAccessLogs,
  getAccessLogsBySerial
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== API 엔드포인트 ====================

// 서버 상태 확인
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Serial Validation Server is running',
    timestamp: new Date().toISOString()
  });
});

// 모든 시리얼 번호 조회
app.get('/api/serials', (req, res) => {
  getAllSerials((err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '시리얼 번호 조회 실패',
        error: err.message
      });
    }
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  });
});

// 특정 시리얼 번호 조회
app.get('/api/serials/:serial', (req, res) => {
  const serialNumber = req.params.serial;

  getSerial(serialNumber, (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '시리얼 번호 조회 실패',
        error: err.message
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: '시리얼 번호를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: row
    });
  });
});

// 시리얼 번호 추가
app.post('/api/serials', (req, res) => {
  const { serial_number, expiry_date, description } = req.body;

  if (!serial_number || !expiry_date) {
    return res.status(400).json({
      success: false,
      message: '시리얼 번호와 유효기간은 필수입니다.'
    });
  }

  addSerial(serial_number, expiry_date, description || '', function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({
          success: false,
          message: '이미 존재하는 시리얼 번호입니다.'
        });
      }
      return res.status(500).json({
        success: false,
        message: '시리얼 번호 추가 실패',
        error: err.message
      });
    }

    res.status(201).json({
      success: true,
      message: '시리얼 번호가 추가되었습니다.',
      data: {
        id: this.lastID,
        serial_number,
        expiry_date,
        description
      }
    });
  });
});

// 시리얼 번호 수정
app.put('/api/serials/:serial', (req, res) => {
  const serialNumber = req.params.serial;
  const { expiry_date, description } = req.body;

  if (!expiry_date) {
    return res.status(400).json({
      success: false,
      message: '유효기간은 필수입니다.'
    });
  }

  updateSerial(serialNumber, expiry_date, description || '', function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '시리얼 번호 수정 실패',
        error: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '시리얼 번호를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '시리얼 번호가 수정되었습니다.'
    });
  });
});

// 시리얼 번호 삭제
app.delete('/api/serials/:serial', (req, res) => {
  const serialNumber = req.params.serial;

  deleteSerial(serialNumber, function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '시리얼 번호 삭제 실패',
        error: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '시리얼 번호를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '시리얼 번호가 삭제되었습니다.'
    });
  });
});

// 시리얼 번호 검증 (IP 검증 포함)
app.post('/api/verify', (req, res) => {
  const { serial_number } = req.body;

  if (!serial_number) {
    return res.status(400).json({
      success: false,
      message: '시리얼 번호는 필수입니다.'
    });
  }

  // 클라이언트 IP 추출 (프록시 뒤에 있을 경우 x-forwarded-for 헤더 사용)
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

// ==================== 접속 로그 API ====================

// 모든 접속 로그 조회
app.get('/api/access-logs', (req, res) => {
  getAllAccessLogs((err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '접속 로그 조회 실패',
        error: err.message
      });
    }
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  });
});

// 특정 시리얼의 접속 로그 조회
app.get('/api/access-logs/:serial', (req, res) => {
  const serialNumber = req.params.serial;

  getAccessLogsBySerial(serialNumber, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '접속 로그 조회 실패',
        error: err.message
      });
    }
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  });
});

// ==================== IP 관리 API (관리자용) ====================

// 시리얼의 IP 바인딩 해제
app.delete('/api/serials/:serial/ip', (req, res) => {
  const serialNumber = req.params.serial;

  clearSerialIP(serialNumber, function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'IP 바인딩 해제 실패',
        error: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '시리얼 번호를 찾을 수 없습니다.'
      });
    }

    console.log(`[IP 해제] 시리얼: ${serialNumber}`);
    res.json({
      success: true,
      message: 'IP 바인딩이 해제되었습니다.'
    });
  });
});


// 404 처리
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 엔드포인트를 찾을 수 없습니다.'
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
  console.log('  Serial Validation Server');
  console.log('═══════════════════════════════════════════════');
  console.log(`  서버 주소: http://0.0.0.0:${PORT}`);
  console.log(`  시작 시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log('═══════════════════════════════════════════════');
});
