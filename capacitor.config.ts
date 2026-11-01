import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fauzan.keuangan',
  appName: 'Finance',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
