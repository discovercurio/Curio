// components/CurioArcadeLoader.tsx
import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  visible: boolean;
  itemCount: number;
  currentProgress: number;
  onCancel?: () => void;
  isDark?: boolean;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CurioArcadeLoader({
  visible,
  itemCount,
  currentProgress,
  onCancel,
  isDark = true,
}: Props) {
  const webViewRef = useRef<WebView>(null);
  const progressPct =
    itemCount > 0 ? Math.round((currentProgress / itemCount) * 100) : 0;

  const theme = isDark
    ? {
        bg: '#020617',
        cardBg: '#020617',
        text: '#e5e7eb',
        subtext: '#9ca3af',
        accent: '#eab308',
        border: 'rgba(248,250,252,0.08)',
      }
    : {
        bg: 'rgba(15,23,42,0.12)',
        cardBg: '#ffffff',
        text: '#0f172a',
        subtext: '#6b7280',
        accent: '#d4af37',
        border: 'rgba(15,23,42,0.08)',
      };

  // Force WebView reload when visible changes to ensure proper rendering
  useEffect(() => {
    if (visible && webViewRef.current) {
      // Small delay to ensure layout is ready
      setTimeout(() => {
        webViewRef.current?.reload();
      }, 100);
    }
  }, [visible]);

  if (!visible) return null;

  const webSource =
    Platform.OS === 'web'
      ? { uri: `${process.env.EXPO_BASE_URL || ''}/CurioArcadeLoader.html` }
      : require('../assets/html/CurioArcadeLoader.html');

  // Injected JavaScript to handle iOS-specific fixes
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
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.backdrop, { backgroundColor: theme.bg }]}>
        <View
          style={[
            styles.shell,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Top bar status / text overlay */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>
                Curio Arcade
              </Text>
              <Text style={[styles.subtitle, { color: theme.subtext }]}>
                Analyzing {currentProgress}/{itemCount} items
              </Text>
            </View>

            {onCancel && (
              <TouchableOpacity
                onPress={onCancel}
                style={styles.cancelBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* WebView with the HTML mini-games */}
          <View style={styles.webViewWrapper} collapsable={false}>
            <WebView
              ref={webViewRef}
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
                // Handle messages from WebView if needed
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'ready') {
                    console.log('WebView game loaded successfully');
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

          {/* Progress footer */}
          <View style={styles.footer}>
            <View style={styles.progressRow}>
              <View style={styles.progressLabelRow}>
                <ActivityIndicator size="small" color={theme.accent} />
                <Text
                  style={[
                    styles.footerLabel,
                    { color: theme.subtext, marginLeft: 8 },
                  ]}
                >
                  Scanning & labeling your items…
                </Text>
              </View>
              <Text style={[styles.footerPct, { color: theme.text }]}>
                {progressPct}%
              </Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPct}%`, backgroundColor: theme.accent },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  shell: {
    width: '100%',
    maxWidth: 500,
    height: SCREEN_HEIGHT * 0.85, // Use explicit height instead of maxHeight
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.15)',
  },
  cancelText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '600',
  },
  webViewWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
    // Explicit dimensions to help WebView calculate size
    minHeight: 400,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148,163,184,0.3)',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
  },
  footerPct: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.3)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
});