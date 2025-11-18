# Serial Admin GUI (Windows)

시리얼 번호를 관리하는 관리자 프로그램입니다.

## 기능

- ✅ 시리얼 번호 추가 (유효기간 포함)
- ✅ 시리얼 번호 목록 조회
- ✅ 시리얼 번호 수정
- ✅ 시리얼 번호 삭제
- ✅ 시리얼 번호 검증
- ✅ 실시간 검색
- ✅ 서버 연결 상태 표시

## 설치 방법

```bash
cd admin-gui
npm install
```

## 실행 방법

```bash
npm start
```

## 빌드 방법 (Windows 실행 파일)

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

## 서버 URL 설정

기본적으로 `http://localhost:3000`에 연결됩니다.

다른 서버 주소를 사용하려면 환경 변수를 설정하세요:

```bash
# Windows
set SERVER_URL=http://192.168.1.100:3000
npm start

# Linux/Mac
SERVER_URL=http://192.168.1.100:3000 npm start
```

또는 `main.js` 파일의 `SERVER_URL` 상수를 직접 수정하세요.

## 사용 방법

1. 서버가 실행 중인지 확인
2. Admin GUI 실행
3. 좌측 패널에서 시리얼 번호 추가
4. 우측 테이블에서 목록 확인 및 관리
