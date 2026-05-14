// app/welcome.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  DeviceEventEmitter,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, X, Moon as MoonIcon, Sun as SunIcon } from 'lucide-react-native';
import { useFonts, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import { router } from 'expo-router';
import Logo from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';

type ThemeMode = 'light' | 'dark';
const THEME_STORAGE_KEY = 'APP_THEME_MODE';
const CURIO_THEME_CHANGED = 'CURIO_THEME_CHANGED';

/* ---------------- theming ---------------- */
function getTheme(mode: ThemeMode) {
  if (mode === 'dark') {
    return {
      dark: true,
      colors: {
        // brand
        brandFrom: '#0E1A2A',
        brandTo: '#142B44',
        gold: '#EADBA6',
        // surfaces & text
        pageBg: '#0B1320',
        card: '#101B2C',
        cardBorder: '#223049',
        inputBg: '#0F1B2B',
        inputBorder: '#223049',
        text: '#D9E4EF',
        subtext: '#A9B6C6',
        muted: '#9CA3AF',
        // buttons
        ctaBg: '#D4AF37',
        ctaText: '#0E1A2A',
        outlineBorder: '#D4AF37',
        // modal
        modalBg: '#101B2C',
        modalText: '#D9E4EF',
        modalSubtext: '#A9B6C6',
        // fab
        fabBg: 'rgba(13,24,39,0.92)',
        fabBorder: 'rgba(234,219,166,0.28)',
        // dividers
        divider: '#223049',
        footerText: '#D9E4EF',
      },
    } as const;
  }
  return {
    dark: false,
    colors: {
      brandFrom: '#1E3A5F',
      brandTo: '#2A4A6B',
      gold: '#D4AF37',
      pageBg: '#F5F7FA',
      card: '#FFFFFF',
      cardBorder: '#E5E7EB',
      inputBg: '#F9FAFB',
      inputBorder: '#E5E7EB',
      text: '#1E3A5F',
      subtext: '#6B7280',
      muted: '#9CA3AF',
      ctaBg: '#D4AF37',
      ctaText: '#1E3A5F',
      outlineBorder: '#D4AF37',
      modalBg: '#FFFFFF',
      modalText: '#1E3A5F',
      modalSubtext: '#6B7280',
      fabBg: 'rgba(255,255,255,0.95)',
      fabBorder: 'rgba(30,58,95,0.25)',
      divider: '#E5E7EB',
      footerText: '#9CA3AF',
    },
  } as const;
}

function makeStyles(t: ReturnType<typeof getTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.pageBg },
    gradient: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 },
    header: { alignItems: 'center', marginBottom: 40 },
    welcomeTitle: { fontSize: 20, color: t.colors.gold, fontFamily: 'Montserrat_700Bold', marginTop: 20, marginBottom: 8 },
    welcomeSubtitle: { fontSize: 16, color: t.colors.text, fontFamily: 'Roboto_400Regular', textAlign: 'center', opacity: 0.8 },

    formContainer: {
      backgroundColor: t.colors.card, borderRadius: 20, padding: 24,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
      borderWidth: 1, borderColor: t.colors.cardBorder,
    },

    inputContainer: { marginBottom: 24 },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.inputBg,
      borderRadius: 12, borderWidth: 1, borderColor: t.colors.inputBorder, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 4,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: t.colors.text, fontFamily: 'Roboto_400Regular', paddingVertical: 16 },
    passwordInput: { paddingRight: 40 },
    eyeIcon: { position: 'absolute', right: 16, padding: 4 },

    loginButton: {
      backgroundColor: t.colors.ctaBg, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 20,
      shadowColor: t.colors.ctaBg, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    disabledButton: { opacity: 0.6 },
    loginButtonText: { fontSize: 16, color: t.colors.ctaText, fontFamily: 'Montserrat_600SemiBold' },

    divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: t.colors.divider },
    dividerText: { fontSize: 14, color: t.colors.subtext, fontFamily: 'Roboto_400Regular', marginHorizontal: 16 },

    registerButton: {
      borderWidth: 2, borderColor: t.colors.outlineBorder, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16,
      backgroundColor: 'transparent',
    },
    registerButtonText: { fontSize: 16, color: t.colors.gold, fontFamily: 'Montserrat_600SemiBold' },

    forgotPassword: { alignItems: 'center' },
    forgotPasswordText: { fontSize: 14, color: t.colors.subtext, fontFamily: 'Roboto_400Regular' },

    footer: { marginTop: 30, alignItems: 'center' },
    footerText: { fontSize: 12, color: t.colors.footerText, fontFamily: 'Roboto_400Regular', textAlign: 'center', opacity: 0.7, lineHeight: 18 },

    /* Modal */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: {
      backgroundColor: t.colors.modalBg, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 15,
      borderWidth: 1, borderColor: t.colors.cardBorder,
    },
    closeButton: { position: 'absolute', top: 16, right: 16, padding: 4, zIndex: 1 },
    modalTitle: { fontSize: 24, color: t.colors.modalText, fontFamily: 'Montserrat_700Bold', marginBottom: 12, textAlign: 'center' },
    modalDescription: { fontSize: 14, color: t.colors.modalSubtext, fontFamily: 'Roboto_400Regular', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    modalInputWrapper: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.inputBg,
      borderRadius: 12, borderWidth: 1, borderColor: t.colors.inputBorder, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 4,
    },
    modalButton: {
      backgroundColor: t.colors.ctaBg, borderRadius: 12, paddingVertical: 16, alignItems: 'center',
      shadowColor: t.colors.ctaBg, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    modalButtonText: { fontSize: 16, color: t.colors.ctaText, fontFamily: 'Montserrat_600SemiBold' },
    feedbackText: { fontSize: 14, fontFamily: 'Roboto_400Regular', marginBottom: 16, textAlign: 'center', lineHeight: 20 },
    successText: { color: '#10B981' },
    errorText: { color: '#EF4444' },

    /* Theme FAB */
    themeFab: {
      position: 'absolute',
      right: 16,
      bottom: Platform.OS === 'ios' ? 28 : 16,
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.fabBg,
      borderWidth: 1,
      borderColor: t.colors.fabBorder,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
  });
}

