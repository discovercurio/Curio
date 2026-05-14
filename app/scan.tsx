// app/(tabs)/scan.tsx - SPACE-EFFICIENT VERSION
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Image,
  DeviceEventEmitter,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';

import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera as CameraIcon,
  Upload,
  X,
  Sparkles,
  BookOpen,
  Box,
  Layers,
} from 'lucide-react-native';
import { useFonts, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LastScanStore } from '@/lib/LastScanStore';

// NEW icons
import { TradingCardIcon } from '@/components/TradingCardBlank';
import CoinDollarIcon from '@/components/CoinDollarIcon';
import PhotoEnlargeModal from '@/components/PhotoEnlargeModal';
import { useFocusEffect } from '@react-navigation/native';

/** ---------------- cross-screen events ---------------- */
const CURIO_RESET_CAPTURE = 'CURIO_RESET_CAPTURE';

/** ---------------- Theme ---------------- */
const THEME_STORAGE_KEY = 'APP_THEME_MODE';
const CURIO_THEME_CHANGED = 'CURIO_THEME_CHANGED';
const MEMBERSHIP_KEY = 'CURIO_MEMBERSHIP_TIER';
const CURIO_MEMBERSHIP_CHANGED = 'CURIO_MEMBERSHIP_CHANGED';

type ThemeMode = 'light' | 'dark';
type MembershipTier = 'collector' | 'curator';

function getTheme(mode: ThemeMode) {
  if (mode === 'dark') {
    return {
      dark: true,
      colors: {
        appBg: '#0B1320',
        headerBg: '#0E1A2A',
        surface: '#101b2c',
        surfaceHi: '#132235',
        chip: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.10)',
        softBorder: 'rgba(255,255,255,0.08)',
        text: '#D9E4EF',
        subtext: '#A9B6C6',
        muted: '#9CA3AF',
        placeholder: 'rgba(169, 182, 198, 0.35)',
        primary: '#EADBA6',
        accent: '#D4AF37',
        inputBg: '#0F1B2B',
        pillGoldBg: 'rgba(234,219,166,0.12)',
        highlight: 'rgba(234,219,166,0.10)',
        overlay: 'rgba(0,0,0,0.6)',
        dim: 'rgba(0,0,0,0.55)',
        success: 'rgba(34, 197, 94, 0.15)',
      },
    };
  }
  return {
    dark: false,
    colors: {
      appBg: '#F5F7FA',
      headerBg: '#1E3A5F',
      surface: '#FFFFFF',
      surfaceHi: '#F9FAFB',
      chip: '#F8FAFC',
      border: '#E5E7EB',
      softBorder: '#EEF2F7',
      text: '#1E3A5F',
      subtext: '#6B7280',
      muted: '#9CA3AF',
      placeholder: 'rgba(156, 163, 175, 0.45)',
      primary: '#1E3A5F',
      accent: '#D4AF37',
      inputBg: '#FFFFFF',
      pillGoldBg: '#FEF3C7',
      highlight: '#FFF7E6',
      overlay: 'rgba(255,255,255,0.6)',
      dim: 'rgba(0,0,0,0.45)',
      success: 'rgba(34, 197, 94, 0.12)',
    },
  };
}

const SCREEN_W = Dimensions.get('window').width;

