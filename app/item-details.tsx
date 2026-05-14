// app/item-details.tsx - Updated with comprehensive coin fields
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Easing,
  Keyboard,
  DeviceEventEmitter,
} from 'react-native';
import { ArrowLeft, Save, Coins as PriceIcon, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCollection } from '@/contexts/CollectionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LastScanStore,
  CurioCategory,
  AICard,
  AICoin,
  AIComic,
} from '@/lib/LastScanStore';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import CurioAIAnalyzer, {
  CurioAIAnalyzerHandle,
  PriceInput,
  PriceResult,
  normalizeParallelVariant,
  deriveMintDesignation,
  buildFallbackDescription,
} from '../components/CurioAIAnalyzer';

import PhotoEnlargeModal from '../components/PhotoEnlargeModal';
import facts from './data/funfacts.json';

const CURIO_RESET_CAPTURE = 'CURIO_RESET_CAPTURE';
const THEME_STORAGE_KEY = 'APP_THEME_MODE';
type ThemeMode = 'light' | 'dark';

/* ---------------- Theme ---------------- */
function getTheme(mode: ThemeMode) {
  if (mode === 'dark') {
    return {
      dark: true,
      colors: {
        appBg: '#0B1320',
        headerBg: '#0E1A2A',
        surface: '#0d1726',
        text: '#D9E4EF',
        subtext: '#A9B6C6',
        muted: '#9CA3AF',
        accent: '#D4AF37',
        border: 'rgba(255,255,255,0.10)',
        inputBg: '#0F1B2B',
        softBorder: 'rgba(255,255,255,0.08)',
        overlay: 'rgba(4,8,16,0.72)',
        glass: 'rgba(255,255,255,0.06)',
      },
      shadows: { glow: 'rgba(212,175,55,0.25)' },
    };
  }
  return {
    dark: false,
    colors: {
      appBg: '#F5F7FA',
      headerBg: '#1E3A5F',
      surface: '#FFFFFF',
      text: '#1E3A5F',
      subtext: '#6B7280',
      muted: '#9CA3AF',
      accent: '#D4AF37',
      border: '#E5E7EB',
      inputBg: '#FFFFFF',
      softBorder: '#F1F5F9',
      overlay: 'rgba(12,18,28,0.38)',
      glass: 'rgba(248,250,252,0.95)',
    },
    shadows: { glow: 'rgba(30,58,95,0.12)' },
  };
}

function makeStyles(t: ReturnType<typeof getTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.appBg },
    header: {
      backgroundColor: t.colors.headerBg,
      paddingTop: 45,
      paddingBottom: 16,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    hTitle: { fontSize: 20, color: t.colors.accent, fontWeight: '700' },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },

    content: { flex: 1 },
    hero: {
      padding: 16,
      gap: 12,
      backgroundColor: t.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    heroRow: { flexDirection: 'row', gap: 12 },
    heroImgWrap: {
      width: 100,
      height: 100,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    heroImg: { width: '100%', height: '100%' },
    heroMeta: { flex: 1, justifyContent: 'space-between' },
    nameInput: {
      fontSize: 18,
      fontWeight: '600',
      color: t.colors.text,
      padding: 0,
      margin: 0,
    },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    pillText: { color: t.colors.subtext, fontSize: 12 },

    section: { marginTop: 14, paddingHorizontal: 16, paddingBottom: 18 },
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 14,
      marginTop: 10,
    },
    sTitle: { fontSize: 14, fontWeight: '700', color: t.colors.text },
    row: { flexDirection: 'row', gap: 10 },
    half: { flex: 1 },
    label: { fontSize: 12, color: t.colors.subtext, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.inputBg,
      borderRadius: 8,
      padding: 12,
      color: t.colors.text,
    },
    area: { minHeight: 92, textAlignVertical: 'top' },

    inlineBtn: {
      height: 44,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: t.colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inlineBtnTxt: { color: '#0E1A2A', fontWeight: '700', fontSize: 12 },

    overlayRoot: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: t.colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    },
    glassCard: {
      width: '86%',
      borderRadius: 20,
      padding: 18,
      backgroundColor: t.colors.glass,
      borderWidth: 1,
      borderColor: t.colors.softBorder ?? 'rgba(255,255,255,0.18)',
      ...(Platform.OS === 'web'
        ? { backdropFilter: 'blur(10px)' as any }
        : null),
    },
    loadTitle: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: t.colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    animRow: {
      alignSelf: 'center',
      width: 160,
      height: 160,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      shadowColor: t.shadows.glow,
      shadowOpacity: 1,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 0 },
      marginBottom: 14,
    },
    factWrap: {
      marginTop: 6,
      padding: 12,
      borderRadius: 12,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    factLabel: {
      fontSize: 11,
      color: t.colors.subtext,
      marginBottom: 6,
      textAlign: 'center',
    },
    factText: { fontSize: 13, color: t.colors.text, textAlign: 'center' },
    stopBtn: {
      alignSelf: 'center',
      marginTop: 16,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
    },

    footer: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 10,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      backgroundColor: t.colors.surface,
    },
    saveBtn: {
      height: 52,
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accent,
      borderRadius: 12,
      paddingHorizontal: 14,
    },
    saveTxt: { color: '#0E1A2A', fontWeight: '700', fontSize: 16 },

    debugContainer: {
      maxHeight: 300,
      backgroundColor: t.colors.inputBg,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: t.colors.border,
      marginTop: 10,
    },
    debugHeader: {
      color: t.colors.subtext,
      fontWeight: '600',
      fontSize: 12,
      marginBottom: 10,
      letterSpacing: 0.5,
    },
    debugItem: {
      marginBottom: 8,
      paddingBottom: 8,
    },
    debugDivider: {
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    debugTime: {
      fontSize: 10,
      fontWeight: '500',
    },
    debugMessage: {
      fontSize: 11,
      marginTop: 2,
    },
  });
}

