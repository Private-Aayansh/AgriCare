import { auth } from './firebase';
import { 
  PhoneAuthProvider, 
  signInWithCredential, 
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { Platform } from 'react-native';

class PhoneAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  // Check if Firebase Auth is available
  private checkAuth(): boolean {
    if (!auth) {
      console.error('Firebase Auth not initialized');
      return false;
    }
    return true;
  }

  // Initialize reCAPTCHA for web
  private initializeRecaptcha() {
    if (Platform.OS === 'web' && !this.recaptchaVerifier && this.checkAuth()) {
      try {
        // Create reCAPTCHA container if it doesn't exist
        if (!document.getElementById('recaptcha-container')) {
          const container = document.createElement('div');
          container.id = 'recaptcha-container';
          container.style.display = 'none';
          document.body.appendChild(container);
        }

        this.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            this.recaptchaVerifier = null;
          }
        });
        console.log('reCAPTCHA initialized');
      } catch (error) {
        console.error('reCAPTCHA initialization error:', error);
        this.recaptchaVerifier = null;
      }
    }
  }

  async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.checkAuth()) {
        return { success: false, error: 'Firebase Auth not available' };
      }

      // Format phone number (ensure it starts with country code)
      let formattedPhone = phoneNumber.trim();
      
      // Remove any non-digit characters except +
      formattedPhone = formattedPhone.replace(/[^\d+]/g, '');
      
      // Add +91 if no country code is present
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('91')) {
          formattedPhone = '+' + formattedPhone;
        } else {
          formattedPhone = '+91' + formattedPhone;
        }
      }
      
      console.log('Sending OTP to:', formattedPhone);
      
      if (Platform.OS === 'web') {
        this.initializeRecaptcha();
        if (!this.recaptchaVerifier) {
          return { success: false, error: 'reCAPTCHA not available' };
        }
        this.confirmationResult = await signInWithPhoneNumber(
          auth!, 
          formattedPhone, 
          this.recaptchaVerifier
        );
      } else {
        // For React Native (iOS/Android)
        this.confirmationResult = await signInWithPhoneNumber(auth!, formattedPhone);
      }

      console.log('OTP sent successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Send OTP error:', error);
      let errorMessage = 'Failed to send OTP';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'Captcha verification failed. Please try again';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  async verifyOTP(otp: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      if (!this.checkAuth()) {
        return { success: false, error: 'Firebase Auth not available' };
      }

      if (!this.confirmationResult) {
        return { success: false, error: 'No OTP request found. Please request OTP first.' };
      }

      console.log('Verifying OTP:', otp);
      const result = await this.confirmationResult.confirm(otp);
      console.log('OTP verified successfully');
      
      return { 
        success: true, 
        user: result.user 
      };
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      let errorMessage = 'Invalid OTP';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code has expired';
      } else if (error.code === 'auth/session-expired') {
        errorMessage = 'Session expired. Please request a new OTP';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  // Alternative method using verification ID (for native apps)
  async verifyWithCredential(verificationId: string, otp: string) {
    try {
      if (!this.checkAuth()) {
        return { success: false, error: 'Firebase Auth not available' };
      }

      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const result = await signInWithCredential(auth!, credential);
      return { 
        success: true, 
        user: result.user 
      };
    } catch (error: any) {
      console.error('Verify credential error:', error);
      return { 
        success: false, 
        error: error.message || 'Verification failed' 
      };
    }
  }

  // Clear the current verification session
  clearSession() {
    this.confirmationResult = null;
    if (Platform.OS === 'web' && this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch (error) {
        console.log('Error clearing reCAPTCHA:', error);
      }
      this.recaptchaVerifier = null;
    }
  }
}

export const phoneAuthService = new PhoneAuthService();