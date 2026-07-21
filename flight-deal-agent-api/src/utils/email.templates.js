/**
 * OTP email template — clean, on-brand with FareWatch colours.
 *
 * @param {string} otp        - 6-digit OTP to display
 * @param {string} firstName  - Recipient's first name
 * @returns {{ subject: string, html: string, text: string }}
 */
export const otpEmailTemplate = (otp, firstName = "there") => ({
  subject: `${otp} is your FareWatch reset code`,

  text: `Hi ${firstName},\n\nYour FareWatch password reset code is: ${otp}\n\nThis code expires in 10 minutes. If you didn't request this, you can safely ignore this email.\n\nFareWatch Team`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your FareWatch password</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EF;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EF;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#FFFFFF;padding:32px 40px 24px;border-bottom:1px solid #EAE6E0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#4FAE84;margin-right:8px;vertical-align:middle;"></span>
                    <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8FA3B1;vertical-align:middle;">Fare Watch</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0E1F33;font-family:'Courier New',monospace;">
                Reset your password
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#8FA3B1;line-height:1.6;">
                Hi ${firstName}, use the code below to reset your FareWatch password. It expires in <strong style="color:#0E1F33;">10 minutes</strong>.
              </p>

              <!-- OTP box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center" style="background:#F7F5F1;border:1.5px dashed #E5E0D8;border-radius:12px;padding:28px 20px;">
                    <span style="font-family:'Courier New',monospace;font-size:40px;font-weight:700;letter-spacing:12px;color:#0E1F33;">
                      ${otp}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:13px;color:#8FA3B1;line-height:1.6;">
                Enter this code on the FareWatch password reset screen. Do not share this code with anyone.
              </p>
              <p style="margin:0;font-size:13px;color:#8FA3B1;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email — your account is not at risk.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #EAE6E0;">
              <p style="margin:0;font-size:11px;color:#BEB9B2;font-family:'Courier New',monospace;letter-spacing:0.08em;text-transform:uppercase;">
                FareWatch · Flight Deal Monitoring Agent
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
});