/* ---------------- Helper Functions ---------------- */
function extractSummary(cat: CurioCategory | undefined, ai: any): string {
  if (!ai) return '';
  if (cat === 'Card')
    return [
      ai.brand,
      ai.set,
      ai.card_number,
      ai.grade,
      ai.certification_number,
      ai.country,
    ]
      .filter(Boolean)
      .join(' • ');
  if (cat === 'Coin')
    return [
      ai.coins_type || ai.coin_product_name,
      ai.year_displayed,
      ai.mint_mark,
      ai.grade,
      ai.special_designation,
      ai.certification_number,
      ai.country,
    ]
      .filter(Boolean)
      .join(' • ');
  if (cat === 'Comic')
    return [
      ai.publisher,
      ai.comic_title,
      ai.comic_issue_number,
      ai.grade,
      ai.certification_number,
      ai.country,
    ]
      .filter(Boolean)
      .join(' • ');
  return '';
}

function useKeyboardPadding() {
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) =>
      setKbHeight(e.endCoordinates?.height ?? 0)
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  return kbHeight;
}

function pickFacts(cat: CurioCategory | undefined): string[] {
  if (cat === 'Card') return facts.cards;
  if (cat === 'Coin') return facts.coins;
  if (cat === 'Comic') return facts.comics;
  return [...facts.cards, ...facts.coins, ...facts.comics];
}

function randomIdx(max: number, avoid?: number) {
  if (max <= 1) return 0;
  let n = Math.floor(Math.random() * max);
  if (avoid != null && max > 1) {
    while (n === avoid) n = Math.floor(Math.random() * max);
  }
  return n;
}

