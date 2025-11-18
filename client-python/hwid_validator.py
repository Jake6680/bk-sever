"""
하드웨어 ID 기반 시리얼 번호 검증 클라이언트
PC의 CPU, BIOS, Disk, UUID를 조합하여 고유 HWID 생성
"""

import subprocess
import hashlib
import requests
import platform
from typing import Dict, Optional


class HWIDValidator:
    """하드웨어 ID 기반 검증 클라이언트"""

    def __init__(self, server_url: str = "http://localhost:8080", use_hash: bool = True):
        """
        초기화

        Args:
            server_url: 서버 URL (기본값: http://localhost:8080 - 클라이언트 서버)
            use_hash: True면 해시된 HWID 사용, False면 원본 HWID 사용
        """
        self.server_url = server_url.rstrip('/')
        self.use_hash = use_hash
        self.hwid = self._get_hwid()
        self.serial_number = self._generate_serial()

    def _get_info(self, cmd: str) -> str:
        """WMIC 명령으로 하드웨어 정보 가져오기"""
        try:
            output = subprocess.check_output(
                cmd,
                shell=True,
                stderr=subprocess.DEVNULL
            ).decode('utf-8', errors='ignore').split('\n')

            # 첫 줄은 헤더, 두 번째 줄이 실제 값
            if len(output) >= 2:
                value = output[1].strip()
                if value:
                    return value
            return "UNKNOWN"
        except Exception as e:
            print(f"⚠️ 명령 실패 ({cmd}): {e}")
            return "UNKNOWN"

    def _get_hwid(self) -> str:
        """하드웨어 고유 ID 생성 (CPU + BIOS + Disk + UUID)"""
        system = platform.system()

        if system == 'Windows':
            print("🔍 Windows 하드웨어 정보 수집 중...")

            cpu_id = self._get_info("wmic cpu get processorid")
            bios_id = self._get_info("wmic bios get serialnumber")
            disk_id = self._get_info("wmic diskdrive get serialnumber")
            uuid = self._get_info("wmic csproduct get uuid")

            print(f"  CPU ID: {cpu_id}")
            print(f"  BIOS Serial: {bios_id}")
            print(f"  Disk Serial: {disk_id}")
            print(f"  UUID: {uuid}")

            raw_hwid = f"{cpu_id}-{bios_id}-{disk_id}-{uuid}"
            return raw_hwid

        elif system == 'Linux':
            print("🔍 Linux 하드웨어 정보 수집 중...")

            # CPU ID
            try:
                with open('/proc/cpuinfo', 'r') as f:
                    for line in f:
                        if 'Serial' in line:
                            cpu_id = line.split(':')[1].strip()
                            break
                    else:
                        cpu_id = "UNKNOWN"
            except:
                cpu_id = "UNKNOWN"

            # DMI Serial
            try:
                with open('/sys/class/dmi/id/product_serial', 'r') as f:
                    bios_id = f.read().strip()
            except:
                bios_id = "UNKNOWN"

            # Machine ID
            try:
                with open('/etc/machine-id', 'r') as f:
                    machine_id = f.read().strip()
            except:
                machine_id = "UNKNOWN"

            # UUID
            try:
                with open('/sys/class/dmi/id/product_uuid', 'r') as f:
                    uuid = f.read().strip()
            except:
                uuid = "UNKNOWN"

            raw_hwid = f"{cpu_id}-{bios_id}-{machine_id}-{uuid}"
            return raw_hwid

        else:
            print(f"⚠️ {system} OS는 기본 HWID를 사용합니다.")
            return f"{platform.node()}-{platform.machine()}-{platform.processor()}"

    def _hash_serial(self, serial: str) -> str:
        """시리얼 번호를 SHA256으로 해싱"""
        return hashlib.sha256(serial.encode()).hexdigest()

    def _generate_serial(self) -> str:
        """HWID를 기반으로 시리얼 번호 생성"""
        if self.use_hash:
            # 해시 버전 (보안성 높음)
            return self._hash_serial(self.hwid)
        else:
            # 원본 버전 (읽기 쉬움)
            return self.hwid

    def verify(self) -> Dict:
        """
        서버에 HWID 검증 요청

        Returns:
            dict: {
                'success': bool,
                'valid': bool,
                'message': str,
                'days_remaining': int (optional)
            }
        """
        try:
            print(f"\n🔐 서버 검증 요청 중...")
            print(f"서버: {self.server_url}")
            print(f"시리얼: {self.serial_number[:32]}..." if len(self.serial_number) > 32 else f"시리얼: {self.serial_number}")

            response = requests.post(
                f"{self.server_url}/api/verify",
                json={'serial_number': self.serial_number},
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'valid': data.get('valid', False),
                    'message': data.get('message', ''),
                    'days_remaining': data.get('daysRemaining'),
                    'expiry_date': data.get('serial', {}).get('expiry_date')
                }
            else:
                return {
                    'success': False,
                    'valid': False,
                    'message': f'서버 오류: {response.status_code}'
                }

        except requests.exceptions.ConnectionError:
            return {
                'success': False,
                'valid': False,
                'message': '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.'
            }
        except Exception as e:
            return {
                'success': False,
                'valid': False,
                'message': f'검증 실패: {str(e)}'
            }

    def get_hwid(self) -> str:
        """원본 HWID 반환"""
        return self.hwid

    def get_serial(self) -> str:
        """생성된 시리얼 번호 반환"""
        return self.serial_number

    def test_connection(self) -> bool:
        """서버 연결 테스트"""
        try:
            response = requests.get(f"{self.server_url}/api/health", timeout=5)
            return response.status_code == 200
        except:
            return False


