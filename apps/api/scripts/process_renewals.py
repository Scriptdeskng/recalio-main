#!/usr/bin/env python3
"""
Cron job script for processing recurring subscription charges

This script should be run daily via cron to charge subscriptions
that are about to expire.

Add to crontab:
# Run every day at 9 AM
0 9 * * * cd /path/to/recalio && python -m apps.api.scripts.process_renewals

Or run manually:
python -m apps.api.scripts.process_renewals
"""

import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.services.recurring_charge_service import RecurringChargeService
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def main():
    """Main function to process recurring charges"""
    logger.info("="*60)
    logger.info("STARTING RECURRING CHARGE PROCESSING")
    logger.info("="*60)
    
    # Create database engine and session
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    try:
        async with async_session() as session:
            # Process subscriptions expiring within 1 day
            results = await RecurringChargeService.process_pending_renewals(
                db=session,
                days_before_expiry=1
            )
            
            logger.info("="*60)
            logger.info("PROCESSING COMPLETE")
            logger.info(f"Total subscriptions processed: {results['total']}")
            logger.info(f"Successful charges: {results['success']}")
            logger.info(f"Failed charges: {results['failure']}")
            logger.info("="*60)
            
            # Exit with error code if there were failures
            if results['failure'] > 0:
                logger.warning(f"{results['failure']} subscriptions failed to renew")
                sys.exit(1)
            
            sys.exit(0)
            
    except Exception as e:
        logger.error(f"Fatal error processing renewals: {str(e)}", exc_info=True)
        sys.exit(1)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
