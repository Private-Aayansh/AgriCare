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
      this.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });
    }
  }

  async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Format phone number (ensure it starts with country code)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      if (Platform.OS === 'web') {
        this.initializeRecaptcha();
        this.confirmationResult = await signInWithPhoneNumber(
          auth, 
          formattedPhone, 
          this.recaptchaVerifier!
        );
      } else {
        // For React Native (iOS/Android)
        // Note: This requires Firebase native modules
        this.confirmationResult = await signInWithPhoneNumber(auth, formattedPhone);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Send OTP error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send OTP' 
      };
    }
  }

  async verifyOTP(otp: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      if (!this.confirmationResult) {
        return { success: false, error: 'No OTP request found. Please request OTP first.' };
      }

      const result = await this.confirmationResult.confirm(otp);
      return { 
        success: true, 
        user: result.user 
      };
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      return { 
        success: false, 
        error: error.message || 'Invalid OTP' 
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
}

export const phoneAuthService = new PhoneAuthService();