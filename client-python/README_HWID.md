# HWID 인증 사용법

## 📦 Import

```python
from hwid_validator import HWIDValidator, get_hwid, verify_hwid
```

---

## 🚀 사용법

### 방법 1: 시리얼만 가져오기
```python
from hwid_validator import get_hwid

serial = get_hwid(use_hash=True)
print(serial)
```

### 방법 2: 한 줄로 검증
```python
from hwid_validator import verify_hwid

result = verify_hwid(
    server_url="http://192.168.1.100:8080",
    use_hash=True
)

if result['valid']:
    # 프로그램 실행
    pass
else:
    # 종료
    exit(1)
```

### 방법 3: 클래스 사용
```python
from hwid_validator import HWIDValidator

validator = HWIDValidator(
    server_url="http://192.168.1.100:8080",
    use_hash=True
)

# 시리얼 확인
serial = validator.get_serial()

# 검증
result = validator.verify()

if result['valid']:
    print(f"남은 일수: {result['days_remaining']}")
```

---

## 📋 반환값

```python
result = {
    'success': True,           # 서버 통신 성공 여부
    'valid': True,             # 인증 유효 여부
    'message': '...',          # 메시지
    'days_remaining': 45,      # 남은 일수
    'expiry_date': '2025-12-31'  # 유효기간
}
```

---

## 🔧 매개변수

### `HWIDValidator(server_url, use_hash)`
- `server_url`: 서버 주소 (기본: `http://localhost:8080`)
- `use_hash`: 해시 사용 여부 (기본: `True`)

### `get_hwid(use_hash)`
- `use_hash`: 해시 사용 여부 (기본: `True`)

### `verify_hwid(server_url, use_hash)`
- `server_url`: 서버 주소 (기본: `http://localhost:8080`)
- `use_hash`: 해시 사용 여부 (기본: `True`)

---

## 💡 예제 파일

- `example_simple.py` - 기본 사용법
- `example_hwid.py` - 프로그램 시작 시 인증
- `register_hwid.py` - 시리얼 확인 및 등록 가이드
