import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mitchmccracken.devjournal',
  appName: 'Dev Journal',
  webDir: 'dist',
  ios: {
    splash: {
      enabled: false,
    },
  },
};

export default config;
