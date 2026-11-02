import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fauzan.keuangan',
  appName: 'Finance',
  webDir: 'dist',
  server: {
    url: 'https://financebudgatily.vercel.app',
    cleartext: false,
    androidScheme: 'https'
  }
};

export default config;
