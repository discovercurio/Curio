// components/BurgerMenu.tsx
import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Platform,
  Dimensions,
  Image,
  DeviceEventEmitter,
} from 'react-native';
import {
  X,
  House,
  Settings,
  Crown,
  User,
  Calendar,
  Store,
  Users,
} from 'lucide-react-native';
import { useFonts, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, usePathname } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import CollectionIcon from '@/components/CollectionIcon';

// ---- keys & events ----
const THEME_STORAGE_KEY = 'APP_THEME_MODE';
const CURIO_THEME_CHANGED = 'CURIO_THEME_CHANGED';
const KEY_IS_PREMIUM = 'CURIO_IS_PREMIUM';
const KEY_SUBSCRIPTION_TIER = 'CURIO_SUBSCRIPTION_TIER';
const CURIO_PREMIUM_CHANGED = 'CURIO_PREMIUM_CHANGED';

type ThemeMode = 'light' | 'dark';

interface BurgerMenuProps {
  visible: boolean;
  onClose: () => void;
  isPremium?: boolean;
}

/* ---------------- theming ---------------- */

function getTheme(mode: ThemeMode, premium: boolean) {
  const accent = premium ? '#F5D26C' : '#D4AF37';
  if (mode === 'dark') {
    return {
      dark: true,
      premium,
      colors: {
        overlay: 'rgba(0,0,0,0.5)',
        drawerBg: '#0F1725',
        headerBg: premium ? '#0C1626' : '#0E1A2A',
        card: '#101B2C',
        border: 'rgba(255,255,255,0.08)',
        chip: 'rgba(255,255,255,0.06)',
        text: '#D9E4EF',
        subtext: '#A9B6C6',
        muted: '#9CA3AF',
        primary: '#EADBA6',
        accent,
        iconBg: 'rgba(255,255,255,0.06)',
        iconBgMuted: 'rgba(255,255,255,0.04)',
        glow: 'rgba(245,210,108,0.18)',
      },
    };
  }
  return {
    dark: false,
    premium,
    colors: {
      overlay: 'rgba(0,0,0,0.5)',
      drawerBg: '#F5F7FA',
      headerBg: premium ? '#1B3557' : '#1E3A5F',
      card: '#FFFFFF',
      border: '#E5E7EB',
      chip: '#F3F4F6',
      text: '#1E3A5F',
      subtext: '#6B7280',
      muted: '#9CA3AF',
      primary: '#1E3A5F',
      accent,
      iconBg: '#F3F4F6',
      iconBgMuted: '#F9FAFB',
      glow: 'rgba(244,214,120,0.18)',
    },
  };
}

function makeStyles(theme: ReturnType<typeof getTheme>) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    scrim: { flex: 1 },
    menuContainer: {
      height: '100%',
      backgroundColor: theme.colors.drawerBg,
      position: 'absolute',
      left: 0,
      top: 0,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 10,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
    },
    menuHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 65 : 46,
      paddingBottom: 20,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      zIndex: 5,
      elevation: 8,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    greetingContainer: { flexDirection: 'row', alignItems: 'center' },

    avatarWrap: {
      width: 32,
      height: 32,
      position: 'relative',
      marginRight: 12,
    },
    profileImageContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.dark ? 'rgba(234,219,166,0.18)' : 'rgba(212,175,55,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'absolute',
      left: 0,
      top: 0,
      ...(theme.premium && {
        borderWidth: 1,
        borderColor: theme.colors.accent,
      }),
    },
    profileImage: { width: '100%', height: '100%', borderRadius: 16 },
    crownBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.dark ? theme.colors.headerBg : '#FFFFFF',
      shadowColor: '#000',
      shadowOpacity: theme.dark ? 0.25 : 0.15,
      shadowRadius: 4,
      zIndex: 9999,
      elevation: 24,
    },

    greeting: { fontSize: 20, color: theme.colors.accent, fontFamily: 'Montserrat_700Bold' },

    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.chip,
      justifyContent: 'center',
      alignItems: 'center',
    },

    menuContent: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    menuSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.dark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 3,
      ...(theme.premium && { shadowOpacity: 0.25 }),
    },
    premiumGlow: theme.premium
      ? {
          shadowColor: theme.colors.accent,
          shadowOpacity: theme.dark ? 0.25 : 0.2,
          shadowRadius: 10,
          borderColor: theme.colors.accent,
        }
      : {},
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    menuItemIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.iconBg,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      ...(theme.premium && {
        borderWidth: 1,
        borderColor: theme.colors.accent,
      }),
    },
    disabledIcon: { backgroundColor: theme.colors.iconBgMuted },
    menuItemText: { flex: 1 },
    menuItemTitle: {
      fontSize: 16,
      color: theme.colors.text,
      fontFamily: 'Roboto_500Medium',
      marginBottom: 2,
    },
    disabledText: { color: theme.colors.muted },
    menuItemSubtitle: { fontSize: 12, color: theme.colors.subtext, fontFamily: 'Roboto_400Regular' },

    upgradeSection: { marginBottom: 20 },
    upgradeCard: {
      backgroundColor: theme.dark ? 'rgba(234,219,166,0.12)' : '#FEF3C7',
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.accent,
    },
    upgradeText: { marginLeft: 12, flex: 1 },
    upgradeTitle: {
      fontSize: 16,
      color: theme.colors.text,
      fontFamily: 'Montserrat_600SemiBold',
      marginBottom: 4,
    },
    upgradeBullets: { marginTop: 4 },
    upgradeBullet: {
      fontSize: 12,
      color: theme.colors.subtext,
      fontFamily: 'Roboto_400Regular',
      marginTop: 2,
    },

    curatorCard: {
      backgroundColor: theme.colors.chip,
      borderRadius: 12,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.accent,
    },
    curatorCardText: {
      marginLeft: 10,
      fontSize: 14,
      color: theme.colors.text,
      fontFamily: 'Roboto_500Medium',
    },

    devResetBtn: {
      position: 'absolute',
      left: 14,
      bottom: 14,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: theme.dark ? 'rgba(239,68,68,0.25)' : '#FEE2E2',
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(239,68,68,0.5)' : '#FCA5A5',
    },
    devResetText: {
      fontSize: 11,
      fontFamily: 'Roboto_500Medium',
      color: theme.dark ? '#FCA5A5' : '#7F1D1D',
    },
  });
}