/* ---------------- component ---------------- */
export default function WelcomeScreen() {
  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
  });

  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState('');
  const { login, resetPassword } = useAuth();

  /* hydrate theme on mount */
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') setThemeMode(stored);
    })();
  }, []);

  const toggleTheme = async () => {
    const next: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    DeviceEventEmitter.emit(CURIO_THEME_CHANGED, { mode: next });
  };

  if (!fontsLoaded) return null;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    setIsLoading(true);
    try {
      const success = await login(email.trim(), password);
      if (success) router.replace('/');
      else Alert.alert('Error', 'Invalid email or password');
    } catch {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => router.push('/register');

  const handleForgotPassword = () => {
    setShowResetModal(true);
    setResetEmail('');
    setResetFeedback('');
  };

  const handleResetSubmit = async () => {
    if (!resetEmail.trim()) { setResetFeedback('Please enter your email address'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) { setResetFeedback('Please enter a valid email address'); return; }
    setIsResetting(true); setResetFeedback('');
    try {
      const result = await resetPassword(resetEmail.trim());
      setResetFeedback(result.message);
      if (result.success) {
        setTimeout(() => {
          setShowResetModal(false);
          setResetEmail('');
          setResetFeedback('');
        }, 3000);
      }
    } catch {
      setResetFeedback('An error occurred. Please try again.');
    } finally { setIsResetting(false); }
  };

  const closeResetModal = () => { setShowResetModal(false); setResetEmail(''); setResetFeedback(''); };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={[theme.colors.brandFrom, theme.colors.brandTo]} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Logo size="large" />
            <Text style={styles.welcomeTitle}>By Collectors. For Collectors.</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color={theme.colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={theme.colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={20} color={theme.colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor={theme.colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color={theme.colors.muted} /> : <Eye size={20} color={theme.colors.muted} />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[styles.loginButton, isLoading && styles.disabledButton]} onPress={handleLogin} disabled={isLoading}>
              <Text style={styles.loginButtonText}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
              <Text style={styles.registerButtonText}>Register Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>By continuing, you agree to our Terms of Service and Privacy Policy</Text>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Theme Toggle (bottom-right) */}
      <TouchableOpacity
        accessibilityLabel="Toggle theme"
        accessibilityRole="button"
        onPress={toggleTheme}
        activeOpacity={0.85}
        style={styles.themeFab}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        {theme.dark ? <SunIcon size={22} color={theme.colors.gold} /> : <MoonIcon size={22} color="#1E3A5F" />}
      </TouchableOpacity>

      {/* Reset Password Modal */}
      <Modal visible={showResetModal} transparent animationType="fade" onRequestClose={closeResetModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeResetModal}>
              <X size={24} color={theme.colors.muted} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalDescription}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <View style={styles.modalInputWrapper}>
              <Mail size={20} color={theme.colors.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={theme.colors.muted}
                value={resetEmail}
                onChangeText={(text) => { setResetEmail(text); setResetFeedback(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isResetting}
              />
            </View>

            {resetFeedback ? (
              <Text
                style={[
                  styles.feedbackText,
                  resetFeedback.toLowerCase().includes('sent') ? styles.successText : styles.errorText,
                ]}
              >
                {resetFeedback}
              </Text>
            ) : null}

            <TouchableOpacity style={[styles.modalButton, isResetting && styles.disabledButton]} onPress={handleResetSubmit} disabled={isResetting}>
              <Text style={styles.modalButtonText}>{isResetting ? 'Sending...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
