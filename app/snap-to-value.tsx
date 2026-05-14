// app/snap-to-value.tsx - STREAMLINED UX VERSION
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  TextInput,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Camera as CameraIcon, Upload, Check, X, BadgeDollarSign, BookOpen } from 'lucide-react-native';
import { router } from 'expo-router';
import { useFonts, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import PriceFetcher, { PriceFetcherHandle, PriceInput, PriceResult, DebugLog } from '@/components/PriceFetcher';

// Icon imports
import CoinDollarIcon from '@/components/CoinDollarIcon';
import { TradingCardIcon } from '@/components/TradingCardBlank';

type ThemeMode = 'light' | 'dark';
type CurioCategory = 'Card' | 'Coin' | 'Comic';
type CardKind = 'Raw' | 'Graded';

const THEME_STORAGE_KEY = 'APP_THEME_MODE';
const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY || '';

/* ---------------- Theming ---------------- */
function getTheme(mode: ThemeMode) {
  if (mode === 'dark') {
    return {
      dark: true,
      colors: {
        appBg: '#0B1320',
        headerBg: '#0E1A2A',
        surface: '#101b2c',
        surfaceHi: '#132235',
        border: 'rgba(255,255,255,0.10)',
        softBorder: 'rgba(255,255,255,0.08)',
        text: '#D9E4EF',
        subtext: '#A9B6C6',
        muted: '#9CA3AF',
        accent: '#D4AF37',
        pill: 'rgba(234,219,166,0.12)',
        overlay: 'rgba(0,0,0,0.5)',
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
      border: '#E5E7EB',
      softBorder: '#EEF2F7',
      text: '#1E3A5F',
      subtext: '#6B7280',
      muted: '#9CA3AF',
      accent: '#D4AF37',
      pill: '#FEF3C7',
      overlay: 'rgba(255,255,255,0.5)',
    },
  };
}

function makeStyles(t: ReturnType<typeof getTheme>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.appBg },
    header: {
      backgroundColor: t.colors.headerBg,
      paddingTop: 45,
      paddingBottom: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: t.colors.softBorder,
    },
    hTitle: { 
      color: t.colors.accent, 
      fontSize: 18, 
      fontFamily: 'Montserrat_700Bold',
      letterSpacing: 0.5,
    },
    hBtn: { 
      width: 38, 
      height: 38, 
      borderRadius: 19, 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: t.colors.surface,
    },
    content: { flex: 1, padding: 14 },
    card: {
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
    },

    sectionTitle: {
      color: t.colors.text,
      fontFamily: 'Montserrat_600SemiBold',
      fontSize: 14,
      marginBottom: 10,
      letterSpacing: 0.2,
    },

    row: { flexDirection: 'row', gap: 8, marginBottom: 12 },

    chip: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingVertical: 14,
      borderWidth: 2,
      minHeight: 85,
    },
    chipActive: { 
      backgroundColor: t.colors.surfaceHi, 
      borderColor: t.colors.accent,
    },
    chipIdle: { 
      backgroundColor: t.colors.surfaceHi, 
      borderColor: t.colors.border,
    },

    chipIconWrap: { marginBottom: 6 },
    chipTxt: { 
      color: t.colors.text, 
      fontFamily: 'Roboto_500Medium', 
      fontSize: 12,
      letterSpacing: 0.2,
    },

    actionRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    actionBtn: {
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center',
      paddingVertical: 12, 
      borderRadius: 12, 
      borderWidth: 1.5,
      backgroundColor: t.colors.surfaceHi, 
      borderColor: t.colors.border,
      flexDirection: 'row',
      gap: 6,
    },
    actionPrimary: { 
      backgroundColor: t.colors.accent, 
      borderColor: t.colors.accent,
    },
    actionTxt: { 
      color: t.colors.text, 
      fontFamily: 'Montserrat_600SemiBold',
      fontSize: 13,
    },
    actionTxtDark: { 
      color: '#0E1A2A', 
      fontFamily: 'Montserrat_600SemiBold',
      fontSize: 13,
    },

    preview: { 
      marginTop: 0,
      borderRadius: 12, 
      overflow: 'hidden', 
      borderWidth: 1.5, 
      borderColor: t.colors.border, 
      height: 160,
    },
    previewImg: { width: '100%', height: '100%' },

    reviewRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
    input: {
      flex: 1, 
      borderWidth: 1, 
      borderColor: t.colors.border, 
      borderRadius: 10, 
      padding: 10,
      color: t.colors.text, 
      backgroundColor: t.colors.surfaceHi,
      fontFamily: 'Roboto_400Regular',
      fontSize: 13,
    },
    label: { 
      color: t.colors.subtext, 
      fontSize: 11, 
      marginBottom: 5,
      fontFamily: 'Roboto_500Medium',
      letterSpacing: 0.2,
    },

    divider: { 
      height: 1, 
      backgroundColor: t.colors.border, 
      marginVertical: 14,
      opacity: 0.5,
    },

    // Price result styles - more compact
    priceResultHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 12,
      backgroundColor: t.colors.surfaceHi,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.colors.accent,
    },
    priceLabel: {
      color: t.colors.subtext,
      fontSize: 12,
      fontFamily: 'Roboto_500Medium',
      marginBottom: 3,
    },
    priceValue: {
      color: t.colors.accent,
      fontSize: 24,
      fontFamily: 'Montserrat_700Bold',
      letterSpacing: -0.5,
    },
    priceRange: {
      color: t.colors.subtext,
      fontSize: 11,
      fontFamily: 'Roboto_400Regular',
      marginTop: 4,
    },
    priceConfidence: {
      color: t.colors.muted,
      fontSize: 10,
      fontFamily: 'Roboto_400Regular',
      marginTop: 2,
    },

    footer: {
      borderTopWidth: 1, 
      borderTopColor: t.colors.border,
      backgroundColor: t.colors.surface,
      padding: 12, 
      flexDirection: 'row', 
      gap: 8,
    },
    footerBtn: { 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center', 
      paddingVertical: 14, 
      borderRadius: 12, 
      borderWidth: 1.5,
      flexDirection: 'row',
      gap: 6,
    },
    footerPrimary: { 
      backgroundColor: t.colors.accent, 
      borderColor: t.colors.accent,
    },
    footerSecondary: { 
      backgroundColor: t.colors.surfaceHi, 
      borderColor: t.colors.border,
    },
    footerTxtPrimary: { 
      color: '#0E1A2A', 
      fontWeight: '700',
      fontSize: 14,
    },
    footerTxt: { 
      color: t.colors.text, 
      fontWeight: '600',
      fontSize: 14,
    },

    modalWrap: { 
      flex: 1, 
      backgroundColor: t.colors.overlay, 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 16,
    },
    modalCard: { 
      width: '92%', 
      maxWidth: 480, 
      backgroundColor: t.colors.surface, 
      borderWidth: 1, 
      borderColor: t.colors.border, 
      borderRadius: 16, 
      padding: 20,
    },
    modalTitle: { 
      color: t.colors.text, 
      fontFamily: 'Montserrat_700Bold', 
      fontSize: 17, 
      marginBottom: 8,
    },

    // Debug console styles
    debugToggle: {
      color: t.colors.subtext,
      fontFamily: 'Roboto_500Medium',
      fontSize: 12,
      letterSpacing: 0.2,
    },
    debugContainer: {
      maxHeight: 250,
      backgroundColor: t.colors.surfaceHi,
      borderRadius: 8,
      padding: 10,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    debugItem: {
      marginBottom: 6,
      paddingBottom: 6,
    },
    debugDivider: {
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    debugTime: {
      fontSize: 9,
      fontFamily: 'Roboto_500Medium',
    },
    debugMessage: {
      fontSize: 10,
      fontFamily: 'Roboto_400Regular',
      marginTop: 2,
    },

    // PSA Grade Table styles - more compact
    gradeTable: {
      backgroundColor: t.colors.surfaceHi,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    gradeTableHeader: {
      flexDirection: 'row',
      backgroundColor: t.colors.accent,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    gradeTableHeaderText: {
      color: '#0E1A2A',
      fontFamily: 'Montserrat_700Bold',
      fontSize: 12,
      letterSpacing: 0.4,
    },
    gradeTableRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    gradeTableText: {
      color: t.colors.text,
      fontFamily: 'Roboto_500Medium',
      fontSize: 13,
    },
  });
}

/* ---------------- OpenAI helpers (self-contained) ---------------- */

async function uriToDataUrl(uri: string) {
  if (uri.startsWith('data:')) return uri;
  if (Platform.OS !== 'web') {
    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    return `data:image/jpeg;base64,${b64}`;
  }
  const res = await fetch(uri);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

function buildSchema(properties: Record<string, any>) {
  return { type: 'object', additionalProperties: false, properties, required: Object.keys(properties) };
}

const cardSchema = { name: 'CardPayload', schema: buildSchema({
  category:{type:'string'},year:{type:'string'},set:{type:'string'},card_number:{type:'string'},
  brand:{type:'string'},character:{type:'string'},tcg_category:{type:'string'},
  grading_company:{type:'string'},grade:{type:'string'},certification_number:{type:'string'},
  variation_details:{type:'string'},title_for_ui:{type:'string'},estimated_value_usd:{type:'number'}
})};

const coinSchema = { name: 'CoinPayload', schema: buildSchema({
  category:{type:'string'},year_displayed:{type:'string'},denomination:{type:'string'},
  mint_mark:{type:'string'},coins_type:{type:'string'},coin_product_name:{type:'string'},
  grading_company:{type:'string'},grade:{type:'string'},certification_number:{type:'string'},
  title_for_ui:{type:'string'},estimated_value_usd:{type:'number'}
})};

const comicSchema = { name: 'ComicPayload', schema: buildSchema({
  category:{type:'string'},year:{type:'string'},publisher:{type:'string'},
  comic_title:{type:'string'},comic_issue_number:{type:'string'},
  grading_company:{type:'string'},grade:{type:'string'},certification_number:{type:'string'},
  title_for_ui:{type:'string'},estimated_value_usd:{type:'number'}
})};

const CARD_PROMPT = `
Read a graded or raw trading card image. Prefer slab label when present. If unknown, leave empty. Return strict JSON per schema; no explanations.
`;

const COIN_PROMPT = `
Read a coin/medal image. Prefer slab label. 
CRITICAL: For coin_product_name, extract the SPECIFIC coin name (e.g., "Morgan Dollar", "American Eagle", "Peace Dollar"), NOT generic terms like "Silver Coin" or "Coin".
For coins_type, use the material/category (e.g., "Silver", "Gold").
Do NOT treat "S$1" as a mint mark. If mint is only "Struck at ...", set mint_mark="".
Return strict JSON per schema; no explanations.
`;

const COMIC_PROMPT = `
Read a graded comic image. Prefer label. If unknown, leave empty. Return strict JSON per schema; no explanations.
`;

async function callOpenAIJSONSchema(
  dataUrl: string,
  schema: { name: string; schema: any },
  prompt: string
) {
  const mock = !OPENAI_KEY || OPENAI_KEY.includes('__placeholder__');
  if (mock) {
    await new Promise(r=>setTimeout(r,900));
    if (schema.name==='CardPayload') return {
      category:'Card', year:'1999', set:'Base Set', card_number:'4', brand:'Pokemon', character:'Charizard',
      tcg_category:'Pokemon', grading_company:'PSA', grade:'10', certification_number:'12345678',
      variation_details:'Holo', title_for_ui:'1999 Pokémon Base Set #4 Charizard — PSA 10', estimated_value_usd:0
    };
    if (schema.name==='CoinPayload') return {
      category:'Coin', year_displayed:'2022', denomination:'$1', mint_mark:'W', coins_type:'American Silver Eagle',
      coin_product_name:'ASE Proof', grading_company:'NGC', grade:'PF 70 ULTRA CAMEO', certification_number:'67890123',
      title_for_ui:'2022 American Silver Eagle $1 (W) — NGC PF 70 UC', estimated_value_usd:0
    };
    return {
      category:'Comic', year:'1963', publisher:'Marvel', comic_title:'X-Men', comic_issue_number:'1',
      grading_company:'CGC', grade:'8.0', certification_number:'55566677',
      title_for_ui:'1963 Marvel X-Men #1 — CGC 8.0', estimated_value_usd:0
    };
  }

  const payload = {
    model: 'gpt-4o-mini',
    temperature: 0,
    input: [{ role: 'user', content: [
      { type: 'input_text', text: prompt },
      { type: 'input_image', image_url: dataUrl },
    ]}],
    text: { format: { type: 'json_schema', name: schema.name, schema: schema.schema, strict: true } },
    max_output_tokens: 700,
  };

  const resp = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`OpenAI HTTP ${resp.status}: ${await resp.text()}`);
  const json = await resp.json();
  const text =
    json?.output_text ??
    (Array.isArray(json?.output?.[0]?.content)
      ? json.output[0].content.find((p: any) => p?.type === 'output_text' || p?.text)?.text
      : null);
  if (!text) throw new Error('No JSON returned');
  const cleaned = text.trim().startsWith('```') ? text.replace(/^```(?:json)?\s*|\s*```$/g,'') : text;
  return JSON.parse(cleaned);
}

async function analyze(category: CurioCategory, uri: string) {
  const dataUrl = await uriToDataUrl(uri);
  if (category === 'Card') return callOpenAIJSONSchema(dataUrl, cardSchema, CARD_PROMPT);
  if (category === 'Coin') return callOpenAIJSONSchema(dataUrl, coinSchema, COIN_PROMPT);
  return callOpenAIJSONSchema(dataUrl, comicSchema, COMIC_PROMPT);
}

/* ---------------- Helper: Extract numeric grade from coin grade string ---------------- */
function extractNumericGrade(gradeStr: string): string {
  if (!gradeStr) return '';
  const match = gradeStr.match(/(?:MS|PF|PR|PROOF|GRADE)?\s*[-]?\s*(\d+(?:\.\d+)?)/i);
  return match ? match[1] : '';
}

/* ---------------- Screen ---------------- */

export default function SnapToValueScreen() {
  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
  });

  const { width } = useWindowDimensions();
  const ICON_SIZE = width > 480 ? 48 : 42;
  const ACTION_ICON = 20;

  const [mode, setMode] = useState<ThemeMode>('light');
  useEffect(() => { (async () => {
    const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') setMode(stored);
  })(); }, []);
  const t = useMemo(() => getTheme(mode), [mode]);
  const s = useMemo(() => makeStyles(t), [t]);

  const [category, setCategory] = useState<CurioCategory | null>(null);
  const [cardType, setCardType] = useState<CardKind | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ai, setAI] = useState<any|null>(null);

  const priceRef = useRef<PriceFetcherHandle>(null);
  const [lastPrice, setLastPrice] = useState<PriceResult | null>(null);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const onPrice = (r: PriceResult) => setLastPrice(r);
  const onLogsUpdate = (logs: DebugLog[]) => setDebugLogs(logs);

  const [loading, setLoading] = useState<null | { title: string; note?: string }>(null);
  const [debugOpen, setDebugOpen] = useState(false);

  const resetAll = () => {
    setCategory(null);
    setCardType(null);
    setImageUri(null);
    setAI(null);
    setLastPrice(null);
    setDebugLogs([]);
    setDebugOpen(false);
  };

  const pickFromGallery = async () => {
    if (!category) return Alert.alert('Pick a Category', 'Choose what you are scanning first.');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      await runAnalyze(res.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (!category) return Alert.alert('Pick a Category', 'Choose what you are scanning first.');
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      await runAnalyze(res.assets[0].uri);
    }
  };

  async function runAnalyze(uri: string) {
    try {
      setLoading({ title: 'Identifying your item…', note: 'Reading label/text and extracting details' });
      const out = await analyze(category as CurioCategory, uri);
      if (category === 'Card' && cardType === 'Raw') {
        out.grading_company = '';
        out.grade = '';
        out.certification_number = '';
      }
      setAI(out);
    } catch (e: any) {
      Alert.alert('AI Error', e?.message || 'Could not identify this item.');
    } finally {
      setLoading(null);
    }
  }

  function buildPriceInput(): PriceInput {
    const cat = category as CurioCategory;
    if (cat === 'Card') {
      return {
        category: 'Card',
        gradingCompany: cardType === 'Raw' ? '' : (ai?.grading_company || ''),
        grade:          cardType === 'Raw' ? '' : (ai?.grade || ''),
        certificationNumber: cardType === 'Raw' ? '' : (ai?.certification_number || ''),
        year: ai?.year || '',
        setSeries: ai?.set || '',
        cardNumber: ai?.card_number || '',
        cardName: ai?.character || '',
        parallelVariant: ai?.variation_details || '',
        requestGradeBreakdown: cardType === 'Raw',
      };
    }
    if (cat === 'Coin') {
      const rawGrade = ai?.grade || '';
      const numericGrade = extractNumericGrade(rawGrade);
      const specificName = ai?.coin_product_name || '';
      const genericType = ai?.coins_type || '';
      const isGeneric = /^(silver|gold|copper|coin|dollar)$/i.test(specificName.trim());
      const coinName = specificName && !isGeneric ? specificName : genericType;
      
      return {
        category: 'Coin',
        gradingCompany: ai?.grading_company || '',
        grade: numericGrade,
        certificationNumber: ai?.certification_number || '',
        yearDisplayed: ai?.year_displayed || '',
        mintMark: ai?.mint_mark || '',
        coinName: coinName,
        denomination: ai?.denomination || '',
      };
    }
    return {
      category: 'Comic',
      gradingCompany: ai?.grading_company || '',
      grade: ai?.grade || '',
      certificationNumber: ai?.certification_number || '',
      yearOfPublication: ai?.year || '',
      publisher: ai?.publisher || '',
      seriesTitle: ai?.comic_title || '',
      issueNumber: ai?.comic_issue_number || '',
    };
  }

  const confirmAndPrice = async () => {
    setLastPrice(null);
    priceRef.current?.run(buildPriceInput());
  };

  const doneAndRestart = () => {
    resetAll();
  };

  if (!fontsLoaded) return null;

  const renderCategoryIcon = (c: CurioCategory, active: boolean) => {
    const ink = active ? t.colors.accent : t.colors.text;
    if (c === 'Card') return <TradingCardIcon size={ICON_SIZE} ink={ink} />;
    if (c === 'Coin') return <CoinDollarIcon size={ICON_SIZE} color={ink} strokeWidth={5} reeded />;
    return <BookOpen size={ICON_SIZE} color={ink} strokeWidth={2} />;
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.hBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={t.colors.text} />
        </TouchableOpacity>
        <Text style={s.hTitle}>Snap-to-Value</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Streamlined Single Card Layout */}
        <View style={s.card}>
          {/* Category Selection */}
          <Text style={s.sectionTitle}>What are you scanning?</Text>
          <View style={s.row}>
            {(['Card','Coin','Comic'] as CurioCategory[]).map((c) => {
              const active = category === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[s.chip, active ? s.chipActive : s.chipIdle]}
                  onPress={() => { setCategory(c); setCardType(null); setAI(null); setImageUri(null); }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${c}`}
                  activeOpacity={0.7}
                >
                  <View style={s.chipIconWrap}>
                    {renderCategoryIcon(c, active)}
                  </View>
                  <Text style={s.chipTxt}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Card Type Selection - Only for Cards */}
          {category === 'Card' && (
            <>
              <View style={s.divider} />
              <Text style={s.sectionTitle}>Card Condition</Text>
              <View style={s.row}>
                {[{value:'Raw',label:'Ungraded'},{value:'Graded',label:'Graded'}].map(({ value, label }) => {
                  const active = cardType === (value as CardKind);
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[s.chip, active ? s.chipActive : s.chipIdle]}
                      onPress={() => setCardType(value as CardKind)}
                      accessibilityRole="button"
                      accessibilityLabel={`Set card type to ${label}`}
                      activeOpacity={0.7}
                    >
                      <Text style={s.chipTxt}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Photo Actions - Show when category is selected */}
          {category && (category !== 'Card' || cardType) && (
            <>
              <View style={s.divider} />
              <Text style={s.sectionTitle}>Add Photo</Text>
              <View style={s.actionRow}>
                <TouchableOpacity
                  style={[s.actionBtn, s.actionPrimary]}
                  onPress={takePhoto}
                  activeOpacity={0.8}
                >
                  <CameraIcon size={ACTION_ICON} color="#0E1A2A" />
                  <Text style={s.actionTxtDark}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.actionBtn}
                  onPress={pickFromGallery}
                  activeOpacity={0.8}
                >
                  <Upload size={ACTION_ICON} color={t.colors.text} />
                  <Text style={s.actionTxt}>Gallery</Text>
                </TouchableOpacity>
              </View>

              {!!imageUri && (
                <View style={s.preview}>
                  <Image source={{ uri: imageUri }} style={s.previewImg} resizeMode="cover" />
                </View>
              )}
            </>
          )}

          {/* AI Results & Editing - All in one flowing section */}
          {!!ai && (
            <>
              <View style={s.divider} />
              <Text style={s.sectionTitle}>Item Details</Text>
              
              {category === 'Card' && (
                <>
                  <LabeledInput label="Title" value={ai.title_for_ui} onChange={(v)=>setAI((p:any)=>({ ...p, title_for_ui: v }))} styles={s} />
                  <View style={s.reviewRow}>
                    <LabeledInput label="Year" value={ai.year} onChange={(v)=>setAI((p:any)=>({ ...p, year: v }))} styles={s} half />
                    <LabeledInput label="Set" value={ai.set} onChange={(v)=>setAI((p:any)=>({ ...p, set: v }))} styles={s} half />
                  </View>
                  <View style={s.reviewRow}>
                    <LabeledInput label="Card #" value={ai.card_number} onChange={(v)=>setAI((p:any)=>({ ...p, card_number: v }))} styles={s} half />
                    <LabeledInput label="Character" value={ai.character} onChange={(v)=>setAI((p:any)=>({ ...p, character: v }))} styles={s} half />
                  </View>
                  <LabeledInput
                    label="Variant (Holo, Full Art, SIR, etc.)"
                    value={ai.variation_details}
                    onChange={(v)=>setAI((p:any)=>({ ...p, variation_details: v }))}
                    styles={s}
                  />
                  {cardType === 'Graded' && (
                    <>
                      <View style={s.reviewRow}>
                        <LabeledInput label="Grading Company" value={ai.grading_company} onChange={(v)=>setAI((p:any)=>({ ...p, grading_company: v }))} styles={s} half />
                        <LabeledInput label="Grade" value={ai.grade} onChange={(v)=>setAI((p:any)=>({ ...p, grade: v }))} styles={s} half />
                      </View>
                      <LabeledInput label="Certification Number" value={ai.certification_number} onChange={(v)=>setAI((p:any)=>({ ...p, certification_number: v }))} styles={s} />
                    </>
                  )}
                </>
              )}

              {category === 'Coin' && (
                <>
                  <LabeledInput label="Title" value={ai.title_for_ui} onChange={(v)=>setAI((p:any)=>({ ...p, title_for_ui: v }))} styles={s} />
                  <View style={s.reviewRow}>
                    <LabeledInput label="Year" value={ai.year_displayed} onChange={(v)=>setAI((p:any)=>({ ...p, year_displayed: v }))} styles={s} half />
                    <LabeledInput label="Mint Mark" value={ai.mint_mark} onChange={(v)=>setAI((p:any)=>({ ...p, mint_mark: v }))} styles={s} half />
                  </View>
                  <View style={s.reviewRow}>
                    <LabeledInput label="Coin Name" value={ai.coins_type || ai.coin_product_name} onChange={(v)=>setAI((p:any)=>({ ...p, coins_type: v, coin_product_name: v }))} styles={s} half />
                    <LabeledInput label="Denomination" value={ai.denomination} onChange={(v)=>setAI((p:any)=>({ ...p, denomination: v }))} styles={s} half />
                  </View>
                  <View style={s.reviewRow}>
                    <LabeledInput label="Grading Company" value={ai.grading_company} onChange={(v)=>setAI((p:any)=>({ ...p, grading_company: v }))} styles={s} half />
                    <LabeledInput label="Grade" value={ai.grade} onChange={(v)=>setAI((p:any)=>({ ...p, grade: v }))} styles={s} half />
                  </View>
                  <LabeledInput label="Certification Number" value={ai.certification_number} onChange={(v)=>setAI((p:any)=>({ ...p, certification_number: v }))} styles={s} />
                </>
              )}

              {category === 'Comic' && (
                <>
                  <LabeledInput label="Title" value={ai.title_for_ui} onChange={(v)=>setAI((p:any)=>({ ...p, title_for_ui: v }))} styles={s} />
                  <View style={s.reviewRow}>
                    <LabeledInput label="Year" value={ai.year} onChange={(v)=>setAI((p:any)=>({ ...p, year: v }))} styles={s} half />
                    <LabeledInput label="Publisher" value={ai.publisher} onChange={(v)=>setAI((p:any)=>({ ...p, publisher: v }))} styles={s} half />
                  </View>
                  <View style={s.reviewRow}>
                    <LabeledInput label="Series" value={ai.comic_title} onChange={(v)=>setAI((p:any)=>({ ...p, comic_title: v }))} styles={s} half />
                    <LabeledInput label="Issue #" value={ai.comic_issue_number} onChange={(v)=>setAI((p:any)=>({ ...p, comic_issue_number: v }))} styles={s} half />
                  </View>
                  <View style={s.reviewRow}>
                    <LabeledInput label="Grading Company" value={ai.grading_company} onChange={(v)=>setAI((p:any)=>({ ...p, grading_company: v }))} styles={s} half />
                    <LabeledInput label="Grade" value={ai.grade} onChange={(v)=>setAI((p:any)=>({ ...p, grade: v }))} styles={s} half />
                  </View>
                  <LabeledInput label="Certification Number" value={ai.certification_number} onChange={(v)=>setAI((p:any)=>({ ...p, certification_number: v }))} styles={s} />
                </>
              )}

              {/* Get Price Button */}
              <View style={s.divider} />
              <TouchableOpacity onPress={confirmAndPrice} style={[s.actionBtn, s.actionPrimary, { marginTop: 8 }]} activeOpacity={0.8}>
                <BadgeDollarSign size={ACTION_ICON} color="#0E1A2A" />
                <Text style={s.actionTxtDark}>Get Market Price</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Price Results */}
          {lastPrice && (
            <>
              <View style={s.divider} />
              <View style={s.priceResultHeader}>
                <Check size={24} color={t.colors.accent} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.priceLabel}>
                    {cardType === 'Raw' ? 'Ungraded Value' : 'Estimated Value'}
                  </Text>
                  <Text style={s.priceValue}>
                    {lastPrice.currency} {lastPrice.price_mid.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}
                  </Text>
                  <Text style={s.priceRange}>
                    Range: {lastPrice.currency} {lastPrice.price_low.toFixed(2)} – {lastPrice.currency} {lastPrice.price_high.toFixed(2)}
                  </Text>
                  <Text style={s.priceConfidence}>
                    Confidence: {(lastPrice.confidence*100).toFixed(0)}%
                  </Text>
                </View>
              </View>

              {/* PSA Grade Table for Raw Cards */}
              {cardType === 'Raw' && lastPrice.gradeBreakdown && Object.keys(lastPrice.gradeBreakdown).length > 0 && (
                <>
                  <View style={s.divider} />
                  <Text style={s.sectionTitle}>PSA Graded Values</Text>
                  <View style={s.gradeTable}>
                    <View style={s.gradeTableHeader}>
                      <Text style={[s.gradeTableHeaderText, { flex: 1 }]}>Grade</Text>
                      <Text style={[s.gradeTableHeaderText, { flex: 2, textAlign: 'right' }]}>Value</Text>
                    </View>
                    {Object.entries(lastPrice.gradeBreakdown)
                      .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                      .map(([grade, value]) => (
                        <View key={grade} style={s.gradeTableRow}>
                          <Text style={[s.gradeTableText, { flex: 1 }]}>PSA {grade}</Text>
                          <Text style={[s.gradeTableText, { flex: 2, textAlign: 'right' }]}>
                            {lastPrice.currency} {typeof value === 'number' ? value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : value}
                          </Text>
                        </View>
                      ))}
                  </View>
                </>
              )}
            </>
          )}
        </View>

        {/* Debug Console - Collapsible at bottom */}
        {debugLogs.length > 0 && (
          <View style={[s.card, { marginTop: 12 }]}>
            <TouchableOpacity 
              onPress={() => setDebugOpen(!debugOpen)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Text style={s.debugToggle}>
                Debug Console ({debugLogs.length} logs)
              </Text>
              <Text style={{ color: t.colors.accent, fontSize: 18 }}>
                {debugOpen ? '−' : '+'}
              </Text>
            </TouchableOpacity>
            
            {debugOpen && (
              <>
                <View style={[s.divider, { marginVertical: 12 }]} />
                <ScrollView style={s.debugContainer} nestedScrollEnabled>
                  {debugLogs.map((log, idx) => {
                    const time = new Date(log.timestamp).toLocaleTimeString();
                    const logColor = log.level === 'error' ? '#ef4444' : log.level === 'warn' ? '#f59e0b' : t.colors.subtext;
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
                          <Text style={{ color: t.colors.muted, fontSize: 9, fontFamily: 'Roboto_400Regular', marginTop: 4 }}>
                            {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        )}

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Simplified Footer */}
      <View style={s.footer}>
        <TouchableOpacity style={[s.footerBtn, s.footerSecondary]} onPress={resetAll} activeOpacity={0.8}>
          <X size={20} color={t.colors.text} />
          <Text style={s.footerTxt}>Start Over</Text>
        </TouchableOpacity>
        {lastPrice && (
          <TouchableOpacity
            style={[s.footerBtn, s.footerPrimary]}
            onPress={doneAndRestart}
            activeOpacity={0.8}
          >
            <Check size={20} color="#0E1A2A" />
            <Text style={s.footerTxtPrimary}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading modal */}
      <Modal visible={!!loading} transparent animationType="fade" onRequestClose={()=>setLoading(null)}>
        <View style={s.modalWrap}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{loading?.title || 'Working…'}</Text>
            {loading?.note ? <Text style={{ color: t.colors.subtext, fontSize: 14 }}>{loading.note}</Text> : null}
          </View>
        </View>
      </Modal>

      {/* Mount pricing modal */}
      <PriceFetcher
        ref={priceRef}
        onPrice={onPrice}
        onLogsUpdate={onLogsUpdate}
        accent={t.colors.accent}
        text={t.colors.text}
        surface={t.colors.surface}
        border={t.colors.border}
      />
    </View>
  );
}

/* ---------------- Small labeled input helper ---------------- */
function LabeledInput({
  label, value, onChange, styles, half,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  styles: ReturnType<typeof makeStyles>;
  half?: boolean;
}) {
  return (
    <View style={[{ flex: 1, marginBottom: 8 }, half ? null : { width: '100%' }]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value ?? ''}
        onChangeText={onChange}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}