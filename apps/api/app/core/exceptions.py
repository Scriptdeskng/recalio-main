"""Custom exceptions for the Recallio API"""

class RecallioException(Exception):
    """Base exception for Recallio"""
    pass

class QuizGenerationError(RecallioException):
    """Raised when quiz generation fails"""
    pass

class AIResponseError(QuizGenerationError):
    """Raised when AI response is invalid or unparseable"""
    pass

class ValidationError(RecallioException):
    """Raised when validation fails"""
    pass

class ChallengeError(RecallioException):
    """Raised when challenge operations fail"""
    pass
