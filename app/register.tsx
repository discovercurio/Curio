// app/register.tsx
import React, { useEffect, useMemo, useState } from 'react';
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
  DeviceEventEmitter,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Phone } from 'lucide-react-native';
import { useFonts, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import { router } from 'expo-router';
import Logo from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';

type ThemeMode = 'light' | 'dark';
const THEME_STORAGE_KEY = 'APP_THEME_MODE';
const CURIO_THEME_CHANGED = 'CURIO_THEME_CHANGED';

/* ---------------- Theming ---------------- */
function getTheme(mode: ThemeMode) {
  if (mode === 'dark') {
    return {
      dark: true,
      colors: {
        brandFrom: '#0E1A2A',
        brandTo: '#142B44',
        gold: '#EADBA6',
        pageBg: '#0B1320',
        card: '#101B2C',
        cardBorder: '#223049',
        inputBg: '#0F1B2B',
        inputBorder: '#223049',
        text: '#D9E4EF',
        subtext: '#A9B6C6',
        muted: '#9CA3AF',
        ctaBg: '#D4AF37',
        ctaText: '#0E1A2A',
        divider: '#223049',
        footerText: '#D9E4EF',
        backBg: 'rgba(234,219,166,0.16)',
        backIcon: '#EADBA6',
        placeholder: '#9CA3AF',
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
      divider: '#E5E7EB',
      footerText: '#F5F7FA',
      backBg: 'rgba(212,175,55,0.18)',
      backIcon: '#D4AF37',
      placeholder: '#9CA3AF',
    },
  } as const;
}

function makeStyles(t: ReturnType<typeof getTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.pageBg },
    gradient: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 },
    header: {
      paddingTop: Platform.OS === 'ios' ? 52 : 46,
      alignItems: 'center',
      marginBottom: 40,
      position: 'relative',
    },
    backButton: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.colors.backBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    welcomeTitle: { fontSize: 28, color: t.colors.gold, fontFamily: 'Montserrat_700Bold', marginTop: 20, marginBottom: 8 },
    welcomeSubtitle: { fontSize: 16, color: t.colors.footerText, fontFamily: 'Roboto_400Regular', textAlign: 'center', opacity: 0.8 },

    formContainer: {
      backgroundColor: t.colors.card,
      borderRadius: 20,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
      borderWidth: 1,
      borderColor: t.colors.cardBorder,
    },

    inputContainer: { marginBottom: 24 },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.colors.inputBorder,
      marginBottom: 16,
      paddingHorizontal: 16,
      paddingVertical: 4,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: t.colors.text, fontFamily: 'Roboto_400Regular', paddingVertical: 16 },
    passwordInput: { paddingRight: 40 },
    eyeIcon: { position: 'absolute', right: 16, padding: 4 },

    registerButton: {
      backgroundColor: t.colors.ctaBg,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: t.colors.ctaBg,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    disabledButton: { opacity: 0.6 },
    registerButtonText: { fontSize: 16, color: t.colors.ctaText, fontFamily: 'Montserrat_600SemiBold' },

    loginLink: { alignItems: 'center' },
    loginLinkText: { fontSize: 14, color: t.colors.subtext, fontFamily: 'Roboto_400Regular' },
    loginLinkHighlight: { color: t.colors.gold, fontFamily: 'Roboto_500Medium' },

    footer: { marginTop: 30, alignItems: 'center' },
    footerText: {
      fontSize: 12,
      color: t.colors.footerText,
      fontFamily: 'Roboto_400Regular',
      textAlign: 'center',
      opacity: 0.7,
      lineHeight: 18,
    },
  });
}

/* ---------------- Component ---------------- */
export default function RegisterScreen() {
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();

  // hydrate & listen for global theme changes
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') setThemeMode(stored);
    })();
    const sub = DeviceEventEmitter.addListener(CURIO_THEME_CHANGED, (e: any) => {
      const m = e?.mode;
      if (m === 'dark' || m === 'light') setThemeMode(m);
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (!cleaned) return '';
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };
  const handlePhoneChange = (t: string) => setPhone(formatPhoneNumber(t));

  const validateForm = () => {
    if (!firstName.trim()) return Alert.alert('Error', 'Please enter your first name'), false;
    if (!lastName.trim()) return Alert.alert('Error', 'Please enter your last name'), false;
    if (!email.trim()) return Alert.alert('Error', 'Please enter your email'), false;
    if (!email.includes('@')) return Alert.alert('Error', 'Please enter a valid email address'), false;
    if (phone.trim()) {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length !== 10) return Alert.alert('Error', 'Please enter a valid 10-digit phone number'), false;
    }
    if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters long'), false;
    if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match'), false;
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const success = await register(email.trim(), password, firstName.trim(), lastName.trim(), phone.trim());
      if (success) router.replace('/');
      else Alert.alert('Error', 'Registration failed. Please try again.');
    } catch {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    try {
      // @ts-ignore - router.canGoBack exists at runtime
      if (typeof router.canGoBack === 'function' && router.canGoBack()) router.back();
      else router.replace('/welcome');
    } catch {
      router.replace('/welcome');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={[theme.colors.brandFrom, theme.colors.brandTo]} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={24} color={theme.colors.backIcon} />
            </TouchableOpacity>
            <Logo size="large" />
            <Text style={styles.welcomeTitle}>Create Account</Text>
            <Text style={styles.welcomeSubtitle}>Join the community of collectors</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <User size={20} color={theme.colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor={theme.colors.placeholder}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputWrapper}>
                <User size={20} color={theme.colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor={theme.colors.placeholder}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Phone size={20} color={theme.colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone number (optional)"
                  placeholderTextColor={theme.colors.placeholder}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  maxLength={14}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Mail size={20} color={theme.colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={theme.colors.placeholder}
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
                  placeholderTextColor={theme.colors.placeholder}
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

              <View style={styles.inputWrapper}>
                <Lock size={20} color={theme.colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirm password"
                  placeholderTextColor={theme.colors.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={20} color={theme.colors.muted} /> : <Eye size={20} color={theme.colors.muted} />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>{isLoading ? 'Creating Account...' : 'Create Account'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={handleBack}>
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
