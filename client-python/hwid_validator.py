"""
하드웨어 ID 기반 시리얼 번호 검증 클라이언트
"""

import subprocess
import hashlib
import requests
import platform
from typing import Dict


class HWIDValidator:
    """하드웨어 ID 기반 검증 클라이언트"""

    def __init__(self, server_url: str = "http://localhost:8080", use_hash: bool = True):
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

            if len(output) >= 2:
                value = output[1].strip()
                if value:
                    return value
            return "UNKNOWN"
        except:
            return "UNKNOWN"

    def _get_hwid(self) -> str:
        """하드웨어 고유 ID 생성"""
        system = platform.system()

        if system == 'Windows':
            cpu_id = self._get_info("wmic cpu get processorid")
            bios_id = self._get_info("wmic bios get serialnumber")
            disk_id = self._get_info("wmic diskdrive get serialnumber")
            uuid = self._get_info("wmic csproduct get uuid")
            return f"{cpu_id}-{bios_id}-{disk_id}-{uuid}"

        elif system == 'Linux':
            try:
                with open('/proc/cpuinfo', 'r') as f:
                    cpu_id = "UNKNOWN"
                    for line in f:
                        if 'Serial' in line:
                            cpu_id = line.split(':')[1].strip()
                            break
            except:
                cpu_id = "UNKNOWN"

            try:
                with open('/sys/class/dmi/id/product_serial', 'r') as f:
                    bios_id = f.read().strip()
            except:
                bios_id = "UNKNOWN"

            try:
                with open('/etc/machine-id', 'r') as f:
                    machine_id = f.read().strip()
            except:
                machine_id = "UNKNOWN"

            try:
                with open('/sys/class/dmi/id/product_uuid', 'r') as f:
                    uuid = f.read().strip()
            except:
                uuid = "UNKNOWN"

            return f"{cpu_id}-{bios_id}-{machine_id}-{uuid}"

        else:
            return f"{platform.node()}-{platform.machine()}-{platform.processor()}"

    def _hash_serial(self, serial: str) -> str:
        """SHA256 해싱"""
        return hashlib.sha256(serial.encode()).hexdigest()

    def _generate_serial(self) -> str:
        """시리얼 번호 생성"""
        if self.use_hash:
            return self._hash_serial(self.hwid)
        else:
            return self.hwid

    def verify(self) -> Dict:
        """서버에 검증 요청"""
        try:
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
                'message': '서버 연결 실패'
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
        """시리얼 번호 반환"""
        return self.serial_number


def get_hwid(use_hash: bool = True) -> str:
    """현재 PC의 HWID 가져오기"""
    validator = HWIDValidator(use_hash=use_hash)
    return validator.get_serial()


def verify_hwid(server_url: str = "http://localhost:8080", use_hash: bool = True) -> Dict:
    """HWID 검증"""
    validator = HWIDValidator(server_url=server_url, use_hash=use_hash)
    return validator.verify()
