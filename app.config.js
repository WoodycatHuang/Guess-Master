import 'dotenv/config';

/** @type {import('expo/config').ExpoConfig} */
export default {
  expo: {
    name: '猜数大师',
    slug: 'guess-master',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocalNetworkUsageDescription:
          '用于连接同一 WiFi 下的游戏房间服务器',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      usesCleartextTraffic: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      syncUrl: process.env.EXPO_PUBLIC_SYNC_URL ?? null,
    },
  },
};
