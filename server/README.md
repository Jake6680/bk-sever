# Serial Validation Server (Ubuntu)

PC 시리얼 번호를 관리하고 검증하는 서버입니다.

## 🎯 서버 구조 (2개 포트)

이 시스템은 **보안을 위해 2개의 포트**로 분리되어 있습니다:

### 1️⃣ **클라이언트 서버 (8080 포트)**
- **용도**: 클라이언트 시리얼 검증 전용 (읽기 전용)
- **접근**: 모든 클라이언트가 접근 가능
- **API**: `/api/verify` (검증만 가능)
- **보안**: CRUD 작업 불가, 데이터 조작 불가

### 2️⃣ **관리자 서버 (9090 포트)**
- **용도**: 시리얼 번호 관리 및 웹 UI
- **접근**: 관리자만 접근 (방화벽 설정 권장)
- **API**: 모든 CRUD API
- **기능**: 웹 기반 관리 대시보드 제공

---

## 📦 설치 방법

```bash
cd server
npm install
```

---

## 🚀 실행 방법

### 옵션 1: 클라이언트 서버만 실행 (8080)
```bash
npm run start:client
```
- 클라이언트 검증 전용 서버
- 포트: 8080

### 옵션 2: 관리자 서버만 실행 (9090)
```bash
npm run start:admin
```
- 관리자 CRUD + 웹 UI
- 포트: 9090
- 웹 UI: http://localhost:9090

### 옵션 3: 두 서버 모두 실행 (권장)
```bash
npm run start:both
```
- 클라이언트 서버 (8080) + 관리자 서버 (9090)
- 동시 실행

### 옵션 4: 포트 커스터마이징
```bash
# 클라이언트 포트 변경
CLIENT_PORT=8888 npm run start:client

# 관리자 포트 변경
ADMIN_PORT=9999 npm run start:admin

# 둘 다 변경
CLIENT_PORT=8888 ADMIN_PORT=9999 npm run start:both
```

### 레거시: 기존 통합 서버 (3000)
```bash
npm start
```
- 모든 API가 하나의 포트에서 실행 (비권장)

---

## 🔐 보안 권장 사항

### 방화벽 설정
```bash
# 클라이언트 포트만 외부 공개
sudo ufw allow 8080/tcp

# 관리자 포트는 특정 IP만 허용
sudo ufw allow from 192.168.1.0/24 to any port 9090
```

### 프로덕션 환경
- **8080 포트**: 인터넷에 공개 (클라이언트 접근)
- **9090 포트**: 내부망만 접근 또는 특정 IP 허용

---

## 🌐 웹 관리자 UI

관리자 서버(9090)를 실행하면 웹 브라우저에서 관리 가능합니다:

```
http://your-server-ip:9090
```

### 웹 UI 기능
- ✅ 시리얼 번호 추가 (유효기간 포함)
- ✅ 시리얼 번호 목록 조회
- ✅ 실시간 검색
- ✅ 시리얼 번호 수정
- ✅ 시리얼 번호 삭제
- ✅ 시리얼 번호 검증
- ✅ 통계 대시보드 (전체/활성/만료)
- ✅ 반응형 디자인

---

## 📡 API 엔드포인트

### 클라이언트 서버 (8080 포트)

#### 1. 서버 상태 확인
```
GET /api/health
```

#### 2. 시리얼 번호 검증 (클라이언트용)
```
POST /api/verify
Body: {
  "serial_number": "ABC123"
}
```

**응답 예시:**
```json
{
  "success": true,
  "valid": true,
  "message": "유효한 시리얼 번호입니다.",
  "expiry_date": "2025-12-31",
  "days_remaining": 45
}
```

---

### 관리자 서버 (9090 포트)

#### 1. 서버 상태 확인
```
GET /api/health
```

#### 2. 모든 시리얼 번호 조회
```
GET /api/serials
```

#### 3. 특정 시리얼 번호 조회
```
GET /api/serials/:serial
```

#### 4. 시리얼 번호 추가
```
POST /api/serials
Body: {
  "serial_number": "ABC123",
  "expiry_date": "2025-12-31",
  "description": "설명 (선택)"
}
```

#### 5. 시리얼 번호 수정
```
PUT /api/serials/:serial
Body: {
  "expiry_date": "2025-12-31",
  "description": "수정된 설명"
}
```

#### 6. 시리얼 번호 삭제
```
DELETE /api/serials/:serial
```

#### 7. 시리얼 번호 검증 (관리자 테스트용)
```
POST /api/verify
Body: {
  "serial_number": "ABC123"
}
```

---

## 🧪 테스트

### 클라이언트 서버 테스트 (8080)
```bash
# 서버 상태 확인
curl http://localhost:8080/api/health

# 시리얼 검증
curl -X POST http://localhost:8080/api/verify \
  -H "Content-Type: application/json" \
  -d '{"serial_number":"ABC123"}'
```

### 관리자 서버 테스트 (9090)
```bash
# 웹 UI 접속
open http://localhost:9090

# 시리얼 추가
curl -X POST http://localhost:9090/api/serials \
  -H "Content-Type: application/json" \
  -d '{"serial_number":"ABC123","expiry_date":"2025-12-31","description":"테스트"}'

# 모든 시리얼 조회
curl http://localhost:9090/api/serials
```

---

## 📊 사용 시나리오

### 시나리오 1: 개발/테스트
```bash
# 두 서버 모두 실행
npm run start:both
```

### 시나리오 2: 프로덕션 (분리 실행)
```bash
# 터미널 1: 클라이언트 서버
npm run start:client

# 터미널 2: 관리자 서버
npm run start:admin
```

### 시나리오 3: PM2로 백그라운드 실행
```bash
# PM2 설치
npm install -g pm2

# 두 서버 실행
pm2 start client-server.js --name "client-server"
pm2 start admin-server.js --name "admin-server"

# 상태 확인
pm2 status

# 로그 확인
pm2 logs
```

---

## 🔧 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `CLIENT_PORT` | 8080 | 클라이언트 서버 포트 |
| `ADMIN_PORT` | 9090 | 관리자 서버 포트 |
| `PORT` | 3000 | 레거시 서버 포트 |

---

## 📁 파일 구조

```
server/
├── server.js              # 레거시 통합 서버 (3000)
├── client-server.js       # 클라이언트 서버 (8080)
├── admin-server.js        # 관리자 서버 (9090)
├── database.js            # SQLite 데이터베이스
├── package.json           # npm 설정
├── public/                # 웹 UI 파일
│   └── index.html         # 관리자 웹 대시보드
└── serials.db             # SQLite 데이터베이스 파일
```

---

## 🐛 문제 해결

### 포트가 이미 사용 중
```bash
# 포트 사용 확인
sudo lsof -i :8080
sudo lsof -i :9090

# 프로세스 종료
sudo kill -9 <PID>
```

### 데이터베이스 초기화
```bash
rm serials.db
npm run start:admin  # 자동으로 재생성됨
```

---

## 💡 팁

1. **개발 시**: `npm run start:both`로 두 서버 동시 실행
2. **프로덕션**: PM2 또는 systemd로 백그라운드 실행
3. **보안**: 9090 포트는 내부망만 접근 가능하도록 방화벽 설정
4. **웹 UI**: 브라우저에서 `http://server-ip:9090` 접속하여 관리

---

## 📝 라이선스

MIT License
