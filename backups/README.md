# Database Backups Directory

This directory stores PostgreSQL database backups.

## Creating a Backup

```bash
# Auto-named backup with timestamp
make db-backup

# Named backup
make db-backup FILE=my_backup.sql
```

## Restoring a Backup

```bash
make db-restore FILE=backup_20260405_123456.sql
```

## Manual Backup

```bash
docker-compose exec -T db pg_dump -U postgres recallio > backups/manual_backup.sql
```

## Manual Restore

```bash
docker-compose exec -T db psql -U postgres recallio < backups/manual_backup.sql
```

## Backup Best Practices

1. **Regular Backups**: Set up automated backups using cron
   ```bash
   # Add to crontab (crontab -e)
   0 2 * * * cd /path/to/recallio && make db-backup FILE=daily_$(date +\%Y\%m\%d).sql
   ```

2. **Before Migrations**: Always backup before running migrations
   ```bash
   make db-backup
   make db-migrate
   ```

3. **Before Major Changes**: Backup before significant database changes
   ```bash
   make db-backup FILE=before_feature_x.sql
   ```

4. **Test Restores**: Periodically test your backups
   ```bash
   make db-reset
   make db-restore FILE=your_backup.sql
   ```

5. **Retention Policy**: Keep:
   - Daily backups for 7 days
   - Weekly backups for 4 weeks
   - Monthly backups for 12 months

## Backup to Remote Storage

```bash
# Backup to S3
make db-backup FILE=backup.sql
aws s3 cp backups/backup.sql s3://your-bucket/backups/

# Backup to remote server
make db-backup FILE=backup.sql
scp backups/backup.sql user@remote:/path/to/backups/
```

## Automated Backup Script

Create `scripts/backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"
docker-compose exec -T db pg_dump -U postgres recallio > backups/$BACKUP_FILE
gzip backups/$BACKUP_FILE
echo "Backup created: $BACKUP_FILE.gz"

# Keep only last 7 days
find backups/ -name "backup_*.sql.gz" -mtime +7 -delete
```

## Production Considerations

For production:
- Use managed database with automated backups (AWS RDS, Azure Database, etc.)
- Implement point-in-time recovery
- Store backups in multiple locations
- Encrypt sensitive backups
- Test disaster recovery procedures
