# Cron Job Setup Guide: Automated Subscription Renewals

This guide explains how to configure the daily recurring charge cron job for production deployment.

---

## Overview

The `process_renewals.py` script automatically charges subscribers whose subscriptions are due for renewal. It runs daily and processes cards saved via Paystack authorization codes.

**Script Location:** `apps/api/scripts/process_renewals.py`

**What it does:**
- Finds subscriptions where `next_billing_at <= current_time`
- Charges saved payment methods (Paystack authorization codes)
- Updates subscription status based on charge results
- Implements 3-tier retry logic before moving to grace period
- Detects invalid authorization codes and suspends accounts

---

## Prerequisites

1. **Python environment** with all dependencies installed
2. **Database access** (PostgreSQL connection configured)
3. **Environment variables** loaded (`.env` file with Paystack keys, database URL, etc.)
4. **Script permissions:** Make script executable
   ```bash
   chmod +x apps/api/scripts/process_renewals.py
   ```

---

## Production Deployment

### Step 1: Test the Script Manually

Before adding to cron, verify the script runs correctly:

```bash
# Navigate to project root
cd /path/to/recalio

# Activate virtual environment (if using one)
source venv/bin/activate  # or your virtualenv path

# Run the script
python -m apps.api.scripts.process_renewals
```

**Expected output:**
```
2026-04-07 09:00:00 - INFO - Starting renewal processing...
2026-04-07 09:00:05 - INFO - Processed 15 subscriptions: 12 success, 3 failed
2026-04-07 09:00:05 - INFO - Renewal processing complete
```

**Exit codes:**
- `0` = Success (all renewals succeeded or no renewals due)
- `1` = Failures detected (check logs for details)

---

### Step 2: Create a Log Directory

Create a dedicated directory for cron logs:

```bash
sudo mkdir -p /var/log/recalio
sudo chown $USER:$USER /var/log/recalio
```

Or use project-relative logs:

```bash
mkdir -p /path/to/recalio/logs
```

---

### Step 3: Create a Wrapper Script (Recommended)

Create a wrapper script to handle environment setup:

```bash
nano /path/to/recalio/scripts/run_renewals.sh
```

**Wrapper script content:**

```bash
#!/bin/bash

# Exit on any error
set -e

# Set project path
PROJECT_ROOT="/path/to/recalio"
cd "$PROJECT_ROOT"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
fi

# Activate virtual environment (if using one)
if [ -f "$PROJECT_ROOT/venv/bin/activate" ]; then
    source "$PROJECT_ROOT/venv/bin/activate"
fi

# Run the renewal script
python -m apps.api.scripts.process_renewals

# Exit with the same code as the Python script
exit $?
```

**Make it executable:**

```bash
chmod +x /path/to/recalio/scripts/run_renewals.sh
```

---

### Step 4: Configure Crontab

Open your crontab file:

```bash
crontab -e
```

**Add one of these cron entries:**

#### Option A: Run at 9 AM daily (Recommended)
```cron
# Run renewal processing every day at 9:00 AM WAT
0 9 * * * /path/to/recalio/scripts/run_renewals.sh >> /var/log/recalio/renewals.log 2>&1
```

#### Option B: Run multiple times per day (for high-volume systems)
```cron
# Run every 6 hours (at 6 AM, 12 PM, 6 PM, 12 AM)
0 6,12,18,0 * * * /path/to/recalio/scripts/run_renewals.sh >> /var/log/recalio/renewals.log 2>&1
```

#### Option C: Direct Python execution (without wrapper)
```cron
# Run at 9 AM - direct Python execution
0 9 * * * cd /path/to/recalio && /path/to/python -m apps.api.scripts.process_renewals >> /var/log/recalio/renewals.log 2>&1
```

**Cron time syntax:**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

---

### Step 5: Verify Cron Job

**List active cron jobs:**
```bash
crontab -l
```

**Test cron execution** (wait for scheduled time or temporarily set to run in 2 minutes):
```bash
# Temporarily set to run at next minute for testing
# Edit crontab: */1 * * * * /path/to/script...
# Watch the log file
tail -f /var/log/recalio/renewals.log
```

**Restore original schedule after testing!**

---

## Monitoring & Maintenance

### Check Cron Logs

```bash
# View recent renewal logs
tail -50 /var/log/recalio/renewals.log

# Search for failures
grep -i "failed" /var/log/recalio/renewals.log

# Monitor in real-time
tail -f /var/log/recalio/renewals.log
```

