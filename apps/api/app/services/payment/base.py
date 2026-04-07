from abc import ABC, abstractmethod
from typing import Dict, Any
from dataclasses import dataclass
from datetime import datetime

@dataclass
class PaymentTransaction:
    """Represents a payment transaction"""
    reference: str
    amount: int  # In kobo/cents
    email: str
    status: str
    paid_at: datetime | None = None
    authorization_code: str | None = None
    channel: str | None = None
    metadata: Dict[str, Any] | None = None

@dataclass
class InitiatePaymentResponse:
    """Response from initiating a payment"""
    success: bool
    authorization_url: str | None = None
    access_code: str | None = None
    reference: str | None = None
    message: str | None = None

class PaymentProvider(ABC):
    """Abstract base class for payment providers"""
    
    @abstractmethod
    async def initialize_transaction(
        self,
        email: str,
        amount: int,
        plan_code: str | None = None,
        metadata: Dict[str, Any] | None = None
    ) -> InitiatePaymentResponse:
        """
        Initialize a payment transaction
        
        Args:
            email: Customer's email
            amount: Amount in kobo/cents
            plan_code: Subscription plan code (if applicable)
            metadata: Additional transaction metadata
            
        Returns:
            InitiatePaymentResponse with authorization URL
        """
        pass
    
    @abstractmethod
    async def verify_transaction(self, reference: str) -> PaymentTransaction:
        """
        Verify a payment transaction
        
        Args:
            reference: Transaction reference
            
        Returns:
            PaymentTransaction with transaction details
        """
        pass
    
    @abstractmethod
    async def charge_authorization(
        self,
        authorization_code: str,
        email: str,
        amount: int,
        metadata: Dict[str, Any] | None = None
    ) -> PaymentTransaction:
        """
        Charge a previously authorized card
        
        Args:
            authorization_code: Authorization code from previous transaction
            email: Customer's email
            amount: Amount in kobo/cents
            metadata: Additional transaction metadata
            
        Returns:
            PaymentTransaction with charge details
        """
        pass
