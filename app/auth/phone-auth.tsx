import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { phoneAuthService } from '../../utils/phoneAuth';
import { ArrowLeft } from 'lucide-react-native';

export default function PhoneAuth() {
  const router = useRouter();
  const { t } = useLanguage();
  const { login } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    const result = await phoneAuthService.sendOTP(phoneNumber);
    
    if (result.success) {
      setStep('otp');
    } else {
      setError(result.error || 'Failed to send OTP');
    }
    
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    const result = await phoneAuthService.verifyOTP(otp);
    
    if (result.success && result.user) {
      // Create user object for your auth context
      const user = {
        name: result.user.displayName || 'User',
        phone: result.user.phoneNumber,
        role: 'labour' as const, // You might want to handle role selection
      };

      // Get Firebase ID token for your backend
      const token = await result.user.getIdToken();
      
      await login(token, user);
      router.replace('/(labour-tabs)');
    } else {
      setError(result.error || 'Verification failed');
    }
    
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {step === 'phone' ? 'Phone Verification' : 'Enter OTP'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* reCAPTCHA container for web */}
        {Platform.OS === 'web' && <div id="recaptcha-container"></div>}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {step === 'phone' ? (
          <View style={styles.phoneSection}>
            <Text style={styles.subtitle}>
              Enter your phone number to receive a verification code
            </Text>

            <Input
              label="Phone Number"
              placeholder="+91 9876543210"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <Button
              title="Send OTP"
              onPress={handleSendOTP}
              loading={loading}
              size="large"
              style={styles.button}
            />
          </View>
        ) : (
          <View style={styles.otpSection}>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to {phoneNumber}
            </Text>

            <Input
              placeholder="Enter OTP"
              value={otp}
              onChangeText={setOTP}
              keyboardType="numeric"
              style={styles.otpInput}
              maxLength={6}
            />

            <Button
              title="Verify OTP"
              onPress={handleVerifyOTP}
              loading={loading}
              size="large"
              style={styles.button}
            />

            <TouchableOpacity
              onPress={() => setStep('phone')}
              style={styles.backButton}
            >
              <Text style={styles.backText}>Change Phone Number</Text>
            </TouchableOpacity>
          </View>
        )}
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
  phoneSection: {
    marginBottom: 32,
  },
  otpSection: {
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
  },
  button: {
    width: '100%',
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'center',
  },
  backText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
});