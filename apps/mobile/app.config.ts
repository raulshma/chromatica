import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const expoProjectId = process.env.EXPO_PROJECT_ID ?? new Error('EXPO_PROJECT_ID is not set');
  if (expoProjectId instanceof Error) throw expoProjectId;
  const expoConfig: ExpoConfig = {
    ...config,
    slug: process.env.EXPO_SLUG ?? 'react-native-boilerplate',
    name: process.env.EXPO_NAME ?? 'React Native Boilerplate',
    ios: {
      ...config.ios,
      bundleIdentifier:
        process.env.EXPO_IOS_BUNDLE_IDENTIFIER ?? 'com.watarumaeda.react-native-boilerplate',
    },
    android: {
      ...config.android,
      package: process.env.EXPO_ANDROID_PACKAGE ?? 'com.watarumaeda.react_native_boilerplate',
    },
    web: {
      ...config.web,
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/logo-sm.png',
    },
    updates: {
      url: `https://u.expo.dev/${expoProjectId}`,
    },
    extra: {
      ...config.extra,
      eas: { projectId: expoProjectId },
      env: process.env.ENV ?? 'development',
      apiUrl: process.env.API_URL ?? 'https://example.com',
      // add more env variables here...
    },
    plugins: [
      'expo-router',
      'expo-asset',
      'expo-web-browser',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#101212',
          },
          image: './assets/images/logo-lg.png',
          imageWidth: 200,
          resizeMode: 'contain',
        },
      ],
      [
        'expo-font',
        {
          fonts: [
            './assets/fonts/OpenSans-Bold.ttf',
            './assets/fonts/OpenSans-BoldItalic.ttf',
            './assets/fonts/OpenSans-Italic.ttf',
            './assets/fonts/OpenSans-Regular.ttf',
            './assets/fonts/OpenSans-Semibold.ttf',
            './assets/fonts/OpenSans-SemiboldItalic.ttf',
          ],
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: true, // Set to true to enable cleartext HTTP requests
          },
        },
      ],
    ],
  };
  // console.log('[##] expo config', expoConfig);
  return expoConfig;
};
