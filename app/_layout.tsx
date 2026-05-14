// app/_layout.tsx
import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens(true);
import React, { useEffect, useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/hooks/useAuth';
import { CollectionProvider } from '@/contexts/CollectionContext';

type ThemeMode = 'light' | 'dark';

const getTheme = (mode: ThemeMode) =>
  mode === 'dark'
    ? {
        dark: true,
        colors: {
          background: '#0B1320',
          headerBg: '#0E1A2A',
          text: '#D9E4EF',
          accent: '#D4AF37',
        },
      }
    : {
        dark: false,
        colors: {
          background: '#F5F7FA',
          headerBg: '#1E3A5F',
          text: '#1E3A5F',
          accent: '#D4AF37',
        },
      };

export default function RootLayout() {
  useFrameworkReady();
  const { user, isLoading } = useAuth();
  const scheme = (useColorScheme() ?? 'light') as ThemeMode;
  const theme = useMemo(() => getTheme(scheme), [scheme]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
  }, [theme.colors.background]);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/welcome');
  }, [user, isLoading]);

  return (
    <SafeAreaProvider>
      <CollectionProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            // Keep fade on both, but make iOS snappier
            animation: 'fade',
            ...(Platform.OS === 'ios' ? { animationDuration: 140 } : {}),
            ...(Platform.OS === 'android' ? { animationDuration: 20 } : {}),
            fullScreenGestureEnabled: false,
            gestureEnabled: false,
            contentStyle: { backgroundColor: theme.colors.background },
            headerStyle: { backgroundColor: theme.colors.headerBg },
            headerTintColor: theme.colors.accent,
            // no statusBar* props here to avoid the Info.plist crash
          }}
        >
          {/* Auth screens - allow gestures */}
          <Stack.Screen 
            name="welcome" 
            options={{ 
              gestureEnabled: true,
              fullScreenGestureEnabled: true 
            }} 
          />
          <Stack.Screen 
            name="register" 
            options={{ 
              gestureEnabled: true,
              fullScreenGestureEnabled: true 
            }} 
          />
          
          {/* Main app screens - disable swipe back gestures */}
          <Stack.Screen 
            name="index" 
            options={{ 
              gestureEnabled: false,
              fullScreenGestureEnabled: false 
            }} 
          />
          <Stack.Screen 
            name="collection" 
            options={{ 
              gestureEnabled: false,
              fullScreenGestureEnabled: false 
            }} 
          />
          <Stack.Screen 
            name="community" 
            options={{ 
              gestureEnabled: false,
              fullScreenGestureEnabled: false 
            }} 
          />
          <Stack.Screen 
            name="events" 
            options={{ 
              gestureEnabled: false,
              fullScreenGestureEnabled: false 
            }} 
          />
          <Stack.Screen 
            name="settings" 
            options={{ 
              gestureEnabled: false,
              fullScreenGestureEnabled: false 
            }} 
          />
          <Stack.Screen 
            name="scan" 
            options={{ 
              gestureEnabled: false,
              fullScreenGestureEnabled: false 
            }} 
          />
          <Stack.Screen 
            name="curio-arcade" 
            options={{ 
              gestureEnabled: false,
              fullScreenGestureEnabled: false 
            }} 
          />
          <Stack.Screen 
            name="store" 
            options={{ 
              gestureEnabled: false,
              fullScreenGestureEnabled: false 
            }} 
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={theme.dark ? 'light' : 'dark'} animated />
      </CollectionProvider>
    </SafeAreaProvider>
  );
}