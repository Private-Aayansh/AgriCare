import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { apiClient } from '../../utils/api';
import { phoneAuthService } from '../../utils/phoneAuth';
import { ArrowLeft, Mail, Phone } from 'lucide-react-native';

export default function Login() {
  const router = useRouter();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
  });
  const [useEmail, setUseEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [apiError, setApiError] = useState<string>('');

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (useEmail) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
    } else {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
        newErrors.phone = 'Phone number is invalid';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setApiError('');
    
    try {
      if (useEmail) {
        // Email OTP flow (existing)
        await apiClient.loginEmail(formData.email);
        
        // Navigate to OTP verification
        router.push({
          pathname: '/auth/otp-verification',
          params: {
            email: formData.email,
          },
        });
      } else {
        // Phone OTP flow using Firebase
        const result = await phoneAuthService.sendOTP(formData.phone);
        
        if (result.success) {
          // Navigate to OTP verification with phone
          router.push({
            pathname: '/auth/otp-verification',
            params: {
              phone: formData.phone,
              useFirebase: 'true', // Flag to indicate Firebase phone auth
            },
          });
        } else {
          setApiError(result.error || 'Failed to send OTP to phone');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* reCAPTCHA container for web phone auth */}
      {Platform.OS === 'web' && !useEmail && (
        <div id="recaptcha-container" style={{ display: 'none' }}></div>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('auth.loginTitle')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {apiError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{apiError}</Text>
          </View>
        ) : null}

        <View style={styles.contactSection}>
          <View style={styles.contactToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, useEmail && styles.toggleButtonActive]}
              onPress={() => setUseEmail(true)}
            >
              <Mail size={16} color={useEmail ? '#FFFFFF' : '#6B7280'} />
              <Text style={[styles.toggleText, useEmail && styles.toggleTextActive]}>
                {t('common.email')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !useEmail && styles.toggleButtonActive]}
              onPress={() => setUseEmail(false)}
            >
              <Phone size={16} color={!useEmail ? '#FFFFFF' : '#6B7280'} />
              <Text style={[styles.toggleText, !useEmail && styles.toggleTextActive]}>
                {t('common.phone')}
              </Text>
            </TouchableOpacity>
          </View>

          {useEmail ? (
            <Input
              label={t('common.email')}
              placeholder={t('auth.enterEmail')}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
          ) : (
            <Input
              label={t('common.phone')}
              placeholder="+91 9876543210"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              error={errors.phone}
            />
          )}
        </View>

        <Button
          title={t('common.login')}
          onPress={handleLogin}
          loading={loading}
          size="large"
          style={styles.loginButton}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/auth/role-selection')}
          >
            <Text style={styles.footerLink}>{t('common.signup')}</Text>
          </TouchableOpacity>
        </View>
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
  contactSection: {
    marginBottom: 32,
  },
  contactToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#22C55E',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  loginButton: {
    width: '100%',
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  footerLink: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
});