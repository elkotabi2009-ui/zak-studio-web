#!/usr/bin/env python3
"""
STEP 5: Follow-up Manager
Automated reply classification, sequence pause/resume, CRM task creation
"""
import os, json, csv
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PROJECT_DIR = Path(__file__).parent

# Load keywords from dispatcher config
import yaml
with open(PROJECT_DIR / "01-config" / "dispatcher.yaml", "r", encoding="utf-8") as f:
    CONFIG = yaml.safe_load(f)

KEYWORDS = CONFIG["reply_classification"]["keywords"]
DEFAULT_CLASS = CONFIG["reply_classification"]["default"]
UNSUB_BASE_URL = CONFIG["legal"]["unsubscribe_base_url"]
SUPPRESSION_FILE = PROJECT_DIR / CONFIG["suppression"]["local_file"]
UNSUB_SECRET = os.getenv("UNSUB_SECRET", "zak-studio-web-unsubscribe-secret-2026-change-in-production")

# Lead state tracking
STATE_FILE = PROJECT_DIR / "02-data" / "lead_states.json"

def load_lead_states():
    """Load lead states from JSON"""
    if STATE_FILE.exists():
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_lead_states(states):
    """Save lead states to JSON"""
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(states, f, indent=2, ensure_ascii=False)

def classify_reply(subject, body):
    """Classify reply based on keywords"""
    text = f"{subject} {body}".lower()

    for category, kws in KEYWORDS.items():
        for kw in kws:
            if kw in text:
                return category

    # Heuristics
    if len(text) > 200:
        return "interested"
    if any(w in text for w in ["?", "come", "quanto", "quando", "dove", "info", "dettagli"]):
        return "interested"

    return DEFAULT_CLASS

def handle_interested(lead_slug, company, subject, body, step):
    """Handle interested reply"""
    print(f"[INTERESTED] {lead_slug} (step {step})")
    print(f"   Subject: {subject}")
    print(f"   Body: {body[:200]}...")

    # 1. Pause sequence
    pause_sequence(lead_slug, "interested_reply")

    # 2. Create CRM task (in production, call CRM API)
    create_crm_task(lead_slug, company, "interested", subject, body)

    # 3. Notify sales (in production, send Slack/email)
    notify_sales(lead_slug, company, "interested", subject, body)

    return {"action": "paused", "crm_task": True, "notified": True}

def handle_not_interested(lead_slug, company, subject, body, step):
    """Handle not interested reply"""
    print(f"[NOT_INTERESTED] {lead_slug} (step {step})")

    # 1. Pause sequence
    pause_sequence(lead_slug, "not_interested")

    # 2. Log lost reason
    log_lost_reason(lead_slug, company, "not_interested", body)

    return {"action": "paused", "lost_reason": "not_interested"}

def handle_referral(lead_slug, company, subject, body, step):
    """Handle referral reply"""
    print(f"[REFERRAL] {lead_slug} (step {step})")
    print(f"   Body: {body[:200]}...")

    # 1. Pause current sequence
    pause_sequence(lead_slug, "referral")

    # 2. Notify sales with referral details
    notify_sales(lead_slug, company, "referral", subject, body)

    return {"action": "paused", "referral": True}

def handle_unsubscribe(lead_slug, company, email, step):
    """Handle unsubscribe reply"""
    print(f"[UNSUBSCRIBE] {lead_slug} (step {step})")

    # 1. Add to suppression list
    add_to_suppression(email, "unsubscribe_reply", "reply_classification")

    # 2. Pause sequence
    pause_sequence(lead_slug, "unsubscribe_reply")

    return {"action": "suppressed_and_paused"}

def handle_bounce(lead_slug, company, email, bounce_type):
    """Handle bounce event"""
    print(f"[BOUNCE] {lead_slug} ({bounce_type})")

    if bounce_type == "hard":
        # Hard bounce -> immediate suppression
        add_to_suppression(email, f"hard_bounce", "webhook")
        pause_sequence(lead_slug, "hard_bounce")
        return {"action": "suppressed_and_paused"}
    else:
        # Soft bounce -> retry logic (handled by ESP)
        return {"action": "monitoring"}

def handle_complaint(lead_slug, company, email):
    """Handle spam complaint"""
    print(f"[SPAM_COMPLAINT] {lead_slug}")

    # Immediate suppression
    add_to_suppression(email, "spam_complaint", "webhook")
    pause_sequence(lead_slug, "spam_complaint")

    # Alert team
    alert_team(f"[SPAM_COMPLAINT] {email} ({company}) - Review list/offer immediately!")

    return {"action": "suppressed_and_paused", "alerted": True}

def handle_unknown(lead_slug, company, subject, body, step):
    """Handle unknown classification"""
    print(f"❓ UNKNOWN: {lead_slug} (step {step})")
    print(f"   Subject: {subject}")
    print(f"   Body: {body[:200]}...")

    # Log for manual review
    log_for_review(lead_slug, company, subject, body, step)

    return {"action": "logged_for_review"}

