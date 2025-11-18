"""
간단한 사용 예제
"""

from hwid_validator import HWIDValidator, get_hwid, verify_hwid


# 방법 1: 시리얼만 가져오기
serial = get_hwid(use_hash=True)
print(f"시리얼: {serial}")


# 방법 2: 한 줄로 검증
result = verify_hwid(server_url="http://localhost:8080", use_hash=True)
if result['valid']:
    print("인증 성공")
else:
    print("인증 실패")


# 방법 3: 클래스 사용
validator = HWIDValidator(
    server_url="http://localhost:8080",
    use_hash=True
)

# 시리얼 확인
print(f"시리얼: {validator.get_serial()}")

# 검증
result = validator.verify()
if result['valid']:
    print(f"인증 성공 (남은 일수: {result['days_remaining']}일)")
else:
    print(f"인증 실패: {result['message']}")
