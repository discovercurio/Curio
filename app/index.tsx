// app/index.tsx (Complete with Improved Metal Chart Modal)
 
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  DeviceEventEmitter,
  Modal,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import {
  TrendingUp,
  TrendingDown,
  Menu,
  ScanLine,
  FolderPlus,
} from 'lucide-react-native';
import { useFonts, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import { router } from 'expo-router';
import Logo from '@/components/Logo';
import BurgerMenu from '@/components/BurgerMenu';
import { useCollection } from '@/contexts/CollectionContext';
import CurioSearchPlusIcon from '@/components/CurioSearchPlusIcon';

type Period = '1W' | '1M' | '6M' | '1Y';
type ThemeMode = 'light' | 'dark';
type MembershipTier = 'collector' | 'curator';
type MetalChartPeriod = 7 | 14 | 30 | 60;
type HistoricalDataPoint = { date: string; price: number };

const THEME_STORAGE_KEY = 'APP_THEME_MODE';
const CURIO_THEME_CHANGED = 'CURIO_THEME_CHANGED';
const MEMBERSHIP_KEY = 'CURIO_MEMBERSHIP_TIER';
const CURIO_MEMBERSHIP_CHANGED = 'CURIO_MEMBERSHIP_CHANGED';

const MARKET_SNAPSHOT_KEY = 'CURIO_MARKET_SNAPSHOT_V1';
const CURIO_MARKET_REFRESH = 'CURIO_MARKET_REFRESH';

const GOLD_SNAPSHOT_URL =
  'https://script.google.com/macros/s/AKfycbz12KIWA6mJKw06Vt85xUjWHWrzRXw46XTjOQTf12yfqS5VEWPygsdVMBNcPFfwN-91/exec';
const SILVER_SNAPSHOT_URL =
  'https://script.google.com/macros/s/AKfycbxVMyllensodm6_56fyJWjQEYxalEaWiaAZGZwq_vbQlhc9WZgF85q6CFWE9h6LUfWNKg/exec';

type MetalQuote = {
  price: number | null;
  change?: number | null;
  changePct?: number | null;
  updatedAt?: string | null;
};
type IndexQuote = { value: number | null; changePct?: number | null; updatedAt?: string | null };
type MarketSnapshot = { gold: MetalQuote; silver: MetalQuote; pokemonIndex: IndexQuote };

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ---------------- theming helpers ---------------- */
function getTheme(mode: ThemeMode) {
  if (mode === 'dark') {
    return {
      dark: true,
      colors: {
        background: '#0B1320',
        headerGradientFrom: '#0E1A2A',
        headerGradientTo: '#142B44',
        card: '#101B2C',
        surface: '#1A2335',
        border: '#223049',
        primary: '#EADBA6',
        accent: '#D4AF37',
        text: '#D9E4EF',
        subtext: '#A9B6C6',
        muted: '#9CA3AF',
        grid: '#1E3049',
        chipUpBg: '#0F2A19',
        chipDownBg: '#2A1515',
        chipUp: '#16A34A',
        chipDown: '#EF4444',
        segmentBg: '#18243A',
        segmentActiveText: '#0E1A2A',
        tooltipBg: '#0E1A2A',
        popoverBg: '#101B2C',
        popoverBorder: '#2A3A58',
        badge: 'rgba(255,255,255,0.06)',
        chartGradientFrom: 'rgba(212, 175, 55, 0.4)',
        chartGradientTo: 'rgba(212, 175, 55, 0.05)',
        chartLine: '#D4AF37',
        chartDot: '#F5E6AA',
        chartDotShadow: 'rgba(212, 175, 55, 0.6)',
      },
    };
  }
  return {
    dark: false,
    colors: {
      background: '#F5F7FA',
      headerGradientFrom: '#1E3A5F',
      headerGradientTo: '#2A4A6B',
      card: '#FFFFFF',
      surface: '#F3F4F6',
      border: '#E5E7EB',
      primary: '#1E3A5F',
      accent: '#D4AF37',
      text: '#1E3A5F',
      subtext: '#6B7280',
      muted: '#9CA3AF',
      grid: '#E8EDF3',
      chipUpBg: '#E7F4EA',
      chipDownBg: '#FBEAEA',
      chipUp: '#16A34A',
      chipDown: '#EF4444',
      segmentBg: '#EEF2F7',
      segmentActiveText: '#1E3A5F',
      tooltipBg: '#FFFFFF',
      popoverBg: '#FFFFFF',
      popoverBorder: '#E5E7EB',
      badge: '#F0F3F8',
      chartGradientFrom: 'rgba(212, 175, 55, 0.25)',
      chartGradientTo: 'rgba(212, 175, 55, 0.02)',
      chartLine: '#C4A030',
      chartDot: '#D4AF37',
      chartDotShadow: 'rgba(212, 175, 55, 0.4)',
    },
  };
}

function makeStyles(theme: ReturnType<typeof getTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },

    /* Header - 15% more compact */
    header: {
      paddingTop: Platform.OS === 'ios' ? 60 : 46,
      paddingBottom: 17,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    headerContent: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      marginBottom: 17,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.dark ? '#2B3A59' : '#EDE6CE',
      justifyContent: 'center',
      alignItems: 'center',
    },
    plusAnchorWrap: { position: 'relative' },

    /* Modal popover */
    modalRoot: {
      flex: 1,
      backgroundColor: 'transparent',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      paddingRight: 20,
      paddingTop: (Platform.OS === 'ios' ? 60 : 46) + 48,
    },
    popover: {
      width: 220,
      backgroundColor: theme.colors.popoverBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.popoverBorder,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 10 },
      elevation: 40,
    },
    popoverItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.popoverBg,
    },
    popoverLast: { borderBottomWidth: 0 },
    popoverText: { 
      marginLeft: 12, 
      color: theme.colors.text, 
      fontSize: 15, 
      fontFamily: 'Roboto_500Medium' 
    },

    headerStats: { 
      flexDirection: 'row', 
      justifyContent: 'space-between',
      gap: 10,
    },
    statBubble: {
      flex: 1,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: 13,
      paddingHorizontal: 10,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    statLabel: {
      fontSize: 10,
      color: theme.colors.subtext,
      fontFamily: 'Roboto_500Medium',
      marginBottom: 5,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    statValue: {
      fontSize: 19,
      color: theme.colors.accent,
      fontFamily: 'Montserrat_700Bold',
      textAlign: 'center',
    },

    content: { flex: 1 },

    card: {
      marginHorizontal: 16,
      marginTop: 20,
      backgroundColor: theme.colors.card,
      borderRadius: 18,
      padding: 18,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    cardTitle: { 
      fontSize: 17, 
      color: theme.colors.text, 
      fontFamily: 'Montserrat_600SemiBold',
      letterSpacing: 0.2,
    },
    changeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: theme.colors.card,
    },
    changeChipText: { 
      marginLeft: 6, 
      fontFamily: 'Roboto_500Medium', 
      fontSize: 13 
    },

    segmentRoot: {
      backgroundColor: theme.colors.segmentBg,
      borderRadius: 12,
      padding: 4,
      flexDirection: 'row',
      marginBottom: 16,
    },
    segment: { 
      flex: 1, 
      paddingVertical: 10, 
      borderRadius: 10, 
      alignItems: 'center' 
    },
    segmentActive: { backgroundColor: theme.colors.accent },
    segmentText: { 
      color: theme.colors.subtext, 
      fontSize: 14, 
      fontFamily: 'Roboto_500Medium',
      fontWeight: '500',
    },
    segmentTextActive: { 
      color: theme.colors.segmentActiveText,
      fontWeight: '600',
    },

    chartWrap: { 
      marginTop: 8,
      paddingTop: 8, 
      borderRadius: 16, 
      overflow: 'hidden', 
      position: 'relative',
    },
    chart: { 
      borderRadius: 16,
      marginVertical: 8,
    },
    
    legendRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      opacity: 0.85 
    },
    legendDot: { 
      width: 10, 
      height: 10, 
      borderRadius: 5, 
      backgroundColor: theme.colors.chartLine,
      shadowColor: theme.colors.chartDotShadow,
      shadowOpacity: 0.5,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
      marginRight: 8 
    },
    legendText: { 
      color: theme.colors.subtext, 
      fontSize: 12, 
      fontFamily: 'Roboto_400Regular' 
    },

    tooltip: {
      position: 'absolute',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: theme.colors.tooltipBg,
      borderWidth: 2,
      borderColor: theme.colors.accent,
      shadowColor: theme.colors.accent,
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    tooltipText: { 
      fontSize: 14, 
      color: theme.colors.text, 
      fontFamily: 'Montserrat_600SemiBold',
      letterSpacing: 0.3,
    },

    rowBetween: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between' 
    },

    tickerContainer: {
      marginTop: 16,
      overflow: 'hidden',
    },

    tickerContent: {
      flexDirection: 'row',
      gap: 12,
      paddingRight: 12,
    },

    tickerCard: {
      minWidth: 160,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 16,
    },

    tickerLabel: {
      fontSize: 11,
      fontFamily: 'Roboto_500Medium',
      color: theme.colors.subtext,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 8,
    },

    tickerValue: {
      fontSize: 24,
      fontFamily: 'Montserrat_700Bold',
      color: theme.colors.text,
      marginBottom: 8,
    },

    tickerChip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 999,
      gap: 5,
    },

    tickerChipText: {
      fontSize: 13,
      fontFamily: 'Roboto_500Medium',
    },

    badge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.colors.badge,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    badgeText: { 
      fontSize: 12, 
      color: theme.colors.subtext, 
      fontFamily: 'Roboto_500Medium' 
    },
    divider: { 
      height: 1, 
      backgroundColor: theme.colors.border, 
      marginVertical: 16 
    },

    topMoverRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between' 
    },
    topMoverLeft: { 
      flex: 1, 
      paddingRight: 12 
    },
    topMoverTitle: { 
      fontSize: 15, 
      color: theme.colors.text, 
      fontFamily: 'Roboto_500Medium',
      marginBottom: 4,
    },
    topMoverSubtitle: { 
      fontSize: 12, 
      color: theme.colors.subtext, 
      fontFamily: 'Roboto_400Regular' 
    },
    chipPct: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignSelf: 'flex-start',
    },

    // Metal chart modal
    metalModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    metalModalContent: {
      width: '100%',
      maxWidth: 500,
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 24,
      maxHeight: '80%',
    },
    metalModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    metalModalTitle: {
      fontSize: 22,
      fontFamily: 'Montserrat_700Bold',
      color: theme.colors.text,
    },
    metalModalClose: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    metalChartWrapper: {
      marginVertical: 16,
    },
    metalPeriodSelector: {
      flexDirection: 'row',
      backgroundColor: theme.colors.segmentBg,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
    },
    metalPeriodButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    metalPeriodActive: {
      backgroundColor: theme.colors.accent,
    },
    metalPeriodText: {
      fontSize: 13,
      fontFamily: 'Roboto_500Medium',
      color: theme.colors.subtext,
    },
    metalPeriodTextActive: {
      color: theme.colors.segmentActiveText,
      fontWeight: '600',
    },
    metalStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 20,
      paddingHorizontal: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: 8,
    },
    metalStatItem: {
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      minWidth: 70,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    metalStatLabel: {
      fontSize: 10,
      fontFamily: 'Roboto_500Medium',
      color: theme.colors.subtext,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    metalStatValue: {
      fontSize: 15,
      fontFamily: 'Montserrat_700Bold',
      color: theme.colors.text,
    },
    loadingText: {
      textAlign: 'center',
      color: theme.colors.subtext,
      fontFamily: 'Roboto_400Regular',
      fontSize: 14,
      paddingVertical: 40,
    },
  });
}

