import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

const i18n = new I18n({
  en: {
    // Common
    common: {
      continue: 'Continue',
      back: 'Back',
      submit: 'Submit',
      cancel: 'Cancel',
      delete: 'Delete',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      otp: 'OTP',
      verify: 'Verify',
      resend: 'Resend',
      login: 'Login',
      signup: 'Sign Up',
      logout: 'Logout',
    },
    // Language Selector
    language: {
      title: 'Select Language',
      subtitle: 'Choose your preferred language',
      english: 'English',
      hindi: 'हिंदी',
      punjabi: 'ਪੰਜਾਬੀ',
      tamil: 'தமிழ்',
    },
    // Authentication
    auth: {
      roleSelection: 'I am a',
      farmer: 'Farmer',
      labour: 'Labour',
      signupTitle: 'Create Account',
      loginTitle: 'Welcome Back',
      enterName: 'Enter your name',
      enterEmail: 'Enter your email',
      enterPhone: 'Enter your phone number',
      useEmail: 'Use email instead',
      usePhone: 'Use phone instead',
      haveAccount: 'Already have an account?',
      noAccount: 'Don\'t have an account?',
      otpTitle: 'Enter OTP',
      otpSubtitle: 'We sent a code to',
      otpPlaceholder: 'Enter 6-digit code',
      resendOtp: 'Resend OTP',
    },
    // Dashboard
    dashboard: {
      welcome: 'Welcome',
      farmer: {
        home: 'Home',
        chats: 'Chats',
        labours: 'Jobs',
        services: 'Services',
      },
      labour: {
        home: 'Home',
        jobs: 'Jobs',
        chats: 'Chats',
      },
    },
    // Profile
    profile: {
      title: 'Profile',
      changeLanguage: 'Change Language',
      role: 'Role',
    },
    // Job Management
    jobCard: {
      deleteConfirmationTitle: 'Delete Job',
      deleteConfirmationMessage: 'Are you sure you want to delete this job? This action cannot be undone.',
      deleteSuccessTitle: 'Job Deleted',
      deleteSuccessMessage: 'The job has been successfully deleted.',
    },
    // Job List
    jobList: {
      noJobs: {
        title: 'No Jobs Posted',
        subtitle: 'Create your first job posting to find labourers in your area.',
      },
    },
    // Errors
    errors: {
      fetchErrorTitle: 'Error Loading Jobs',
      fetchErrorMessage: 'Unable to load jobs. Please check your connection and try again.',
      deleteErrorTitle: 'Delete Failed',
      deleteErrorMessage: 'Unable to delete the job. Please try again.',
    },
  },
  hi: {
    // Common
    common: {
      continue: 'जारी रखें',
      back: 'वापस',
      submit: 'जमा करें',
      cancel: 'रद्द करें',
      delete: 'हटाएं',
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफलता',
      name: 'नाम',
      email: 'ईमेल',
      phone: 'फोन',
      otp: 'ओटीपी',
      verify: 'सत्यापित करें',
      resend: 'पुनः भेजें',
      login: 'लॉगिन',
      signup: 'साइन अप',
      logout: 'लॉगआउट',
    },
    // Language Selector
    language: {
      title: 'भाषा चुनें',
      subtitle: 'अपनी पसंदीदा भाषा चुनें',
      english: 'English',
      hindi: 'हिंदी',
      punjabi: 'ਪੰਜਾਬੀ',
      tamil: 'தமிழ்',
    },
    // Authentication
    auth: {
      roleSelection: 'मैं हूं',
      farmer: 'किसान',
      labour: 'मजदूर',
      signupTitle: 'खाता बनाएं',
      loginTitle: 'वापस आपका स्वागत है',
      enterName: 'अपना नाम दर्ज करें',
      enterEmail: 'अपना ईमेल दर्ज करें',
      enterPhone: 'अपना फोन नंबर दर्ज करें',
      useEmail: 'ईमेल का उपयोग करें',
      usePhone: 'फोन का उपयोग करें',
      haveAccount: 'पहले से खाता है?',
      noAccount: 'खाता नहीं है?',
      otpTitle: 'ओटीपी दर्ज करें',
      otpSubtitle: 'हमने कोड भेजा है',
      otpPlaceholder: '6-अंकीय कोड दर्ज करें',
      resendOtp: 'ओटीपी पुनः भेजें',
    },
    // Dashboard
    dashboard: {
      welcome: 'स्वागत',
      farmer: {
        home: 'होम',
        chats: 'चैट',
        labours: 'काम',
        services: 'सेवाएं',
      },
      labour: {
        home: 'होम',
        jobs: 'काम',
        chats: 'चैट',
      },
    },
    // Profile
    profile: {
      title: 'प्रोफाइल',
      changeLanguage: 'भाषा बदलें',
      role: 'भूमिका',
    },
    // Job Management
    jobCard: {
      deleteConfirmationTitle: 'काम हटाएं',
      deleteConfirmationMessage: 'क्या आप वाकई इस काम को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।',
      deleteSuccessTitle: 'काम हटा दिया गया',
      deleteSuccessMessage: 'काम सफलतापूर्वक हटा दिया गया है।',
    },
    // Job List
    jobList: {
      noJobs: {
        title: 'कोई काम पोस्ट नहीं किया गया',
        subtitle: 'अपने क्षेत्र में मजदूर खोजने के लिए अपना पहला काम पोस्ट करें।',
      },
    },
    // Errors
    errors: {
      fetchErrorTitle: 'काम लोड करने में त्रुटि',
      fetchErrorMessage: 'काम लोड करने में असमर्थ। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।',
      deleteErrorTitle: 'हटाना असफल',
      deleteErrorMessage: 'काम हटाने में असमर्थ। कृपया पुनः प्रयास करें।',
    },
  },
});

// Set locale with fallback to 'en' if Localization.locale is undefined
const deviceLocale = Localization.locale || 'en';
i18n.locale = deviceLocale.startsWith('hi') ? 'hi' : 'en';
i18n.fallbacks = true;

export default i18n;