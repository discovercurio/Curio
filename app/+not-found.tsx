import React from 'react';
import { Stack, Link, router } from 'expo-router';
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Appearance,
} from 'react-native';

const ACCENT = '#D4AF37';
const DARK = { bg: '#0B1320', ink: '#D9E4EF', sub: '#A9B6C6', card: '#101B2C', border: 'rgba(255,255,255,0.12)' };
const LIGHT = { bg: '#F5F7FA', ink: '#1E3A5F', sub: '#6B7280', card: '#FFFFFF', border: '#E5E7EB' };

export default function NotFoundScreen() {
  // Avoid useColorScheme entirely to rule it out
  const sys = (typeof Appearance !== 'undefined' && Appearance.getColorScheme?.()) || 'light';
  const t = sys === 'dark' ? DARK : LIGHT;

  const onGoBack = () => {
    // @ts-ignore
    if (typeof router.canGoBack === 'function' && router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: false }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <StatusBar
          barStyle={sys === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={t.bg}
        />
        <View style={[styles.wrap, { backgroundColor: t.bg }]}>
          <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[styles.code, { color: ACCENT }]}>404</Text>
            <Text style={[styles.title, { color: t.ink }]}>This screen doesn’t exist</Text>
            <Text style={[styles.sub, { color: t.sub }]}>
              The link may be broken or the page has moved.
            </Text>

            {/* Actions (no gap; use margins to separate) */}
            <View style={styles.row}>
              <Pressable
                onPress={() => router.replace('/')}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnFill,
                  pressed ? styles.btnPressed : null,
                ]}
              >
                <Text style={styles.btnFillText}>Go Home</Text>
              </Pressable>

              <Pressable
                onPress={onGoBack}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnOutline,
                  pressed ? styles.btnPressed : null,
                ]}
              >
                <Text style={[styles.btnOutlineText, { color: ACCENT }]}>Go Back</Text>
              </Pressable>
            </View>

            {/* Secondary links */}
            <View style={styles.row2}>
              <Link href="/" style={[styles.textLink, { color: ACCENT }]}>
                Back to safety
              </Link>
              <Text style={[styles.sep, { color: t.sub }]}>·</Text>
              <Pressable onPress={() => router.replace('/')}>
                <Text style={[styles.textLink, { color: ACCENT }]}>Reload</Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.watermark, { color: t.sub }]}>
            Curio • Not Found
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 26,
    paddingHorizontal: 22,
  },
  code: {
    fontSize: 64,
    fontWeight: '800', // string, not number
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    marginTop: 18,
    justifyContent: 'center',
  },
  btn: {
    minWidth: 140,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPressed: { opacity: 0.9 },
  btnFill: { backgroundColor: ACCENT, marginRight: 12 },
  btnOutline: { borderWidth: 1.5, borderColor: ACCENT },
  btnFillText: { color: '#0E1A2A', fontWeight: '700', fontSize: 15 },
  btnOutlineText: { fontWeight: '700', fontSize: 15 },
  row2: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
    alignItems: 'center',
  },
  textLink: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'none',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  sep: { marginHorizontal: 8 },
  watermark: {
    position: 'absolute',
    bottom: 22 + (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0),
    fontSize: 12,
  },
});
