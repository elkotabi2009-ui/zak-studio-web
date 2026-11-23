#!/usr/bin/env python3
"""
Daily Email Sender Daemon
Run via cron: 0 8 * * * cd /c/Users/asus/Desktop/progetto zak studio web && python sender_daemon.py
Or via GitHub Actions (see .github/workflows/sender-daily.yml)
"""
import sys
from pathlib import Path

# Auto-detect project directory
PROJECT_DIR = Path(__file__).parent
sys.path.insert(0, str(PROJECT_DIR))

from run_pipeline_step4 import send_daily_batch
from datetime import datetime

if __name__ == "__main__":
    # Allow date override for testing
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="Date in YYYY-MM-DD format")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without sending")
    args = parser.parse_args()

    if args.date:
        from datetime import datetime
        send_daily_batch(datetime.strptime(args.date, "%Y-%m-%d").date(), dry_run=args.dry_run)
    else:
        send_daily_batch(dry_run=args.dry_run)
