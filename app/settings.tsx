import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Image,
  Modal,
  DeviceEventEmitter,
  StatusBar,
  Platform,
  BackHandler,
  Animated,
} from 'react-native';
import {
  ArrowLeft,
  Bell,
  TrendingUp,
  Mail,
  Lock,
  CircleHelp as HelpCircle,
  Phone,
  Moon,
  LogOut,
  ChevronRight,
  Crown,
  User,
  Pencil,
  Eye,
  EyeOff,
  X,
  Shield,
  Sparkles,
  CheckCircle,
  PartyPopper,
} from 'lucide-react-native';
import { useFonts, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Roboto_400Regular, Roboto_500Medium, Roboto_600SemiBold } from '@expo-google-fonts/roboto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { SafeAreaView } from 'react-native-safe-area-context';

/** ---------------- Keys / Types ---------------- */
export const THEME_STORAGE_KEY = 'APP_THEME_MODE';
export const CURIO_THEME_CHANGED = 'CURIO_THEME_CHANGED';
const MEMBERSHIP_KEY = 'CURIO_MEMBERSHIP_TIER'; // 'collector' | 'curator'
type ThemeMode = 'light' | 'dark';
type MembershipTier = 'collector' | 'curator';

/** ---------------- Privacy Policy Content ---------------- */
const PRIVACY_LAST_UPDATED = 'November 2, 2025';
const POLICY_SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: 'Information We Collect',
    body: 'We collect information you provide directly to us, including your name, email address, and collection data. We also collect information about your device and how you use our app.',
  },
  {
    title: 'How We Use Your Information',
    body: 'We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to personalize your experience.',
  },
  {
    title: 'Information Sharing',
    body: 'We do not sell your personal information. We may share your information with service providers who assist us in operating our app and providing our services.',
  },
  {
    title: 'Data Security',
    body: 'We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.',
  },
  {
    title: 'Your Rights',
    body: 'You have the right to access, update, or delete your personal information. You can do this through your account settings or by contacting us.',
  },
  {
    title: 'Contact Us',
    body: 'If you have any questions about this Privacy Policy, please contact us at privacy@curioapp.com',
  },
];

