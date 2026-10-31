import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'lastWorche',
  webDir: 'dist',
  // Android blocks plain http calls by default. The local backend has no https, so test builds need this.
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