/* ---------------- Component ---------------- */
export default function ItemDetailsScreen() {
  const { setItems } = useCollection();
  const insets = useSafeAreaInsets();
  const kbHeight = useKeyboardPadding();
  const [footerH, setFooterH] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const analyzerRef = useRef<CurioAIAnalyzerHandle>(null);
  
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const onLogsUpdate = (logs: any[]) => setDebugLogs(logs);
  
  const handlePrice = (r: PriceResult) => {
    const mid = Math.max(0, Math.round(r.price_mid || 0));
    set('value', mid ? String(mid) : '');
  };

  const [mode, setMode] = useState<ThemeMode>('light');
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') setMode(stored);
    })();
  }, []);
  const theme = useMemo(() => getTheme(mode), [mode]);
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const scan = LastScanStore.get();
  useEffect(() => {
    if (!scan) {
      console.warn('[details] No scan in store; going back');
      router.back();
    }
  }, [scan]);

  const [form, setForm] = useState(() => {
    const ai = scan?.ai as any;
    const fallback = {
      type: scan?.category ?? 'Other',
      name: ai?.title_for_ui ?? '',
      value:
        typeof ai?.estimated_value_usd === 'number'
          ? String(ai.estimated_value_usd)
          : '',
      description: ai?.fact_description ?? '',
      hiddenDescription: '',
      gradingCompany: ai?.grading_company ?? '',
      grade: ai?.grade ?? '',
      certificationNumber: ai?.certification_number ?? '',
      country: ai?.country ?? '',
      year: (ai as AICard)?.year ?? '',
      setSeries: (ai as AICard)?.set ?? '',
      cardNumber: (ai as AICard)?.card_number ?? '',
      cardName: (ai as AICard)?.character ?? '',
      sportGenre: (ai as AICard)?.tcg_category ?? '',
      mintDesignation: deriveMintDesignation(ai),
      parallelVariant:
        normalizeParallelVariant(
          (ai as AICard)?.variation_details,
          (ai as AICard)?.tcg_edition,
          ai?.title_for_ui
        ) || '',
      autograph: (ai?.autographed ?? '').toString().toLowerCase() === 'yes',
      autographWho: (ai as any)?.autographed_by ?? '',
      denomination: (ai as AICoin)?.denomination ?? '',
      coinName:
        (ai as AICoin)?.coins_type ??
        (ai as AICoin)?.coin_product_name ??
        '',
      mintMark: (ai as AICoin)?.mint_mark ?? '',
      strikeType: (ai as AICoin)?.production_type ?? '',
      designation: (ai as AICoin)?.design_variation ?? '',
      variety: (ai as AICoin)?.design_variation_details ?? '',
      yearDisplayed: (ai as AICoin)?.year_displayed ?? '',
      // NEW COIN FIELDS
      specialDesignation: (ai as any)?.special_designation ?? '',
      designer: (ai as any)?.designer ?? '',
      specialLabel: (ai as any)?.special_label ?? '',
      pedigree: (ai as any)?.pedigree ?? '',
      seriesName: (ai as any)?.series_name ?? '',
      mintLocation: (ai as any)?.mint_location ?? '',
      metalFineness: (ai as any)?.metal_fineness ?? '',
      weight: (ai as any)?.weight ?? '',
      designDetails: (ai as any)?.design_details ?? '',
      yearOfPublication: (ai as AIComic)?.year ?? '',
      publisher: (ai as AIComic)?.publisher ?? '',
      seriesTitle: (ai as AIComic)?.comic_title ?? '',
      issueNumber: (ai as AIComic)?.comic_issue_number ?? '',
      variantEdition: (ai as AIComic)?.variant ?? '',
      pageQuality: '',
      keyNotes: (ai as AIComic)?.first_appearance ?? '',
      extractedText: extractSummary(scan?.category, ai),
      imageUri: scan?.imageUri ?? null,
    } as const;
    return fallback;
  });

  const [filling, setFilling] = useState(false);

  const [factIdx, setFactIdx] = useState<number>(0);
  const factsPool = useMemo(() => pickFacts(scan?.category), [scan?.category]);

  const [showStop, setShowStop] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!filling) return;
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    pulseLoop.start();
    spinLoop.start();
    return () => {
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [filling, pulse, spin]);

  useEffect(() => {
    if (!filling || factsPool.length === 0) return;
    const interval = setInterval(
      () => setFactIdx((prev) => randomIdx(factsPool.length, prev)),
      5000
    );
    return () => clearInterval(interval);
  }, [filling, factsPool.length]);

  useEffect(() => {
    if (!filling) return;
    const t = setTimeout(() => setShowStop(true), 30000);
    return () => clearTimeout(t);
  }, [filling]);

  useEffect(() => {
    (async () => {
      if (!scan?.imageUri || !scan?.category) return;
      const hasExistingAI = scan.ai && Object.keys(scan.ai).length > 0;
      if (hasExistingAI) return;

      try {
        setFilling(true);
        setShowStop(false);
        abortRef.current = new AbortController();

        const ai = await analyzerRef.current?.analyzeImage(
          scan.category as CurioCategory,
          scan.imageUri,
          abortRef.current.signal
        );

        if (scan.category === 'Card' && ai) {
          ai.variation_details = normalizeParallelVariant(
            ai.variation_details,
            ai.tcg_edition,
            ai.title_for_ui
          );
        }

        LastScanStore.set({ ...scan, ai } as any);
        setForm((prev: any) => ({
          ...prev,
          name: ai?.title_for_ui ?? prev.name,
          value:
            typeof ai?.estimated_value_usd === 'number' &&
            ai.estimated_value_usd > 0
              ? String(ai.estimated_value_usd)
              : prev.value,
          gradingCompany: ai?.grading_company ?? prev.gradingCompany,
          grade: ai?.grade ?? prev.grade,
          certificationNumber:
            ai?.certification_number ?? prev.certificationNumber,
          country: ai?.country ?? prev.country,
          year: ai?.year ?? prev.year,
          setSeries: ai?.set ?? prev.setSeries,
          cardNumber: ai?.card_number ?? prev.cardNumber,
          cardName: ai?.character ?? prev.cardName,
          sportGenre: ai?.tcg_category ?? prev.sportGenre,
          mintDesignation: deriveMintDesignation(ai ?? null) || prev.mintDesignation,
          parallelVariant:
            normalizeParallelVariant(
              ai?.variation_details,
              ai?.tcg_edition,
              ai?.title_for_ui
            ) || prev.parallelVariant,
          autograph:
            ((ai?.autographed ?? '').toString().toLowerCase() === 'yes') ||
            prev.autograph,
          autographWho: ai?.autographed_by ?? prev.autographWho,
          denomination: ai?.denomination ?? prev.denomination,
          coinName:
            ai?.coins_type ?? ai?.coin_product_name ?? prev.coinName,
          mintMark: ai?.mint_mark ?? prev.mintMark,
          strikeType: ai?.production_type ?? prev.strikeType,
          designation: ai?.design_variation ?? prev.designation,
          variety: ai?.design_variation_details ?? prev.variety,
          yearDisplayed: ai?.year_displayed ?? prev.yearDisplayed,
          specialDesignation: ai?.special_designation ?? prev.specialDesignation,
          designer: ai?.designer ?? prev.designer,
          specialLabel: ai?.special_label ?? prev.specialLabel,
          pedigree: ai?.pedigree ?? prev.pedigree,
          seriesName: ai?.series_name ?? prev.seriesName,
          mintLocation: ai?.mint_location ?? prev.mintLocation,
          metalFineness: ai?.metal_fineness ?? prev.metalFineness,
          weight: ai?.weight ?? prev.weight,
          designDetails: ai?.design_details ?? prev.designDetails,
          yearOfPublication: ai?.year ?? prev.yearOfPublication,
          publisher: ai?.publisher ?? prev.publisher,
          seriesTitle: ai?.comic_title ?? prev.seriesTitle,
          issueNumber: ai?.comic_issue_number ?? prev.issueNumber,
          variantEdition: ai?.variant ?? prev.variantEdition,
          keyNotes: ai?.first_appearance ?? prev.keyNotes,
          description:
            ai?.fact_description &&
            ai.fact_description.trim().length >= 40
              ? ai.fact_description.trim()
              : buildFallbackDescription(
                  scan.category as CurioCategory,
                  ai ?? null
                ) || prev.description,
          extractedText: extractSummary(scan.category, ai),
        }));
      } catch (e: any) {
        if (e?.name === 'AbortError')
          Alert.alert('Stopped', 'Scan analysis was cancelled.');
        else
          Alert.alert(
            'AI Error',
            e?.message ||
              'Could not auto-fill details. You can edit fields manually.'
          );
      } finally {
        setFilling(false);
        abortRef.current = null;
      }
    })();
  }, []);

  const set = (k: any, v: any) =>
    setForm((prev: any) => ({ ...prev, [k]: v }));

  const onSave = () => {
    if (!form.name || !form.value) {
      Alert.alert(
        'Missing Info',
        'Please provide both a Name and Estimated Value.'
      );
      return;
    }
    const parsed = parseFloat(form.value.replace(/[^0-9.]/g, '')) || 0;
    const formattedGrade =
      form.gradingCompany && form.grade
        ? `${form.gradingCompany}-${form.grade}`
        : form.grade || undefined;

    setItems((prev) => [
      {
        id: Date.now().toString(),
        name: form.name,
        type: form.type,
        value: parsed,
        initialValue: parsed,
        grade: formattedGrade,
        imageUrl:
          form.imageUri ||
          'https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg',
        description: form.description,
        dateAdded: new Date(),
        meta: {
          country: form.country,
          certificationNumber: form.certificationNumber,
          hiddenDescription: form.hiddenDescription,
          year: form.year,
          set: form.setSeries,
          cardNumber: form.cardNumber,
          character: form.cardName,
          sportGenre: form.sportGenre,
          mintDesignation: form.mintDesignation,
          parallelVariant: form.parallelVariant,
          autograph: form.autograph,
          autographWho: form.autographWho,
          yearDisplayed: form.yearDisplayed,
          mintMark: form.mintMark,
          coinName: form.coinName,
          strikeType: form.strikeType,
          designation: form.designation,
          variety: form.variety,
          specialDesignation: form.specialDesignation,
          designer: form.designer,
          specialLabel: form.specialLabel,
          pedigree: form.pedigree,
          seriesName: form.seriesName,
          mintLocation: form.mintLocation,
          metalFineness: form.metalFineness,
          weight: form.weight,
          designDetails: form.designDetails,
          yearOfPublication: form.yearOfPublication,
          publisher: form.publisher,
          seriesTitle: form.seriesTitle,
          issueNumber: form.issueNumber,
          variantEdition: form.variantEdition,
          pageQuality: form.pageQuality,
          keyNotes: form.keyNotes,
        },
      },
      ...prev,
    ]);

    LastScanStore.clear();
    DeviceEventEmitter.emit(CURIO_RESET_CAPTURE);

    Alert.alert('Saved', 'Collectible added to your collection.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const onStop = () => abortRef.current?.abort();

  const buildPriceInput = (): PriceInput => ({
    category: (form.type as 'Card' | 'Coin' | 'Comic' | 'Other') ?? 'Other',
    gradingCompany: form.gradingCompany,
    grade: form.grade,
    certificationNumber: form.certificationNumber,
    country: form.country,
    year: form.year,
    setSeries: form.setSeries,
    cardNumber: form.cardNumber,
    cardName: form.cardName,
    sportGenre: form.sportGenre,
    parallelVariant: form.parallelVariant,
    autograph: !!form.autograph,
    autographWho: form.autographWho,
    yearDisplayed: form.yearDisplayed,
    mintMark: form.mintMark,
    coinName: form.coinName,
    denomination: form.denomination,
    strikeType: form.strikeType,
    designation: form.designation,
    variety: form.variety,
    specialDesignation: form.specialDesignation,
    designer: form.designer,
    specialLabel: form.specialLabel,
    pedigree: form.pedigree,
    seriesName: form.seriesName,
    mintLocation: form.mintLocation,
    metalFineness: form.metalFineness,
    weight: form.weight,
    designDetails: form.designDetails,
    yearOfPublication: form.yearOfPublication,
    publisher: form.publisher,
    seriesTitle: form.seriesTitle,
    issueNumber: form.issueNumber,
    variantEdition: form.variantEdition,
  });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.appBg }}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => {
              router.replace('/');
            }}
          >
            <ArrowLeft size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={s.hTitle}>Item Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={s.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: Math.max(
              (footerH || 72) + insets.bottom + 12,
              kbHeight + 12
            ),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <View style={s.hero}>
            <View style={s.heroRow}>
              <TouchableOpacity
                style={s.heroImgWrap}
                onPress={() => form.imageUri && setShowPhotoModal(true)}
                activeOpacity={0.7}
              >
                {form.imageUri ? (
                  <Image
                    source={{ uri: form.imageUri }}
                    style={s.heroImg}
                    resizeMode="cover"
                  />
                ) : null}
              </TouchableOpacity>
              <View style={s.heroMeta}>
                <TextInput
                  placeholder="Item name"
                  placeholderTextColor={theme.colors.muted}
                  style={s.nameInput}
                  value={form.name}
                  onChangeText={(t) => set('name', t)}
                  multiline
                />
                <View style={s.pillRow}>
                  <View style={s.pill}>
                    <Text style={s.pillText}>{form.type}</Text>
                  </View>
                  {!!form.grade && (
                    <View style={s.pill}>
                      <Text style={s.pillText}>
                        {form.gradingCompany
                          ? `${form.gradingCompany}-${form.grade}`
                          : form.grade}
                      </Text>
                    </View>
                  )}
                  {!!form.country && (
                    <View style={s.pill}>
                      <Text style={s.pillText}>{form.country}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            {!!form.extractedText && (
              <Text style={{ color: theme.colors.subtext, fontSize: 12 }}>
                {form.extractedText}
              </Text>
            )}
          </View>

          {/* VALUE & COMMON */}
          <View style={s.section}>
            <Text style={s.sTitle}>Value & Common</Text>
            <View style={s.card}>
              <View style={[s.row, { alignItems: 'flex-end' }]}>
                <View style={s.half}>
                  <Text style={s.label}>Estimated Value (USD) *</Text>
                  <TextInput
                    style={s.input}
                    keyboardType="numeric"
                    value={form.value}
                    onChangeText={(t) => set('value', t)}
                    placeholder="$0.00"
                    placeholderTextColor={theme.colors.muted}
                  />
                </View>

                <View style={{ width: 120 }}>
                  <Text style={s.label}> </Text>

                  {form.type === 'Other' ? (
                    <Text
                      style={[
                        s.label,
                        {
                          fontSize: 10,
                          lineHeight: 12,
                        },
                      ]}
                    >
                      Price tracking may not be available for this item, so its
                      value likely won&apos;t auto-update.
                    </Text>
                  ) : (
                    <TouchableOpacity
                      style={s.inlineBtn}
                      activeOpacity={0.9}
                      onPress={() => {
                        setDebugLogs([]);
                        analyzerRef.current?.fetchPrice(buildPriceInput());
                      }}
                    >
                      <PriceIcon size={16} color="#0E1A2A" />
                      <Text style={[s.inlineBtnTxt, { marginLeft: 6 }]}>
                        Price
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={{ height: 10 }} />
              <View style={s.row}>
                <View style={s.half}>
                  <Text style={s.label}>Country</Text>
                  <TextInput
                    style={s.input}
                    value={form.country}
                    onChangeText={(t) => set('country', t)}
                    placeholder="e.g., United States"
                    placeholderTextColor={theme.colors.muted}
                  />
                </View>
                <View style={s.half}>
                  <Text style={s.label}>Grading Company</Text>
                  <TextInput
                    style={s.input}
                    value={form.gradingCompany}
                    onChangeText={(t) => set('gradingCompany', t)}
                    placeholder="PSA / BGS / CGC / PCGS / NGC..."
                    placeholderTextColor={theme.colors.muted}
                  />
                </View>
              </View>

              <View style={{ height: 10 }} />
              <View style={s.row}>
                <View style={s.half}>
                  <Text style={s.label}>Grade</Text>
                  <TextInput
                    style={s.input}
                    value={form.grade}
                    onChangeText={(t) => set('grade', t)}
                    placeholder="MS 70 / PF 70 / PR 69..."
                    placeholderTextColor={theme.colors.muted}
                  />
                </View>
                <View style={s.half}>
                  <Text style={s.label}>Certification #</Text>
                  <TextInput
                    style={s.input}
                    value={form.certificationNumber}
                    onChangeText={(t) => set('certificationNumber', t)}
                    placeholder="e.g., 12345678"
                    placeholderTextColor={theme.colors.muted}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* TYPE-SPECIFIC FIELDS */}
          {form.type === 'Card' && (
            <View style={s.section}>
              <Text style={s.sTitle}>Card Fields</Text>
              <View style={s.card}>
                <View style={s.row}>
                  <View style={s.half}>
                    <Text style={s.label}>Year</Text>
                    <TextInput
                      style={s.input}
                      value={form.year}
                      onChangeText={(t) => set('year', t)}
                      placeholder="2018"
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                  <View style={s.half}>
                    <Text style={s.label}>Card #</Text>
                    <TextInput
                      style={s.input}
                      value={form.cardNumber}
                      onChangeText={(t) => set('cardNumber', t)}
                      placeholder="#10-KB"
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                </View>

                <View style={{ height: 10 }} />
                <Text style={s.label}>Set / Series</Text>
                <TextInput
                  style={s.input}
                  value={form.setSeries}
                  onChangeText={(t) => set('setSeries', t)}
                  placeholder="Panini Certified 10th Anniversary"
                  placeholderTextColor={theme.colors.muted}
                />

                <View style={{ height: 10 }} />
                <Text style={s.label}>Card Name / Player</Text>
                <TextInput
                  style={s.input}
                  value={form.cardName}
                  onChangeText={(t) => set('cardName', t)}
                  placeholder="Kobe Bryant"
                  placeholderTextColor={theme.colors.muted}
                />

                <View style={{ height: 10 }} />
                <View style={s.row}>
                  <View style={s.half}>
                    <Text style={s.label}>Sport / Genre</Text>
                    <TextInput
                      style={s.input}
                      value={form.sportGenre}
                      onChangeText={(t) => set('sportGenre', t)}
                      placeholder="Basketball / Pokemon / ..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                  <View style={s.half}>
                    <Text style={s.label}>Mint Designation / Qualifier</Text>
                    <TextInput
                      style={s.input}
                      value={form.mintDesignation}
                      onChangeText={(t) => set('mintDesignation', t)}
                      placeholder="MINT / GEM MINT / NM-MT ..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                </View>

                <View style={{ height: 10 }} />
                <Text style={s.label}>Parallel / Variant</Text>
                <TextInput
                  style={s.input}
                  value={form.parallelVariant}
                  onChangeText={(t) => set('parallelVariant', t)}
                  placeholder="1st Edition, Holo / Mirror Gold / Refractor ..."
                  placeholderTextColor={theme.colors.muted}
                />
                <View style={{ height: 10 }} />
                <Text style={s.label}>Autograph (who?)</Text>
                <TextInput
                  style={s.input}
                  value={form.autographWho}
                  onChangeText={(t) => set('autographWho', t)}
                  placeholder="Signer name (if applicable)"
                  placeholderTextColor={theme.colors.muted}
                />
              </View>
            </View>
          )}

          {form.type === 'Coin' && (
            <View style={s.section}>
              <Text style={s.sTitle}>Coin Fields</Text>
              <View style={s.card}>
                <View style={s.row}>
                  <View style={s.half}>
                    <Text style={s.label}>Year Displayed</Text>
                    <TextInput
                      style={s.input}
                      value={form.yearDisplayed}
                      onChangeText={(t) => set('yearDisplayed', t)}
                      placeholder="1776–1976 / 2023"
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                  <View style={s.half}>
                    <Text style={s.label}>Mint Mark</Text>
                    <TextInput
                      style={s.input}
                      value={form.mintMark}
                      onChangeText={(t) => set('mintMark', t)}
                      placeholder="P / D / S / W / CC / O"
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                </View>

                <View style={{ height: 10 }} />
                <View style={s.row}>
                  <View style={s.half}>
                    <Text style={s.label}>Coin Name / Type</Text>
                    <TextInput
                      style={s.input}
                      value={form.coinName}
                      onChangeText={(t) => set('coinName', t)}
                      placeholder="Peace Dollar / American Eagle"
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                  <View style={s.half}>
                    <Text style={s.label}>Denomination</Text>
                    <TextInput
                      style={s.input}
                      value={form.denomination}
                      onChangeText={(t) => set('denomination', t)}
                      placeholder="$1 / 50¢ / 25¢..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                </View>

                <View style={{ height: 10 }} />
                <View style={s.row}>
                  <View style={s.half}>
                    <Text style={s.label}>Production / Strike Type</Text>
                    <TextInput
                      style={s.input}
                      value={form.strikeType}
                      onChangeText={(t) => set('strikeType', t)}
                      placeholder="MS / PF / PR / SP / PL / DMPL"
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                  <View style={s.half}>
                    <Text style={s.label}>Designation</Text>
                    <TextInput
                      style={s.input}
                      value={form.designation}
                      onChangeText={(t) => set('designation', t)}
                      placeholder="FBL / FB / FT / DCAM ..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                </View>

                <View style={{ height: 10 }} />
                <Text style={s.label}>Special Designation</Text>
                <TextInput
                  style={s.input}
                  value={form.specialDesignation}
                  onChangeText={(t) => set('specialDesignation', t)}
                  placeholder="Early Releases / First Strike / First Day of Issue..."
                  placeholderTextColor={theme.colors.muted}
                />

                <View style={{ height: 10 }} />
                <View style={s.row}>
                  <View style={s.half}>
                    <Text style={s.label}>Designer</Text>
                    <TextInput
                      style={s.input}
                      value={form.designer}
                      onChangeText={(t) => set('designer', t)}
                      placeholder="Joel Iskowitz / Augustus Saint-Gaudens..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                  <View style={s.half}>
                    <Text style={s.label}>Special Label</Text>
                    <TextInput
                      style={s.input}
                      value={form.specialLabel}
                      onChangeText={(t) => set('specialLabel', t)}
                      placeholder="Master Coin Designer / Ultra Cameo..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                </View>

                <View style={{ height: 10 }} />
                <View style={s.row}>
                  <View style={s.half}>
                    <Text style={s.label}>Variety / Attribution</Text>
                    <TextInput
                      style={s.input}
                      value={form.variety}
                      onChangeText={(t) => set('variety', t)}
                      placeholder="Type 1, VAM, Overdate ..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                  <View style={s.half}>
                    <Text style={s.label}>Pedigree</Text>
                    <TextInput
                      style={s.input}
                      value={form.pedigree}
                      onChangeText={(t) => set('pedigree', t)}
                      placeholder="Eliasberg Collection..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                </View>

                <View style={{ height: 10 }} />
                <View style={s.row}>
                  <View style={s.half}>
                    <Text style={s.label}>Series Name</Text>
                    <TextInput
                      style={s.input}
                      value={form.seriesName}
                      onChangeText={(t) => set('seriesName', t)}
                      placeholder="American Liberty Series..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                  <View style={s.half}>
                    <Text style={s.label}>Mint Location</Text>
                    <TextInput
                      style={s.input}
                      value={form.mintLocation}
                      onChangeText={(t) => set('mintLocation', t)}
                      placeholder="Struck at Philadelphia..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                </View>

                <View style={{ height: 10 }} />
                <View style={s.row}>
                  <View style={s.half}>
                    <Text style={s.label}>Metal / Fineness</Text>
                    <TextInput
                      style={s.input}
                      value={form.metalFineness}
                      onChangeText={(t) => set('metalFineness', t)}
                      placeholder=".999 Fine / .9999 / 24K..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                  <View style={s.half}>
                    <Text style={s.label}>Weight</Text>
                    <TextInput
                      style={s.input}
                      value={form.weight}
                      onChangeText={(t) => set('weight', t)}
                      placeholder="1oz / 5oz / 1/10oz..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                </View>

                <View style={{ height: 10 }} />
                <Text style={s.label}>Design Details</Text>
                <TextInput
                  style={s.input}
                  value={form.designDetails}
                  onChangeText={(t) => set('designDetails', t)}
                  placeholder="High Relief / X-Ray Ag / with Star Privy..."
                  placeholderTextColor={theme.colors.muted}
                />
              </View>
            </View>
          )}

          {form.type === 'Comic' && (
            <View style={s.section}>
              <Text style={s.sTitle}>Comic Fields</Text>
              <View style={s.card}>
                <View style={s.row}>
                  <View style={s.half}>
                    <Text style={s.label}>Year of Publication</Text>
                    <TextInput
                      style={s.input}
                      value={form.yearOfPublication}
                      onChangeText={(t) => set('yearOfPublication', t)}
                      placeholder="1962"
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                  <View style={s.half}>
                    <Text style={s.label}>Publisher</Text>
                    <TextInput
                      style={s.input}
                      value={form.publisher}
                      onChangeText={(t) => set('publisher', t)}
                      placeholder="Marvel, DC ..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                </View>

                <View style={{ height: 10 }} />
                <View style={s.row}>
                  <View style={s.half}>
                    <Text style={s.label}>Series / Title</Text>
                    <TextInput
                      style={s.input}
                      value={form.seriesTitle}
                      onChangeText={(t) => set('seriesTitle', t)}
                      placeholder="Amazing Fantasy"
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                  <View style={s.half}>
                    <Text style={s.label}>Issue #</Text>
                    <TextInput
                      style={s.input}
                      value={form.issueNumber}
                      onChangeText={(t) => set('issueNumber', t)}
                      placeholder="15"
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                </View>

                <View style={{ height: 10 }} />
                <View style={s.row}>
                  <View style={s.half}>
                    <Text style={s.label}>Variant / Edition</Text>
                    <TextInput
                      style={s.input}
                      value={form.variantEdition}
                      onChangeText={(t) => set('variantEdition', t)}
                      placeholder="Newsstand / Direct / Foil ..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                  <View style={s.half}>
                    <Text style={s.label}>Page Quality</Text>
                    <TextInput
                      style={s.input}
                      value={form.pageQuality}
                      onChangeText={(t) => set('pageQuality', t)}
                      placeholder="White / OW-W / ..."
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                </View>

                <View style={{ height: 10 }} />
                <Text style={s.label}>Key Notes</Text>
                <TextInput
                  style={[s.input, s.area]}
                  multiline
                  value={form.keyNotes}
                  onChangeText={(t) => set('keyNotes', t)}
                  placeholder="First appearance, story arc, etc."
                  placeholderTextColor={theme.colors.muted}
                  onFocus={() =>
                    setTimeout(
                      () =>
                        scrollRef.current?.scrollToEnd({
                          animated: true,
                        }),
                      50
                    )
                  }
                />
              </View>
            </View>
          )}

          {/* DESCRIPTION */}
          <View style={s.section}>
            <Text style={s.sTitle}>Notes</Text>
            <View style={s.card}>
              <Text style={s.label}>Description</Text>
              <TextInput
                style={[s.input, s.area]}
                multiline
                value={form.description}
                onChangeText={(t) => set('description', t)}
                placeholder="Facts-only summary. Auto-filled from the slab if certain."
                placeholderTextColor={theme.colors.muted}
                onFocus={() =>
                  setTimeout(
                    () =>
                      scrollRef.current?.scrollToEnd({
                        animated: true,
                      }),
                    50
                  )
                }
              />
            </View>
          </View>

          {/* HIDDEN DESCRIPTION */}
          <View style={s.section}>
            <Text style={s.sTitle}>Hidden description</Text>
            <View style={s.card}>
              <Text style={s.label}>Private notes (not shown elsewhere)</Text>
              <TextInput
                style={[s.input, s.area]}
                multiline
                value={form.hiddenDescription}
                onChangeText={(t) => set('hiddenDescription', t)}
                placeholder="Purchase date, gift from, where acquired, insurance notes…"
                placeholderTextColor={theme.colors.muted}
                onFocus={() =>
                  setTimeout(
                    () =>
                      scrollRef.current?.scrollToEnd({
                        animated: true,
                      }),
                    50
                  )
                }
              />
            </View>
          </View>

          {/* DEBUG LOGS SECTION */}
          {debugLogs.length > 0 && (
            <View style={s.section}>
              <Text style={s.sTitle}>Price Fetch Debug Logs</Text>
              <View style={s.card}>
                <Text style={s.debugHeader}>
                  Debug Logs ({debugLogs.length})
                </Text>
                <ScrollView style={s.debugContainer} nestedScrollEnabled={true}>
                  {debugLogs.map((log, idx) => {
                    const time = new Date(log.timestamp).toLocaleTimeString();
                    const logColor = log.level === 'error' ? '#ef4444' : log.level === 'warn' ? '#f59e0b' : theme.colors.subtext;
                    return (
                      <View 
                        key={idx} 
                        style={[
                          s.debugItem,
                          idx < debugLogs.length - 1 && s.debugDivider
                        ]}
                      >
                        <Text style={[s.debugTime, { color: logColor }]}>
                          [{time}] {log.level.toUpperCase()}
                        </Text>
                        <Text style={[s.debugMessage, { color: logColor }]}>
                          {log.message}
                        </Text>
                        {log.data && (
                          <Text style={{ color: theme.colors.muted, fontSize: 9, marginTop: 4 }}>
                            {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Loading Overlay */}
        {filling && (
          <View style={s.overlayRoot}>
            <View style={s.glassCard}>
              <Text style={s.loadTitle}>Analyzing your collectible…</Text>

              <View style={s.animRow}>
                <Animated.View
                  style={{
                    width: 104,
                    height: 104,
                    borderRadius: 52,
                    borderWidth: 4,
                    borderColor: theme.colors.border,
                    borderTopColor: theme.colors.accent,
                    transform: [{ rotate }],
                  }}
                />
              </View>

              <View style={s.factWrap}>
                <Text style={s.factLabel}>Did you know?</Text>
                <Animated.Text key={factIdx} style={s.factText}>
                  {factsPool[factIdx]}
                </Animated.Text>
              </View>

              {showStop && (
                <TouchableOpacity style={s.stopBtn} onPress={onStop}>
                  <X size={16} color={theme.colors.text} />
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontWeight: '700',
                    }}
                  >
                    Stop
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <View
          style={[s.footer, { paddingBottom: 0 + insets.bottom }]}
          onLayout={(e) => setFooterH(e.nativeEvent.layout.height)}
        >
          <TouchableOpacity style={s.saveBtn} onPress={onSave}>
            <Save size={18} color="#0E1A2A" />
            <Text style={s.saveTxt}>Save to Collection</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CurioAIAnalyzer
        ref={analyzerRef}
        onPriceResult={handlePrice}
        onLogsUpdate={onLogsUpdate}
        accent={theme.colors.accent}
        text={theme.colors.text}
        surface={theme.colors.surface}
        border={theme.colors.border}
      />

      <PhotoEnlargeModal
        visible={showPhotoModal}
        imageUri={form.imageUri}
        onClose={() => setShowPhotoModal(false)}
        accentColor={theme.colors.accent}
      />
    </SafeAreaView>
  );
}