/** ---------------- Component ---------------- */
export default function SettingsScreen() {
  const { logout, user, updateProfileImage } = useAuth();

  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_600SemiBold,
  });

  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Membership
  const [membership, setMembership] = useState<MembershipTier>('collector');
  const isPremium = membership === 'curator';

  // UI state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(true);
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (user?.phone) setPhone(user.phone);
    loadProfileImage();
    loadTheme();
    loadMembership();
  }, [user]);

  // --- SAFE BACK: close open modals first, then return to Home ---
  const safeGoBack = () => {
    if (showPasswordModal) { setShowPasswordModal(false); return true; }
    if (showEmailModal) { setShowEmailModal(false); return true; }
    if (showPhoneModal) { setShowPhoneModal(false); return true; }
    if (showPrivacyModal) { setShowPrivacyModal(false); return true; }
    if (showUpgradeModal) { setShowUpgradeModal(false); return true; }
    if (showSuccessModal) { setShowSuccessModal(false); return true; }
    router.replace('/');
    return true;
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => safeGoBack());
    return () => sub.remove();
  }, [showPasswordModal, showEmailModal, showPhoneModal, showPrivacyModal, showUpgradeModal, showSuccessModal]);

  /** --------- Theme --------- */
  const loadTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') setThemeMode(stored);
    } catch {}
  };

  const setAndPersistTheme = async (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      DeviceEventEmitter.emit(CURIO_THEME_CHANGED, { mode });
    } catch {}
  };

  /** --------- Membership (persisted) --------- */
  const loadMembership = async () => {
    try {
      const tier = await AsyncStorage.getItem(MEMBERSHIP_KEY);
      if (tier === 'curator' || tier === 'collector') setMembership(tier);
    } catch {}
  };

  const setMembershipPersisted = async (tier: MembershipTier) => {
    setMembership(tier);
    try {
      await AsyncStorage.setItem(MEMBERSHIP_KEY, tier);
      // Optional: broadcast so other screens can react (badges, paywalls, etc.)
      DeviceEventEmitter.emit('CURIO_MEMBERSHIP_CHANGED', { tier });
    } catch {}
  };

  /** --------- Profile image --------- */
  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem(`profileImage_${user?.id}`);
      if (savedImage) setProfileImage(savedImage);
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  const saveProfileImage = async (imageUri: string) => {
    try {
      if (user?.id) {
        await AsyncStorage.setItem(`profileImage_${user.id}`, imageUri);
        updateProfileImage();
      }
    } catch (error) {
      console.error('Error saving profile image:', error);
    }
  };

  if (!fontsLoaded) return null;

  /** --------- Upgrade flow --------- */
  const handleUpgrade = () => {
    // Open themed upsell modal instead of a basic Alert
    setShowUpgradeModal(true);
  };

  // For testing: instantly flip to premium on CTA (no verification/paywall)
  const performLocalUpgrade = async () => {
    await setMembershipPersisted('curator');
    setShowUpgradeModal(false);
    // Show branded success modal instead of boring Alert
    setShowSuccessModal(true);
  };

  // (Optional helper for testing to revert)
  const performLocalDowngrade = async () => {
    await setMembershipPersisted('collector');
    Alert.alert('Back to Collector', 'Premium features have been turned off for testing.');
  };

  const handleChangePassword = () => setShowPasswordModal(true);

  const handleSavePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    if (newPassword === oldPassword) {
      Alert.alert('Error', 'New password must be different from old password');
      return;
    }
    Alert.alert('Success', 'Password changed successfully!', [
      {
        text: 'OK',
        onPress: () => {
          setShowPasswordModal(false);
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      },
    ]);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleOpenEmailModal = () => {
    setTempEmail(email);
    setShowEmailModal(true);
  };
  const handleSaveEmail = () => {
    if (!tempEmail || !tempEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setEmail(tempEmail);
    setShowEmailModal(false);
    Alert.alert('Success', 'Email address updated successfully!');
  };
  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setTempEmail('');
  };

  const handleOpenPhoneModal = () => {
    setTempPhone(phone);
    setShowPhoneModal(true);
  };
  const handleSavePhone = () => {
    setPhone(tempPhone);
    setShowPhoneModal(false);
    Alert.alert('Success', 'Phone number updated successfully!');
  };
  const handleClosePhoneModal = () => {
    setShowPhoneModal(false);
    setTempPhone('');
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          setTimeout(() => router.replace('/welcome'), 100);
        },
      },
    ]);
  };

  const handleProfileImagePress = () => {
    Alert.alert('Update Profile Photo', 'Choose how you want to update your profile photo', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: () => openCamera() },
      { text: 'Choose from Library', onPress: () => openImagePicker() },
    ]);
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) await cropImageToSquare(result.assets[0].uri);
  };

  const openImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permission is required to select photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) await cropImageToSquare(result.assets[0].uri);
  };

  const cropImageToSquare = async (imageUri: string) => {
    try {
      const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const { width, height } = imageInfo as any;
      const size = Math.min(width, height);
      const originX = (width - size) / 2;
      const originY = (height - size) / 2;

      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { crop: { originX, originY, width: size, height: size } },
          { resize: { width: 200, height: 200 } },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      setProfileImage(manipulatedImage.uri);
      await saveProfileImage(manipulatedImage.uri);
    } catch (error) {
      console.error('Error cropping image:', error);
      Alert.alert('Error', 'Failed to process the image. Please try again.');
    }
  };

  const MenuItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    rightElement,
    showChevron = true,
    disabled = false,
  }: any) => (
    <TouchableOpacity
      style={[styles.menuItem, disabled && styles.disabledMenuItem]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={0.8}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuItemIcon, disabled && styles.disabledIcon]}>
          <Icon size={20} color={disabled ? theme.colors.muted : theme.colors.primary} />
        </View>
        <View style={styles.menuItemText}>
          <Text style={[styles.menuItemTitle, disabled && styles.disabledText]}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {rightElement}
        {showChevron && !disabled && <ChevronRight size={16} color={theme.colors.muted} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Status bar that adapts with theme */}
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={safeGoBack}>
            <ArrowLeft size={24} color={theme.colors.accent} />
          </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarWrap}>
              <TouchableOpacity style={styles.avatar} onPress={handleProfileImagePress} activeOpacity={0.85}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                ) : (
                  <User size={32} color={theme.colors.accent} />
                )}
              </TouchableOpacity>
              <View style={styles.profileBadge} pointerEvents="none">
                <Pencil size={14} color={theme.dark ? '#0E1A2A' : '#1E3A5F'} />
              </View>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'Collector'}</Text>
              <View style={[styles.membershipBadge, isPremium && styles.membershipBadgePremium]}>
                {isPremium ? (
                  <>
                    <Crown size={14} color={theme.dark ? '#0B1320' : '#1E3A5F'} />
                    <Text style={styles.premiumText}>Curator • Gilded</Text>
                  </>
                ) : (
                  <Text style={styles.freeText}>Collector (Free)</Text>
                )}
              </View>
            </View>
          </View>

          {!isPremium ? (
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade} activeOpacity={0.9}>
              <Crown size={20} color={theme.dark ? '#0E1A2A' : '#1E3A5F'} />
              <Text style={styles.upgradeButtonText}>Upgrade to Curator</Text>
            </TouchableOpacity>
          ) : (
            // Dev-only: quick toggle to test downgrade (optional – comment out if undesired)
            <TouchableOpacity style={styles.devDowngradeButton} onPress={performLocalDowngrade} activeOpacity={0.9}>
              <Text style={styles.devDowngradeText}>[Testing] Revert to Collector</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* APPEARANCE */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon={Moon}
              title="Dark Mode"
              rightElement={
                <Switch
                  value={themeMode === 'dark'}
                  onValueChange={(v: boolean) => setAndPersistTheme(v ? 'dark' : 'light')}
                  trackColor={{ false: theme.colors.trackOff, true: theme.colors.accent }}
                  thumbColor={themeMode === 'dark' ? theme.colors.primary : theme.colors.muted}
                />
              }
              showChevron={false}
              onPress={() => setAndPersistTheme(themeMode === 'dark' ? 'light' : 'dark')}
            />
          </View>
        </View>

        {/* NOTIFICATIONS */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon={Bell}
              title="Push Notifications"
              subtitle="Get notified about updates"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: theme.colors.trackOff, true: theme.colors.accent }}
                  thumbColor={notificationsEnabled ? theme.colors.primary : theme.colors.muted}
                />
              }
              showChevron={false}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            />
            <MenuItem
              icon={TrendingUp}
              title="Price Alerts"
              subtitle="Notify when values change"
              rightElement={
                <Switch
                  value={priceAlertsEnabled}
                  onValueChange={setPriceAlertsEnabled}
                  trackColor={{ false: theme.colors.trackOff, true: theme.colors.accent }}
                  thumbColor={priceAlertsEnabled ? theme.colors.primary : theme.colors.muted}
                />
              }
              showChevron={false}
              onPress={() => setPriceAlertsEnabled(!priceAlertsEnabled)}
            />
          </View>
        </View>

        {/* ACCOUNT */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuGroup}>
            <View style={styles.emailField}>
              <View style={styles.emailHeader}>
                <Mail size={20} color={theme.colors.primary} />
                <Text style={styles.emailLabel}>Email Address</Text>
                <TouchableOpacity onPress={handleOpenEmailModal}>
                  <Text style={styles.changeLink}>Update</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.emailDisplay}>
                <Text style={styles.emailDisplayText}>{email || 'Not set'}</Text>
              </View>
            </View>

            <View style={styles.emailField}>
              <View style={styles.emailHeader}>
                <Phone size={20} color={theme.colors.primary} />
                <Text style={styles.emailLabel}>Phone Number</Text>
                <TouchableOpacity onPress={handleOpenPhoneModal}>
                  <Text style={styles.changeLink}>Update</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.emailDisplay}>
                <Text style={styles.emailDisplayText}>{phone || 'Not set'}</Text>
              </View>
            </View>

            <MenuItem
              icon={Lock}
              title="Change Password"
              subtitle="Update your account password"
              onPress={handleChangePassword}
            />
          </View>
        </View>

        {/* SUPPORT */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon={HelpCircle}
              title="Help & Support"
              subtitle="Get help or contact us"
              onPress={() => console.log('Help')}
            />
            <MenuItem
              icon={Moon}
              title="Privacy Policy"
              subtitle="How we protect your data"
              onPress={() => setShowPrivacyModal(true)}
            />
          </View>
        </View>

        {/* LOGOUT */}
        <View style={styles.menuSection}>
          <View style={styles.menuGroup}>
            <MenuItem
              icon={LogOut}
              title="Logout"
              subtitle="Sign out of your account"
              onPress={handleLogout}
              showChevron={false}
            />
          </View>
        </View>

        {/* 🎮 EASTER EGG FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Curio v1.0.0</Text>
          <TouchableOpacity 
            onPress={() => router.push('/curio-arcade')}
            activeOpacity={0.7}
            style={styles.easterEggButton}
          >
            <Text style={styles.footerText}>Made with ❤️ for collectors</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ========== SUCCESS MODAL (Branded) ========== */}
      <Modal 
        visible={showSuccessModal} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            {/* Animated Icon - User's Avatar with Crown Badge */}
            <View style={styles.successIconContainer}>
              <View style={styles.successIconBubble}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.successAvatarImage} />
                ) : (
                  <User size={48} color={theme.dark ? '#0E1A2A' : '#1E3A5F'} />
                )}
              </View>
              <View style={styles.successCheckmark}>
                <Crown size={28} color={theme.colors.accent} />
              </View>
            </View>

            {/* Title & Message */}
            <Text style={styles.successTitle}>Welcome to Curator! 🎉</Text>
            <Text style={styles.successMessage}>
              Premium features have been unlocked for your account. Enjoy unlimited AI identification, community submissions, and your exclusive gold badge.
            </Text>

            {/* Feature Pills */}
            <View style={styles.successFeatures}>
              <View style={styles.successPill}>
                <Sparkles size={14} color={theme.colors.accent} />
                <Text style={styles.successPillText}>Unlimited AI Power</Text>
              </View>
              <View style={styles.successPill}>
                <TrendingUp size={14} color={theme.colors.accent} />
                <Text style={styles.successPillText}>Multi-item Uploads</Text>
              </View>
              <View style={styles.successPill}>
                <Crown size={14} color={theme.colors.accent} />
                <Text style={styles.successPillText}>Gold Badge</Text>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity 
              style={styles.successButton} 
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.9}
            >
              <Text style={styles.successButtonText}>Start Exploring</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upgrade (Curator) Modal */}
      <Modal visible={showUpgradeModal} transparent animationType="fade" onRequestClose={() => setShowUpgradeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.upgradeModal}>
            <View style={styles.upgradeHeader}>
              <View style={styles.upgradeIconBubble}>
                <Crown size={24} color={theme.dark ? '#0E1A2A' : '#1E3A5F'} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={styles.upgradeTitle}>Curator Premium</Text>
                <Text style={styles.upgradeSubtitle}>Level up your collecting.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowUpgradeModal(false)} style={styles.modalCloseButton}>
                <X size={22} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.upgradeBody}>
              <View style={styles.featureRow}>
                <Sparkles size={18} color={theme.colors.accent} />
                <Text style={styles.featureText}>Unlimited AI Identification</Text>
              </View>
              <View style={styles.featureRow}>
                <TrendingUp size={18} color={theme.colors.accent} />
                <Text style={styles.featureText}>Daily price updates & market signals</Text>
              </View>
              <View style={styles.featureRow}>
                <Shield size={18} color={theme.colors.accent} />
                <Text style={styles.featureText}>Premium analytics, watchlists & alerts</Text>
              </View>
              <View style={styles.featureRow}>
                <Crown size={18} color={theme.colors.accent} />
                <Text style={styles.featureText}>Gold badge on your profile</Text>
              </View>
            </View>

            <View style={styles.upgradeActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowUpgradeModal(false)}>
                <Text style={styles.cancelButtonText}>Not now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryCTA} onPress={performLocalUpgrade}>
                <Text style={styles.primaryCTAText}>Become a Curator</Text>
              </TouchableOpacity>
            </View>

            {/* Dev hint row (safe to remove) */}
            <View style={styles.devHintRow}>
              <Text style={styles.devHintText}>Testing only: instantly upgrades without payment.</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Modal */}
      <Modal visible={showEmailModal} transparent animationType="fade" onRequestClose={handleCloseEmailModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Mail size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Change Email Address</Text>
                <Text style={styles.modalSubtitle}>Update your account email</Text>
              </View>
              <TouchableOpacity onPress={handleCloseEmailModal} style={styles.modalCloseButton}>
                <X size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.passwordField}>
                <Text style={styles.passwordLabel}>Email Address</Text>
                <TextInput
                  style={styles.singleInput}
                  value={tempEmail}
                  onChangeText={setTempEmail}
                  placeholder="Enter new email address"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCloseEmailModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.savePasswordButton} onPress={handleSaveEmail}>
                  <Text style={styles.savePasswordButtonText}>Save Email</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Phone Modal */}
      <Modal visible={showPhoneModal} transparent animationType="fade" onRequestClose={handleClosePhoneModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Phone size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Change Phone Number</Text>
                <Text style={styles.modalSubtitle}>Update your phone number</Text>
              </View>
              <TouchableOpacity onPress={handleClosePhoneModal} style={styles.modalCloseButton}>
                <X size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.passwordField}>
                <Text style={styles.passwordLabel}>Phone Number</Text>
                <TextInput
                  style={styles.singleInput}
                  value={tempPhone}
                  onChangeText={setTempPhone}
                  placeholder="Enter new phone number"
                  placeholderTextColor={theme.colors.placeholder}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClosePhoneModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.savePasswordButton} onPress={handleSavePhone}>
                  <Text style={styles.savePasswordButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade" onRequestClose={handleClosePasswordModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Lock size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <Text style={styles.modalSubtitle}>Update your account password</Text>
              </View>
              <TouchableOpacity onPress={handleClosePasswordModal} style={styles.modalCloseButton}>
                <X size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.passwordField}>
                <Text style={styles.passwordLabel}>Old Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    placeholder="Enter old password"
                    placeholderTextColor={theme.colors.placeholder}
                    secureTextEntry={!showOldPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowOldPassword(!showOldPassword)}>
                    {showOldPassword ? <EyeOff size={20} color={theme.colors.muted} /> : <Eye size={20} color={theme.colors.muted} />}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.passwordField}>
                <Text style={styles.passwordLabel}>New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor={theme.colors.placeholder}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff size={20} color={theme.colors.muted} /> : <Eye size={20} color={theme.colors.muted} />}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.passwordField}>
                <Text style={styles.passwordLabel}>Confirm New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter new password"
                    placeholderTextColor={theme.colors.placeholder}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff size={20} color={theme.colors.muted} /> : <Eye size={20} color={theme.colors.muted} />}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <Text style={styles.requirementText}>• At least 6 characters long</Text>
                <Text style={styles.requirementText}>• Different from old password</Text>
                <Text style={styles.requirementText}>• Both new passwords must match</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClosePasswordModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.savePasswordButton} onPress={handleSavePassword}>
                  <Text style={styles.savePasswordButtonText}>Save Password</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={showPrivacyModal} transparent animationType="fade" onRequestClose={() => setShowPrivacyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.privacyModalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Lock size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Privacy Policy</Text>
                <Text style={styles.modalSubtitle}>Last updated: {PRIVACY_LAST_UPDATED}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)} style={styles.modalCloseButton}>
                <X size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.privacyModalBody} showsVerticalScrollIndicator={false}>
              {POLICY_SECTIONS.map(({ title, body }, idx) => (
                <View key={idx} style={styles.privacySection}>
                  <Text style={styles.privacySectionTitle}>{title}</Text>
                  <Text style={styles.privacyText}>
                    {body.split('\n').map((line, i) => (
                      <Text key={i}>
                        {line}
                        {'\n'}
                      </Text>
                    ))}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.privacyModalFooter}>
              <TouchableOpacity style={styles.privacyCloseButton} onPress={() => setShowPrivacyModal(false)}>
                <Text style={styles.privacyCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------------- theming ---------------- */

function getTheme(mode: 'light' | 'dark') {
  if (mode === 'dark') {
    return {
      dark: true,
      colors: {
        background: '#0B1320',
        headerBg: '#0E1A2A',
        card: '#101B2C',
        surface: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.08)',
        primary: '#EADBA6',
        accent: '#D4AF37',
        text: '#D9E4EF',
        subtext: '#A9B6C6',
        muted: '#9CA3AF',
        placeholder: '#9CA3AF',
        trackOff: '#3A4554',
      },
    };
  }
  return {
    dark: false,
    colors: {
      background: '#F5F7FA',
      headerBg: '#1E3A5F',
      card: '#FFFFFF',
      surface: '#F3F4F6',
      border: '#E5E7EB',
      primary: '#1E3A5F',
      accent: '#D4AF37',
      text: '#1E3A5F',
      subtext: '#6B7280',
      muted: '#9CA3AF',
      placeholder: '#9CA3AF',
      trackOff: '#E5E7EB',
    },
  };
}

function makeStyles(theme: ReturnType<typeof getTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },

    header: {
      backgroundColor: theme.colors.headerBg,
      paddingTop: Platform.OS === 'ios' ? 60 : 45,
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: theme.dark ? 'rgba(234,219,166,0.15)' : 'rgba(212, 175, 55, 0.2)',
      justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 20, color: theme.colors.accent, fontFamily: 'Montserrat_700Bold' },
    placeholder: { width: 40 },

    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    scrollContent: { paddingBottom: Platform.OS === 'android' ? 80 : 20 },

    profileSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.dark ? 0.35 : 0.1,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    profileInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },

    avatarWrap: { width: 60, height: 60, position: 'relative', marginRight: 16 },
    avatar: {
      width: 60, height: 60, borderRadius: 30,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%', borderRadius: 30 },
    profileBadge: {
      position: 'absolute', top: -4, left: -4, zIndex: 20, elevation: 20,
      backgroundColor: theme.colors.accent, borderRadius: 10, padding: 2,
      borderWidth: 1, borderColor: theme.dark ? '#0B1320' : '#FFFFFF',
    },

    userInfo: { flex: 1 },
    userName: { fontSize: 18, color: theme.colors.text, fontFamily: 'Montserrat_600SemiBold', marginBottom: 8 },
    membershipBadge: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.dark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.2)',
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start',
    },
    membershipBadgePremium: {
      backgroundColor: theme.colors.accent,
    },
    premiumText: {
      fontSize: 12,
      color: theme.dark ? '#0B1320' : '#1E3A5F',
      fontFamily: 'Roboto_600SemiBold',
      marginLeft: 6
    },
    freeText: { fontSize: 12, color: theme.colors.subtext, fontFamily: 'Roboto_500Medium' },

    upgradeButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.colors.accent, borderRadius: 12, padding: 12,
    },
    upgradeButtonText: {
      color: theme.dark ? '#0E1A2A' : '#1E3A5F', fontFamily: 'Roboto_500Medium', fontSize: 16, marginLeft: 8,
    },
    devDowngradeButton: {
      marginTop: 8,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border
    },
    devDowngradeText: {
      fontSize: 12,
      color: theme.colors.muted,
      fontFamily: 'Roboto_500Medium'
    },

    menuSection: { marginBottom: 20 },
    sectionTitle: {
      fontSize: 16, color: theme.colors.text, fontFamily: 'Montserrat_600SemiBold', marginBottom: 12, paddingHorizontal: 4,
    },
    menuGroup: {
      backgroundColor: theme.colors.card, borderRadius: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.dark ? 0.25 : 0.05, shadowRadius: 8, elevation: 3,
      borderWidth: theme.dark ? 1 : 0, borderColor: theme.colors.border,
    },
    menuItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: 16, borderBottomWidth: 1, borderBottomColor: theme.dark ? theme.colors.border : '#F3F4F6',
    },
    disabledMenuItem: { opacity: 0.6 },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    menuItemIcon: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface,
      justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    disabledIcon: { opacity: 0.8 },
    menuItemText: { flex: 1 },
    menuItemTitle: { fontSize: 16, color: theme.colors.text, fontFamily: 'Roboto_500Medium', marginBottom: 2 },
    disabledText: { color: theme.colors.muted },
    menuItemSubtitle: { fontSize: 12, color: theme.colors.subtext, fontFamily: 'Roboto_400Regular' },
    menuItemRight: { flexDirection: 'row', alignItems: 'center' },

    emailField: { padding: 16, borderBottomWidth: 1, borderBottomColor: theme.dark ? theme.colors.border : '#F3F4F6' },
    emailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    emailLabel: { fontSize: 16, color: theme.colors.text, fontFamily: 'Roboto_500Medium', marginLeft: 12, flex: 1 },
    changeLink: { fontSize: 14, color: theme.colors.accent, fontFamily: 'Roboto_500Medium' },
    emailDisplay: {
      backgroundColor: theme.colors.surface, borderRadius: 8, padding: 12,
      borderWidth: 1, borderColor: theme.colors.border,
    },
    emailDisplayText: { fontSize: 16, color: theme.colors.text, fontFamily: 'Roboto_400Regular' },

    footer: { alignItems: 'center', paddingVertical: 30 },
    footerText: { fontSize: 12, color: theme.colors.subtext, fontFamily: 'Roboto_400Regular', marginBottom: 4 },
    easterEggButton: { 
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },

    // Generic Modal Shell
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20,
    },
    modalContent: {
      width: '100%', maxWidth: 420, backgroundColor: theme.colors.card, borderRadius: 20, overflow: 'hidden',
      borderWidth: theme.dark ? 1 : 0, borderColor: theme.colors.border,
    },
    modalHeader: {
      flexDirection: 'row', alignItems: 'center', padding: 20,
      backgroundColor: theme.dark ? '#0F1729' : '#F9FAFB',
      borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    },
    modalIconContainer: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: theme.dark ? 'rgba(212,175,55,0.15)' : '#FEF3C7',
      justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    modalTitleContainer: { flex: 1 },
    modalTitle: { fontSize: 18, color: theme.colors.text, fontFamily: 'Montserrat_700Bold', marginBottom: 2 },
    modalSubtitle: { fontSize: 12, color: theme.colors.subtext, fontFamily: 'Roboto_400Regular' },
    modalCloseButton: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center',
    },
    modalBody: { padding: 20 },
    passwordField: { marginBottom: 20 },
    passwordLabel: { fontSize: 14, color: theme.colors.text, fontFamily: 'Roboto_500Medium', marginBottom: 8 },
    passwordInputContainer: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.colors.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border,
    },
    passwordInput: {
      flex: 1, padding: 12, fontSize: 16, color: theme.colors.text, fontFamily: 'Roboto_400Regular',
    },
    eyeButton: { padding: 12 },
    singleInput: {
      backgroundColor: theme.colors.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border,
      padding: 12, fontSize: 16, color: theme.colors.text, fontFamily: 'Roboto_400Regular',
    },
    passwordRequirements: {
      backgroundColor: theme.dark ? 'rgba(59,130,246,0.15)' : '#F0F9FF',
      borderRadius: 8, padding: 12, marginBottom: 20,
    },
    requirementsTitle: { fontSize: 12, color: theme.colors.text, fontFamily: 'Roboto_500Medium', marginBottom: 8 },
    requirementText: { fontSize: 12, color: theme.colors.subtext, fontFamily: 'Roboto_400Regular', marginBottom: 4 },
    modalActions: { flexDirection: 'row', gap: 12 },
    cancelButton: {
      flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: theme.colors.surface, alignItems: 'center',
      borderWidth: 1, borderColor: theme.colors.border
    },
    cancelButtonText: { fontSize: 16, color: theme.colors.muted, fontFamily: 'Roboto_500Medium' },
    savePasswordButton: {
      flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: theme.colors.accent, alignItems: 'center',
    },
    savePasswordButtonText: {
      fontSize: 16, color: theme.dark ? '#0E1A2A' : '#1E3A5F', fontFamily: 'Roboto_600SemiBold',
    },

    // ========== SUCCESS MODAL STYLES ==========
    successModal: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: theme.colors.card,
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    successIconContainer: {
      position: 'relative',
      marginBottom: 24,
    },
    successIconBubble: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
      overflow: 'hidden',
    },
    successAvatarImage: {
      width: 96,
      height: 96,
      borderRadius: 48,
    },
    successCheckmark: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      backgroundColor: theme.dark ? '#0E1A2A' : '#1E3A5F',
      borderRadius: 20,
      padding: 4,
      borderWidth: 3,
      borderColor: theme.colors.accent,
    },
    successTitle: {
      fontSize: 24,
      color: theme.colors.text,
      fontFamily: 'Montserrat_700Bold',
      marginBottom: 12,
      textAlign: 'center',
    },
    successMessage: {
      fontSize: 15,
      color: theme.colors.subtext,
      fontFamily: 'Roboto_400Regular',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    successFeatures: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 28,
    },
    successPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.dark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.1)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(212,175,55,0.3)' : 'rgba(212,175,55,0.2)',
    },
    successPillText: {
      fontSize: 13,
      color: theme.colors.text,
      fontFamily: 'Roboto_500Medium',
    },
    successButton: {
      width: '100%',
      paddingVertical: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
      shadowColor: theme.colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    successButtonText: {
      fontSize: 17,
      color: theme.dark ? '#0E1A2A' : '#1E3A5F',
      fontFamily: 'Roboto_600SemiBold',
    },

    // Upgrade modal (themed)
    upgradeModal: {
      width: '100%', maxWidth: 480, backgroundColor: theme.colors.card, borderRadius: 20, overflow: 'hidden',
      borderWidth: theme.dark ? 1 : 0, borderColor: theme.colors.border
    },
    upgradeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.dark ? '#0F1729' : '#F9FAFB',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border
    },
    upgradeIconBubble: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: theme.dark ? 'rgba(212,175,55,0.15)' : '#FEF3C7',
      justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    upgradeTitle: { fontSize: 20, color: theme.colors.text, fontFamily: 'Montserrat_700Bold' },
    upgradeSubtitle: { fontSize: 12, color: theme.colors.subtext, fontFamily: 'Roboto_400Regular' },
    upgradeBody: { padding: 20, gap: 14 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    featureText: { color: theme.colors.text, fontSize: 14, fontFamily: 'Roboto_400Regular', flex: 1 },
    upgradeActions: { flexDirection: 'row', gap: 12, padding: 20, paddingTop: 8 },
    primaryCTA: {
      flex: 1, paddingVertical: 14, borderRadius: 8, backgroundColor: theme.colors.accent, alignItems: 'center',
    },
    primaryCTAText: {
      fontSize: 16, color: theme.dark ? '#0E1A2A' : '#1E3A5F', fontFamily: 'Roboto_600SemiBold',
    },
    devHintRow: { paddingHorizontal: 20, paddingBottom: 16 },
    devHintText: { fontSize: 12, color: theme.colors.muted, fontFamily: 'Roboto_400Regular', textAlign: 'center' },

    // Privacy Modal
    privacyModalContent: {
      width: '100%', maxWidth: 500, backgroundColor: theme.colors.card, borderRadius: 20, overflow: 'hidden',
      maxHeight: '85%', borderWidth: theme.dark ? 1 : 0, borderColor: theme.colors.border,
    },
    privacyModalBody: { padding: 20, maxHeight: 500 },
    privacySection: { marginBottom: 24 },
    privacySectionTitle: {
      fontSize: 16, color: theme.colors.text, fontFamily: 'Montserrat_600SemiBold', marginBottom: 8,
    },
    privacyText: {
      fontSize: 14, color: theme.colors.subtext, fontFamily: 'Roboto_400Regular', lineHeight: 20,
    },
    privacyModalFooter: {
      padding: 20, borderTopWidth: 1, borderTopColor: theme.colors.border,
      backgroundColor: theme.dark ? '#0F1729' : '#F9FAFB',
    },
    privacyCloseButton: {
      paddingVertical: 14, borderRadius: 8, backgroundColor: theme.colors.accent, alignItems: 'center',
    },
    privacyCloseButtonText: {
      fontSize: 16, color: theme.dark ? '#0E1A2A' : '#1E3A5F', fontFamily: 'Roboto_600SemiBold',
    },
  });
}