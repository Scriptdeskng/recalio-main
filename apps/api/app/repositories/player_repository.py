from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.player import Player
from app.schemas.auth import VerifyOTPData
from datetime import datetime, timezone

class PlayerRepository:
    """Repository for player data access"""
    
    @staticmethod
    async def get_by_msisdn(db: AsyncSession, msisdn: str) -> Player | None:
        """Get player by phone number"""
        result = await db.execute(
            select(Player).where(Player.msisdn == msisdn)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def create_or_update_from_auth(
        db: AsyncSession, 
        msisdn: str, 
        telco: str,
        auth_data: VerifyOTPData
    ) -> Player:
        """
        Create or update player profile from authentication data
        """
        player = await PlayerRepository.get_by_msisdn(db, msisdn)
        
        if player:
            # Update existing player
            player.telco = telco
            player.service_id = auth_data.service_id
            player.has_any_subscription = auth_data.has_any_subscription
            player.has_active_subscription = auth_data.has_active_subscription
            player.subscription_data = (
                auth_data.active_subscription.model_dump() 
                if auth_data.active_subscription 
                else None
            )
            player.last_subscription_check = datetime.now(timezone.utc)
            player.updated_at = datetime.now(timezone.utc)
        else:
            # Create new player
            player = Player(
                msisdn=msisdn,
                telco=telco,
                service_id=auth_data.service_id,
                has_any_subscription=auth_data.has_any_subscription,
                has_active_subscription=auth_data.has_active_subscription,
                subscription_data=(
                    auth_data.active_subscription.model_dump() 
                    if auth_data.active_subscription 
                    else None
                ),
                last_subscription_check=datetime.now(timezone.utc)
            )
            db.add(player)
        
        await db.commit()
        await db.refresh(player)
        return player
    
    @staticmethod
    async def update_subscription_status(
        db: AsyncSession,
        msisdn: str,
        subscription_data: dict
    ) -> Player | None:
        """Update player subscription status"""
        player = await PlayerRepository.get_by_msisdn(db, msisdn)
        
        if not player:
            return None
        
        player.has_any_subscription = subscription_data.get("has_any_subscription", False)
        player.has_active_subscription = subscription_data.get("has_active_subscription", False)
        player.subscription_data = subscription_data.get("active_subscription")
        player.last_subscription_check = datetime.now(timezone.utc)
        player.updated_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(player)
        return player
    
    @staticmethod
    async def update_player(
        db: AsyncSession,
        msisdn: str,
        full_name: str | None = None
    ) -> Player | None:
        """Update player profile"""
        player = await PlayerRepository.get_by_msisdn(db, msisdn)
        
        if not player:
            return None
        
        if full_name is not None:
            player.full_name = full_name
        
        player.updated_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(player)
        return player
        
        await db.commit()
        await db.refresh(player)
        return player
