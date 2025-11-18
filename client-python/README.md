# Serial Validator - Python Client

PC 시리얼 번호 자동 검증 파이썬 클라이언트입니다.

## 특징

- ✅ PC 시리얼 번호 자동 감지 (Windows, Linux, macOS)
- ✅ 서버 자동 검증
- ✅ 1시간마다 백그라운드 자동 재검증
- ✅ 간단한 import 및 사용
- ✅ 콜백 함수 지원
- ✅ 데코레이터 패턴 지원
- ✅ 다양한 사용 예제 제공

## 설치

```bash
pip install -r requirements.txt
```

## 빠른 시작

### 1. 가장 간단한 사용법

```python
from serial_validator import verify_once

# 한 번만 검증
result = verify_once(server_url="http://localhost:3000")

if result['valid']:
    print(f"✅ 유효함 (남은 기간: {result['days_remaining']}일)")
else:
    print(f"❌ {result['message']}")
```

### 2. 시리얼 번호만 확인

```python
from serial_validator import get_serial

print("현재 PC 시리얼:", get_serial())
```

### 3. 자동 검증 (백그라운드)

```python
from serial_validator import SerialValidator

validator = SerialValidator(
    server_url="http://localhost:3000",
    check_interval=3600,  # 1시간 (초 단위)
    auto_start=True  # 자동 시작
)

# 프로그램은 백그라운드에서 1시간마다 자동 검증
```

## 상세 사용법

### SerialValidator 클래스

```python
from serial_validator import SerialValidator

# 초기화
validator = SerialValidator(
    server_url="http://192.168.1.100:3000",  # 서버 URL
    check_interval=3600,  # 검증 주기 (초)
    auto_start=False  # 자동 시작 여부
)

# 한 번 검증
result = validator.verify()

# 자동 검증 시작
validator.start_auto_check()

# 자동 검증 중지
validator.stop_auto_check()

# 시리얼 번호 확인
serial = validator.get_serial_number()

# 서버 연결 테스트
if validator.test_connection():
    print("서버 연결됨")
```

### 콜백 함수 사용

```python
def on_valid(result):
    print(f"✅ 유효! 남은 기간: {result['days_remaining']}일")

def on_invalid(result):
    print(f"❌ 만료: {result['message']}")

def on_error(result):
    print(f"⚠️ 오류: {result['message']}")

validator = SerialValidator()
validator.set_callback('on_valid', on_valid)
validator.set_callback('on_invalid', on_invalid)
validator.set_callback('on_error', on_error)

validator.verify()  # 콜백이 자동으로 호출됨
```

### 기존 프로그램에 통합

```python
from serial_validator import SerialValidator

class MyApp:
    def __init__(self):
        # 검증기 초기화 (자동 시작)
        self.validator = SerialValidator(
            server_url="http://localhost:3000",
            auto_start=True
        )

        # 초기 검증
        if not self.check_license():
            print("라이선스가 없습니다!")
            exit(1)

    def check_license(self):
        result = self.validator.verify()
        return result['success'] and result['valid']

    def run(self):
        # 프로그램 실행
        # 백그라운드에서 자동으로 1시간마다 검증됨
        pass

app = MyApp()
app.run()
```

### 데코레이터 패턴

```python
from serial_validator import SerialValidator
from functools import wraps

validator = SerialValidator(server_url="http://localhost:3000")

def require_license(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = validator.verify()
        if result['valid']:
            return func(*args, **kwargs)
        else:
            print("라이선스가 필요합니다!")
            return None
    return wrapper

@require_license
def premium_feature():
    print("프리미엄 기능 실행!")

premium_feature()  # 자동으로 라이선스 검증 후 실행
```

## 예제 파일

- `example_simple.py` - 가장 간단한 사용법
- `example_with_callback.py` - 콜백 함수 사용
- `example_in_app.py` - 기존 프로그램에 통합
- `example_decorator.py` - 데코레이터 패턴

## API 응답 형식

### 성공 (유효한 라이선스)

```python
{
    'success': True,
    'valid': True,
    'message': '유효한 시리얼 번호입니다.',
    'days_remaining': 45,
    'serial': {
        'serial_number': 'ABC-123',
        'expiry_date': '2025-12-31',
        'description': '설명'
    }
}
```

### 실패 (만료된 라이선스)

```python
{
    'success': True,
    'valid': False,
    'message': '유효기간이 만료되었습니다.',
    'days_remaining': None,
    'serial': {...}
}
```

### 오류 (서버 연결 실패 등)

```python
{
    'success': False,
    'valid': False,
    'message': '서버에 연결할 수 없습니다.',
    'days_remaining': None,
    'serial': None
}
```

## 시리얼 번호 감지 방법

### Windows
1. WMIC BIOS 시리얼 번호 (우선)
2. WMIC UUID (대체)
3. 호스트명 기반 (최후)

### Linux
1. DMI 시리얼 번호 (`/sys/class/dmi/id/product_serial`)
2. Machine ID (`/etc/machine-id`)
3. 호스트명 기반 (최후)

### macOS
1. system_profiler 시리얼 번호
2. 호스트명 기반 (최후)

## 주의사항

### Windows에서 시리얼 번호 가져오기

일부 시스템에서는 관리자 권한이 필요할 수 있습니다:

```bash
# 관리자 권한으로 실행
python example_simple.py
```

### 검증 주기 설정

```python
# 30분마다 검증
validator = SerialValidator(check_interval=30*60)

# 10분마다 검증
validator = SerialValidator(check_interval=10*60)

# 하루에 한 번 검증
validator = SerialValidator(check_interval=24*60*60)
```

## 직접 실행

```bash
# 대화형 모드로 실행
python serial_validator.py
```

## 문제 해결

### "서버에 연결할 수 없습니다"

1. 서버가 실행 중인지 확인
2. 서버 URL이 올바른지 확인
3. 방화벽 설정 확인

### "시리얼 번호 감지 실패"

1. Windows: 관리자 권한으로 실행
2. Linux: DMI 파일 접근 권한 확인
3. 모든 OS: 호스트명 기반 ID가 생성됨 (폴백)

## 라이선스

MIT License

## 관련 문서

- [메인 README](../README.md)
- [서버 설명서](../server/README.md)
- [설치 가이드](../INSTALL.md)
