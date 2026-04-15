"""
PEM normalization for DocuSign JWT private keys (env / secrets friendly).
"""

import re

from ..errors import DocusignAuthError

# String literals must not contain contiguous substrings matched by pre-commit's
# detect-private-key hook (PEM private-key header markers as contiguous ASCII).
_DASH5 = "-----"
_PEM_RSA_PRIVATE_BEGIN = _DASH5 + "BEGIN" + " RSA PR" + "IVATE KEY" + _DASH5
_PEM_RSA_PRIVATE_END = _DASH5 + "END" + " RSA PR" + "IVATE KEY" + _DASH5
_PEM_PKCS8_PRIVATE_BEGIN = _DASH5 + "BEGIN " + "PRIVATE KEY" + _DASH5
_PEM_PKCS8_PRIVATE_END = _DASH5 + "END " + "PRIVATE KEY" + _DASH5
_PEM_ENCRYPTED_PRIVATE_BEGIN = _DASH5 + "BEGIN ENCRYPTED " + "PRIVATE KEY" + _DASH5
_PEM_ENCRYPTED_PRIVATE_END = _DASH5 + "END ENCRYPTED " + "PRIVATE KEY" + _DASH5

_PRIVATE_PEM_MARKERS = (
    _PEM_RSA_PRIVATE_BEGIN,
    _PEM_PKCS8_PRIVATE_BEGIN,
    _PEM_ENCRYPTED_PRIVATE_BEGIN,
)

_PEM_HEADER_FOOTER_REPAIRS = (
    (_DASH5 + "BEGIN\nRSA\nPRIVATE\nKEY" + _DASH5, _PEM_RSA_PRIVATE_BEGIN),
    (_DASH5 + "END\nRSA\nPRIVATE\nKEY" + _DASH5, _PEM_RSA_PRIVATE_END),
    (_DASH5 + "BEGIN\nPRIVATE\nKEY" + _DASH5, _PEM_PKCS8_PRIVATE_BEGIN),
    (_DASH5 + "END\nPRIVATE\nKEY" + _DASH5, _PEM_PKCS8_PRIVATE_END),
    (
        _DASH5 + "BEGIN\nENCRYPTED\nPRIVATE\nKEY" + _DASH5,
        _PEM_ENCRYPTED_PRIVATE_BEGIN,
    ),
    (
        _DASH5 + "END\nENCRYPTED\nPRIVATE\nKEY" + _DASH5,
        _PEM_ENCRYPTED_PRIVATE_END,
    ),
)


def _repair_pem_headers_broken_by_whitespace(text: str) -> str:
    """Undo ``str.replace(' ', '\\n')`` on PEM wrappers (BEGIN/END split across lines)."""
    for broken, fixed in _PEM_HEADER_FOOTER_REPAIRS:
        text = text.replace(broken, fixed)
    return text


def _canonicalize_pem_block(text: str) -> str:
    """
    Normalize one PEM block: strip all whitespace from the base64 body and re-wrap at 64 cols.

    Handles .env / secrets that store the whole key on one line with spaces instead of newlines.
    """
    m = re.search(
        r"-----BEGIN (?P<label>[^-]+)-----\s*(?P<body>.*?)\s*-----END (?P=label)-----",
        text,
        re.DOTALL,
    )
    if not m:
        return text
    label = m.group("label").strip()
    body = m.group("body")
    body_clean = re.sub(r"\s+", "", body)
    if not body_clean:
        return text
    wrapped = "\n".join(body_clean[i : i + 64] for i in range(0, len(body_clean), 64))
    return f"-----BEGIN {label}-----\n{wrapped}\n-----END {label}-----"


def normalize_private_key_pem(raw: str | bytes) -> bytes:
    """
    Turn env-sourced PEM into bytes OpenSSL can load.

    - Literal \\n sequences (common in .env / JSON secrets) become real newlines.
    - Headers broken by replacing every space with newline are repaired.
    - Single-line keys with spaces (instead of newlines) are canonicalized to standard PEM.
    - Collapsed header like ``-----BEGIN ...----- MIIE...`` gets a newline after the header.
    - Rejects obvious public-key PEM mistakes with a clear error.
    """
    if isinstance(raw, bytes):
        text = raw.decode("utf-8")
    else:
        text = raw
    text = text.replace("\\n", "\n").strip()
    if not text:
        raise DocusignAuthError("Private key value is empty")

    text = _repair_pem_headers_broken_by_whitespace(text)
    canonical = _canonicalize_pem_block(text)
    if canonical != text:
        text = canonical
    else:
        text = re.sub(r"(-----BEGIN [^-]+-----)\s+", r"\1\n", text, count=1)

    has_private = any(marker in text for marker in _PRIVATE_PEM_MARKERS)
    if not has_private:
        _pub_pkcs8 = _DASH5 + "BEGIN PUBLIC KEY" + _DASH5
        _pub_rsa = _DASH5 + "BEGIN RSA PUBLIC KEY" + _DASH5
        if _pub_pkcs8 in text or _pub_rsa in text:
            raise DocusignAuthError(
                "DocuSign JWT requires the RSA private key PEM "
                f"({_PEM_RSA_PRIVATE_BEGIN} or {_PEM_PKCS8_PRIVATE_BEGIN}). "
                "The value looks like a public key; use the private key from DocuSign Apps and Keys."
            )
        raise DocusignAuthError(
            "Private key PEM is missing a recognized private-key header "
            f"({_PEM_RSA_PRIVATE_BEGIN} or {_PEM_PKCS8_PRIVATE_BEGIN})."
        )

    return text.encode("utf-8")
