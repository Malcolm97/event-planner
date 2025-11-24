'use client';

import { useRef, forwardRef, useImperativeHandle } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface CaptchaProps {
  onVerify?: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
  size?: 'compact' | 'normal';
  theme?: 'light' | 'dark';
}

export interface CaptchaRef {
  execute: () => void;
  reset: () => void;
  getValue: () => string | null;
}

const Captcha = forwardRef<CaptchaRef, CaptchaProps>(({
  onVerify,
  onExpired,
  onError,
  size = 'normal',
  theme = 'light'
}, ref) => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useImperativeHandle(ref, () => ({
    execute: () => recaptchaRef.current?.execute(),
    reset: () => recaptchaRef.current?.reset(),
    getValue: () => recaptchaRef.current?.getValue() || null,
  }));

  // Only render if site key is available
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    console.warn('reCAPTCHA site key not configured');
    return null;
  }

  return (
    <ReCAPTCHA
      ref={recaptchaRef}
      sitekey={siteKey}
      onChange={onVerify}
      onExpired={onExpired}
      onError={onError}
      size={size}
      theme={theme}
    />
  );
});

Captcha.displayName = 'Captcha';

export default Captcha;
