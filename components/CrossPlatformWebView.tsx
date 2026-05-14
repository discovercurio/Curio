// components/CrossPlatformWebView.tsx
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { WebViewProps } from 'react-native-webview';

// Only import the native WebView when NOT on web.
// Importing react-native-webview on web throws "does not support this platform".
let NativeWebView: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  NativeWebView = require('react-native-webview').WebView;
}

type Props = WebViewProps & {
  // For web, we need a URL string. On native, `source` can be require() or { uri }.
  webSrc?: string;
};

export default function CrossPlatformWebView(props: Props) {
  if (Platform.OS === 'web') {
    // Resolve a URL for the iframe. Prefer explicit webSrc, otherwise read source.uri.
    const uri =
      props.webSrc ??
      (props.source && typeof props.source === 'object' && 'uri' in props.source
        ? (props.source as { uri: string }).uri
        : undefined);

    if (!uri) {
      // Nothing valid to render on web
      return <View style={[styles.fill, props.style as any]} />;
    }

    return (
      <View style={[styles.fill, props.style as any]}>
        {/* @ts-ignore - iframe is a DOM element, fine on RN Web */}
        <iframe
          src={uri}
          style={{
            border: 'none',
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
          }}
          allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
          allowFullScreen
        />
      </View>
    );
  }

  // Native (iOS/Android)
  return <NativeWebView {...props} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1, width: '100%' },
});