def process_reply(lead_slug, company, email, subject, body, step):
    """Main reply processing function"""
    classification = classify_reply(subject, body)
    print(f"\n[REPLY] Processing reply: {lead_slug} -> {classification}")

    handlers = {
        "interested": handle_interested,
        "not_interested": handle_not_interested,
        "referral": handle_referral,
        "unsubscribe": lambda *args: handle_unsubscribe(lead_slug, company, email, step),
        "unknown": handle_unknown
    }

    handler = handlers.get(classification, handle_unknown)
    result = handler(lead_slug, company, subject, body, step)
    result["classification"] = classification

    # Update lead state
    states = load_lead_states()
    if lead_slug not in states:
        states[lead_slug] = {"company": company, "email": email, "history": []}

    states[lead_slug]["history"].append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "step": step,
        "subject": subject,
        "classification": classification,
        "action": result.get("action")
    })
    states[lead_slug]["current_status"] = result.get("action", "unknown")
    states[lead_slug]["last_classification"] = classification

    save_lead_states(states)

    return result

def pause_sequence(lead_slug, reason):
    """Pause email sequence for a lead"""
    states = load_lead_states()
    if lead_slug not in states:
        states[lead_slug] = {"company": "", "email": "", "history": []}

    states[lead_slug]["sequence_paused"] = True
    states[lead_slug]["pause_reason"] = reason
    states[lead_slug]["paused_at"] = datetime.now(timezone.utc).isoformat()
    states[lead_slug]["current_status"] = f"paused_{reason}"

    save_lead_states(states)
    print(f"  [PAUSE] Sequence paused for {lead_slug}: {reason}")

def resume_sequence(lead_slug, from_step=1):
    """Resume email sequence for a lead"""
    states = load_lead_states()
    if lead_slug in states:
        states[lead_slug]["sequence_paused"] = False
        states[lead_slug]["resume_from_step"] = from_step
        states[lead_slug]["resumed_at"] = datetime.now(timezone.utc).isoformat()
        states[lead_slug]["current_status"] = f"active_step_{from_step}"
        save_lead_states(states)
        print(f"  [RESUME] Sequence resumed for {lead_slug} from step {from_step}")
    else:
        print(f"  [WARN] Lead state not found: {lead_slug}")

def create_crm_task(lead_slug, company, classification, subject, body):
    """Create CRM task (placeholder - integrate with actual CRM)"""
    task = {
        "lead_slug": lead_slug,
        "company": company,
        "type": "followup",
        "priority": "high" if classification == "interested" else "medium",
        "subject": subject,
        "notes": f"Reply classification: {classification}\n\nBody:\n{body[:500]}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "due_date": (datetime.now() + timedelta(days=1)).date().isoformat()
    }

    # Save to local CRM tasks file
    crm_file = PROJECT_DIR / "02-data" / "crm_tasks.json"
    tasks = []
    if crm_file.exists():
        with open(crm_file, "r", encoding="utf-8") as f:
            tasks = json.load(f)

    tasks.append(task)
    with open(crm_file, "w", encoding="utf-8") as f:
        json.dump(tasks, f, indent=2, ensure_ascii=False)

    print(f"  [CRM] CRM task created: {task['type']} - {task['priority']}")

