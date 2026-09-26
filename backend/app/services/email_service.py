import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load backend/.env if present, otherwise search upwards
_env_backend = Path(__file__).resolve().parents[2] / ".env"
_env_root = Path(__file__).resolve().parents[3] / ".env"
if _env_backend.exists():
    load_dotenv(dotenv_path=_env_backend)
elif _env_root.exists():
    load_dotenv(dotenv_path=_env_root)
else:
    load_dotenv()

SMTP_HOST = os.getenv("MAIL_SERVER") or os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("MAIL_PORT") or os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("MAIL_USERNAME") or os.getenv("SMTP_USER", "skilltoincomeaiengine@gmail.com")
SMTP_PASS = (os.getenv("MAIL_PASSWORD") or os.getenv("SMTP_PASSWORD", "")).strip()


def send_otp_email(to_email: str, otp_code: str) -> bool:
    if not SMTP_PASS:
        print(f"[ERROR] MAIL_PASSWORD not set in backend/.env. Fallback OTP: {otp_code}")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your Skill-to-Income Verification Code: {otp_code}"
        msg["From"] = f"Skill-to-Income AI Engine <{SMTP_USER}>"
        msg["To"] = to_email

        html_body = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #0f172a; margin-bottom: 8px;">Verify Your Email</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.5;">Enter the verification code below to activate your Skill-to-Income AI Engine workspace:</p>
            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0284c7;">{otp_code}</span>
            </div>
            <p style="color: #64748b; font-size: 13px;">This code expires in 10 minutes. If you did not request this code, please disregard this message.</p>
        </div>
        """
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, [to_email], msg.as_string())
        print(f"[SUCCESS] OTP email delivered to {to_email}")
        return True
    except Exception as e:
        print(f"[SMTP ERROR] Failed sending OTP email to {to_email}: {e}")
        return False
