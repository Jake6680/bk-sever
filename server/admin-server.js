const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const {
  getAllSerials,
  getSerial,
  addSerial,
  updateSerial,
  deleteSerial,
  verifySerial,
  clearSerialIP
} = require('./database');

const app = express();
const PORT = process.env.ADMIN_PORT || 9090;

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 제공 (웹 UI)
app.use(express.static(path.join(__dirname, 'public')));

// 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== 관리자 전용 API ====================

// 서버 상태 확인
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Admin Management Server is running',
    timestamp: new Date().toISOString(),
    serverType: 'admin'
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

    res.json({
      success: true,
      message: 'IP 바인딩이 해제되었습니다.'
    });
  });
});

// 시리얼 번호 검증 (관리자 테스트용)
app.post('/api/verify', (req, res) => {
  const { serial_number } = req.body;

  if (!serial_number) {
    return res.status(400).json({
      success: false,
      message: '시리얼 번호는 필수입니다.'
    });
  }

  verifySerial(serial_number, (err, result) => {
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

// 웹 UI 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
  console.log('  🔧 Admin Management Server');
  console.log('═══════════════════════════════════════════════');
  console.log(`  서버 주소: http://0.0.0.0:${PORT}`);
  console.log(`  웹 UI: http://0.0.0.0:${PORT}/`);
  console.log(`  용도: 관리자 시리얼 관리 (CRUD + 웹 UI)`);
  console.log(`  시작 시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log('═══════════════════════════════════════════════');
});
