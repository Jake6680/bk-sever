const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, 'serials.db');
console.log(`[Database] Path: ${dbPath}`);

// 데이터베이스 연결
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('데이터베이스 연결 실패:', err.message);
  } else {
    console.log('SQLite 데이터베이스에 연결되었습니다.');
    initDatabase();
  }
});

// 데이터베이스 초기화
function initDatabase() {
  // serials 테이블 생성
  const createSerialsTableQuery = `
    CREATE TABLE IF NOT EXISTS serials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial_number TEXT UNIQUE NOT NULL,
      expiry_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      description TEXT,
      bound_ip TEXT DEFAULT NULL
    )
  `;

  db.run(createSerialsTableQuery, (err) => {
    if (err) {
      console.error('serials 테이블 생성 실패:', err.message);
    } else {
      console.log('serials 테이블이 준비되었습니다.');

      // 기존 테이블에 bound_ip 컬럼이 없을 경우 추가
      db.run(`ALTER TABLE serials ADD COLUMN bound_ip TEXT DEFAULT NULL`, (alterErr) => {
        if (alterErr && !alterErr.message.includes('duplicate column')) {
          // 이미 존재하는 컬럼이 아닌 다른 에러인 경우만 출력
          if (!alterErr.message.includes('duplicate')) {
            console.log('bound_ip 컬럼 추가 시도:', alterErr.message);
          }
        }
      });
    }
  });

  // 접속 로그 테이블 생성
  const createAccessLogsTableQuery = `
    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial_number TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      success INTEGER NOT NULL,
      failure_reason TEXT,
      accessed_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(createAccessLogsTableQuery, (err) => {
    if (err) {
      console.error('access_logs 테이블 생성 실패:', err.message);
    } else {
      console.log('access_logs 테이블이 준비되었습니다.');
    }
  });
}

// 모든 시리얼 번호 조회
function getAllSerials(callback) {
  const query = 'SELECT * FROM serials ORDER BY created_at DESC';
  db.all(query, [], callback);
}

// 특정 시리얼 번호 조회
function getSerial(serialNumber, callback) {
  const query = 'SELECT * FROM serials WHERE serial_number = ?';
  db.get(query, [serialNumber], callback);
}

// 시리얼 번호 추가
function addSerial(serialNumber, expiryDate, description, callback) {
  const query = `
    INSERT INTO serials (serial_number, expiry_date, description)
    VALUES (?, ?, ?)
  `;
  db.run(query, [serialNumber, expiryDate, description], callback);
}

// 시리얼 번호 수정
function updateSerial(serialNumber, expiryDate, description, callback) {
  const query = `
    UPDATE serials
    SET expiry_date = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE serial_number = ?
  `;
  db.run(query, [expiryDate, description, serialNumber], callback);
}

// 시리얼 번호 삭제
function deleteSerial(serialNumber, callback) {
  const query = 'DELETE FROM serials WHERE serial_number = ?';
  db.run(query, [serialNumber], callback);
}

// 시리얼 번호 검증 (기존 - IP 검증 없이)
function verifySerial(serialNumber, callback) {
  getSerial(serialNumber, (err, row) => {
    if (err) {
      return callback(err, null);
    }

    if (!row) {
      return callback(null, {
        valid: false,
        message: '등록되지 않은 시리얼 번호입니다.'
      });
    }

    const now = new Date();
    const expiryDate = new Date(row.expiry_date);

    if (now > expiryDate) {
      return callback(null, {
        valid: false,
        message: '유효기간이 만료되었습니다.',
        serial: row
      });
    }

    return callback(null, {
      valid: true,
      message: '유효한 시리얼 번호입니다.',
      serial: row,
      daysRemaining: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
    });
  });
}

// 시리얼 번호에 IP 바인딩
function bindIP(serialNumber, ip, callback) {
  const query = `
    UPDATE serials
    SET bound_ip = ?, updated_at = CURRENT_TIMESTAMP
    WHERE serial_number = ?
  `;
  db.run(query, [ip, serialNumber], callback);
}

// 시리얼 번호의 IP 바인딩 해제 (관리자용)
function clearSerialIP(serialNumber, callback) {
  const query = `
    UPDATE serials
    SET bound_ip = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE serial_number = ?
  `;
  db.run(query, [serialNumber], callback);
}

// 접속 로그 기록
// 접속 로그 기록
function addAccessLog(serialNumber, ipAddress, success, failureReason, callback) {
  const query = `
    INSERT INTO access_logs (serial_number, ip_address, success, failure_reason)
    VALUES (?, ?, ?, ?)
  `;
  console.log(`[Log] Access Log 추가 시도: ${serialNumber}, ${ipAddress}, ${success}`);
  db.run(query, [serialNumber, ipAddress, success ? 1 : 0, failureReason || null], (err) => {
    if (err) {
      console.error(`[Log] Access Log 추가 실패: ${err.message}`);
    } else {
      console.log(`[Log] Access Log 추가 성공`);
    }
    if (callback) callback(err);
  });
}

// 모든 접속 로그 조회
function getAllAccessLogs(callback) {
  const query = 'SELECT * FROM access_logs ORDER BY accessed_at DESC LIMIT 1000';
  db.all(query, [], callback);
}

// 특정 시리얼의 접속 로그 조회
function getAccessLogsBySerial(serialNumber, callback) {
  const query = 'SELECT * FROM access_logs WHERE serial_number = ? ORDER BY accessed_at DESC LIMIT 100';
  db.all(query, [serialNumber], callback);
}

// 모든 접속 로그 삭제
function clearAllAccessLogs(callback) {
  const query = 'DELETE FROM access_logs';
  db.run(query, [], callback);
}

// 시리얼 번호 검증 (IP 검증 포함)
function verifySerialWithIP(serialNumber, clientIP, callback) {
  getSerial(serialNumber, (err, row) => {
    if (err) {
      addAccessLog(serialNumber, clientIP, false, '데이터베이스 오류', () => { });
      return callback(err, null);
    }

    // 1. 시리얼 번호 존재 확인
    if (!row) {
      addAccessLog(serialNumber, clientIP, false, '미등록 시리얼', () => { });
      return callback(null, {
        valid: false,
        message: '등록되지 않은 시리얼 번호입니다.',
        ip_verified: false
      });
    }

    // 2. 유효기간 확인
    const now = new Date();
    const expiryDate = new Date(row.expiry_date);

    if (now > expiryDate) {
      addAccessLog(serialNumber, clientIP, false, '유효기간 만료', () => { });
      return callback(null, {
        valid: false,
        message: '유효기간이 만료되었습니다.',
        serial: row,
        ip_verified: false
      });
    }

    // 3. IP 검증
    const boundIP = row.bound_ip;

    if (!boundIP) {
      // 최초 접속: IP 바인딩
      bindIP(serialNumber, clientIP, (bindErr) => {
        if (bindErr) {
          addAccessLog(serialNumber, clientIP, false, 'IP 바인딩 실패', () => { });
          return callback(bindErr, null);
        }

        addAccessLog(serialNumber, clientIP, true, null, () => { });
        return callback(null, {
          valid: true,
          message: '유효한 시리얼 번호입니다. (IP가 등록되었습니다)',
          serial: { ...row, bound_ip: clientIP },
          daysRemaining: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)),
          ip_verified: true,
          ip_newly_bound: true
        });
      });
    } else if (boundIP === clientIP) {
      // IP 일치
      addAccessLog(serialNumber, clientIP, true, null, () => { });
      return callback(null, {
        valid: true,
        message: '유효한 시리얼 번호입니다.',
        serial: row,
        daysRemaining: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)),
        ip_verified: true
      });
    } else {
      // IP 불일치
      addAccessLog(serialNumber, clientIP, false, `IP 불일치 (등록: ${boundIP}, 접속: ${clientIP})`, () => { });
      return callback(null, {
        valid: false,
        message: 'IP 주소가 일치하지 않습니다. 등록된 기기에서만 사용 가능합니다.',
        ip_verified: false,
        ip_mismatch: true
      });
    }
  });
}

module.exports = {
  db,
  getAllSerials,
  getSerial,
  addSerial,
  updateSerial,
  deleteSerial,
  verifySerial,
  verifySerialWithIP,
  bindIP,
  clearSerialIP,
  addAccessLog,
  getAllAccessLogs,
  getAccessLogsBySerial,
  clearAllAccessLogs
};

// force update
