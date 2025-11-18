"""
HWID 등록 헬퍼 스크립트
현재 PC의 HWID를 출력하여 관리자가 서버에 등록할 수 있게 함
"""

from hwid_validator import HWIDValidator


def main():
    print("=" * 70)
    print("🔐 HWID 등록 헬퍼")
    print("=" * 70)

    # 해시 사용 버전
    print("\n📌 옵션 1: 해시된 시리얼 (권장 - 보안성 높음)")
    validator_hash = HWIDValidator(use_hash=True)
    serial_hash = validator_hash.get_serial()
    print(f"시리얼 번호: {serial_hash}")

    # 원본 사용 버전
    print("\n📌 옵션 2: 원본 HWID (읽기 쉬움)")
    validator_raw = HWIDValidator(use_hash=False)
    serial_raw = validator_raw.get_serial()
    print(f"시리얼 번호: {serial_raw}")

    print("\n" + "=" * 70)
    print("💡 관리자 가이드:")
    print("=" * 70)
    print("\n1️⃣ 웹 UI로 등록 (권장):")
    print(f"   - 브라우저에서 http://your-server:9090 접속")
    print(f"   - 시리얼 번호: {serial_hash}")
    print(f"   - 유효기간: 원하는 날짜 선택")
    print(f"   - [추가하기] 버튼 클릭")

    print("\n2️⃣ curl로 등록:")
    print(f"   curl -X POST http://localhost:9090/api/serials \\")
    print(f"     -H 'Content-Type: application/json' \\")
    print(f"     -d '{{")
    print(f"       \"serial_number\": \"{serial_hash}\",")
    print(f"       \"expiry_date\": \"2025-12-31\",")
    print(f"       \"description\": \"PC 등록\"")
    print(f"     }}'")

    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()
