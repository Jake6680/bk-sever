"""
사용 예제 4: 데코레이터를 사용한 라이선스 검증
"""

from serial_validator import SerialValidator
from functools import wraps

# 전역 검증기
validator = SerialValidator(server_url="http://localhost:3000")


def require_license(func):
    """
    라이선스 검증 데코레이터
    함수 실행 전에 자동으로 라이선스를 검증합니다
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = validator.verify()

        if result['success'] and result['valid']:
            print(f"✅ 라이선스 확인 (남은 기간: {result['days_remaining']}일)")
            return func(*args, **kwargs)
        else:
            print(f"❌ 라이선스 오류: {result.get('message', '인증 실패')}")
            print("이 기능을 사용할 수 없습니다.")
            return None

    return wrapper


# 라이선스가 필요한 함수들
@require_license
def premium_feature_1():
    """프리미엄 기능 1"""
    print("프리미엄 기능 1 실행 중...")
    # 실제 기능 코드


@require_license
def premium_feature_2():
    """프리미엄 기능 2"""
    print("프리미엄 기능 2 실행 중...")
    # 실제 기능 코드


def free_feature():
    """무료 기능 (라이선스 필요 없음)"""
    print("무료 기능 실행 중...")


# 사용 예제
if __name__ == "__main__":
    print("=== 프로그램 시작 ===\n")

    # 무료 기능은 항상 실행 가능
    free_feature()

    print()

    # 프리미엄 기능은 라이선스 확인 후 실행
    premium_feature_1()
    premium_feature_2()
