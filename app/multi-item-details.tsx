// app/multi-item-details.tsx
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
  Dimensions,
  DeviceEventEmitter,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  Save,
  Check,
  X as XIcon,
  ChevronLeft,
  ChevronRight,
  Coins as PriceIcon,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useCollection } from '@/contexts/CollectionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CurioCategory } from '@/lib/LastScanStore';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Unified AI & Price Analyzer
import CurioAIAnalyzer, {
  CurioAIAnalyzerHandle,
  PriceInput,
  PriceResult,
  AIAnalysisResult,
  normalizeParallelVariant,
  deriveMintDesignation,
  buildFallbackDescription,
} from '../components/CurioAIAnalyzer';

// Other components
import PhotoEnlargeModal from '../components/PhotoEnlargeModal';
import CurioArcadeLoader from '../components/CurioArcadeLoader';

const CURIO_RESET_CAPTURE = 'CURIO_RESET_CAPTURE';
const THEME_STORAGE_KEY = 'APP_THEME_MODE';
type ThemeMode = 'light' | 'dark';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.88;

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
        placeholder: 'rgba(169, 182, 198, 0.35)', // More subtle placeholder
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
      placeholder: 'rgba(156, 163, 175, 0.45)', // More subtle placeholder
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

    cardContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
    },
    itemCard: {
      width: CARD_WIDTH,
      backgroundColor: t.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: t.colors.border,
      overflow: 'hidden',
      shadowColor: t.dark ? '#000' : '#1E3A5F',
      shadowOpacity: t.dark ? 0.4 : 0.12,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 8,
    },

    imageSection: {
      width: '100%',
      height: 240,
      backgroundColor: t.colors.appBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    itemImage: { width: '100%', height: '100%' },

    formSection: {
      padding: 16,
      maxHeight: 380,
    },

    scrollContent: {
      paddingBottom: 12,
    },

    row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    half: { flex: 1 },
    label: {
      fontSize: 12,
      color: t.colors.subtext,
      marginBottom: 6,
      fontWeight: '600',
    },
    input: {
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.inputBg,
      borderRadius: 8,
      padding: 10,
      color: t.colors.text,
      fontSize: 14,
    },
    area: { minHeight: 80, textAlignVertical: 'top' },

    inlineBtn: {
      height: 40,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: t.colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inlineBtnTxt: { color: '#0E1A2A', fontWeight: '700', fontSize: 11 },

    navControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      backgroundColor: t.colors.surface,
    },
    navBtn: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: t.colors.surface,
      borderWidth: 2,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: t.dark ? '#000' : '#1E3A5F',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 4,
    },
    navBtnDisabled: { opacity: 0.3 },
    navBtnApprove: {
      backgroundColor: t.colors.accent,
      borderColor: t.colors.accent,
      shadowColor: t.colors.accent,
      shadowOpacity: 0.4,
    },
    navBtnReject: {
      backgroundColor: '#EF4444',
      borderColor: '#EF4444',
      shadowColor: '#EF4444',
      shadowOpacity: 0.4,
    },

    progressText: {
      fontSize: 16,
      fontWeight: '700',
      color: t.colors.text,
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

    pricingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: t.colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    pricingCard: {
      width: '86%',
      borderRadius: 20,
      padding: 24,
      backgroundColor: t.colors.glass,
      borderWidth: 1,
      borderColor: t.colors.softBorder,
      alignItems: 'center',
    },
    pricingTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: t.colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    pricingProgress: {
      fontSize: 14,
      color: t.colors.subtext,
      marginTop: 12,
      textAlign: 'center',
    },
  });
}

/* ---------------- Item Form Interface ---------------- */
interface ItemForm {
  imageUri: string;
  type: CurioCategory;
  name: string;
  value: string;
  description: string;
  hiddenDescription: string;
  gradingCompany: string;
  grade: string;
  certificationNumber: string;
  country: string;
  year: string;
  setSeries: string;
  cardNumber: string;
  cardName: string;
  sportGenre: string;
  mintDesignation: string;
  parallelVariant: string;
  autograph: boolean;
  autographWho: string;
  denomination: string;
  coinName: string;
  mintMark: string;
  strikeType: string;
  designation: string;
  variety: string;
  yearDisplayed: string;
  specialDesignation: string;
  designer: string;
  specialLabel: string;
  pedigree: string;
  seriesName: string;
  mintLocation: string;
  metalFineness: string;
  weight: string;
  designDetails: string;
  yearOfPublication: string;
  publisher: string;
  seriesTitle: string;
  issueNumber: string;
  variantEdition: string;
  pageQuality: string;
  keyNotes: string;
  approved: boolean;
  rejected: boolean;
  aiData?: AIAnalysisResult;
}

