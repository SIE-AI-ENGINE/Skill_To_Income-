import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Sends a 6-digit verification OTP email using configured SMTP credentials.
    Falls back gracefully with a development warning if credentials are missing
    or SMTP dispatch fails.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[DEV WARNING] SMTP failed or not configured. OTP code for {to_email}: {otp_code}", flush=True)
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your Skill-to-Income Engine Verification Code"
        from_email = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
        from_name = settings.EMAILS_FROM_NAME or "Skill-to-Income AI Engine"
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email

        # Plain text version
        plain_text = (
            f"Verify Your Account\n\n"
            f"Your verification code is: {otp_code}\n\n"
            f"This code is valid for 10 minutes. If you did not request this, please ignore this email.\n\n"
            f"— Skill-to-Income AI Engine Team"
        )

        # HTML version
        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1528; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b1528; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540px" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #11223f; border: 1px solid #1e3a68; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center;">
              <div style="display: inline-block; padding: 8px 16px; border-radius: 9999px; background-color: rgba(126, 219, 234, 0.12); border: 1px solid rgba(126, 219, 234, 0.3); color: #7edbea; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">
                Skill-to-Income AI Engine
              </div>
              <h1 style="margin: 20px 0 8px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; color: #ffffff;">
                Verify Your Account
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 22px; color: #a3b8cc;">
                Use the 6-digit confirmation code below to activate your account and access your income engine workspace.
              </p>
            </td>
          </tr>

          <!-- OTP Code Display -->
          <tr>
            <td align="center" style="padding: 10px 36px 25px 36px;">
              <div style="background: linear-gradient(135deg, #173762 0%, #1e4b85 100%); border: 1px solid #2d62a3; border-radius: 14px; padding: 22px 30px; text-align: center; max-width: 320px;">
                <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #7edbea; padding-left: 12px;">
                  {otp_code}
                </div>
              </div>
            </td>
          </tr>

          <!-- Subtitle / Notice -->
          <tr>
            <td style="padding: 0 36px 30px 36px; text-align: center;">
              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #7e9bb8;">
                This code is valid for 10 minutes. If you did not request this, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Divider & Footer -->
          <tr>
            <td style="border-top: 1px solid #1a3258; padding: 24px 36px; text-align: center; background-color: #0d1a31;">
              <p style="margin: 0; font-size: 11px; color: #5a7594;">
                &copy; 2025 Skill-to-Income AI Engine &middot; Intelligent Career Acceleration
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        print(f"[AUTH] Verification OTP successfully emailed to {to_email}", flush=True)
        return True

    except Exception as e:
        print(f"[DEV WARNING] SMTP failed or not configured. OTP code for {to_email}: {otp_code} (Error: {e})", flush=True)
        return False
