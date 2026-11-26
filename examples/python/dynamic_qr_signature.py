import hashlib
import hmac


def _hmac_sha512_hex(secret_key: str, message: str) -> str:
    return hmac.new(secret_key.encode(), message.encode(), hashlib.sha512).hexdigest()


def sign_qr_request(secret_key: str, merchant_code: str, *, amount: str, prn: str,
                    remarks1: str, remarks2: str) -> str:
    """Message: AMOUNT,PRN,MERCHANT-CODE,REMARKS1,REMARKS2"""
    return _hmac_sha512_hex(secret_key, ",".join([amount, prn, merchant_code, remarks1, remarks2]))


def sign_status_request(secret_key: str, merchant_code: str, prn: str) -> str:
    """Message: PRN,MERCHANT-CODE"""
    return _hmac_sha512_hex(secret_key, f"{prn},{merchant_code}")