/* ---------------- Main Component ---------------- */
export default function MultiItemDetailsScreen() {
  const { setItems } = useCollection();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  
  // Unified analyzer ref
  const analyzerRef = useRef<CurioAIAnalyzerHandle>(null);

  const [mode, setMode] = useState<ThemeMode>('light');
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') setMode(stored);
    })();
  }, []);
  const theme = useMemo(() => getTheme(mode), [mode]);
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [category, setCategory] = useState<CurioCategory>('Card');
  const [photos, setPhotos] = useState<string[]>([]);
  const [items, setItemForms] = useState<ItemForm[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [pricingProgress, setPricingProgress] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  // Load photos and analyze
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('CURIO_MULTI_PHOTOS');
        if (!stored) {
          Alert.alert('No Data', 'No photos found for multi-upload.');
          router.back();
          return;
        }
        const data = JSON.parse(stored);
        setCategory(data.category);
        setPhotos(data.photos);

        // Analyze all photos
        abortRef.current = new AbortController();
        const analyzed: ItemForm[] = [];

        for (let i = 0; i < data.photos.length; i++) {
          const uri = data.photos[i];
          const ai = await analyzerRef.current?.analyzeImage(
            data.category,
            uri,
            abortRef.current.signal
          );

          // Post-process for cards
          if (data.category === 'Card' && ai) {
            ai.variation_details = normalizeParallelVariant(
              ai.variation_details,
              ai.tcg_edition,
              ai.title_for_ui
            );
          }

          analyzed.push({
            imageUri: uri,
            type: data.category,
            name: ai?.title_for_ui ?? '',
            value:
              typeof ai?.estimated_value_usd === 'number' &&
              ai.estimated_value_usd > 0
                ? String(ai.estimated_value_usd)
                : '',
            description:
              ai?.fact_description && ai.fact_description.trim().length >= 40
                ? ai.fact_description.trim()
                : buildFallbackDescription(data.category, ai ?? null),
            hiddenDescription: '',
            gradingCompany: ai?.grading_company ?? '',
            grade: ai?.grade ?? '',
            certificationNumber: ai?.certification_number ?? '',
            country: ai?.country ?? '',
            year: ai?.year ?? '',
            setSeries: ai?.set ?? '',
            cardNumber: ai?.card_number ?? '',
            cardName: ai?.character ?? '',
            sportGenre: ai?.tcg_category ?? '',
            mintDesignation: deriveMintDesignation(ai ?? null),
            parallelVariant:
              normalizeParallelVariant(
                ai?.variation_details,
                ai?.tcg_edition,
                ai?.title_for_ui
              ) || '',
            autograph:
              (ai?.autographed ?? '').toString().toLowerCase() === 'yes',
            autographWho: ai?.autographed_by ?? '',
            denomination: ai?.denomination ?? '',
            coinName: ai?.coin_product_name ?? ai?.coins_type ?? '',
            mintMark: ai?.mint_mark ?? '',
            strikeType: ai?.production_type ?? '',
            designation: ai?.design_variation ?? '',
            variety: ai?.design_variation_details ?? '',
            yearDisplayed: ai?.year_displayed ?? '',
            specialDesignation: ai?.special_designation ?? '',
            designer: ai?.designer ?? '',
            specialLabel: ai?.special_label ?? '',
            pedigree: ai?.pedigree ?? '',
            seriesName: ai?.series_name ?? '',
            mintLocation: ai?.mint_location ?? '',
            metalFineness: ai?.metal_fineness ?? '',
            weight: ai?.weight ?? '',
            designDetails: ai?.design_details ?? '',
            yearOfPublication: ai?.year ?? '',
            publisher: ai?.publisher ?? '',
            seriesTitle: ai?.comic_title ?? '',
            issueNumber: ai?.comic_issue_number ?? '',
            variantEdition: ai?.variant ?? '',
            pageQuality: '',
            keyNotes: ai?.first_appearance ?? '',
            approved: false,
            rejected: false,
            aiData: ai,
          });

          setAnalyzedCount(i + 1);
        }

        setItemForms(analyzed);
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          Alert.alert('Stopped', 'Analysis was cancelled.');
        } else {
          Alert.alert('Error', e?.message || 'Could not analyze photos.');
        }
        router.back();
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    })();
  }, []);

  const currentItem = items[currentIndex];

  const updateField = (field: keyof ItemForm, value: any) => {
    setItemForms((prev) => {
      const updated = [...prev];
      updated[currentIndex] = { ...updated[currentIndex], [field]: value };
      return updated;
    });
  };

  const buildPriceInput = (item: ItemForm): PriceInput => ({
    category: item.type,
    gradingCompany: item.gradingCompany,
    grade: item.grade,
    certificationNumber: item.certificationNumber,
    country: item.country,
    year: item.year,
    setSeries: item.setSeries,
    cardNumber: item.cardNumber,
    cardName: item.cardName,
    sportGenre: item.sportGenre,
    parallelVariant: item.parallelVariant,
    autograph: item.autograph,
    autographWho: item.autographWho,
    yearDisplayed: item.yearDisplayed,
    mintMark: item.mintMark,
    coinName: item.coinName,
    denomination: item.denomination,
    strikeType: item.strikeType,
    designation: item.designation,
    variety: item.variety,
    specialDesignation: item.specialDesignation,
    designer: item.designer,
    specialLabel: item.specialLabel,
    pedigree: item.pedigree,
    seriesName: item.seriesName,
    mintLocation: item.mintLocation,
    metalFineness: item.metalFineness,
    weight: item.weight,
    designDetails: item.designDetails,
    yearOfPublication: item.yearOfPublication,
    publisher: item.publisher,
    seriesTitle: item.seriesTitle,
    issueNumber: item.issueNumber,
    variantEdition: item.variantEdition,
  });

  const handlePriceThis = () => {
    if (!currentItem) return;
    analyzerRef.current?.fetchPrice(buildPriceInput(currentItem));
  };

  const handlePrice = (r: PriceResult) => {
    const mid = Math.max(0, Math.round(r.price_mid || 0));
    updateField('value', mid ? String(mid) : '');
  };

  // New function that accepts the items array directly
  const handleSaveAllWithItems = async (itemsToSave: ItemForm[]) => {
    const approved = itemsToSave.filter((i) => i.approved && !i.rejected);

    if (approved.length === 0) {
      Alert.alert('No Items', 'No items were approved. Nothing to save.');
      await AsyncStorage.removeItem('CURIO_MULTI_PHOTOS');
      DeviceEventEmitter.emit(CURIO_RESET_CAPTURE);
      router.back();
      return;
    }

    // Batch pricing
    setShowPricing(true);
    setPricingProgress(0);

    const pricedItems: ItemForm[] = [];
    for (let i = 0; i < approved.length; i++) {
      const item = approved[i];

      // Skip pricing if value already exists
      if (item.value && parseFloat(item.value.replace(/[^0-9.]/g, '')) > 0) {
        pricedItems.push(item);
        setPricingProgress(((i + 1) / approved.length) * 100);
        continue;
      }

      try {
        // Use unified analyzer for pricing
        await new Promise<void>((resolve) => {
          if (analyzerRef.current) {
            analyzerRef.current.fetchPrice(buildPriceInput(item));
            // Wait for pricing to complete
            setTimeout(resolve, 2000);
          } else {
            resolve();
          }
        });
      } catch (err) {
        console.warn('Pricing failed for item', err);
      }

      pricedItems.push(item);
      setPricingProgress(((i + 1) / approved.length) * 100);
    }

    setShowPricing(false);

    // Save all to collection
    setItems((prev) => [
      ...pricedItems.map((item) => {
        const parsed = parseFloat(item.value.replace(/[^0-9.]/g, '')) || 0;
        const formattedGrade =
          item.gradingCompany && item.grade
            ? `${item.gradingCompany}-${item.grade}`
            : item.grade || undefined;

        return {
          id: Date.now().toString() + Math.random(),
          name: item.name,
          type: item.type,
          value: parsed,
          initialValue: parsed,
          grade: formattedGrade,
          imageUrl: item.imageUri,
          description: item.description,
          dateAdded: new Date(),
          meta: {
            country: item.country,
            certificationNumber: item.certificationNumber,
            hiddenDescription: item.hiddenDescription,
            year: item.year,
            set: item.setSeries,
            cardNumber: item.cardNumber,
            character: item.cardName,
            sportGenre: item.sportGenre,
            mintDesignation: item.mintDesignation,
            parallelVariant: item.parallelVariant,
            autograph: item.autograph,
            autographWho: item.autographWho,
            yearDisplayed: item.yearDisplayed,
            mintMark: item.mintMark,
            coinName: item.coinName,
            strikeType: item.strikeType,
            designation: item.designation,
            variety: item.variety,
            specialDesignation: item.specialDesignation,
            designer: item.designer,
            specialLabel: item.specialLabel,
            pedigree: item.pedigree,
            seriesName: item.seriesName,
            mintLocation: item.mintLocation,
            metalFineness: item.metalFineness,
            weight: item.weight,
            designDetails: item.designDetails,
            yearOfPublication: item.yearOfPublication,
            publisher: item.publisher,
            seriesTitle: item.seriesTitle,
            issueNumber: item.issueNumber,
            variantEdition: item.variantEdition,
            pageQuality: item.pageQuality,
            keyNotes: item.keyNotes,
          },
        };
      }),
      ...prev,
    ]);

    await AsyncStorage.removeItem('CURIO_MULTI_PHOTOS');
    DeviceEventEmitter.emit(CURIO_RESET_CAPTURE);

    Alert.alert(
      'Success!',
      `${pricedItems.length} item${pricedItems.length !== 1 ? 's' : ''} added to your collection.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  // Keep the original handleSaveAll for the manual Save button
  const handleSaveAll = async () => {
    handleSaveAllWithItems(items);
  };

  // FIX: Use callback to ensure state is updated before proceeding
  const handleApprove = () => {
    setItemForms((prev) => {
      const updated = [...prev];
      updated[currentIndex] = { 
        ...updated[currentIndex], 
        approved: true, 
        rejected: false 
      };
      
      // Check if this was the last item after updating
      setTimeout(() => {
        if (currentIndex < prev.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // All items reviewed, trigger save with updated array
          handleSaveAllWithItems(updated);
        }
      }, 0);
      
      return updated;
    });
  };

  const handleReject = () => {
    setItemForms((prev) => {
      const updated = [...prev];
      updated[currentIndex] = { 
        ...updated[currentIndex], 
        rejected: true, 
        approved: false 
      };
      
      // Check if this was the last item after updating
      setTimeout(() => {
        if (currentIndex < prev.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // All items reviewed, trigger save with updated array
          handleSaveAllWithItems(updated);
        }
      }, 0);
      
      return updated;
    });
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const onCancelAnalysis = () => {
    abortRef.current?.abort();
    router.back();
  };

  if (!currentItem && !loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.appBg }}
        edges={['bottom']}
      >
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => {
              router.back();
            }}
          >
            <ArrowLeft size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={s.hTitle}>Multi-Item Review</Text>
          <View style={{ width: 40 }} />
        </View>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          <Text
            style={{ fontSize: 16, color: theme.colors.text, textAlign: 'center' }}
          >
            No items to review
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.appBg }}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => {
              router.back();
            }}
          >
            <ArrowLeft size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={s.hTitle}>Review Items</Text>
          <View style={{ width: 40 }} />
        </View>

        {!loading && currentItem && (
          <>
            <View style={s.cardContainer}>
              <View style={s.itemCard}>
                <TouchableOpacity
                  style={s.imageSection}
                  onPress={() => setShowPhotoModal(true)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: currentItem.imageUri }}
                    style={s.itemImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                <ScrollView
                  ref={scrollRef}
                  style={s.formSection}
                  contentContainerStyle={s.scrollContent}
                  keyboardDismissMode="interactive"
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={{ marginBottom: 10 }}>
                    <Text style={s.label}>Item Name *</Text>
                    <TextInput
                      placeholder="Item name"
                      placeholderTextColor={theme.colors.placeholder}
                      style={s.input}
                      value={currentItem.name}
                      onChangeText={(t) => updateField('name', t)}
                    />
                  </View>

                  <View style={[s.row, { alignItems: 'flex-end' }]}>
                    <View style={s.half}>
                      <Text style={s.label}>Value (USD) *</Text>
                      <TextInput
                        style={s.input}
                        keyboardType="numeric"
                        value={currentItem.value}
                        onChangeText={(t) => updateField('value', t)}
                        placeholder="$0.00"
                        placeholderTextColor={theme.colors.placeholder}
                      />
                    </View>

                    <View style={{ width: 100 }}>
                      <TouchableOpacity
                        style={s.inlineBtn}
                        activeOpacity={0.9}
                        onPress={handlePriceThis}
                      >
                        <PriceIcon size={14} color="#0E1A2A" />
                        <Text style={[s.inlineBtnTxt, { marginLeft: 4 }]}>
                          Price
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={s.row}>
                    <View style={s.half}>
                      <Text style={s.label}>Grading Company</Text>
                      <TextInput
                        style={s.input}
                        value={currentItem.gradingCompany}
                        onChangeText={(t) => updateField('gradingCompany', t)}
                        placeholder="PSA / BGS / CGC..."
                        placeholderTextColor={theme.colors.placeholder}
                      />
                    </View>
                    <View style={s.half}>
                      <Text style={s.label}>Grade</Text>
                      <TextInput
                        style={s.input}
                        value={currentItem.grade}
                        onChangeText={(t) => updateField('grade', t)}
                        placeholder="10 / 9.5 / 9..."
                        placeholderTextColor={theme.colors.placeholder}
                      />
                    </View>
                  </View>

                  <View style={s.row}>
                    <View style={s.half}>
                      <Text style={s.label}>Cert #</Text>
                      <TextInput
                        style={s.input}
                        value={currentItem.certificationNumber}
                        onChangeText={(t) => updateField('certificationNumber', t)}
                        placeholder="12345678"
                        placeholderTextColor={theme.colors.placeholder}
                      />
                    </View>
                    <View style={s.half}>
                      <Text style={s.label}>Country</Text>
                      <TextInput
                        style={s.input}
                        value={currentItem.country}
                        onChangeText={(t) => updateField('country', t)}
                        placeholder="United States"
                        placeholderTextColor={theme.colors.placeholder}
                      />
                    </View>
                  </View>

                  {currentItem.type === 'Card' && (
                    <>
                      <View style={s.row}>
                        <View style={s.half}>
                          <Text style={s.label}>Year</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.year}
                            onChangeText={(t) => updateField('year', t)}
                            placeholder="2018"
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                        <View style={s.half}>
                          <Text style={s.label}>Card #</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.cardNumber}
                            onChangeText={(t) => updateField('cardNumber', t)}
                            placeholder="#10"
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                      </View>

                      <View style={{ marginBottom: 10 }}>
                        <Text style={s.label}>Set / Series</Text>
                        <TextInput
                          style={s.input}
                          value={currentItem.setSeries}
                          onChangeText={(t) => updateField('setSeries', t)}
                          placeholder="Panini Certified"
                          placeholderTextColor={theme.colors.placeholder}
                        />
                      </View>

                      <View style={{ marginBottom: 10 }}>
                        <Text style={s.label}>Player / Character</Text>
                        <TextInput
                          style={s.input}
                          value={currentItem.cardName}
                          onChangeText={(t) => updateField('cardName', t)}
                          placeholder="Kobe Bryant"
                          placeholderTextColor={theme.colors.placeholder}
                        />
                      </View>
                    </>
                  )}

                  {currentItem.type === 'Coin' && (
                    <>
                      <View style={s.row}>
                        <View style={s.half}>
                          <Text style={s.label}>Year Displayed</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.yearDisplayed}
                            onChangeText={(t) => updateField('yearDisplayed', t)}
                            placeholder="1776–1976"
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                        <View style={s.half}>
                          <Text style={s.label}>Mint Mark</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.mintMark}
                            onChangeText={(t) => updateField('mintMark', t)}
                            placeholder="P/D/S..."
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                      </View>

                      <View style={s.row}>
                        <View style={s.half}>
                          <Text style={s.label}>Coin Name / Type</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.coinName}
                            onChangeText={(t) => updateField('coinName', t)}
                            placeholder="Peace Dollar"
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                        <View style={s.half}>
                          <Text style={s.label}>Denomination</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.denomination}
                            onChangeText={(t) => updateField('denomination', t)}
                            placeholder="$1 / 50¢ / 1oz Medal"
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                      </View>

                      <View style={s.row}>
                        <View style={s.half}>
                          <Text style={s.label}>Production / Strike Type</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.strikeType}
                            onChangeText={(t) => updateField('strikeType', t)}
                            placeholder="MS / PF / PR..."
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                        <View style={s.half}>
                          <Text style={s.label}>Designation</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.designation}
                            onChangeText={(t) => updateField('designation', t)}
                            placeholder="FBL / DCAM..."
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                      </View>

                      <View style={{ marginBottom: 10 }}>
                        <Text style={s.label}>Special Designation</Text>
                        <TextInput
                          style={s.input}
                          value={currentItem.specialDesignation}
                          onChangeText={(t) => updateField('specialDesignation', t)}
                          placeholder="Early Releases / First Strike..."
                          placeholderTextColor={theme.colors.placeholder}
                        />
                      </View>

                      <View style={s.row}>
                        <View style={s.half}>
                          <Text style={s.label}>Designer</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.designer}
                            onChangeText={(t) => updateField('designer', t)}
                            placeholder="Joel Iskowitz..."
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                        <View style={s.half}>
                          <Text style={s.label}>Special Label</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.specialLabel}
                            onChangeText={(t) => updateField('specialLabel', t)}
                            placeholder="Master Coin Designer..."
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                      </View>

                      <View style={s.row}>
                        <View style={s.half}>
                          <Text style={s.label}>Variety / Attribution</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.variety}
                            onChangeText={(t) => updateField('variety', t)}
                            placeholder="Type 1, VAM..."
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                        <View style={s.half}>
                          <Text style={s.label}>Pedigree</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.pedigree}
                            onChangeText={(t) => updateField('pedigree', t)}
                            placeholder="Collection name..."
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                      </View>

                      <View style={s.row}>
                        <View style={s.half}>
                          <Text style={s.label}>Series Name</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.seriesName}
                            onChangeText={(t) => updateField('seriesName', t)}
                            placeholder="American Liberty Series..."
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                        <View style={s.half}>
                          <Text style={s.label}>Mint Location</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.mintLocation}
                            onChangeText={(t) => updateField('mintLocation', t)}
                            placeholder="Struck at Philadelphia..."
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                      </View>

                      <View style={s.row}>
                        <View style={s.half}>
                          <Text style={s.label}>Metal / Fineness</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.metalFineness}
                            onChangeText={(t) => updateField('metalFineness', t)}
                            placeholder=".999 Fine / .9999..."
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                        <View style={s.half}>
                          <Text style={s.label}>Weight</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.weight}
                            onChangeText={(t) => updateField('weight', t)}
                            placeholder="1oz / 5oz..."
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                      </View>

                      <View style={{ marginBottom: 10 }}>
                        <Text style={s.label}>Design Details</Text>
                        <TextInput
                          style={s.input}
                          value={currentItem.designDetails}
                          onChangeText={(t) => updateField('designDetails', t)}
                          placeholder="High Relief / X-Ray Ag..."
                          placeholderTextColor={theme.colors.placeholder}
                        />
                      </View>
                    </>
                  )}

                  {currentItem.type === 'Comic' && (
                    <>
                      <View style={s.row}>
                        <View style={s.half}>
                          <Text style={s.label}>Year</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.yearOfPublication}
                            onChangeText={(t) => updateField('yearOfPublication', t)}
                            placeholder="1962"
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                        <View style={s.half}>
                          <Text style={s.label}>Issue #</Text>
                          <TextInput
                            style={s.input}
                            value={currentItem.issueNumber}
                            onChangeText={(t) => updateField('issueNumber', t)}
                            placeholder="15"
                            placeholderTextColor={theme.colors.placeholder}
                          />
                        </View>
                      </View>

                      <View style={{ marginBottom: 10 }}>
                        <Text style={s.label}>Publisher</Text>
                        <TextInput
                          style={s.input}
                          value={currentItem.publisher}
                          onChangeText={(t) => updateField('publisher', t)}
                          placeholder="Marvel"
                          placeholderTextColor={theme.colors.placeholder}
                        />
                      </View>

                      <View style={{ marginBottom: 10 }}>
                        <Text style={s.label}>Series Title</Text>
                        <TextInput
                          style={s.input}
                          value={currentItem.seriesTitle}
                          onChangeText={(t) => updateField('seriesTitle', t)}
                          placeholder="Amazing Fantasy"
                          placeholderTextColor={theme.colors.placeholder}
                        />
                      </View>
                    </>
                  )}

                  <View style={{ marginBottom: 10 }}>
                    <Text style={s.label}>Description</Text>
                    <TextInput
                      style={[s.input, s.area]}
                      multiline
                      value={currentItem.description}
                      onChangeText={(t) => updateField('description', t)}
                      placeholder="Auto-filled description"
                      placeholderTextColor={theme.colors.placeholder}
                    />
                  </View>
                </ScrollView>
              </View>
            </View>

            <View style={s.navControls}>
              <TouchableOpacity
                style={[s.navBtn, currentIndex === 0 && s.navBtnDisabled]}
                onPress={handlePrevious}
                disabled={currentIndex === 0}
                activeOpacity={0.85}
              >
                <ChevronLeft size={28} color={theme.colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.navBtn, s.navBtnReject]}
                onPress={handleReject}
                activeOpacity={0.85}
              >
                <XIcon size={28} color="#FFFFFF" strokeWidth={3} />
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                <Text style={s.progressText}>
                  {currentIndex + 1} / {items.length}
                </Text>
                <Text
                  style={{ fontSize: 11, color: theme.colors.subtext, marginTop: 2 }}
                >
                  {items.filter((i) => i.approved).length} approved
                </Text>
              </View>

              <TouchableOpacity
                style={[s.navBtn, s.navBtnApprove]}
                onPress={handleApprove}
                activeOpacity={0.85}
              >
                <Check size={28} color="#0E1A2A" strokeWidth={3} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  s.navBtn,
                  currentIndex === items.length - 1 && s.navBtnDisabled,
                ]}
                onPress={handleNext}
                disabled={currentIndex === items.length - 1}
                activeOpacity={0.85}
              >
                <ChevronRight size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {items.every((i) => i.approved || i.rejected) && (
              <View style={[s.footer, { paddingBottom: insets.bottom }]}>
                <TouchableOpacity style={s.saveBtn} onPress={handleSaveAll}>
                  <Save size={18} color="#0E1A2A" />
                  <Text style={s.saveTxt}>
                    Save {items.filter((i) => i.approved).length} Item
                    {items.filter((i) => i.approved).length !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* 🎮 ARCADE LOADER OVERLAY */}
        <CurioArcadeLoader
          visible={loading}
          itemCount={photos.length}
          currentProgress={analyzedCount}
          onCancel={onCancelAnalysis}
          isDark={theme.dark}
        />

        {showPricing && (
          <View style={s.pricingOverlay}>
            <View style={s.pricingCard}>
              <Text style={s.pricingTitle}>Fetching Prices...</Text>
              <ActivityIndicator size="large" color={theme.colors.accent} />
              <Text style={s.pricingProgress}>
                {Math.round(pricingProgress)}% Complete
              </Text>
            </View>
          </View>
        )}

        {/* Unified Analyzer with Price Fetching */}
        <CurioAIAnalyzer
          ref={analyzerRef}
          onPriceResult={handlePrice}
          accent={theme.colors.accent}
          text={theme.colors.text}
          surface={theme.colors.surface}
          border={theme.colors.border}
        />

        <PhotoEnlargeModal
          visible={showPhotoModal}
          imageUri={currentItem?.imageUri}
          onClose={() => setShowPhotoModal(false)}
          accentColor={theme.colors.accent}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}