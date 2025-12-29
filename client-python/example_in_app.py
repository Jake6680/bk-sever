"""
사용 예제 3: 기존 프로그램에 통합하는 방법
"""

from serial_validator import SerialValidator

class MyApplication:
    """여러분의 기존 프로그램"""

    def __init__(self):
        # 시리얼 검증기 초기화
        self.validator = SerialValidator(
            server_url="http://localhost:3000",
            check_interval=3600,  # 1시간
            auto_start=True  # 자동으로 백그라운드 검증 시작
        )

        # 콜백 설정
        self.validator.set_callback('on_valid', self.on_license_valid)
        self.validator.set_callback('on_invalid', self.on_license_invalid)

        self.is_licensed = False

        # 초기 검증
        self.check_license()

    def check_license(self):
        """라이선스 확인"""
        result = self.validator.verify()

        if result['success'] and result['valid']:
            self.is_licensed = True
            print("✅ 라이선스 인증 완료")
            return True
        else:
            self.is_licensed = False
            print(f"❌ 라이선스 인증 실패: {result.get('message', '알 수 없는 오류')}")
            return False

    def on_license_valid(self, result):
        """라이선스 유효 시 호출"""
        self.is_licensed = True
        print(f"라이선스 갱신 성공 (남은 기간: {result['days_remaining']}일)")

    def on_license_invalid(self, result):
        """라이선스 만료 시 호출"""
        self.is_licensed = False
        print(f"라이선스 만료됨: {result['message']}")
        # 프로그램 기능 제한 또는 종료

    def run(self):
        """프로그램 실행"""
        if not self.is_licensed:
            print("라이선스가 없습니다. 프로그램을 종료합니다.")
            return

        print("프로그램 실행 중...")
        # 여기에 실제 프로그램 로직

        # 백그라운드에서 자동으로 1시간마다 검증됨

    def shutdown(self):
        """프로그램 종료"""
        self.validator.stop_auto_check()
        print("프로그램 종료")


# 사용 예제
if __name__ == "__main__":
    app = MyApplication()

    try:
        app.run()

        # 프로그램이 계속 실행
        import time
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        app.shutdown()
