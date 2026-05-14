// app/store.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
  BackHandler,
  StatusBar,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

const STORE_URL = 'https://curiocollectibles.com/password'; // change to https://curiocollectibles.com/ when live
const ALLOWED_HOST = 'curiocollectibles.com';

type ThemeMode = 'light' | 'dark';

const getTheme = (mode: ThemeMode) =>
  mode === 'dark'
    ? {
        dark: true,
        colors: {
          background: '#000000',
          accent: '#D4AF37',
          buttonBg: 'rgba(13, 26, 42, 0.95)',
          shadow: 'rgba(212, 175, 55, 0.3)',
        },
      }
    : {
        dark: false,
        colors: {
          background: '#000000',
          accent: '#D4AF37',
          buttonBg: 'rgba(30, 58, 95, 0.95)',
          shadow: 'rgba(212, 175, 55, 0.3)',
        },
      };

const StoreScreen: React.FC = () => {
  const colorScheme = (useColorScheme() ?? 'light') as ThemeMode;
  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  const safeGoBack = () => {
    // If the Shopify page has history, go back inside WebView first
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    // Otherwise, fall back to app-level navigation
    router.replace('/');
    return true;
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', safeGoBack);
    return () => sub.remove();
  }, [canGoBack]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'light-content'} />

      <View style={styles.webviewContainer}>
        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" />
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: STORE_URL }}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onShouldStartLoadWithRequest={(request) => {
            try {
              const url = new URL(request.url);
              if (url.hostname === ALLOWED_HOST) return true;
              return false;
            } catch {
              return false;
            }
          }}
          allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
        />
        
        {/* Floating back button in bottom left corner */}
        <TouchableOpacity 
          style={styles.floatingBackButton} 
          onPress={safeGoBack} 
          activeOpacity={0.8}
        >
          <ArrowLeft size={24} color={theme.colors.accent} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default StoreScreen;

function makeStyles(theme: ReturnType<typeof getTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    webviewContainer: {
      flex: 1,
    },
    loaderOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    floatingBackButton: {
      position: 'absolute',
      bottom: 24,
      left: 20,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.buttonBg,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 999,
    },
  });
}