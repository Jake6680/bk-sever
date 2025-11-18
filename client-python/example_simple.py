"""
간단한 사용 예제 1: 한 번만 검증
"""

from serial_validator import verify_once, get_serial

# 방법 1: 시리얼 번호 확인
print("현재 PC 시리얼 번호:", get_serial())

# 방법 2: 즉시 검증
result = verify_once(server_url="http://localhost:3000")

if result['success']:
    if result['valid']:
        print(f"✅ 유효한 라이선스 (남은 기간: {result['days_remaining']}일)")
    else:
        print(f"❌ {result['message']}")
else:
    print(f"⚠️ 서버 오류: {result['message']}")
