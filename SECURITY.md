# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the repository owner
through GitHub Security Advisories. Do not publish passwords, OTPs, CAPTCHA
values, Supabase service-role keys, personal data, or private business records
in issues or pull requests.

## Protected secrets

- Use `SUPABASE_SERVICE_ROLE_KEY` only on server-side workers or CI jobs.
- Never place service-role keys in Vite, Expo, extension, or browser code.
- Never automate government-login passwords, OTP entry, CAPTCHA solving,
  payment submission, or final portal submission.
- User-confirmed autofill must exclude password, OTP, CAPTCHA, security-code,
  and PIN fields.
