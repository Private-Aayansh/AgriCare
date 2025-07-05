import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { apiClient } from '../../utils/api';
import { phoneAuthService } from '../../utils/phoneAuth';
import { ArrowLeft } from 'lucide-react-native';

export default function OTPVerification() {
  const router = useRouter();
  const { email, phone, role, useFirebase, name, isSignup } = useLocalSearchParams<{
    email?: string;
    phone?: string;
    role: 'farmer' | 'labour';
    useFirebase?: string;
    name?: string;
    isSignup?: string;
  }>();
  const { t } = useLanguage();
  const { login } = useAuth();

  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  const isFirebaseAuth = useFirebase === 'true';
  const isSignupFlow = isSignup === 'true';

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isFirebaseAuth) {
        phoneAuthService.clearSession();
      }
    };
  }, [isFirebaseAuth]);

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setApiError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setApiError('');
    
    try {
      if (isFirebaseAuth && phone) {
        // Firebase phone verification
        const result = await phoneAuthService.verifyOTP(otp);
        
        if (result.success && result.user) {
          // Create user object for your auth context
          const user = {
            name: name || result.user.displayName || 'User',
            phone: result.user.phoneNumber,
            role: role,
          };

          // Get Firebase ID token for your backend
          const token = await result.user.getIdToken();
          
          // If this is a signup flow, you might want to call your backend
          // to create the user record with additional info
          if (isSignupFlow) {
            try {
              await apiClient.signup({
                name: user.name,
                phone: user.phone,
                role: role,
              });
            } catch (signupError) {
              console.log('Backend signup error (continuing anyway):', signupError);
              // Continue even if backend signup fails
            }
          }
          
          await login(token, user);
          
          // Navigate to appropriate dashboard
          if (role === 'farmer') {
            router.replace('/(farmer-tabs)');
          } else {
            router.replace('/(labour-tabs)');
          }
        } else {
          setApiError(result.error || 'Phone verification failed');
        }
      } else if (email) {
        // Email OTP verification (existing flow)
        const response = await apiClient.verifyEmailOTP(email, otp);

        if (response?.token) {
          const user = {
            name: name || 'User',
            email: email,
            role: role,
          };
          
          await login(response.token, user);
          
          // Navigate to appropriate dashboard
          if (role === 'farmer') {
            router.replace('/(farmer-tabs)');
          } else {
            router.replace('/(labour-tabs)');
          }
        }
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'OTP verification failed. Please try again.';
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setResendLoading(true);
    setApiError('');
    
    try {
      if (isFirebaseAuth && phone) {
        // Resend Firebase phone OTP
        const result = await phoneAuthService.sendOTP(phone);
        
        if (result.success) {
          setTimer(60);
          setCanResend(false);
          setApiError('');
        } else {
          setApiError(result.error || 'Failed to resend OTP');
        }
      } else if (email) {
        // Resend email OTP
        await apiClient.sendEmailOTP(email);
        setTimer(60);
        setCanResend(false);
        setApiError('');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP. Please try again.';
      setApiError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* reCAPTCHA container for web phone auth */}
      {Platform.OS === 'web' && isFirebaseAuth && (
        <div id="recaptcha-container" style={{ display: 'none' }}></div>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('auth.otpTitle')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {apiError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{apiError}</Text>
          </View>
        ) : null}

        <View style={styles.otpSection}>
          <Text style={styles.subtitle}>
            {t('auth.otpSubtitle')} {email || phone}
          </Text>
          
          {isFirebaseAuth && (
            <Text style={styles.firebaseNote}>
              Using Firebase SMS verification
            </Text>
          )}

          <Input
            placeholder={t('auth.otpPlaceholder')}
            value={otp}
            onChangeText={setOTP}
            keyboardType="numeric"
            style={styles.otpInput}
            maxLength={6}
          />

          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={!canResend || resendLoading}
            style={styles.resendButton}
          >
            <Text style={[
              styles.resendText,
              (!canResend || resendLoading) && styles.resendTextDisabled
            ]}>
              {resendLoading ? 'Sending...' : 
               canResend ? t('auth.resendOtp') : `${t('auth.resendOtp')} (${timer}s)`}
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title={t('common.verify')}
          onPress={handleVerifyOTP}
          loading={loading}
          size="large"
          style={styles.verifyButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  otpSection: {
    marginBottom: 48,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  firebaseNote: {
    fontSize: 12,
    color: '#8B5CF6',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
  },
  resendButton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#9CA3AF',
  },
  verifyButton: {
    width: '100%',
  },
});