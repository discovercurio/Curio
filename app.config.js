// app.config.js
// Dynamic Expo config so GitHub Pages can serve this app from /your-repo-name.
// For local development, EXPO_PUBLIC_BASE_PATH is usually blank.

const baseUrl = process.env.EXPO_PUBLIC_BASE_PATH || undefined;

module.exports = {
  expo: {
    name: 'Curio',
    slug: 'curio-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'curio',
    userInterfaceStyle: 'automatic',
    platforms: ['ios', 'android', 'web'],
    ios: {
      supportsTablet: true,
      infoPlist: {
        UIViewControllerBasedStatusBarAppearance: true,
      },
    },
    android: {
      softwareKeyboardLayoutMode: 'resize',
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      [
        'expo-build-properties',
        {
          ios: {
            newArchEnabled: false,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      ...(baseUrl ? { baseUrl } : {}),
    },
  },
};
