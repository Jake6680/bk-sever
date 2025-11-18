const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, 'serials.db');

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
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS serials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial_number TEXT UNIQUE NOT NULL,
      expiry_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      description TEXT
    )
  `;

  db.run(createTableQuery, (err) => {
    if (err) {
      console.error('테이블 생성 실패:', err.message);
    } else {
      console.log('serials 테이블이 준비되었습니다.');
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

// 시리얼 번호 검증
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

module.exports = {
  db,
  getAllSerials,
  getSerial,
  addSerial,
  updateSerial,
  deleteSerial,
  verifySerial
};