def notify_sales(lead_slug, company, classification, subject, body):
    """Notify sales team (placeholder - integrate with Slack/email)"""
    message = f"""*{classification.upper()}* reply from {company}
Subject: {subject}
Body: {body[:300]}...
Lead: {lead_slug}
Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}"""

    # Save notification log
    notif_file = PROJECT_DIR / "02-data" / "sales_notifications.json"
    notifications = []
    if notif_file.exists():
        with open(notif_file, "r", encoding="utf-8") as f:
            notifications = json.load(f)

    notifications.append({
        "lead_slug": lead_slug,
        "company": company,
        "classification": classification,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    with open(notif_file, "w", encoding="utf-8") as f:
        json.dump(notifications, f, indent=2, ensure_ascii=False)

    print(f"  [NOTIFY] Sales notified (logged)")

def log_lost_reason(lead_slug, company, reason, body):
    """Log lost deal reason"""
    lost_file = PROJECT_DIR / "02-data" / "lost_reasons.json"
    lost = []
    if lost_file.exists():
        with open(lost_file, "r", encoding="utf-8") as f:
            lost = json.load(f)

    lost.append({
        "lead_slug": lead_slug,
        "company": company,
        "reason": reason,
        "body": body[:500],
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    with open(lost_file, "w", encoding="utf-8") as f:
        json.dump(lost, f, indent=2, ensure_ascii=False)

    print(f"  [LOG] Lost reason logged: {reason}")

def log_for_review(lead_slug, company, subject, body, step):
    """Log unknown reply for manual review"""
    review_file = PROJECT_DIR / "02-data" / "review_queue.json"
    queue = []
    if review_file.exists():
        with open(review_file, "r", encoding="utf-8") as f:
            queue = json.load(f)

    queue.append({
        "lead_slug": lead_slug,
        "company": company,
        "subject": subject,
        "body": body[:500],
        "step": step,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "pending"
    })

    with open(review_file, "w", encoding="utf-8") as f:
        json.dump(queue, f, indent=2, ensure_ascii=False)

    print(f"  [QUEUE] Added to review queue")

def alert_team(message):
    """Alert team (placeholder)"""
    alert_file = PROJECT_DIR / "02-data" / "alerts.json"
    alerts = []
    if alert_file.exists():
        with open(alert_file, "r", encoding="utf-8") as f:
            alerts = json.load(f)

    alerts.append({
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "severity": "high"
    })

    with open(alert_file, "w", encoding="utf-8") as f:
        json.dump(alerts, f, indent=2, ensure_ascii=False)

    print(f"  [ALERT] {message}")

def add_to_suppression(email, reason, source):
    """Add email to suppression list"""
    email = email.lower().strip()
    SUPPRESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SUPPRESSION_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([email, reason, datetime.now(timezone.utc).isoformat(), source, ""])
    print(f"  🚫 Added to suppression: {email} ({reason})")

def check_sequence_paused(lead_slug):
    """Check if sequence is paused for lead"""
    states = load_lead_states()
    return states.get(lead_slug, {}).get("sequence_paused", False)

def get_lead_status(lead_slug):
    """Get current lead status"""
    states = load_lead_states()
    return states.get(lead_slug, {})

# ============================================================
# CLI Interface
# ============================================================

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Follow-up Manager CLI")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Process reply
    p_reply = subparsers.add_parser("process-reply", help="Process a reply")
    p_reply.add_argument("--lead", required=True, help="Lead slug")
    p_reply.add_argument("--company", required=True, help="Company name")
    p_reply.add_argument("--email", required=True, help="Reply from email")
    p_reply.add_argument("--subject", required=True, help="Reply subject")
    p_reply.add_argument("--body", required=True, help="Reply body")
    p_reply.add_argument("--step", type=int, required=True, help="Step number")

    # Pause sequence
    p_pause = subparsers.add_parser("pause", help="Pause sequence for lead")
    p_pause.add_argument("--lead", required=True, help="Lead slug")
    p_pause.add_argument("--reason", required=True, choices=["interested_reply", "not_interested", "referral", "unsubscribe_reply", "hard_bounce", "spam_complaint", "manual"])

    # Resume sequence
    p_resume = subparsers.add_parser("resume", help="Resume sequence for lead")
    p_resume.add_argument("--lead", required=True, help="Lead slug")
    p_resume.add_argument("--from-step", type=int, default=1, help="Step to resume from")

    # Status
    p_status = subparsers.add_parser("status", help="Get lead status")
    p_status.add_argument("--lead", required=True, help="Lead slug")

    # List paused
    subparsers.add_parser("list-paused", help="List all paused sequences")

    # Review queue
    subparsers.add_parser("review-queue", help="Show review queue")

    # CRM tasks
    subparsers.add_parser("crm-tasks", help="Show CRM tasks")

    args = parser.parse_args()

    if args.command == "process-reply":
        result = process_reply(args.lead, args.company, args.email, args.subject, args.body, args.step)
        print(f"\nResult: {json.dumps(result, indent=2)}")

    elif args.command == "pause":
        pause_sequence(args.lead, args.reason)

    elif args.command == "resume":
        resume_sequence(args.lead, args.from_step)

    elif args.command == "status":
        status = get_lead_status(args.lead)
        print(json.dumps(status, indent=2, ensure_ascii=False))

    elif args.command == "list-paused":
        states = load_lead_states()
        paused = [(k, v) for k, v in states.items() if v.get("sequence_paused")]
        print(f"Paused sequences: {len(paused)}")
        for slug, state in paused:
            print(f"  {slug} ({state.get('company', '')}): {state.get('pause_reason', '')} at {state.get('paused_at', '')}")

    elif args.command == "review-queue":
        review_file = PROJECT_DIR / "02-data" / "review_queue.json"
        if review_file.exists():
            with open(review_file, "r", encoding="utf-8") as f:
                queue = json.load(f)
            print(f"Review queue: {len(queue)} items")
            for item in queue:
                print(f"  {item['lead_slug']} ({item['company']}): step {item['step']} - {item['subject'][:50]}")
        else:
            print("Review queue empty")

    elif args.command == "crm-tasks":
        crm_file = PROJECT_DIR / "02-data" / "crm_tasks.json"
        if crm_file.exists():
            with open(crm_file, "r", encoding="utf-8") as f:
                tasks = json.load(f)
            print(f"CRM tasks: {len(tasks)}")
            for task in tasks:
                print(f"  {task['lead_slug']} ({task['company']}): {task['type']} - {task['priority']} - due {task['due_date']}")
        else:
            print("No CRM tasks")

    else:
        parser.print_help()

if __name__ == "__main__":
    from datetime import timedelta
    main()