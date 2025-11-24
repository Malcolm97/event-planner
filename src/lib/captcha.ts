// CAPTCHA verification utility
export async function verifyCaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn('reCAPTCHA secret key not configured, skipping verification');
    return true; // Allow in development
  }

  if (!token) {
    return false;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      console.warn('CAPTCHA verification failed:', data['error-codes']);
      return false;
    }

    // Check score for reCAPTCHA v3 (if available)
    if (data.score !== undefined && data.score < 0.5) {
      console.warn('CAPTCHA score too low:', data.score);
      return false;
    }

    return true;
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return false;
  }
}
