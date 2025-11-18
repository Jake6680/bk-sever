"""
HWID 기반 인증 사용 예제
프로그램 시작 시 하드웨어 ID를 확인하여 인증
"""

from hwid_validator import HWIDValidator
import sys


def main():
    print("🚀 프로그램 시작...")

    # HWID 검증기 생성
    validator = HWIDValidator(
        server_url="http://localhost:8080",  # 클라이언트 서버 포트
        use_hash=True  # 해시 사용 (보안)
    )

    print(f"\n📋 이 PC의 시리얼 번호: {validator.get_serial()[:32]}...")

    # 인증 검증
    result = validator.verify()

    if result['success'] and result['valid']:
        print(f"✅ 인증 성공! 남은 기간: {result['days_remaining']}일")
        print("\n프로그램을 계속 실행합니다...\n")

        # 여기에 실제 프로그램 로직 작성
        run_application()

    else:
        print(f"❌ 인증 실패: {result.get('message', '알 수 없는 오류')}")
        print("\n관리자에게 연락하여 라이선스를 등록하세요.")
        print(f"등록할 시리얼: {validator.get_serial()}")
        sys.exit(1)


def run_application():
    """인증 후 실행되는 메인 프로그램"""
    print("=" * 50)
    print("메인 프로그램 실행 중...")
    print("=" * 50)

    # 실제 프로그램 로직
    print("✅ 기능 1 실행")
    print("✅ 기능 2 실행")
    print("✅ 기능 3 실행")

    print("\n프로그램 종료")


if __name__ == "__main__":
    main()
