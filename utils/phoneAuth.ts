import { Platform } from 'react-native';

let phoneAuthService: any;

if (Platform.OS === 'web') {
  phoneAuthService = require('./phoneAuth.web').phoneAuthService;
} else {
  phoneAuthService = require('./phoneAuth.native').phoneAuthService;
}

export { phoneAuthService };