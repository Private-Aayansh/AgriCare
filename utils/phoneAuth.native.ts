import { auth } from './firebase';

class PhoneAuthService {
  private confirmationResult: any = null;

  // Check if Firebase Auth is available
  private checkAuth(): boolean {
    if (!auth) {
      console.error('Firebase Auth not initialized');
      return false;
    }
    return true;
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
      
      this.confirmationResult = await auth.signInWithPhoneNumber(formattedPhone);

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
      }
      if (error.message) {
        errorMessage += ': ' + error.message;
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
      }
      if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  // Clear the current verification session
  clearSession() {
    this.confirmationResult = null;
  }
}

export const phoneAuthService = new PhoneAuthService();