function makeStyles(t: ReturnType<typeof getTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.appBg },

    header: {
      backgroundColor: t.colors.headerBg,
      paddingTop: 45,
      paddingBottom: 14,
      paddingHorizontal: 18,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.softBorder,
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: {
      width: 38, 
      height: 38, 
      borderRadius: 19,
      backgroundColor: t.dark ? 'rgba(234,219,166,0.18)' : 'rgba(212,175,55,0.20)',
      justifyContent: 'center', 
      alignItems: 'center',
    },
    headerTitle: { 
      fontSize: 20,
      color: t.colors.accent, 
      fontFamily: 'Montserrat_700Bold',
      letterSpacing: 0.5,
    },
    placeholder: { width: 38 },
    headerSubtitle: {
      marginTop: 6,
      fontSize: 12,
      color: t.dark ? t.colors.subtext : '#F5F7FA',
      fontFamily: 'Roboto_400Regular',
      textAlign: 'center',
      opacity: 0.9,
    },

    content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

    // Compact hero with carousel
    heroWrap: {
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 14,
      padding: 12,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: t.dark ? '#000' : '#1E3A5F',
      shadowOpacity: t.dark ? 0.25 : 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    },
    heroTextCol: {
      flex: 1,
      paddingRight: 10,
    },
    heroTitle: {
      fontSize: 16,
      fontFamily: 'Montserrat_700Bold',
      color: t.colors.text,
      letterSpacing: 0.2,
    },
    heroSub: {
      fontSize: 11,
      color: t.colors.subtext,
      fontFamily: 'Roboto_400Regular',
      marginTop: 3,
      lineHeight: 16,
    },
    heroImgBox: {
      width: 80,
      height: 64,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.colors.softBorder,
      overflow: 'hidden',
      backgroundColor: t.colors.surfaceHi,
    },
    heroImg: {
      width: '100%',
      height: '100%',
    },

    // Compact step header
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    stepBadge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: t.colors.pillGoldBg,
      borderWidth: 1,
      borderColor: t.colors.accent,
      marginRight: 10,
    },
    stepBadgeText: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 11,
      color: t.colors.text,
      letterSpacing: 0.5,
    },
    stepTitle: {
      fontFamily: 'Montserrat_600SemiBold',
      color: t.colors.text,
      fontSize: 15,
      letterSpacing: 0.2,
      flex: 1,
    },

    // Compact category cards
    categoryGrid: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    categoryCard: {
      flex: 1,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 6,
      alignItems: 'center',
    },
    categoryCardActive: {
      borderWidth: 2,
      borderColor: t.colors.accent,
      backgroundColor: t.dark ? '#18263a' : '#FFFDF6',
    },
    categoryIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.colors.highlight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    categoryTitle: {
      fontSize: 12,
      fontFamily: 'Montserrat_600SemiBold',
      color: t.colors.text,
      textAlign: 'center',
    },

    // Compact mode selector
    modeRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    modeCard: {
      flex: 1,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 12,
      padding: 10,
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    modeCardActive: {
      borderWidth: 2,
      borderColor: t.colors.accent,
      backgroundColor: t.dark ? '#18263a' : '#FFFDF6',
    },
    modeIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.colors.highlight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modeTextCol: {
      flex: 1,
    },
    modeTitle: {
      fontSize: 13,
      fontFamily: 'Montserrat_600SemiBold',
      color: t.colors.text,
    },
    modeSub: {
      fontSize: 10,
      fontFamily: 'Roboto_400Regular',
      color: t.colors.subtext,
    },

    // Action buttons - more compact
    actionRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    actionBtn: {
      flex: 1,
      backgroundColor: t.colors.surface,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.colors.border,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    actionBtnPrimary: {
      backgroundColor: t.colors.accent,
      borderColor: t.colors.accent,
    },
    actionBtnDisabled: {
      opacity: 0.4,
    },
    actionTitle: {
      fontSize: 14,
      color: t.colors.text,
      fontFamily: 'Montserrat_600SemiBold',
    },
    actionTitlePrimary: {
      fontSize: 14,
      color: '#0E1A2A',
      fontFamily: 'Montserrat_600SemiBold',
    },

    // Compact tips
    tipsCard: {
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 12,
      padding: 12,
      marginTop: 10,
    },
    tipsTitle: {
      fontSize: 14,
      fontFamily: 'Montserrat_600SemiBold',
      color: t.colors.text,
      marginBottom: 8,
    },
    tip: {
      fontSize: 12,
      color: t.colors.subtext,
      fontFamily: 'Roboto_400Regular',
      marginBottom: 5,
      lineHeight: 17,
    },

    permissionContainer: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: t.colors.appBg, 
      paddingHorizontal: 40 
    },
    message: { 
      fontSize: 16, 
      color: t.colors.text, 
      fontFamily: 'Roboto_400Regular', 
      textAlign: 'center', 
      marginBottom: 24,
      lineHeight: 24,
    },
    permissionButton: { 
      backgroundColor: t.colors.accent, 
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 12,
    },
    permissionButtonText: { 
      color: t.dark ? '#0E1A2A' : t.colors.text, 
      fontFamily: 'Roboto_500Medium', 
      fontSize: 16,
    },

    cameraContainer: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },

    cameraControls: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 28,
    },
    cameraButton: {
      width: 66,
      height: 66, 
      borderRadius: 33,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center', 
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    cameraButtonText: { 
      color: '#FFFFFF', 
      fontFamily: 'Roboto_500Medium', 
      fontSize: 13,
    },
    captureButton: { 
      width: 92,
      height: 92, 
      borderRadius: 46, 
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center', 
      alignItems: 'center', 
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    captureButtonInner: { 
      width: 70,
      height: 70, 
      borderRadius: 35, 
      backgroundColor: t.colors.accent,
    },

    overlayRoot: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },

    hintWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
    },

    hintText: {
      color: '#fff',
      fontFamily: 'Montserrat_700Bold',
      fontSize: 19,
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.6)',
      textShadowRadius: 8,
    },
    subHint: {
      marginTop: 7,
      color: 'rgba(255,255,255,0.90)',
      fontFamily: 'Roboto_400Regular',
      fontSize: 14,
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowRadius: 6,
    },

    frameBox: {
      width: '70%',
      aspectRatio: 2 / 3,
      backgroundColor: 'transparent',
    },

    dim: { position: 'absolute', backgroundColor: t.colors.dim },

    corner: {
      position: 'absolute',
      width: 36,
      height: 36,
      borderColor: t.colors.accent,
      borderRadius: 8,
    },
    tl: { top: -2, left: -2, borderLeftWidth: 5, borderTopWidth: 5 },
    tr: { top: -2, right: -2, borderRightWidth: 5, borderTopWidth: 5 },
    bl: { bottom: -2, left: -2, borderLeftWidth: 5, borderBottomWidth: 5 },
    br: { bottom: -2, right: -2, borderRightWidth: 5, borderBottomWidth: 5 },
  });
}

