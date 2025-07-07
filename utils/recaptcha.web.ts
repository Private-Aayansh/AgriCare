import { Auth } from 'firebase/auth';
import { RecaptchaVerifier } from 'firebase/auth';

export async function initializeRecaptcha(auth: Auth): Promise<RecaptchaVerifier | null> {
  if (typeof document === 'undefined') {
    // Not in a browser environment
    return null;
  }

  let recaptchaVerifier: RecaptchaVerifier | null = null;

  try {
    // Create reCAPTCHA container if it doesn't exist
    if (!document.getElementById('recaptcha-container')) {
      const container = document.createElement('div');
      container.id = 'recaptcha-container';
      container.style.display = 'none';
      document.body.appendChild(container);
    }

    recaptchaVerifier = new RecaptchaVerifier(
      'recaptcha-container',
      {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          recaptchaVerifier = null;
        }
      },
      auth
    );
    console.log('reCAPTCHA initialized');
    return recaptchaVerifier;
  } catch (error) {
    console.error('reCAPTCHA initialization error:', error);
    return null;
  }
}