# 간단한 사용을 위한 헬퍼 함수
def get_hwid(use_hash: bool = False) -> str:
    """
    현재 PC의 HWID 가져오기

    Args:
        use_hash: True면 해시된 값, False면 원본 값

    Returns:
        HWID 문자열
    """
    validator = HWIDValidator(use_hash=use_hash)
    return validator.get_serial()


def verify_hwid(server_url: str = "http://localhost:8080", use_hash: bool = True) -> Dict:
    """
    HWID 검증 (간단한 사용)

    Args:
        server_url: 서버 URL
        use_hash: 해시 사용 여부

    Returns:
        검증 결과 dict
    """
    validator = HWIDValidator(server_url=server_url, use_hash=use_hash)
    return validator.verify()


if __name__ == "__main__":
    print("=" * 70)
    print("🔐 하드웨어 ID 기반 시리얼 검증 클라이언트")
    print("=" * 70)

    # HWID 검증기 생성
    validator = HWIDValidator(
        server_url="http://localhost:8080",  # 클라이언트 서버
        use_hash=True  # 해시 사용 (보안성 높음)
    )

    print(f"\n📋 하드웨어 정보:")
    print(f"  원본 HWID: {validator.get_hwid()}")
    print(f"  시리얼 번호: {validator.get_serial()}")

    # 서버 연결 테스트
    print("\n🔌 서버 연결 테스트...")
    if validator.test_connection():
        print("✅ 서버 연결 성공")
    else:
        print("❌ 서버 연결 실패")
        print("\n💡 서버를 먼저 실행하세요:")
        print("   cd ~/bk-sever/server")
        print("   npm run start:client")
        exit(1)

    # 검증 시작
    print("\n" + "=" * 70)
    result = validator.verify()

    if result['success']:
        if result['valid']:
            print("✅ 인증 성공!")
            print(f"   유효기간: {result.get('expiry_date')}")
            print(f"   남은 일수: {result.get('days_remaining')}일")
        else:
            print(f"❌ 인증 실패: {result['message']}")
            print("\n💡 관리자에게 다음 시리얼 번호를 등록 요청하세요:")
            print(f"   {validator.get_serial()}")
    else:
        print(f"⚠️ 검증 오류: {result['message']}")

    print("=" * 70)
