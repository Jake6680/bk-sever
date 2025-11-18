# Serial Validation Server (Ubuntu)

PC 시리얼 번호를 관리하고 검증하는 서버입니다.

## 기능

- ✅ 시리얼 번호 등록/조회/수정/삭제
- ✅ 시리얼 번호 유효기간 검증
- ✅ RESTful API 제공

## 설치 방법

```bash
cd server
npm install
```

## 실행 방법

```bash
# 일반 실행
npm start

# 개발 모드 (nodemon)
npm run dev
```

기본 포트: 3000

## API 엔드포인트

### 1. 서버 상태 확인
```
GET /api/health
```

### 2. 모든 시리얼 번호 조회
```
GET /api/serials
```

### 3. 특정 시리얼 번호 조회
```
GET /api/serials/:serial
```

### 4. 시리얼 번호 추가
```
POST /api/serials
Body: {
  "serial_number": "ABC123",
  "expiry_date": "2025-12-31",
  "description": "설명 (선택)"
}
```

### 5. 시리얼 번호 수정
```
PUT /api/serials/:serial
Body: {
  "expiry_date": "2025-12-31",
  "description": "수정된 설명"
}
```

### 6. 시리얼 번호 삭제
```
DELETE /api/serials/:serial
```

### 7. 시리얼 번호 검증
```
POST /api/verify
Body: {
  "serial_number": "ABC123"
}
```

## 응답 예시

### 성공
```json
{
  "success": true,
  "valid": true,
  "message": "유효한 시리얼 번호입니다.",
  "daysRemaining": 45
}
```

### 실패
```json
{
  "success": true,
  "valid": false,
  "message": "유효기간이 만료되었습니다."
}
```