/* ---------------- component ---------------- */

export default function BurgerMenu({ visible, onClose, isPremium: propPremium }: BurgerMenuProps) {
  const { user, profileImageVersion, signOut } = useAuth() as any;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [mode, setMode] = useState<ThemeMode>('light');
  const [resolvedPremium, setResolvedPremium] = useState<boolean>(!!propPremium);

  const pathname = usePathname();
  const MENU_WIDTH = Math.round(Dimensions.get('window').width * 0.8);
  const slideX = useRef(new Animated.Value(-MENU_WIDTH)).current;

  const theme = useMemo(() => getTheme(mode, resolvedPremium), [mode, resolvedPremium]);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
  });

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') setMode(stored);
    })();
    const themeSub = DeviceEventEmitter.addListener(CURIO_THEME_CHANGED, (e: any) => {
      if (e?.mode === 'dark' || e?.mode === 'light') setMode(e.mode);
    });
    return () => themeSub.remove();
  }, []);

  useEffect(() => {
    loadProfileImage();
  }, [user?.id, visible, profileImageVersion]);

  const loadProfileImage = async () => {
    try {
      if (user?.id) {
        const savedImage = await AsyncStorage.getItem(`profileImage_${user.id}`);
        setProfileImage(savedImage);
      }
    } catch (error) {}
  };

  useEffect(() => {
    const fetchPremium = async () => {
      try {
        const p = (await AsyncStorage.getItem(KEY_IS_PREMIUM)) || '';
        const isTrue = p.trim().toLowerCase() === 'true';
        const tier = (await AsyncStorage.getItem(KEY_SUBSCRIPTION_TIER)) || '';
        const isCurator = tier.trim().toLowerCase() === 'curator';
        const authIsPremium = !!user?.isPremium;
        const prop = !!propPremium;
        const finalPremium = isTrue || isCurator || authIsPremium || prop;
        setResolvedPremium(finalPremium);
      } catch {
        setResolvedPremium(!!propPremium || !!user?.isPremium);
      }
    };
    if (visible) fetchPremium();
  }, [visible, user?.id, propPremium]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(CURIO_PREMIUM_CHANGED, (e: any) => {
      if (typeof e?.isPremium === 'boolean') setResolvedPremium(e.isPremium);
      if (typeof e?.tier === 'string') setResolvedPremium(e.tier.trim().toLowerCase() === 'curator');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideX, { toValue: 0, duration: 160, useNativeDriver: true }).start();
    } else {
      slideX.setValue(-MENU_WIDTH);
    }
  }, [visible]);

  const closeMenuThen = (cb?: () => void) => {
    Animated.timing(slideX, { toValue: -MENU_WIDTH, duration: 160, useNativeDriver: true }).start(
      ({ finished }) => {
        if (finished) {
          onClose?.();
          cb?.();
        }
      },
    );
  };

  const navigateTo = (route: string) => {
    if (pathname === route || (route === '/' && pathname === '/')) return closeMenuThen();
    closeMenuThen(() => router.replace(route));
  };

  const handleDevReset = async () => {
    try {
      await AsyncStorage.clear();
      await Promise.resolve(signOut?.());
    } catch (e) {
    } finally {
      router.replace('/welcome');
    }
  };

  if (!fontsLoaded) return null;

  return (
    <Modal visible={visible} transparent onRequestClose={() => closeMenuThen()}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={() => closeMenuThen()} />

        <Animated.View
          style={[
            styles.menuContainer,
            { width: MENU_WIDTH, transform: [{ translateX: slideX }] },
          ]}
        >
          <View style={styles.menuHeader}>
            <View style={styles.greetingContainer}>
              <View style={styles.avatarWrap}>
                <View style={styles.profileImageContainer}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                  ) : (
                    <User size={20} color={theme.colors.accent} />
                  )}
                </View>

                {resolvedPremium && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Premium"
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    style={styles.crownBadge}
                    onPress={() => navigateTo('/settings')}
                  >
                    <Crown size={10} color={theme.dark ? '#0F1725' : '#1E3A5F'} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.greeting}>
                Hello {user?.name?.split(' ')[0] || 'Collector'}!
              </Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => closeMenuThen()} style={styles.closeButton}>
                <X size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.menuSection, styles.premiumGlow]}>
              <MenuItem
                icon={House}
                title="Home"
                subtitle="Your Collection value"
                onPress={() => navigateTo('/')}
                premiumTint={resolvedPremium}
              />
              <MenuItem
                icon={CollectionIcon}
                title="My Collection"
                subtitle="Browse items you've added"
                onPress={() => navigateTo('/collection')}
                premiumTint={resolvedPremium}
              />
              <MenuItem
                icon={Users}
                title="Community"
                subtitle="Tournaments, trading & more"
                onPress={() => navigateTo('/community')}
                premiumTint={resolvedPremium}
              />
              <MenuItem
                icon={Calendar}
                title="Events"
                subtitle="Shows and conventions"
                onPress={() => navigateTo('/events')}
                premiumTint={resolvedPremium}
              />
              <MenuItem
                icon={Store}
                title="Store"
                subtitle="Supplies & accessories"
                onPress={() => navigateTo('/store')}
                premiumTint={resolvedPremium}
              />
              <MenuItem
                icon={Settings}
                title="Settings"
                subtitle="Account and preferences"
                onPress={() => navigateTo('/settings')}
                premiumTint={resolvedPremium}
              />
            </View>

            {!resolvedPremium ? (
              <View style={styles.upgradeSection}>
                <View style={styles.upgradeCard}>
                  <Crown size={24} color={theme.colors.accent} />
                  <View style={styles.upgradeText}>
                    <Text style={styles.upgradeTitle}>Upgrade to Curator</Text>
                    <View style={styles.upgradeBullets}>
                      <Text style={styles.upgradeBullet}>• Unlimited AI identification & pricing</Text>
                      <Text style={styles.upgradeBullet}>• Multi item upload</Text>
                      <Text style={styles.upgradeBullet}>• Daily Collection updates</Text>
                      <Text style={styles.upgradeBullet}>• Ad free!</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.upgradeSection}>
                <View style={styles.curatorCard}>
                  <Crown size={18} color={theme.colors.accent} />
                  <Text style={styles.curatorCardText}>
                    You're a Curator. Thanks for supporting Curio!
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity onPress={handleDevReset} style={styles.devResetBtn} activeOpacity={0.8}>
            <Text style={styles.devResetText}>Reset (DEV)</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ---- local MenuItem ---- */
function MenuItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  isPremiumFeature = false,
  premiumTint = false,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isPremiumFeature?: boolean;
  premiumTint?: boolean;
}) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [isCurator, setIsCurator] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') setMode(stored);

      const p = (await AsyncStorage.getItem(KEY_IS_PREMIUM)) || '';
      const tier = (await AsyncStorage.getItem(KEY_SUBSCRIPTION_TIER)) || '';
      setIsCurator(p.trim().toLowerCase() === 'true' || tier.trim().toLowerCase() === 'curator');
    })();

    const themeSub = DeviceEventEmitter.addListener(CURIO_THEME_CHANGED, (e: any) => {
      if (e?.mode === 'dark' || e?.mode === 'light') setMode(e.mode);
    });
    const premiumSub = DeviceEventEmitter.addListener(CURIO_PREMIUM_CHANGED, (e: any) => {
      if (typeof e?.isPremium === 'boolean') setIsCurator(e.isPremium);
      if (typeof e?.tier === 'string') setIsCurator(e.tier.trim().toLowerCase() === 'curator');
    });
    return () => {
      themeSub.remove();
      premiumSub.remove();
    };
  }, []);

  const theme = useMemo(() => getTheme(mode, isCurator), [mode, isCurator]);
  const styles = useMemo(() => makeStyles(theme), [theme]);
 
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View
          style={[
            styles.menuItemIcon,
            isPremiumFeature && styles.disabledIcon,
            premiumTint && { borderColor: theme.colors.accent, borderWidth: 1 },
          ]}
        >
          <Icon size={20} color={isPremiumFeature ? theme.colors.muted : theme.colors.primary} />
        </View>
        <View style={styles.menuItemText}>
          <Text style={[styles.menuItemTitle, isPremiumFeature && styles.disabledText]}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {isPremiumFeature && <Crown size={16} color={theme.colors.accent} />}
    </TouchableOpacity>
  );
}