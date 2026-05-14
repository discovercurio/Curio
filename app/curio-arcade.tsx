// app/curio-arcade.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { ArrowLeft, Gamepad2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'APP_THEME_MODE';
type ThemeMode = 'light' | 'dark';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CurioArcadeScreen() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') setThemeMode(stored);
    } catch {}
  };

  const webSource =
    Platform.OS === 'web'
      ? { uri: `${process.env.EXPO_BASE_URL || ''}/CurioArcadeLoader.html` }
      : require('../assets/html/CurioArcadeLoader.html');

  const injectedJavaScript = `
    (function() {
      // Prevent WebView scrolling/bouncing
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // iOS-specific touch handling
      document.addEventListener('touchmove', function(e) {
        if (e.target.tagName !== 'CANVAS') {
          e.preventDefault();
        }
      }, { passive: false });

      // Ensure proper viewport
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }

      // Signal that WebView is ready
      setTimeout(() => {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        }
      }, 100);

      true; // Required for iOS
    })();
  `;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.accent} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Gamepad2 size={22} color={theme.colors.accent} />
          <Text style={styles.headerTitle}>Curio Arcade</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Secret Easter Egg Message */}
      <View style={styles.secretBanner}>
        <Text style={styles.secretBannerText}>
          🎮 You found the secret arcade!
        </Text>
      </View>

      {/* WebView Game Container */}
      <View style={styles.webViewWrapper} collapsable={false}>
        <WebView
          source={webSource}
          originWhitelist={['*']}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          bounces={false}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          injectedJavaScript={injectedJavaScript}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'ready') {
                console.log('Arcade loaded successfully');
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
          }}
          // iOS-specific props
          {...(Platform.OS === 'ios' && {
            allowsBackForwardNavigationGestures: false,
            automaticallyAdjustContentInsets: false,
            contentInsetAdjustmentBehavior: 'never',
          })}
          // Android-specific props
          {...(Platform.OS === 'android' && {
            mixedContentMode: 'always',
            androidHardwareAccelerationDisabled: false,
          })}
        />
      </View>
    </SafeAreaView>
  );
}

function getTheme(mode: ThemeMode) {
  if (mode === 'dark') {
    return {
      dark: true,
      colors: {
        background: '#0B1320',
        headerBg: '#0E1A2A',
        surface: '#101B2C',
        text: '#D9E4EF',
        subtext: '#A9B6C6',
        accent: '#D4AF37',
        border: 'rgba(255,255,255,0.08)',
        secretBg: 'rgba(212,175,55,0.15)',
      },
    };
  }
  return {
    dark: false,
    colors: {
      background: '#F5F7FA',
      headerBg: '#1E3A5F',
      surface: '#FFFFFF',
      text: '#1E3A5F',
      subtext: '#6B7280',
      accent: '#D4AF37',
      border: '#E5E7EB',
      secretBg: 'rgba(212,175,55,0.2)',
    },
  };
}

function makeStyles(theme: ReturnType<typeof getTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.headerBg,
      paddingVertical: 16,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.dark
        ? 'rgba(234,219,166,0.15)'
        : 'rgba(212, 175, 55, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 20,
      color: theme.colors.accent,
      fontWeight: '700',
    },
    placeholder: {
      width: 40,
    },
    secretBanner: {
      backgroundColor: theme.colors.secretBg,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    secretBannerText: {
      fontSize: 13,
      color: theme.colors.text,
      textAlign: 'center',
      fontWeight: '500',
    },
    webViewWrapper: {
      flex: 1,
      width: '100%',
      backgroundColor: 'transparent',
    },
    webView: {
      flex: 1,
      backgroundColor: 'transparent',
    },
  });
}