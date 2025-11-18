"""
PC 시리얼 번호 자동 검증 클라이언트
다른 파이썬 프로그램에서 import하여 사용 가능
"""

import platform
import subprocess
import requests
import threading
import time
from datetime import datetime
from typing import Optional, Dict, Callable


class SerialValidator:
    """PC 시리얼 번호 검증 클라이언트"""

    def __init__(self, server_url: str = "http://localhost:3000",
                 check_interval: int = 3600,
                 auto_start: bool = False):
        """
        초기화

        Args:
            server_url: 서버 URL (기본값: http://localhost:3000)
            check_interval: 자동 검증 주기 (초 단위, 기본값: 3600 = 1시간)
            auto_start: 초기화 시 자동으로 검증 시작 여부
        """
        self.server_url = server_url.rstrip('/')
        self.check_interval = check_interval
        self.serial_number = None
        self.is_running = False
        self._thread = None
        self._callbacks = {
            'on_valid': None,
            'on_invalid': None,
            'on_error': None
        }

        # 시리얼 번호 자동 감지
        self.serial_number = self._get_serial_number()

        if auto_start:
            self.start_auto_check()

    def _get_serial_number(self) -> str:
        """PC 시리얼 번호 자동 감지"""
        try:
            system = platform.system()

            if system == 'Windows':
                # Windows BIOS 시리얼 번호 가져오기
                try:
                    result = subprocess.check_output(
                        'wmic bios get serialnumber',
                        shell=True,
                        text=True
                    )
                    lines = result.strip().split('\n')
                    if len(lines) >= 2:
                        serial = lines[1].strip()
                        if serial and serial != 'SerialNumber':
                            return serial
                except Exception as e:
                    print(f"WMIC 실패, 대체 방법 사용: {e}")

                # 대체 방법: UUID 사용
                try:
                    result = subprocess.check_output(
                        'wmic csproduct get uuid',
                        shell=True,
                        text=True
                    )
                    lines = result.strip().split('\n')
                    if len(lines) >= 2:
                        uuid = lines[1].strip()
                        if uuid and uuid != 'UUID':
                            return uuid
                except Exception:
                    pass

            elif system == 'Linux':
                # Linux DMI 시리얼 번호
                try:
                    with open('/sys/class/dmi/id/product_serial', 'r') as f:
                        serial = f.read().strip()
                        if serial:
                            return serial
                except Exception:
                    pass

                # 대체: machine-id
                try:
                    with open('/etc/machine-id', 'r') as f:
                        return f.read().strip()
                except Exception:
                    pass

            elif system == 'Darwin':  # macOS
                try:
                    result = subprocess.check_output(
                        'system_profiler SPHardwareDataType | grep "Serial Number"',
                        shell=True,
                        text=True
                    )
                    serial = result.split(':')[1].strip()
                    if serial:
                        return serial
                except Exception:
                    pass

            # 최후의 수단: platform 기반 고유 ID
            return f"{platform.node()}-{platform.machine()}"

        except Exception as e:
            print(f"시리얼 번호 감지 실패: {e}")
            return f"UNKNOWN-{platform.node()}"

    def verify(self) -> Dict:
        """
        시리얼 번호 검증

        Returns:
            dict: {
                'success': bool,
                'valid': bool,
                'message': str,
                'days_remaining': int (optional),
                'serial': dict (optional)
            }
        """
        try:
            response = requests.post(
                f"{self.server_url}/api/verify",
                json={'serial_number': self.serial_number},
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                result = {
                    'success': True,
                    'valid': data.get('valid', False),
                    'message': data.get('message', ''),
                    'days_remaining': data.get('daysRemaining'),
                    'serial': data.get('serial')
                }

                # 콜백 실행
                if result['valid'] and self._callbacks['on_valid']:
                    self._callbacks['on_valid'](result)
                elif not result['valid'] and self._callbacks['on_invalid']:
                    self._callbacks['on_invalid'](result)

                return result
            else:
                error_result = {
                    'success': False,
                    'valid': False,
                    'message': f'서버 오류: {response.status_code}'
                }
                if self._callbacks['on_error']:
                    self._callbacks['on_error'](error_result)
                return error_result

        except requests.exceptions.ConnectionError:
            error_result = {
                'success': False,
                'valid': False,
                'message': '서버에 연결할 수 없습니다.'
            }
            if self._callbacks['on_error']:
                self._callbacks['on_error'](error_result)
            return error_result

        except Exception as e:
            error_result = {
                'success': False,
                'valid': False,
                'message': f'검증 실패: {str(e)}'
            }
            if self._callbacks['on_error']:
                self._callbacks['on_error'](error_result)
            return error_result

    def _auto_check_loop(self):
        """자동 검증 루프 (백그라운드 스레드)"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 자동 검증 시작")
        print(f"시리얼 번호: {self.serial_number}")
        print(f"검증 주기: {self.check_interval}초 ({self.check_interval/60:.1f}분)")

        while self.is_running:
            try:
                print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 검증 중...")
                result = self.verify()

                if result['success']:
                    if result['valid']:
                        print(f"✅ 유효한 라이선스 (남은 기간: {result['days_remaining']}일)")
                    else:
                        print(f"❌ {result['message']}")
                else:
                    print(f"⚠️ {result['message']}")

            except Exception as e:
                print(f"❌ 검증 오류: {e}")

            # 다음 검증까지 대기
            time.sleep(self.check_interval)

    def start_auto_check(self):
        """자동 검증 시작 (백그라운드 스레드로 실행)"""
        if self.is_running:
            print("이미 자동 검증이 실행 중입니다.")
            return

        self.is_running = True
        self._thread = threading.Thread(target=self._auto_check_loop, daemon=True)
        self._thread.start()
        print("백그라운드 자동 검증이 시작되었습니다.")

    def stop_auto_check(self):
        """자동 검증 중지"""
        if not self.is_running:
            print("자동 검증이 실행 중이지 않습니다.")
            return

        self.is_running = False
        if self._thread:
            self._thread.join(timeout=5)
        print("자동 검증이 중지되었습니다.")

    def set_callback(self, event: str, callback: Callable):
        """
        이벤트 콜백 설정

        Args:
            event: 'on_valid', 'on_invalid', 'on_error'
            callback: 콜백 함수 (result dict를 매개변수로 받음)
        """
        if event in self._callbacks:
            self._callbacks[event] = callback
        else:
            raise ValueError(f"잘못된 이벤트: {event}")

    def get_serial_number(self) -> str:
        """현재 시리얼 번호 반환"""
        return self.serial_number

    def test_connection(self) -> bool:
        """서버 연결 테스트"""
        try:
            response = requests.get(f"{self.server_url}/api/health", timeout=5)
            return response.status_code == 200
        except:
            return False


# 간단한 사용을 위한 헬퍼 함수들
def verify_once(server_url: str = "http://localhost:3000") -> Dict:
    """
    한 번만 검증 (간단한 사용)

    Args:
        server_url: 서버 URL

    Returns:
        검증 결과 dict
    """
    validator = SerialValidator(server_url=server_url)
    return validator.verify()


def get_serial() -> str:
    """
    현재 PC의 시리얼 번호만 가져오기

    Returns:
        시리얼 번호
    """
    validator = SerialValidator()
    return validator.get_serial_number()


if __name__ == "__main__":
    # 직접 실행시 예제
    print("=" * 60)
    print("PC 시리얼 번호 검증 클라이언트")
    print("=" * 60)

    # 검증기 생성
    validator = SerialValidator(
        server_url="http://localhost:3000",
        check_interval=3600  # 1시간
    )

    print(f"\n📋 PC 시리얼 번호: {validator.get_serial_number()}")

    # 서버 연결 테스트
    print("\n🔌 서버 연결 테스트...")
    if validator.test_connection():
        print("✅ 서버 연결 성공")
    else:
        print("❌ 서버 연결 실패")
        exit(1)

    # 즉시 검증
    print("\n🔍 검증 시작...")
    result = validator.verify()

    if result['success']:
        if result['valid']:
            print(f"✅ 유효한 라이선스")
            print(f"   남은 기간: {result['days_remaining']}일")
        else:
            print(f"❌ {result['message']}")
    else:
        print(f"⚠️ {result['message']}")

    # 자동 검증 시작 (백그라운드)
    print("\n⏰ 자동 검증을 시작하시겠습니까? (y/n): ", end='')
    choice = input().lower()

    if choice == 'y':
        validator.start_auto_check()
        print("\n백그라운드에서 자동 검증이 실행됩니다.")
        print("종료하려면 Ctrl+C를 누르세요...\n")

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\n프로그램을 종료합니다...")
            validator.stop_auto_check()
    else:
        print("\n프로그램을 종료합니다.")