/** ---------------- Scan Screen ---------------- */

type CurioCategory = 'Card' | 'Coin' | 'Comic' | 'Other';
type UploadMode = 'single' | 'multi';

export default function ScanScreen() {
  // theme
  const [mode, setMode] = useState<ThemeMode>('light');
  const [membership, setMembership] = useState<MembershipTier>('collector');
  const isPremium = membership === 'curator';

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') setMode(stored);
      const tier = await AsyncStorage.getItem(MEMBERSHIP_KEY);
      if (tier === 'curator' || tier === 'collector') setMembership(tier);
    })();
    const subTheme = DeviceEventEmitter.addListener(CURIO_THEME_CHANGED, (e: any) => {
      if (e?.mode === 'dark' || e?.mode === 'light') setMode(e.mode);
    });
    const subMember = DeviceEventEmitter.addListener(CURIO_MEMBERSHIP_CHANGED, (e: any) => {
      if (e?.tier === 'curator' || e?.tier === 'collector') setMembership(e.tier);
    });
    return () => {
      subTheme.remove();
      subMember.remove();
    };
  }, []);

  const theme = useMemo(() => getTheme(mode), [mode]);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Hero image carousel
  const heroImages = [
    require('@/assets/images/Collectible_Coin_Transparent.png'),
    require('@/assets/images/Collectible_Card_Transparent.png'),
  ];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start();
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [fadeAnim, heroImages.length]);

  // fonts
  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
  });

  // camera
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRefLocal = useRef<CameraView>(null);

  // proactively ensure picker permissions
  useEffect(() => {
    (async () => {
      try {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        await ImagePicker.requestCameraPermissionsAsync();
      } catch {}
    })();
  }, []);

  // UI
  const [selectedCategory, setSelectedCategory] = useState<CurioCategory | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  // Multi-upload state
  const [multiPhotos, setMultiPhotos] = useState<string[]>([]);

  // overlay measurement
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });
  const [frameBoxLayout, setFrameBoxLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Reset preview & category on focus
  useFocusEffect(
    useCallback(() => {
      if (!LastScanStore.get()?.imageUri) {
        setCapturedImageUri(null);
      }
      setSelectedCategory(null);
      setUploadMode('single');
      setMultiPhotos([]);

      const sub = DeviceEventEmitter.addListener(CURIO_RESET_CAPTURE, () => {
        setCapturedImageUri(null);
        setSelectedCategory(null);
        setUploadMode('single');
        setMultiPhotos([]);
      });
      return () => sub.remove();
    }, [])
  );

  // navigation
  async function goToDetails(imageUri: string) {
    if (!selectedCategory) {
      Alert.alert('Pick a Category', 'Choose Cards, Coins, Comics, or Other before scanning.');
      return;
    }
    LastScanStore.set({ category: selectedCategory, imageUri, ai: {} } as any);
    router.push('/item-details');
  }

  async function goToMultiDetails() {
    if (!selectedCategory) {
      Alert.alert('Pick a Category', 'Choose a category first.');
      return;
    }
    if (multiPhotos.length === 0) {
      Alert.alert('No Photos', 'Please capture or upload at least one photo.');
      return;
    }
    await AsyncStorage.setItem('CURIO_MULTI_PHOTOS', JSON.stringify({
      category: selectedCategory,
      photos: multiPhotos,
    }));
    router.push('/multi-item-details');
  }

  // Single photo capture
  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      try {
        const cap = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 1,
        });
        if (!cap.canceled) {
          setCapturedImageUri(cap.assets[0].uri);
          await goToDetails(cap.assets[0].uri);
        }
      } catch (err) {
        console.error('[scan] web camera error', err);
        Alert.alert('Camera Error', 'Could not access the webcam in this context.');
      }
      return;
    }

    if (!cameraRefLocal.current) return;
    try {
      const photo = await cameraRefLocal.current.takePictureAsync();
      if (!photo) return;
      setShowCamera(false);
      setCapturedImageUri(photo.uri);
      await goToDetails(photo.uri);
    } catch (err) {
      console.error('[scan] takePicture error', err);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  // Multi photo capture
  const takeMultiPhoto = async () => {
    if (Platform.OS === 'web') {
      try {
        const cap = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 1,
        });
        if (!cap.canceled) {
          const newUri = cap.assets[0].uri;
          setMultiPhotos(prev => {
            if (prev.length >= 10) {
              Alert.alert('Limit Reached', 'You can only capture up to 10 photos.');
              return prev;
            }
            return [...prev, newUri];
          });
        }
      } catch (err) {
        console.error('[scan] web multi camera error', err);
        Alert.alert('Camera Error', 'Could not access the webcam.');
      }
      return;
    }

    if (!cameraRefLocal.current) return;
    try {
      const photo = await cameraRefLocal.current.takePictureAsync();
      if (!photo) return;
      
      setMultiPhotos(prev => {
        if (prev.length >= 10) {
          Alert.alert('Limit Reached', 'You can only capture up to 10 photos. Press Done to continue.');
          return prev;
        }
        return [...prev, photo.uri];
      });
    } catch (err) {
      console.error('[scan] multi takePicture error', err);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  // gallery picker (single)
  const pickImageFromGallery = async () => {
    if (!selectedCategory) {
      Alert.alert('Pick a Category', 'Choose a category first.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setCapturedImageUri(uri);
        await goToDetails(uri);
      }
    } catch (err) {
      console.error('[scan] pickImageFromGallery error', err);
      Alert.alert('Upload Error', 'Could not open the file picker.');
    }
  };

  // gallery picker (multi)
  const pickMultiImagesFromGallery = async () => {
    if (!selectedCategory) {
      Alert.alert('Pick a Category', 'Choose a category first.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 1,
      });
      if (!result.canceled) {
        const uris = result.assets.map(a => a.uri);
        setMultiPhotos(prev => {
          const combined = [...prev, ...uris];
          if (combined.length > 10) {
            Alert.alert('Limit Reached', 'Only the first 10 photos will be used.');
            return combined.slice(0, 10);
          }
          return combined;
        });
      }
    } catch (err) {
      console.error('[scan] pickMultiImages error', err);
      Alert.alert('Upload Error', 'Could not open the file picker.');
    }
  };

  // Early guards
  if (!fontsLoaded) return null;
  if (!permission) return <View />;

  if (Platform.OS !== 'web' && !permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.message}>We need your permission to access the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getCategoryIcon = (cat: CurioCategory, active: boolean) => {
    const color = active ? theme.colors.accent : theme.colors.text;
    const size = 24;
    switch (cat) {
      case 'Coin': return <CoinDollarIcon size={size} color={color} strokeWidth={2} reeded={false} />;
      case 'Comic': return <BookOpen size={size} color={color} strokeWidth={2} />;
      case 'Card': return <TradingCardIcon size={size} ink={color} />;
      case 'Other': return <Box size={size} color={color} strokeWidth={2} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.replace('/')}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color={theme.colors.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Collectible</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.headerSubtitle}>
          {uploadMode === 'multi' 
            ? `Multi-upload: ${multiPhotos.length}/10 photos captured`
            : 'Choose category, then scan or upload'}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Compact Hero with Carousel */}
        <View style={styles.heroWrap}>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>Snap, Scan, Save!</Text>
            <Text style={styles.heroSub}>Our AI reads slab labels to auto-fill details.</Text>
          </View>
          <TouchableOpacity
            style={styles.heroImgBox}
            onPress={() => capturedImageUri && setShowPhotoModal(true)}
            activeOpacity={capturedImageUri ? 0.7 : 1}
            disabled={!capturedImageUri}
          >
            {capturedImageUri ? (
              <Image
                source={{ uri: capturedImageUri }}
                style={styles.heroImg}
                resizeMode="contain"
              />
            ) : (
              <Animated.Image
                source={heroImages[currentImageIndex]}
                style={[styles.heroImg, { opacity: fadeAnim }]}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>

        {/* STEP 1: Category Selection */}
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>STEP 1</Text>
          </View>
          <Text style={styles.stepTitle}>Select Category</Text>
        </View>

        <View style={styles.categoryGrid}>
          {(['Card', 'Coin', 'Comic', 'Other'] as CurioCategory[]).map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryCard, isActive && styles.categoryCardActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIconWrap}>
                  {getCategoryIcon(cat, isActive)}
                </View>
                <Text style={styles.categoryTitle}>
                  {cat === 'Card'
                    ? 'Cards'
                    : cat === 'Coin'
                    ? 'Coins'
                    : cat === 'Comic'
                    ? 'Comics'
                    : 'Other'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* STEP 2: Upload Mode (Premium Only) */}
        {selectedCategory && isPremium && (
          <>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 2</Text>
              </View>
              <Text style={styles.stepTitle}>Upload Mode</Text>
            </View>

            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeCard, uploadMode === 'single' && styles.modeCardActive]}
                onPress={() => {
                  setUploadMode('single');
                  setMultiPhotos([]);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.modeIconWrap}>
                  <CameraIcon 
                    size={20} 
                    color={uploadMode === 'single' ? theme.colors.accent : theme.colors.text}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.modeTextCol}>
                  <Text style={styles.modeTitle}>Single</Text>
                  <Text style={styles.modeSub}>One at a time</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeCard, uploadMode === 'multi' && styles.modeCardActive]}
                onPress={() => setUploadMode('multi')}
                activeOpacity={0.7}
              >
                <View style={styles.modeIconWrap}>
                  <Layers 
                    size={20} 
                    color={uploadMode === 'multi' ? theme.colors.accent : theme.colors.text}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.modeTextCol}>
                  <Text style={styles.modeTitle}>Multi</Text>
                  <Text style={styles.modeSub}>Up to 10 items</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* STEP 3: Capture/Upload */}
        {selectedCategory && (
          <>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{isPremium ? 'STEP 3' : 'STEP 2'}</Text>
              </View>
              <Text style={styles.stepTitle}>
                {uploadMode === 'multi' ? `Capture Photos (${multiPhotos.length}/10)` : 'Capture or Upload'}
              </Text>
            </View>

            {/* Single Mode Actions */}
            {uploadMode === 'single' && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary]}
                  onPress={async () => {
                    if (Platform.OS === 'web') {
                      await takePhoto();
                    } else {
                      setShowCamera(true);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <CameraIcon size={22} color="#0E1A2A" strokeWidth={2} />
                  <Text style={styles.actionTitlePrimary}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={pickImageFromGallery}
                  activeOpacity={0.8}
                >
                  <Upload size={22} color={theme.colors.text} strokeWidth={2} />
                  <Text style={styles.actionTitle}>Upload</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Multi Mode Actions */}
            {uploadMode === 'multi' && (
              <>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      multiPhotos.length < 10 && styles.actionBtnPrimary,
                      multiPhotos.length >= 10 && styles.actionBtnDisabled,
                    ]}
                    onPress={async () => {
                      if (multiPhotos.length >= 10) return Alert.alert('Limit Reached', 'Maximum 10 photos.');
                      if (Platform.OS === 'web') {
                        await takeMultiPhoto();
                      } else {
                        setShowCamera(true);
                      }
                    }}
                    activeOpacity={0.8}
                    disabled={multiPhotos.length >= 10}
                  >
                    <CameraIcon 
                      size={22} 
                      color={multiPhotos.length < 10 ? '#0E1A2A' : theme.colors.text} 
                      strokeWidth={2} 
                    />
                    <Text style={multiPhotos.length < 10 ? styles.actionTitlePrimary : styles.actionTitle}>
                      Capture
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      multiPhotos.length >= 10 && styles.actionBtnDisabled,
                    ]}
                    onPress={pickMultiImagesFromGallery}
                    activeOpacity={0.8}
                    disabled={multiPhotos.length >= 10}
                  >
                    <Upload size={22} color={theme.colors.text} strokeWidth={2} />
                    <Text style={styles.actionTitle}>Upload</Text>
                  </TouchableOpacity>
                </View>

                {multiPhotos.length > 0 && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={goToMultiDetails}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={22} color="#0E1A2A" strokeWidth={2} />
                    <Text style={styles.actionTitlePrimary}>
                      Continue ({multiPhotos.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}

        {/* Tips - Compact */}
        {selectedCategory && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Quick Tips</Text>
            <Text style={styles.tip}>• Shoot straight on, keep edges parallel</Text>
            <Text style={styles.tip}>• Wipe the case to avoid dust/smudges</Text>
            <Text style={styles.tip}>• Turn off harsh lighting to reduce glare</Text>
            <Text style={styles.tip}>• Fill the frame with the label</Text>
          </View>
        )}
      </ScrollView>

      {/* Camera Modal */}
      {Platform.OS !== 'web' && (
        <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
          <View style={styles.cameraContainer}>
            <CameraView style={styles.camera} facing={facing} ref={cameraRefLocal}>
              <View
                pointerEvents="none"
                style={styles.overlayRoot}
                onLayout={(e) => {
                  const { width, height } = e.nativeEvent.layout;
                  setOverlaySize({ width, height });
                }}
              >
                <View
                  style={styles.frameBox}
                  onLayout={(e) => {
                    const { x, y, width, height } = e.nativeEvent.layout;
                    setFrameBoxLayout({ x, y, width, height });
                  }}
                >
                  <View style={[styles.corner, styles.tl]} />
                  <View style={[styles.corner, styles.tr]} />
                  <View style={[styles.corner, styles.bl]} />
                  <View style={[styles.corner, styles.br]} />
                </View>

                {overlaySize.width > 0 && frameBoxLayout.width > 0 && (
                  <>
                    <View style={[styles.dim, { top: 0, left: 0, right: 0, height: frameBoxLayout.y }]} />
                    <View
                      style={[
                        styles.dim,
                        {
                          top: frameBoxLayout.y + frameBoxLayout.height,
                          left: 0,
                          right: 0,
                          height: Math.max(0, overlaySize.height - (frameBoxLayout.y + frameBoxLayout.height)),
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.dim,
                        { top: frameBoxLayout.y, left: 0, width: frameBoxLayout.x, height: frameBoxLayout.height },
                      ]}
                    />
                    <View
                      style={[
                        styles.dim,
                        {
                          top: frameBoxLayout.y,
                          left: frameBoxLayout.x + frameBoxLayout.width,
                          right: 0,
                          height: frameBoxLayout.height,
                        },
                      ]}
                    />
                  </>
                )}

                {(() => {
                  const ABOVE_GAP = 14;
                  const approxTextBlockH = 58;
                  const fallbackTop = 40;
                  const measuredTop =
                    frameBoxLayout.height > 0
                      ? Math.max(16, frameBoxLayout.y - approxTextBlockH - ABOVE_GAP)
                      : fallbackTop;

                  return (
                    <View style={[styles.hintWrap, { top: measuredTop }]}>
                      <Text style={styles.hintText}>
                        {uploadMode === 'multi' 
                          ? `Photo ${multiPhotos.length + 1} of 10`
                          : 'Fit the slab inside the corners'}
                      </Text>
                      <Text style={styles.subHint}>Keep the label clear; reduce glare for best results</Text>
                    </View>
                  );
                })()}
              </View>

              <View style={styles.cameraControls}>
                <TouchableOpacity 
                  style={styles.cameraButton} 
                  onPress={() => setShowCamera(false)}
                  activeOpacity={0.8}
                >
                  {uploadMode === 'multi' && multiPhotos.length > 0 ? (
                    <Text style={styles.cameraButtonText}>Done</Text>
                  ) : (
                    <X size={26} color="#FFFFFF" strokeWidth={2.5} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.captureButton} 
                  onPress={uploadMode === 'multi' ? takeMultiPhoto : takePhoto}
                  activeOpacity={0.85}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={() => setFacing((curr) => (curr === 'back' ? 'front' : 'back'))}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cameraButtonText}>Flip</Text>
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        </Modal>
      )}

      <PhotoEnlargeModal
        visible={showPhotoModal}
        imageUri={capturedImageUri}
        onClose={() => setShowPhotoModal(false)}
        accentColor={theme.colors.accent}
      />
    </View>
  );
}