import os
import smtplib
from email.message import EmailMessage

def send_otp_email(to_email: str, otp: str):
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")

    if not all([smtp_host, smtp_port, smtp_user, smtp_password]):
        print(f"[AUTH FALLBACK] Verification OTP for {to_email}: {otp}", flush=True)
        return

    try:
        msg = EmailMessage()
        msg.set_content(f"Your verification code is: {otp}\n\nThis code will expire in 15 minutes.")
        msg["Subject"] = "Your SIE Verification Code"
        msg["From"] = smtp_user
        msg["To"] = to_email

        server = smtplib.SMTP(smtp_host, int(smtp_port))
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        print(f"[AUTH] Verification email sent to {to_email}", flush=True)
    except Exception as e:
        print(f"[AUTH ERROR] Failed to send email to {to_email}: {e}", flush=True)
        # Fallback to print if email fails (for testing/safety)
        print(f"[AUTH FALLBACK] Verification OTP for {to_email}: {otp}", flush=True)
