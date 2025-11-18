# 🔐 Serial Validation System

PC 시리얼 번호 관리 및 검증 시스템입니다.

## 📋 시스템 구성

이 프로젝트는 3개의 주요 컴포넌트로 구성되어 있습니다:

### 1. **Ubuntu Server** (서버)
- PC 시리얼 번호를 저장하고 관리
- 유효기간 검증 API 제공
- RESTful API 서버
- 기술 스택: Node.js, Express, SQLite

### 2. **Admin GUI** (Windows 관리자 프로그램)
- 시리얼 번호 CRUD 관리
- 유효기간 설정
- 예쁜 GUI 인터페이스
- 기술 스택: Electron, HTML/CSS/JavaScript

### 3. **Client** (Windows 클라이언트 프로그램)
- PC 시리얼 번호 자동 감지
- 서버에 자동 검증 요청
- 1시간마다 자동 재검증
- 백그라운드 실행 (시스템 트레이)
- 기술 스택: Electron

---

## 🚀 빠른 시작

### 전제 조건

- **Ubuntu Server**: Node.js 14+ 설치
- **Windows**: Node.js 14+ 설치 (Admin GUI 및 Client 실행용)

### 1️⃣ Ubuntu 서버 설치 및 실행

```bash
# 서버 디렉토리로 이동
cd server

# 의존성 설치
npm install

# 서버 실행
npm start
```

서버가 `http://0.0.0.0:3000`에서 실행됩니다.

**포트 변경:**
```bash
PORT=8080 npm start
```

### 2️⃣ Windows Admin GUI 설치 및 실행

```bash
# 관리자 GUI 디렉토리로 이동
cd admin-gui

# 의존성 설치
npm install

# 실행
npm start
```

**다른 서버에 연결:**
```cmd
set SERVER_URL=http://192.168.1.100:3000
npm start
```

### 3️⃣ Windows Client 설치 및 실행

```bash
# 클라이언트 디렉토리로 이동
cd client

# 의존성 설치
npm install

# 실행
npm start
```

**다른 서버에 연결:**
```cmd
set SERVER_URL=http://192.168.1.100:3000
npm start
```

---

## 📖 사용 시나리오

### 시나리오 1: 초기 설정

1. **Ubuntu 서버 실행**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Admin GUI에서 시리얼 번호 등록**
   - Admin GUI 실행
   - 시리얼 번호 추가 (예: `ABC-123-XYZ`)
   - 유효기간 설정 (예: `2025-12-31`)
   - 저장

3. **Client에서 자동 검증**
   - 클라이언트 실행
   - PC 시리얼 번호 자동 감지
   - 서버에 검증 요청
   - 결과 확인

### 시나리오 2: 일상적인 사용

1. **서버**: 백그라운드에서 계속 실행
2. **Admin GUI**: 필요시 시리얼 관리
3. **Client**: 사용자 PC에서 자동으로 실행되며 1시간마다 검증

---

## 📂 프로젝트 구조

```
bk-sever/
├── server/              # Ubuntu 서버
│   ├── server.js        # Express 서버
│   ├── database.js      # SQLite 데이터베이스
│   ├── package.json
│   └── README.md
│
├── admin-gui/           # Windows 관리자 GUI
│   ├── main.js          # Electron 메인 프로세스
│   ├── index.html       # UI
│   ├── renderer.js      # 렌더러 프로세스
│   ├── package.json
│   └── README.md
│
├── client/              # Windows 클라이언트
│   ├── main.js          # Electron 메인 프로세스
│   ├── index.html       # UI
│   ├── renderer.js      # 렌더러 프로세스
│   ├── package.json
│   └── README.md
│
└── README.md            # 이 파일
```

---

## 🔧 상세 기능

### Server API 엔드포인트

| 메소드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health` | 서버 상태 확인 |
| GET | `/api/serials` | 모든 시리얼 조회 |
| GET | `/api/serials/:serial` | 특정 시리얼 조회 |
| POST | `/api/serials` | 시리얼 추가 |
| PUT | `/api/serials/:serial` | 시리얼 수정 |
| DELETE | `/api/serials/:serial` | 시리얼 삭제 |
| POST | `/api/verify` | 시리얼 검증 |

### Admin GUI 기능

- ✅ 시리얼 번호 추가 (번호 + 유효기간 + 설명)
- ✅ 시리얼 번호 목록 조회
- ✅ 시리얼 번호 수정
- ✅ 시리얼 번호 삭제
- ✅ 시리얼 번호 검증
- ✅ 실시간 검색
- ✅ 서버 연결 상태 표시
- ✅ 유효기간 만료 상태 표시

### Client 기능

- ✅ PC 시리얼 번호 자동 감지
  - Windows BIOS 시리얼 번호
  - Machine ID (대체)
- ✅ 서버 자동 검증
- ✅ 1시간마다 자동 재검증
- ✅ 시스템 트레이에서 실행
- ✅ 실시간 알림
- ✅ 수동 검증 기능
- ✅ 로그 기록

---

## 🔨 빌드 방법 (Windows 실행 파일)

### Admin GUI 빌드

```bash
cd admin-gui
npm install
npm run build
```

실행 파일: `admin-gui/dist/Serial Admin Setup.exe`

### Client 빌드

```bash
cd client
npm install
npm run build
```

실행 파일: `client/dist/Serial Client Setup.exe`

---

## ⚙️ 환경 설정

### 서버 설정

**포트 변경:**
```bash
PORT=8080 npm start
```

### Admin GUI 설정

**서버 URL 변경 (main.js):**
```javascript
const SERVER_URL = 'http://192.168.1.100:3000';
```

또는 환경 변수:
```cmd
set SERVER_URL=http://192.168.1.100:3000
npm start
```

### Client 설정

**서버 URL 변경 (main.js):**
```javascript
const SERVER_URL = 'http://192.168.1.100:3000';
```

**검증 주기 변경 (main.js):**
```javascript
const CHECK_INTERVAL = 30 * 60 * 1000; // 30분
```

---

## 🧪 테스트

### 서버 API 테스트

```bash
# 서버 상태 확인
curl http://localhost:3000/api/health

# 시리얼 추가
curl -X POST http://localhost:3000/api/serials \
  -H "Content-Type: application/json" \
  -d '{"serial_number":"TEST-123","expiry_date":"2025-12-31","description":"테스트"}'

# 시리얼 검증
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"serial_number":"TEST-123"}'

# 모든 시리얼 조회
curl http://localhost:3000/api/serials
```

---

## 🐛 문제 해결

### 서버 연결 실패

1. 서버가 실행 중인지 확인
2. 방화벽 설정 확인 (포트 3000 열기)
3. 서버 URL이 올바른지 확인

### 시리얼 번호 감지 실패

1. Windows에서 관리자 권한으로 실행
2. `wmic` 명령이 작동하는지 확인:
   ```cmd
   wmic bios get serialnumber
   ```

### Admin GUI가 서버에 연결 안됨

1. 서버 URL 확인 (`main.js`의 `SERVER_URL`)
2. 네트워크 연결 확인
3. CORS 설정 확인

---

## 📝 라이선스

MIT License

---

## 👥 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

---

## 🔗 추가 문서

- [Server 상세 가이드](./server/README.md)
- [Admin GUI 상세 가이드](./admin-gui/README.md)
- [Client 상세 가이드](./client/README.md)

---

## 📞 지원

문제가 발생하면 각 컴포넌트의 README를 참조하거나 이슈를 등록해주세요.
