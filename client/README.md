# Serial Client (Windows)

PC 시리얼 번호를 자동으로 검증하는 클라이언트 프로그램입니다.

## 기능

- ✅ PC 시리얼 번호 자동 감지
- ✅ 서버에 자동 검증 요청
- ✅ 1시간마다 자동 재검증
- ✅ 시스템 트레이에서 백그라운드 실행
- ✅ 실시간 알림
- ✅ 수동 검증 기능

## 설치 방법

```bash
cd client
npm install
```

## 실행 방법

```bash
npm start
```

프로그램이 시작되면:
- 시스템 트레이에 아이콘이 생성됩니다
- 백그라운드에서 자동으로 실행됩니다
- 1시간마다 자동으로 검증합니다

## 빌드 방법 (Windows 실행 파일)

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

## 시리얼 번호 감지 방법

1. Windows BIOS 시리얼 번호 (우선)
   - `wmic bios get serialnumber` 명령 사용
2. Machine ID (대체)
   - BIOS 시리얼이 없는 경우 시스템 고유 ID 사용

## 서버 URL 설정

기본적으로 `http://localhost:3000`에 연결됩니다.

다른 서버 주소를 사용하려면:

```bash
# Windows
set SERVER_URL=http://192.168.1.100:3000
npm start
```

또는 `main.js` 파일의 `SERVER_URL` 상수를 수정하세요.

## 검증 주기 설정

기본값: 1시간 (3600000 밀리초)

`main.js` 파일의 `CHECK_INTERVAL` 상수를 수정하여 변경할 수 있습니다:

```javascript
const CHECK_INTERVAL = 30 * 60 * 1000; // 30분
```

## 트레이 메뉴

시스템 트레이 아이콘을 우클릭하면:
- 상태 확인: 메인 창 열기
- 지금 검증: 즉시 검증 실행
- 현재 시리얼 번호 표시
- 종료: 프로그램 종료
