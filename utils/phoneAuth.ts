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

  // Initialize reCAPTCHA for web
  private initializeRecaptcha() {
    if (Platform.OS === 'web' && !this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
          }
        });
      } catch (error) {
        console.error('reCAPTCHA initialization error:', error);
      }
    }
  }

  async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
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
          throw new Error('reCAPTCHA not initialized');
        }
        this.confirmationResult = await signInWithPhoneNumber(
          auth, 
          formattedPhone, 
          this.recaptchaVerifier
        );
      } else {
        // For React Native (iOS/Android)
        this.confirmationResult = await signInWithPhoneNumber(auth, formattedPhone);
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
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const result = await signInWithCredential(auth, credential);
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
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
  }
}

export const phoneAuthService = new PhoneAuthService();