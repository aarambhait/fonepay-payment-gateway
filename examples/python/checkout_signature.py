import base64

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding


def sign_body(body: str, private_key_base64: str) -> str:
    """Base64(RSA-SHA256(body)). Sign the exact string you send on the wire."""
    der = base64.b64decode("".join(private_key_base64.split()))
    private_key = serialization.load_der_private_key(der, password=None)
    signature = private_key.sign(body.encode(), padding.PKCS1v15(), hashes.SHA256())
    return base64.b64encode(signature).decode()
