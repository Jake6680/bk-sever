"""
사용 예제 2: 콜백 함수와 함께 사용
"""

from serial_validator import SerialValidator
import time

# 콜백 함수 정의
def on_valid(result):
    print(f"🎉 라이선스 유효! 남은 기간: {result['days_remaining']}일")
    # 여기에 유효할 때 실행할 코드 작성
    # 예: 프로그램 기능 활성화

def on_invalid(result):
    print(f"⛔ 라이선스 만료: {result['message']}")
    # 여기에 만료시 실행할 코드 작성
    # 예: 프로그램 기능 비활성화 또는 경고 표시

def on_error(result):
    print(f"⚠️ 연결 오류: {result['message']}")
    # 여기에 오류 처리 코드 작성

# 검증기 생성 및 콜백 설정
validator = SerialValidator(server_url="http://localhost:3000")
validator.set_callback('on_valid', on_valid)
validator.set_callback('on_invalid', on_invalid)
validator.set_callback('on_error', on_error)

# 즉시 검증
print("첫 검증...")
validator.verify()

print("\n1시간마다 자동 검증을 시작합니다...")
validator.start_auto_check()

# 프로그램이 계속 실행되도록 유지
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n종료 중...")
    validator.stop_auto_check()
