"""Auth user exceptions."""


class SecurityException(Exception):
    """Exception class for SecurityError tuples."""

    def __init__(self, security_error_tuple):
        self.error_tuple = security_error_tuple
        super().__init__(security_error_tuple[1])