/* ---------------- auto-scrolling market ticker ---------------- */
function MarketTicker({
  markets,
  theme,
  styles,
  onMetalPress,
}: {
  markets: Array<{ label: string; value: string; changePct: number | null; metal?: 'gold' | 'silver' }>;
  theme: ReturnType<typeof getTheme>;
  styles: ReturnType<typeof makeStyles>;
  onMetalPress?: (metal: 'gold' | 'silver') => void;
}) {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const [cardWidth, setCardWidth] = React.useState(0);

  React.useEffect(() => {
    if (cardWidth === 0) return;

    const singleSetWidth = (cardWidth + 12) * markets.length;
    const duration = singleSetWidth * 40;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -singleSetWidth,
          duration: duration,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [cardWidth, markets.length, translateX]);

  return (
    <View style={styles.tickerContainer}>
      <Animated.View
        style={[
          styles.tickerContent,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {[...markets, ...markets, ...markets].map((market, idx) => (
          <View
            key={idx}
            onLayout={(e) => {
              if (idx === 0 && cardWidth === 0) {
                setCardWidth(e.nativeEvent.layout.width);
              }
            }}
          >
            <MetricCard
              label={market.label}
              value={market.value}
              changePct={market.changePct}
              theme={theme}
              styles={styles}
              metal={market.metal}
              onPress={onMetalPress}
            />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

function MetricCard({
  label,
  value,
  changePct,
  theme,
  styles,
  metal,
  onPress,
}: {
  label: string;
  value: string;
  changePct: number | null;
  theme: ReturnType<typeof getTheme>;
  styles: ReturnType<typeof makeStyles>;
  metal?: 'gold' | 'silver';
  onPress?: (metal: 'gold' | 'silver') => void;
}) {
  const up = (changePct ?? 0) >= 0;

  const CardWrapper = metal && onPress ? TouchableOpacity : View;
  const wrapperProps = metal && onPress ? {
    onPress: () => onPress(metal),
    activeOpacity: 0.8,
  } : {};

  return (
    <CardWrapper style={styles.tickerCard} {...wrapperProps}>
      <Text style={styles.tickerLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.tickerValue}>{value}</Text>
      {changePct != null && (
        <View
          style={[
            styles.tickerChip,
            { backgroundColor: up ? theme.colors.chipUpBg : theme.colors.chipDownBg },
          ]}
        >
          {up ? (
            <TrendingUp size={13} color={theme.colors.chipUp} strokeWidth={2.5} />
          ) : (
            <TrendingDown size={13} color={theme.colors.chipDown} strokeWidth={2.5} />
          )}
          <Text style={[styles.tickerChipText, { color: up ? theme.colors.chipUp : theme.colors.chipDown }]}>
            {up ? '+' : ''}
            {changePct.toFixed(1)}%
          </Text>
        </View>
      )}
    </CardWrapper>
  );
}

/* ---------------- Metal Chart Modal ---------------- */
function MetalChartModal({
  visible,
  onClose,
  metal,
  theme,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  metal: 'gold' | 'silver' | null;
  theme: ReturnType<typeof getTheme>;
  styles: ReturnType<typeof makeStyles>;
}) {
  const [period, setPeriod] = useState<MetalChartPeriod>(30);
  const [loading, setLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

  const chartWidth = Math.min(SCREEN_WIDTH - 88, 412);

  useEffect(() => {
    if (visible && metal) {
      loadHistoricalData();
    }
  }, [visible, metal, period]);

  const loadHistoricalData = async () => {
    if (!metal) return;
    
    setLoading(true);
    try {
      const url = metal === 'gold' ? GOLD_SNAPSHOT_URL : SILVER_SNAPSHOT_URL;
      const response = await fetch(`${url}?days=${period}`);
      const data = await response.json();
      
      if (data.historical && Array.isArray(data.historical)) {
        setHistoricalData(data.historical);
      } else {
        // Generate mock data if API doesn't return historical yet
        setHistoricalData(generateMockHistoricalData(period, metal));
      }
    } catch (error) {
      console.warn('Failed to load historical data', error);
      setHistoricalData(generateMockHistoricalData(period, metal));
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (historicalData.length === 0) {
      return { labels: [], datasets: [{ data: [0] }] };
    }

    // Determine sampling based on period - fewer labels for cleaner display
    let step = 1;
    let maxLabels = 5; // Reduced from 7-10 to 5 for less crowding
    
    switch (period) {
      case 7:
        step = 1; // Show all 7 days
        maxLabels = 7;
        break;
      case 14:
        step = 3; // Show ~5 points
        maxLabels = 5;
        break;
      case 30:
        step = 6; // Show ~5 points
        maxLabels = 5;
        break;
      case 60:
        step = 12; // Show ~5 points
        maxLabels = 5;
        break;
    }

    const sampledData = historicalData.filter((_, i) => i % step === 0 || i === historicalData.length - 1);
    
    // Ensure we don't exceed maxLabels
    const finalData = sampledData.length > maxLabels 
      ? [
          sampledData[0],
          ...sampledData.slice(Math.floor(sampledData.length / 4), Math.floor(sampledData.length / 4) + 1),
          ...sampledData.slice(Math.floor(sampledData.length / 2), Math.floor(sampledData.length / 2) + 1),
          ...sampledData.slice(Math.floor((sampledData.length * 3) / 4), Math.floor((sampledData.length * 3) / 4) + 1),
          sampledData[sampledData.length - 1]
        ]
      : sampledData;

    return {
      labels: finalData.map((d, i) => {
        const date = new Date(d.date);
        // Only show labels at first, middle, and last to reduce crowding
        if (i === 0 || i === finalData.length - 1 || i === Math.floor(finalData.length / 2)) {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return ''; // Empty label for intermediate points
      }),
      datasets: [{
        data: finalData.map(d => d.price),
        color: (opacity = 1) => theme.colors.chartLine,
        strokeWidth: 3,
      }],
    };
  }, [historicalData, theme, period]);

  const chartConfig = useMemo(
    () => ({
      backgroundColor: 'transparent',
      backgroundGradientFrom: theme.colors.card,
      backgroundGradientTo: theme.colors.card,
      backgroundGradientFromOpacity: 1,
      backgroundGradientToOpacity: 1,
      decimalPlaces: 2,
      color: (opacity = 1) => theme.colors.chartLine,
      labelColor: (opacity = 1) => theme.colors.subtext,
      propsForDots: { 
        r: '7', 
        strokeWidth: '3', 
        stroke: theme.colors.chartDot,
        fill: theme.colors.card,
        shadowColor: theme.colors.chartDotShadow,
        shadowOpacity: 0.6,
        shadowRadius: 6,
      },
      propsForBackgroundLines: { 
        strokeDasharray: '4 8',
        stroke: theme.colors.grid,
        strokeWidth: 1,
        strokeOpacity: 0.3,
      },
      fillShadowGradientFrom: theme.colors.accent,
      fillShadowGradientFromOpacity: theme.dark ? 0.4 : 0.25,
      fillShadowGradientTo: theme.colors.accent,
      fillShadowGradientToOpacity: 0,
      style: { borderRadius: 16 },
      formatYLabel: (value: string) => {
        const num = parseFloat(value);
        return `$${num.toFixed(0)}`;
      },
    }),
    [theme],
  );

  const stats = useMemo(() => {
    if (historicalData.length === 0) return null;
    
    const prices = historicalData.map(d => d.price);
    const current = prices[prices.length - 1];
    const start = prices[0];
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const change = current - start;
    const changePct = (change / start) * 100;

    return { current, high, low, change, changePct };
  }, [historicalData]);

  if (!metal) return null;

  const metalName = metal.charAt(0).toUpperCase() + metal.slice(1);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.metalModalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView 
            style={styles.metalModalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.metalModalHeader}>
              <Text style={styles.metalModalTitle}>{metalName} Price History</Text>
              <TouchableOpacity style={styles.metalModalClose} onPress={onClose}>
                <Text style={{ color: theme.colors.text, fontSize: 20 }}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metalPeriodSelector}>
              {([7, 14, 30, 60] as MetalChartPeriod[]).map((p) => {
                const active = period === p;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPeriod(p)}
                    style={[styles.metalPeriodButton, active && styles.metalPeriodActive]}
                  >
                    <Text style={[styles.metalPeriodText, active && styles.metalPeriodTextActive]}>
                      {p}D
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {loading ? (
              <Text style={styles.loadingText}>Loading data...</Text>
            ) : historicalData.length > 0 ? (
              <>
                <View style={styles.metalChartWrapper}>
                  <LineChart
                    data={chartData}
                    width={chartWidth}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={{ borderRadius: 16 }}
                    withInnerLines
                    withOuterLines={false}
                    withShadow
                    fromZero={false}
                    segments={4}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                  />
                </View>

                {stats && (
                  <View style={styles.metalStats}>
                    <View style={styles.metalStatItem}>
                      <Text style={styles.metalStatLabel}>High</Text>
                      <Text style={styles.metalStatValue}>
                        ${stats.high.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.metalStatItem}>
                      <Text style={styles.metalStatLabel}>Low</Text>
                      <Text style={styles.metalStatValue}>
                        ${stats.low.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.metalStatItem}>
                      <Text style={styles.metalStatLabel}>Change</Text>
                      <Text 
                        style={[
                          styles.metalStatValue,
                          { color: stats.change >= 0 ? theme.colors.chipUp : theme.colors.chipDown }
                        ]}
                      >
                        {stats.changePct.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.loadingText}>No data available</Text>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// Generate mock historical data for fallback
function generateMockHistoricalData(days: number, metal: 'gold' | 'silver'): HistoricalDataPoint[] {
  const basePrice = metal === 'gold' ? 2650 : 28.5;
  const volatility = metal === 'gold' ? 25 : 0.6;
  const data: HistoricalDataPoint[] = [];
  
  let currentPrice = basePrice;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Create more realistic trending data with slight variations
    const dailyChange = (Math.random() - 0.48) * volatility; // Slight upward bias
    currentPrice += dailyChange;
    
    // Ensure price stays within reasonable bounds
    const minPrice = basePrice * 0.97;
    const maxPrice = basePrice * 1.03;
    currentPrice = Math.max(minPrice, Math.min(maxPrice, currentPrice));
    
    data.push({
      date: date.toISOString(),
      price: currentPrice,
    });
  }
  
  return data;
}

/* ---------------- main component ---------------- */

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
  });

  const { getTotalValue, getTotalItems, items } = useCollection() as any;
  const cabinetValue = getTotalValue();
  const itemCount = getTotalItems();

  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [membership, setMembership] = useState<MembershipTier>('collector');
  const isPremium = membership === 'curator';

  const [showBurgerMenu, setShowBurgerMenu] = useState(false);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<Period>('1M');
  const [tooltip, setTooltip] =
    useState<{ index: number; value: number; x: number; y: number } | null>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showMetalChart, setShowMetalChart] = useState(false);
  const [selectedMetal, setSelectedMetal] = useState<'gold' | 'silver' | null>(null);

  const [market, setMarket] = useState<MarketSnapshot>({
    gold: { price: null, change: null, changePct: null, updatedAt: null },
    silver: { price: null, change: null, changePct: null, updatedAt: null },
    pokemonIndex: { value: null, changePct: null, updatedAt: null },
  });
  const [marketLoading, setMarketLoading] = useState<boolean>(false);

  const [topMover, setTopMover] = useState<{ name: string; pct: number } | null>(null);

  const chartWidth = SCREEN_WIDTH - 64;

  useEffect(() => {
    if (!tooltip) return;
    const t = setTimeout(() => setTooltip(null), 2500);
    return () => clearTimeout(t);
  }, [tooltip]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') setThemeMode(stored);
      const tier = await AsyncStorage.getItem(MEMBERSHIP_KEY);
      if (tier === 'curator' || tier === 'collector') setMembership(tier);
    })();

    const subTheme = DeviceEventEmitter.addListener(CURIO_THEME_CHANGED, (e: any) => {
      if (e?.mode === 'dark' || e?.mode === 'light') setThemeMode(e.mode);
    });
    const subMember = DeviceEventEmitter.addListener(CURIO_MEMBERSHIP_CHANGED, (e: any) => {
      if (e?.tier === 'curator' || e?.tier === 'collector') setMembership(e.tier);
    });

    return () => {
      subTheme.remove();
      subMember.remove();
    };
  }, []);

  useEffect(() => setTooltip(null), [selectedTimePeriod, cabinetValue]);

  const currentChart = useMemo(
    () => generateChartData(selectedTimePeriod, cabinetValue),
    [selectedTimePeriod, cabinetValue],
  );
  const valueChange = currentChart.change;
  const isUp = valueChange >= 0;

  const chartData = useMemo(
    () => ({
      labels: currentChart.labels,
      datasets: [
        { 
          data: currentChart.data, 
          color: (opacity = 1) => theme.colors.chartLine,
          strokeWidth: 3,
        }
      ],
    }),
    [currentChart, theme],
  );

  const chartConfig = useMemo(
    () => ({
      backgroundColor: 'transparent',
      backgroundGradientFrom: theme.colors.card,
      backgroundGradientTo: theme.colors.card,
      backgroundGradientFromOpacity: 1,
      backgroundGradientToOpacity: 1,
      decimalPlaces: 0,
      color: (opacity = 1) => theme.colors.chartLine,
      labelColor: (opacity = 1) => theme.colors.subtext,
      
      propsForDots: { 
        r: '7', 
        strokeWidth: '3', 
        stroke: theme.colors.chartDot,
        fill: theme.colors.card,
        shadowColor: theme.colors.chartDotShadow,
        shadowOpacity: 0.8,
        shadowRadius: 8,
      },
      
      propsForBackgroundLines: { 
        strokeDasharray: '4 8',
        stroke: theme.colors.grid,
        strokeWidth: 1,
        strokeOpacity: 0.3,
      },
      
      fillShadowGradientFrom: theme.colors.accent,
      fillShadowGradientFromOpacity: theme.dark ? 0.3 : 0.2,
      fillShadowGradientTo: theme.colors.accent,
      fillShadowGradientToOpacity: 0,
      
      style: { borderRadius: 16 },
      
      useShadowColorFromDataset: false,
    }),
    [theme],
  );

  const formatCurrencyBlock = (n: number) =>
    `${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  useEffect(() => {
    try {
      if (!items || !Array.isArray(items) || items.length === 0) {
        setTopMover(null);
        return;
      }
      let best: { name: string; pct: number } | null = null;
      for (const it of items) {
        const pct = Number(it?.marketData?.priceChangePercent ?? 0);
        if (!best || Math.abs(pct) > Math.abs(best.pct)) {
          best = { name: it?.name || 'Unknown item', pct };
        }
      }
      setTopMover(best);
    } catch {
      setTopMover(null);
    }
  }, [items]);

  const loadMarket = async () => {
    setMarketLoading(true);
    try {
      let base: MarketSnapshot = {
        gold: { price: null, change: null, changePct: null, updatedAt: null },
        silver: {
          price: 28.45,
          change: null,
          changePct: -0.8,
          updatedAt: new Date().toISOString(),
        },
        pokemonIndex: {
          value: 1250,
          changePct: 1.2,
          updatedAt: new Date().toISOString(),
        },
      };

      const cached = await AsyncStorage.getItem(MARKET_SNAPSHOT_KEY);
      if (cached) {
        try {
          base = JSON.parse(cached) as MarketSnapshot;
        } catch {}
      }
      setMarket(base);

      const [goldResp, silverResp] = await Promise.allSettled([
        fetch(GOLD_SNAPSHOT_URL),
        fetch(SILVER_SNAPSHOT_URL),
      ]);

      let goldData: any = null;
      let silverData: any = null;

      if (goldResp.status === 'fulfilled' && goldResp.value.ok) {
        goldData = await goldResp.value.json();
      }

      if (silverResp.status === 'fulfilled' && silverResp.value.ok) {
        silverData = await silverResp.value.json();
      }

      const next: MarketSnapshot = {
        gold: {
          price:
            typeof goldData?.gold?.price === 'number'
              ? goldData.gold.price
              : base.gold.price,
          change:
            typeof goldData?.gold?.change === 'number'
              ? goldData.gold.change
              : base.gold.change,
          changePct:
            typeof goldData?.gold?.changePct === 'number'
              ? goldData.gold.changePct
              : base.gold.changePct,
          updatedAt:
            typeof goldData?.gold?.updatedAt === 'string'
              ? goldData.gold.updatedAt
              : base.gold.updatedAt,
        },
        silver: {
          price:
            typeof silverData?.silver?.price === 'number'
              ? silverData.silver.price
              : base.silver.price,
          change:
            typeof silverData?.silver?.change === 'number'
              ? silverData.silver.change
              : base.silver.change,
          changePct:
            typeof silverData?.silver?.changePct === 'number'
              ? silverData.silver.changePct
              : base.silver.changePct,
          updatedAt:
            typeof silverData?.silver?.updatedAt === 'string'
              ? silverData.silver.updatedAt
              : base.silver.updatedAt,
        },
        pokemonIndex: base.pokemonIndex,
      };

      setMarket(next);
      await AsyncStorage.setItem(MARKET_SNAPSHOT_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn('Market load failed', err);
    } finally {
      setMarketLoading(false);
    }
  };

  useEffect(() => {
    loadMarket();
    const sub = DeviceEventEmitter.addListener(CURIO_MARKET_REFRESH, loadMarket);
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  const handlePlusPress = () => {
    if (isPremium) setShowPlusMenu((s) => !s);
    else router.push('/scan');
  };
  const handleAddToCollection = () => {
    setShowPlusMenu(false);
    router.push('/scan');
  };
  const handleScanAndPrice = () => {
    setShowPlusMenu(false);
    router.push('/snap-to-value');
  };

  const handleMetalPress = (metal: 'gold' | 'silver') => {
    setSelectedMetal(metal);
    setShowMetalChart(true);
  };

  const handleCloseMetalChart = () => {
    setShowMetalChart(false);
    setTimeout(() => setSelectedMetal(null), 300);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={[theme.colors.headerGradientFrom, theme.colors.headerGradientTo]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowBurgerMenu(true)}>
            <Menu size={22} color={theme.colors.accent} />
          </TouchableOpacity>
          <Logo size="medium" />
          <View style={styles.plusAnchorWrap}>
            <TouchableOpacity style={styles.iconButton} onPress={handlePlusPress}>
              <CurioSearchPlusIcon
                size={22}
                color={theme.colors.accent}
                strokeWidth={1.8}
                plusStrokeWidth={0.6}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.headerStats}>
          <View style={styles.statBubble}>
            <Text style={styles.statLabel}>COLLECTION VALUE</Text>
            <Text style={styles.statValue}>{formatCurrencyBlock(cabinetValue)}</Text>
          </View>
          <TouchableOpacity
            style={styles.statBubble}
            onPress={() => router.replace('/collection')}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Open your collection"
          >
            <Text style={styles.statLabel}>TOTAL ITEMS</Text>
            <Text style={styles.statValue}>{itemCount}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* PLUS MENU */}
      {isPremium && (
        <Modal
          visible={showPlusMenu}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setShowPlusMenu(false)}
        >
          <TouchableOpacity
            style={styles.modalRoot}
            activeOpacity={1}
            onPress={() => setShowPlusMenu(false)}
          >
            <View style={styles.popover}>
              <TouchableOpacity
                style={styles.popoverItem}
                onPress={handleAddToCollection}
                activeOpacity={0.9}
              >
                <FolderPlus size={18} color={theme.colors.accent} />
                <Text style={styles.popoverText}>Add to Collection</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.popoverItem, styles.popoverLast]}
                onPress={handleScanAndPrice}
                activeOpacity={0.9}
              >
                <ScanLine size={18} color={theme.colors.accent} />
                <Text style={styles.popoverText}>Snap-to-Value</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* CHART CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Value Over Time</Text>
            <View
              style={[
                styles.changeChip,
                { backgroundColor: isUp ? theme.colors.chipUpBg : theme.colors.chipDownBg },
              ]}
            >
              {isUp ? (
                <TrendingUp size={14} color={theme.colors.chipUp} strokeWidth={2.5} />
              ) : (
                <TrendingDown size={14} color={theme.colors.chipDown} strokeWidth={2.5} />
              )}
              <Text
                style={[
                  styles.changeChipText,
                  { color: isUp ? theme.colors.chipUp : theme.colors.chipDown },
                ]}
              >
                {isUp ? '+' : '-'}${Math.abs(valueChange).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Segmented control */}
          <View style={styles.segmentRoot}>
            {(['1W', '1M', '6M', '1Y'] as Period[]).map((p) => {
              const active = selectedTimePeriod === p;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setSelectedTimePeriod(p)}
                  style={[styles.segment, active && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{p}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Chart with Android touch fix */}
          <View style={styles.chartWrap}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => {
                if (Platform.OS !== 'android') return;
                
                const locationX = e.nativeEvent.locationX;
                const locationY = e.nativeEvent.locationY;
                
                const padding = 50;
                const usableWidth = chartWidth - padding * 2;
                const dataPointSpacing = usableWidth / (chartData.datasets[0].data.length - 1);
                
                const dataIndex = Math.round((locationX - padding) / dataPointSpacing);
                
                if (dataIndex >= 0 && dataIndex < chartData.datasets[0].data.length) {
                  const value = chartData.datasets[0].data[dataIndex];
                  setTooltip({ 
                    index: dataIndex, 
                    value, 
                    x: locationX, 
                    y: locationY 
                  });
                }
              }}
            >
              <LineChart
                data={chartData}
                width={chartWidth}
                height={240}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                segments={4}
                yLabelsOffset={10}
                withInnerLines
                withOuterLines={false}
                withShadow
                fromZero={false}
                formatYLabel={(v) => {
                  const n = Number(v);
                  return Number.isNaN(n)
                    ? ''
                    : `${Math.round(n).toLocaleString('en-US')}`;
                }}
                withDots
                onDataPointClick={({ value, x, y, index }) =>
                  setTooltip({ index: index || 0, value, x, y })
                }
              />
            </TouchableOpacity>

            {tooltip && (
              <View
                style={[
                  styles.tooltip,
                  {
                    left: Math.min(
                      Math.max(10, tooltip.x - 50),
                      Math.max(10, chartWidth - 100),
                    ),
                    top: Math.max(10, tooltip.y - 50),
                  },
                ]}
                pointerEvents="none"
              >
                <Text style={styles.tooltipText}>
                  {`${Math.round(tooltip.value).toLocaleString('en-US')}`}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Estimated collection value</Text>
          </View>
        </View>

        {/* MARKET & TOP MOVER CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Market & Top Mover</Text>

          <MarketTicker
            markets={[
              {
                label: 'Gold (oz)',
                value:
                  market.gold.price == null
                    ? '—'
                    : `${Number(market.gold.price).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`,
                changePct: market.gold.changePct ?? null,
                metal: 'gold',
              },
              {
                label: 'Silver (oz)',
                value:
                  market.silver.price == null
                    ? '—'
                    : `${Number(market.silver.price).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`,
                changePct: market.silver.changePct ?? null,
                metal: 'silver',
              },
              {
                label: 'Pokémon Index',
                value:
                  market.pokemonIndex.value == null
                    ? '—'
                    : `${Math.round(market.pokemonIndex.value).toLocaleString('en-US')}`,
                changePct: market.pokemonIndex.changePct ?? null,
              },
            ]}
            theme={theme}
            styles={styles}
            onMetalPress={handleMetalPress}
          />

          <View style={styles.divider} />

          <View style={styles.topMoverRow}>
            <View style={styles.topMoverLeft}>
              <Text style={styles.topMoverTitle} numberOfLines={2}>
                {topMover ? topMover.name : 'No movement detected'}
              </Text>
              <Text style={styles.topMoverSubtitle}>
                {topMover
                  ? 'Top moving collectible'
                  : 'Add items with market data to see movers'}
              </Text>
            </View>

            <View
              style={[
                styles.chipPct,
                {
                  backgroundColor:
                    (topMover?.pct ?? 0) >= 0
                      ? theme.colors.chipUpBg
                      : theme.colors.chipDownBg,
                },
              ]}
            >
              {(topMover?.pct ?? 0) >= 0 ? (
                <TrendingUp size={14} color={theme.colors.chipUp} strokeWidth={2.5} />
              ) : (
                <TrendingDown size={14} color={theme.colors.chipDown} strokeWidth={2.5} />
              )}
              <Text
                style={{
                  marginLeft: 6,
                  fontSize: 13,
                  fontFamily: 'Roboto_500Medium',
                  color:
                    (topMover?.pct ?? 0) >= 0
                      ? theme.colors.chipUp
                      : theme.colors.chipDown,
                }}
                numberOfLines={1}
              >
                {topMover
                  ? `${topMover.pct >= 0 ? '+' : ''}${topMover.pct.toFixed(1)}%`
                  : '—'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: Platform.OS === 'ios' ? 24 : 16 }} />
      </ScrollView>

      <BurgerMenu
        visible={showBurgerMenu}
        onClose={() => setShowBurgerMenu(false)}
        isPremium={isPremium}
      />

      <MetalChartModal
        visible={showMetalChart}
        onClose={handleCloseMetalChart}
        metal={selectedMetal}
        theme={theme}
        styles={styles}
      />
    </View>
  );
}

/* ---------------- helpers ---------------- */

function generateChartData(period: Period, currentValue: number) {
  let labels: string[] = [];
  let data: number[] = [];
  let change = 0;

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const atMonthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

  switch (period) {
    case '1W': {
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      }
      const startValue = currentValue * 0.994;
      data = [
        startValue,
        startValue * 1.003,
        startValue * 0.997,
        startValue * 1.004,
        startValue * 1.007,
        startValue * 1.009,
        currentValue,
      ];
      change = currentValue - startValue;
      break;
    }
    case '1M': {
      const base = new Date();
      for (let i = 3; i >= 0; i--) {
        const d = new Date(base);
        d.setDate(base.getDate() - i * 7);
        labels.push(formatDate(d));
      }
      const startValue = currentValue * 0.972;
      data = [startValue, startValue * 1.012, startValue * 1.02, currentValue];
      change = currentValue - startValue;
      break;
    }
    case '6M': {
      const base = atMonthStart(new Date());
      for (let i = 5; i >= 0; i--) {
        const d = new Date(base);
        d.setMonth(base.getMonth() - i);
        labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
      }
      const startValue = currentValue * 0.96;
      data = [
        startValue,
        startValue * 1.013,
        startValue * 1.031,
        startValue * 1.024,
        startValue * 1.035,
        currentValue,
      ];
      change = currentValue - startValue;
      break;
    }
    case '1Y': {
      const base = atMonthStart(new Date());
      for (let i = 12; i >= 0; i -= 3) {
        const d = new Date(base);
        d.setMonth(base.getMonth() - i);
        labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
      }
      const startValue = currentValue * 0.924;
      data = [
        startValue,
        startValue * 1.026,
        startValue * 1.044,
        startValue * 1.062,
        currentValue,
      ];
      change = currentValue - startValue;
      break;
    }
  }

  return { labels, data, change };
}