### Log Rotation

Prevent log files from growing too large:

```bash
sudo nano /etc/logrotate.d/recalio
```

**Add this configuration:**

```
/var/log/recalio/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 youruser youruser
}
```

### Set Up Alerts (Optional)

Create a monitoring script that sends alerts on failures:

```bash
#!/bin/bash
# /path/to/recalio/scripts/run_renewals_with_alert.sh

LOG_FILE="/var/log/recalio/renewals.log"

# Run the renewal script
/path/to/recalio/scripts/run_renewals.sh >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

# Send alert if there were failures
if [ $EXIT_CODE -ne 0 ]; then
    # Example: Send email alert
    echo "Renewal processing failed at $(date)" | mail -s "Recalio: Renewal Failures Detected" admin@yourdomain.com
    
    # Or use a service like Slack/Discord webhook
    # curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    #   -H 'Content-Type: application/json' \
    #   -d '{"text":"⚠️ Renewal processing failed. Check logs."}'
fi

exit $EXIT_CODE
```

---

## Troubleshooting

### Cron Job Not Running

1. **Check cron service status:**
   ```bash
   sudo service cron status  # or systemctl status cron
   ```

2. **Check system cron logs:**
   ```bash
   grep CRON /var/log/syslog  # Ubuntu/Debian
   # or
   grep CRON /var/log/messages  # CentOS/RHEL
   ```

3. **Verify paths are absolute:**
   - Cron doesn't use your shell's PATH
   - Always use full paths: `/usr/bin/python`, `/path/to/recalio`

### Script Fails in Cron but Works Manually

1. **Environment variables not loaded:**
   - Use wrapper script to source `.env`
   - Or use `env` command in crontab: `ENV_VAR=value command`

2. **Different user context:**
   ```bash
   # Check which user cron runs as
   whoami > /tmp/cron-user.txt
   ```

3. **Database connection issues:**
   - Verify database credentials in `.env`
   - Check firewall rules for database access

### High Failure Rates

1. **Check Paystack API status:**
   ```bash
   curl https://api.paystack.co/
   ```

2. **Review authorization codes:**
   - Some may be expired or revoked by users
   - Script should mark these as `SUSPENDED`

3. **Database query performance:**
   - Add index on `next_billing_at` field if not exists:
   ```sql
   CREATE INDEX idx_subscriptions_next_billing_at 
   ON subscriptions(next_billing_at);
   ```

---

## Production Checklist

- [ ] Script runs successfully in manual test
- [ ] Environment variables are accessible to cron
- [ ] Log directory exists with proper permissions
- [ ] Wrapper script created and tested
- [ ] Crontab entry added with correct schedule
- [ ] Log rotation configured
- [ ] Monitoring/alerting set up (optional)
- [ ] Team notified of deployment
- [ ] First scheduled run verified
- [ ] Failure handling tested (check grace period logic)

---

## Key Configuration Values

| Setting | Current Value | Adjustable? |
|---------|---------------|-------------|
| Cron schedule | 9:00 AM daily | Yes - edit crontab |
| Retry attempts | 3 attempts | Yes - in recurring_charge_service.py |
| Grace period duration | Indefinite until next attempt | Add expiry check in future |
| Days before expiry | 1 day (next_billing_at = ends_at - 1d) | Yes - in subscription_service.py |
| Log retention | 30 days (if logrotate configured) | Yes - edit logrotate config |

---

## Next Steps After Cron Setup

1. **Configure webhook URLs** in provider dashboards:
   - IntelliHQ: `https://yourdomain.com/api/v1/webhooks/intellihq`
   - Paystack: `https://yourdomain.com/api/v1/webhooks/paystack`

2. **Add subscription status checks** to quiz endpoints:
   - Verify `has_active_subscription` before allowing quiz access

3. **Implement grace period expiry**:
   - Add logic to move from `GRACE` to `SUSPENDED` after X days

4. **Set up email notifications**:
   - Alert users when payment fails
   - Remind users before grace period ends

---

## Support & Documentation

- **Cron script source:** `apps/api/scripts/process_renewals.py`
- **Service logic:** `apps/api/app/services/recurring_charge_service.py`
- **Webhook handlers:** `apps/api/app/services/paystack_webhook_service.py`
- **Full flow docs:** `PAYSTACK_FLOW_EXPLAINED.md`

For questions or issues, check application logs and webhook processing history in the database.
