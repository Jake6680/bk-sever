# 🔐 HWID 기반 인증 시스템 가이드

PC의 하드웨어 ID(CPU, BIOS, Disk, UUID)를 기반으로 고유한 시리얼 번호를 생성하여 인증하는 시스템입니다.

---

## 🎯 개요

### 작동 원리
1. **클라이언트**: PC의 하드웨어 정보를 수집하여 고유 HWID 생성
2. **해싱**: SHA256으로 해싱하여 보안 강화
3. **검증**: 서버(8080 포트)에 검증 요청
4. **결과**: 유효하면 프로그램 실행, 무효하면 종료

### 장점
- ✅ PC마다 고유한 시리얼 자동 생성
- ✅ 수동 입력 불필요
- ✅ 하드웨어 변경 시 자동으로 변경됨
- ✅ 해시 사용으로 보안성 높음

---

## 📦 설치

```bash
cd client-python
pip install -r requirements.txt
```

---

## 🚀 사용 방법

### 1️⃣ HWID 확인 및 등록

#### Step 1: 클라이언트에서 HWID 확인
```bash
python register_hwid.py
```

출력 예시:
```
📌 옵션 1: 해시된 시리얼 (권장 - 보안성 높음)
시리얼 번호: 5f4dcc3b5aa765d61d8327deb882cf99a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
```

#### Step 2: 관리자 서버에서 등록

**방법 A - 웹 UI 사용 (권장)**
```bash
# 1. 관리자 서버 실행
cd ~/bk-sever/server
npm run start:admin

# 2. 브라우저에서 접속
# http://your-server-ip:9090

# 3. 시리얼 번호 입력
#    - 시리얼 번호: (위에서 확인한 해시값)
#    - 유효기간: 2025-12-31
#    - 설명: PC-001
#    - [추가하기] 버튼 클릭
```

**방법 B - curl 사용**
```bash
curl -X POST http://localhost:9090/api/serials \
  -H "Content-Type: application/json" \
  -d '{
    "serial_number": "5f4dcc3b5aa765d61d8327deb882cf99a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    "expiry_date": "2025-12-31",
    "description": "PC-001"
  }'
```

---

### 2️⃣ 프로그램에서 인증 사용

#### 방법 1: 간단한 검증
```python
from hwid_validator import verify_hwid

# 한 줄로 검증
result = verify_hwid(server_url="http://192.168.1.100:8080")

if result['valid']:
    print("✅ 인증 성공")
    # 프로그램 실행
else:
    print("❌ 인증 실패")
    exit(1)
```

#### 방법 2: 클래스 사용
```python
from hwid_validator import HWIDValidator

# 검증기 생성
validator = HWIDValidator(
    server_url="http://192.168.1.100:8080",
    use_hash=True  # 해시 사용
)

# 검증
result = validator.verify()

if result['valid']:
    print(f"✅ 인증 성공! 남은 기간: {result['days_remaining']}일")
else:
    print(f"❌ {result['message']}")
```

#### 방법 3: 실전 예제 (프로그램 시작 시 검증)
```python
# example_hwid.py 참고
python example_hwid.py
```

---

## 🧪 테스트

### 1. 서버 실행
```bash
# 터미널 1: 클라이언트 서버 (8080)
cd ~/bk-sever/server
npm run start:client

# 터미널 2: 관리자 서버 (9090)
npm run start:admin
```

### 2. HWID 확인 및 등록
```bash
# HWID 확인
python register_hwid.py

# 웹 UI에서 등록
# http://localhost:9090
```

### 3. 검증 테스트
```bash
# 기본 검증기 실행
python hwid_validator.py

# 또는 예제 실행
python example_hwid.py
```

---

## 📊 HWID 구성 요소

### Windows
- **CPU ID**: `wmic cpu get processorid`
- **BIOS Serial**: `wmic bios get serialnumber`
- **Disk Serial**: `wmic diskdrive get serialnumber`
- **UUID**: `wmic csproduct get uuid`

### Linux
- **CPU Serial**: `/proc/cpuinfo`
- **DMI Serial**: `/sys/class/dmi/id/product_serial`
- **Machine ID**: `/etc/machine-id`
- **UUID**: `/sys/class/dmi/id/product_uuid`

### 최종 HWID
```
원본: CPU_ID-BIOS_ID-DISK_ID-UUID
해시: SHA256(원본)
```

---

## 🔐 보안 고려사항

### 해시 사용 권장
```python
# ✅ 권장: 해시 사용
validator = HWIDValidator(use_hash=True)
# 시리얼: 5f4dcc3b5aa765d61d8327deb882cf99...

# ❌ 비권장: 원본 사용
validator = HWIDValidator(use_hash=False)
# 시리얼: BFEBFBFF000906E9-Default string-WD-WX123456789-...
```

### 서버 포트 분리
- **8080**: 클라이언트 검증 전용 (외부 공개)
- **9090**: 관리자 전용 (내부망만 접근)

### 방화벽 설정
```bash
# 8080만 외부 공개
sudo ufw allow 8080/tcp

# 9090은 내부망만
sudo ufw allow from 192.168.1.0/24 to any port 9090
```

---

## 💡 실전 활용 예제

### 예제 1: 프로그램 시작 시 검증
```python
from hwid_validator import HWIDValidator
import sys

def main():
    validator = HWIDValidator(server_url="http://your-server:8080")
    result = validator.verify()

    if not result['valid']:
        print("❌ 라이선스가 없습니다.")
        print(f"등록 필요: {validator.get_serial()}")
        sys.exit(1)

    # 프로그램 실행
    run_app()
```

### 예제 2: 라이선스 만료 알림
```python
result = validator.verify()

if result['valid']:
    days = result['days_remaining']
    if days < 7:
        print(f"⚠️ 라이선스가 {days}일 후 만료됩니다!")
```

### 예제 3: HWID만 가져오기
```python
from hwid_validator import get_hwid

# 해시된 HWID
hwid_hash = get_hwid(use_hash=True)
print(f"시리얼: {hwid_hash}")

# 원본 HWID
hwid_raw = get_hwid(use_hash=False)
print(f"원본: {hwid_raw}")
```

---

## 🐛 문제 해결

### "서버에 연결할 수 없습니다"
```bash
# 1. 서버가 실행 중인지 확인
cd ~/bk-sever/server
npm run start:client

# 2. 포트 확인
curl http://localhost:8080/api/health
```

### "UNKNOWN" 값이 포함됨
- Windows에서 관리자 권한으로 실행
- WMIC가 설치되어 있는지 확인

### 하드웨어 변경 시
- 하드웨어를 교체하면 HWID가 변경됨
- 새로운 HWID를 서버에 등록 필요

---

## 📚 API 레퍼런스

### `HWIDValidator(server_url, use_hash)`
- `server_url`: 서버 주소 (기본: http://localhost:8080)
- `use_hash`: 해시 사용 여부 (기본: True)

### 메서드
- `verify()`: 검증 실행
- `get_hwid()`: 원본 HWID 반환
- `get_serial()`: 시리얼 번호 반환
- `test_connection()`: 서버 연결 테스트

### 헬퍼 함수
- `get_hwid(use_hash)`: HWID 가져오기
- `verify_hwid(server_url, use_hash)`: 간단한 검증

---

## 📝 라이선스

MIT License
