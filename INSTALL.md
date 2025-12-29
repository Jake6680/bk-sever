# 📦 설치 가이드

PC 시리얼 번호 관리 시스템의 상세 설치 가이드입니다.

---

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [Ubuntu 서버 설치](#ubuntu-서버-설치)
3. [Windows Admin GUI 설치](#windows-admin-gui-설치)
4. [Windows Client 설치](#windows-client-설치)
5. [네트워크 설정](#네트워크-설정)
6. [자동 시작 설정](#자동-시작-설정)

---

## 시스템 요구사항

### Ubuntu 서버
- **OS**: Ubuntu 18.04 이상 (또는 다른 Linux 배포판)
- **Node.js**: 14.x 이상
- **메모리**: 최소 512MB RAM
- **디스크**: 최소 100MB 여유 공간
- **네트워크**: 포트 3000 (또는 사용자 지정 포트) 개방

### Windows (Admin GUI 및 Client)
- **OS**: Windows 10 이상
- **Node.js**: 14.x 이상 (개발용)
- **메모리**: 최소 2GB RAM
- **디스크**: 최소 200MB 여유 공간

---

## Ubuntu 서버 설치

### 1. Node.js 설치 (아직 설치되지 않은 경우)

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Node.js 버전 확인
node --version
npm --version
```

### 2. 프로젝트 다운로드

```bash
# Git으로 클론
git clone <repository-url>
cd bk-sever/server

# 또는 압축 파일 다운로드 후 압축 해제
# unzip bk-sever.zip
# cd bk-sever/server
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 서버 실행

```bash
# 일반 실행
npm start

# 또는 PM2로 백그라운드 실행 (권장)
sudo npm install -g pm2
pm2 start server.js --name serial-server
pm2 save
pm2 startup
```

### 5. 서버 테스트

```bash
# 다른 터미널에서
curl http://localhost:3000/api/health
```

성공 응답:
```json
{
  "status": "ok",
  "message": "Serial Validation Server is running",
  "timestamp": "2025-11-18T..."
}
```

### 6. 방화벽 설정

```bash
# Ubuntu UFW
sudo ufw allow 3000/tcp
sudo ufw reload

# 또는 iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

---

## Windows Admin GUI 설치

### 개발 모드로 실행

#### 1. Node.js 설치

[Node.js 공식 웹사이트](https://nodejs.org/)에서 Windows용 설치 파일 다운로드 및 설치

#### 2. 프로젝트 다운로드

```cmd
:: Git으로 클론
git clone <repository-url>
cd bk-sever\admin-gui

:: 또는 압축 파일 다운로드 후 압축 해제
```

#### 3. 의존성 설치

```cmd
npm install
```

#### 4. 서버 URL 설정

`admin-gui/main.js` 파일을 열고 서버 URL 수정:

```javascript
const SERVER_URL = 'http://192.168.1.100:3000'; // 서버 IP 주소로 변경
```

#### 5. 실행

```cmd
npm start
```

### 실행 파일로 빌드 (배포용)

#### 1. 빌드

```cmd
cd admin-gui
npm install
npm run build
```

#### 2. 설치 파일 찾기

빌드 완료 후 `admin-gui/dist/` 폴더에서 설치 파일 찾기:
- `Serial Admin Setup.exe`

#### 3. 다른 PC에 배포

1. `Serial Admin Setup.exe` 파일을 다른 PC로 복사
2. 실행하여 설치
3. 설치 후 서버 URL이 올바른지 확인

---

## Windows Client 설치

### 개발 모드로 실행

#### 1. Node.js 설치

[Node.js 공식 웹사이트](https://nodejs.org/)에서 Windows용 설치 파일 다운로드 및 설치

#### 2. 프로젝트 다운로드

```cmd
git clone <repository-url>
cd bk-sever\client
```

#### 3. 의존성 설치

```cmd
npm install
```

#### 4. 서버 URL 설정

`client/main.js` 파일을 열고 서버 URL 수정:

```javascript
const SERVER_URL = 'http://192.168.1.100:3000'; // 서버 IP 주소로 변경
```

#### 5. 검증 주기 설정 (선택)

`client/main.js` 파일에서 검증 주기 수정:

```javascript
const CHECK_INTERVAL = 60 * 60 * 1000; // 1시간 (밀리초)
// 예: 30분으로 변경하려면
// const CHECK_INTERVAL = 30 * 60 * 1000;
```

#### 6. 실행

```cmd
npm start
```

### 실행 파일로 빌드 (배포용)

#### 1. 빌드

```cmd
cd client
npm install
npm run build
```

#### 2. 설치 파일 찾기

빌드 완료 후 `client/dist/` 폴더에서 설치 파일 찾기:
- `Serial Client Setup.exe`

#### 3. 다른 PC에 배포

1. `Serial Client Setup.exe` 파일을 사용자 PC로 복사
2. 실행하여 설치
3. 설치 후 자동으로 시스템 트레이에서 실행됨

---

## 네트워크 설정

### 로컬 네트워크에서 사용

#### 서버 IP 주소 확인 (Ubuntu)

```bash
# 서버 IP 주소 확인
ip addr show

# 또는
ifconfig
```

예: `192.168.1.100`

#### Windows에서 서버 접근 테스트

```cmd
:: 서버 연결 테스트
curl http://192.168.1.100:3000/api/health

:: 또는 브라우저에서
:: http://192.168.1.100:3000/api/health
```

### 인터넷을 통한 원격 접근

#### 1. 포트 포워딩 설정

라우터 관리 페이지에서:
- 외부 포트: 3000
- 내부 IP: 서버 IP (예: 192.168.1.100)
- 내부 포트: 3000
- 프로토콜: TCP

#### 2. 공인 IP 주소 확인

```bash
curl ifconfig.me
```

#### 3. Windows에서 공인 IP로 연결

```javascript
// main.js에서
const SERVER_URL = 'http://공인IP주소:3000';
```

⚠️ **보안 경고**: 인터넷을 통한 접근시 HTTPS 및 인증 설정을 권장합니다.

---

## 자동 시작 설정

### Ubuntu 서버 자동 시작 (PM2)

```bash
# PM2로 서버 실행
pm2 start server.js --name serial-server

# 부팅시 자동 시작 설정
pm2 startup
pm2 save

# 상태 확인
pm2 list
pm2 logs serial-server
```

### Windows Client 자동 시작

#### 방법 1: 시작 프로그램 등록

1. `Win + R` → `shell:startup` 입력
2. 시작 프로그램 폴더가 열림
3. Serial Client 바로가기 복사

#### 방법 2: 작업 스케줄러

1. 작업 스케줄러 열기
2. "기본 작업 만들기"
3. 트리거: "컴퓨터를 시작할 때"
4. 작업: Serial Client 실행 파일 경로 지정

---

## 검증 및 테스트

### 1. 서버 동작 확인

```bash
curl http://localhost:3000/api/health
```

### 2. Admin GUI에서 시리얼 추가

1. Admin GUI 실행
2. 좌측 패널에서 시리얼 번호 추가
   - 시리얼 번호: `TEST-001`
   - 유효기간: 한 달 후 날짜
   - 설명: "테스트용"
3. "추가하기" 클릭

### 3. Client에서 검증

1. Client 실행
2. "지금 검증하기" 버튼 클릭
3. 결과 확인

---

## 문제 해결

### 서버가 시작되지 않음

```bash
# 포트 사용 확인
sudo netstat -tulpn | grep 3000

# 로그 확인
pm2 logs serial-server
```

### Admin GUI/Client가 서버에 연결 안됨

1. 서버가 실행 중인지 확인
2. 방화벽 설정 확인
3. 서버 URL이 올바른지 확인
4. 네트워크 연결 확인

### 빌드 실패

```cmd
:: Node.js 버전 확인 (14 이상 필요)
node --version

:: 캐시 정리 후 재시도
npm cache clean --force
npm install
npm run build
```

---

## 다음 단계

설치가 완료되면:

1. [README.md](./README.md)에서 사용 방법 확인
2. 각 컴포넌트의 상세 문서 참조:
   - [Server README](./server/README.md)
   - [Admin GUI README](./admin-gui/README.md)
   - [Client README](./client/README.md)

---

## 지원

문제가 계속되면 GitHub 이슈를 등록하거나 문서를 참조하세요.
