// app/events.tsx - UX REFINED VERSION with Distance Slider in Filters
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal,
  FlatList, Alert, Platform, DeviceEventEmitter, Linking,
} from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft, MapPin, Calendar, Users, Search, Filter, Star,
  ChevronRight, X, Check, ArrowUpDown, Locate, TrendingUp, Share as ShareIcon,
  Grid3X3, BookOpen, Globe,
} from 'lucide-react-native';
import { useFonts, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Defs, LinearGradient, Stop, G, Circle, Path, Rect, Ellipse } from 'react-native-svg';

import { EventsProvider } from '../contexts/events';
import { fetchShowsFromSheet, withDistances, ShowRow } from '../lib/eventsFromSheet';

import zipMap from './data/zipMap.min.json';
import zipList from './data/zipList.min.json';

/* -------- App icons (safe fallbacks) -------- */
let CoinDollarIcon: any;
let TradingCardBlank: any;
try { CoinDollarIcon = require('../components/CoinDollarIcon').default; } catch { CoinDollarIcon = null; }
try { TradingCardBlank = require('../components/TradingCardBlank').default; } catch { TradingCardBlank = null; }

/* ---------------- Theme & membership ---------------- */
const THEME_STORAGE_KEY = 'APP_THEME_MODE';
const LOCATION_ZIP_STORAGE_KEY = 'USER_LOCATION_ZIP';
const RADIUS_STORAGE_KEY = 'USER_RADIUS_MILES';
const DATE_RANGE_STORAGE_KEY = 'USER_DATE_RANGE_DAYS';
const EVENTS_FAV_STORAGE_KEY = 'EVENTS_FAVORITES_V1';

const CURIO_THEME_CHANGED = 'CURIO_THEME_CHANGED';
const MEMBERSHIP_KEY = 'CURIO_MEMBERSHIP_TIER';
const CURIO_MEMBERSHIP_CHANGED = 'CURIO_MEMBERSHIP_CHANGED';

type AppThemeMode = 'light' | 'dark';
type MembershipTier = 'collector' | 'curator';

const AD_FREQUENCY = 4;

// Distance presets for slider
const DISTANCE_PRESETS = [50, 100, 250, 500, 1000];

function getTheme(mode: AppThemeMode) {
  if (mode === 'dark') {
    return {
      dark: true,
      colors: {
        appBg: '#0B1320',
        headerBg: '#0E1A2A',
        surface: '#101B2C',
        chip: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.10)',
        softBorder: 'rgba(255,255,255,0.08)',
        text: '#D9E4EF',
        subtext: '#A9B6C6',
        muted: '#9CA3AF',
        primary: '#1E3A5F',
        accent: '#D4AF37',
        success: '#10B981',
        danger: '#EF4444',
        inputBg: '#0F1B2B',
        listStripe: 'rgba(255,255,255,0.04)',
        pillGoldBg: 'rgba(234,219,166,0.12)',
        highlight: 'rgba(234,219,166,0.18)',
        favOn: '#EAB308',
      },
    } as const;
  }
  return {
    dark: false,
    colors: {
      appBg: '#F5F7FA',
      headerBg: '#1E3A5F',
      surface: '#FFFFFF',
      chip: '#F8FAFC',
      border: '#E5E7EB',
      softBorder: '#F1F5F9',
      text: '#1E3A5F',
      subtext: '#6B7280',
      muted: '#9CA3AF',
      primary: '#1E3A5F',
      accent: '#D4AF37',
      success: '#10B981',
      danger: '#EF4444',
      inputBg: '#FFFFFF',
      listStripe: '#F3F4F6',
      pillGoldBg: '#FFF6DA',
      highlight: '#FFEEB6',
      favOn: '#CA8A04',
    },
  } as const;
}

/* ---------------- Illustration ---------------- */
function LocatorIllustration({ accent, ink, soft }: { accent: string; ink: string; soft: string }) {
  return (
    <Svg width={260} height={140} viewBox="0 0 260 140">
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={soft} stopOpacity="0.55" />
          <Stop offset="1" stopColor={soft} stopOpacity="0.1" />
        </LinearGradient>
        <LinearGradient id="pin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={accent} stopOpacity="1" />
          <Stop offset="1" stopColor={accent} stopOpacity="0.75" />
        </LinearGradient>
      </Defs>
      <G>
        <Rect x="8" y="12" width="244" height="116" rx="20" fill="url(#bg)" />
        <Circle cx="44" cy="30" r="10" fill={soft} opacity="0.45" />
        <Circle cx="220" cy="34" r="8" fill={soft} opacity="0.32" />
        <Circle cx="210" cy="106" r="14" fill={soft} opacity="0.28" />
      </G>
      <G>
        <Circle cx="96" cy="62" r="26" fill="none" stroke={ink} strokeOpacity="0.25" strokeWidth={2.5} />
        <Path d="M114 78 L130 94" stroke={ink} strokeOpacity="0.25" strokeWidth={6} strokeLinecap="round" />
        <Circle cx="96" cy="62" r="18" fill="none" stroke={ink} strokeOpacity="0.14" strokeWidth={2} />
      </G>
      <G>
        <Path d="M177 44c-13 0-23 10-23 22 0 15 23 36 23 36s23-21 23-36c0-12-10-22-23-22z" fill="url(#pin)" />
        <Circle cx="177" cy="66" r="7" fill="#0E1A2A" opacity="0.9" />
        <Ellipse cx="177" cy="108" rx="20" ry="4" fill={ink} opacity="0.12" />
      </G>
    </Svg>
  );
}

/* ---------------- Date helpers ---------------- */
function formatEventDateUTC(d: Date | undefined) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return 'TBD';
  const wd = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()];
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()];
  const day = d.getUTCDate();
  return `${wd}, ${mo} ${day}`;
}
function sameUTCDate(a?: Date, b?: Date) {
  if (!a || !b) return false;
  if (!(a instanceof Date) || !(b instanceof Date)) return false;
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;
  return a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate();
}
function fmtRange(start?: Date, end?: Date) {
  if (!start || !(start instanceof Date) || isNaN(start.getTime())) return 'TBD';
  const startStr = formatEventDateUTC(start);
  if (!end || !(end instanceof Date) || isNaN(end.getTime()) || sameUTCDate(end, start)) return startStr;
  return `${startStr} – ${formatEventDateUTC(end)}`;
}
function gmapsUrl(address?: string, fallback?: string) {
  const q = address && address.trim().length ? address : (fallback || '');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
function calDateUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
function gcalUrl(show: ShowRow) {
  const start = show.startDate && !isNaN(show.startDate.getTime()) ? calDateUTC(show.startDate) : '';
  const endD = show.endDate && !isNaN(show.endDate.getTime()) ? show.endDate : show.startDate;
  const end = endD && !isNaN(endD.getTime()) ? calDateUTC(endD) : start;
  const dates = start && end ? `${start}/${end}` : '';
  const text = encodeURIComponent(show.name || '');
  const loc = encodeURIComponent(show.address || show.location || '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&location=${loc}`;
}

/* ---------------- Styles ---------------- */
function makeStyles(t: ReturnType<typeof getTheme>) {
  const activeBg = t.colors.highlight;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.appBg },
    header: { 
      backgroundColor: t.colors.headerBg, 
      paddingTop: Platform.OS === 'ios' ? 60 : 46, 
      paddingBottom: 16, 
      paddingHorizontal: 20 
    },
    headerTop: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      marginBottom: 12 
    },
    backButton: { 
      width: 40, 
      height: 40, 
      borderRadius: 20, 
      backgroundColor: t.dark ? 'rgba(234,219,166,0.18)' : 'rgba(212,175,55,0.2)', 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    headerTitle: { 
      fontSize: 22, 
      color: t.colors.accent, 
      fontFamily: 'Montserrat_700Bold' 
    },

    searchContainer: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: t.colors.surface, 
      borderRadius: 14, 
      paddingHorizontal: 16, 
      paddingVertical: 14, 
      borderWidth: 1, 
      borderColor: t.colors.border, 
      marginHorizontal: 20, 
      marginTop: 0,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOpacity: t.dark ? 0.3 : 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    searchIcon: { marginRight: 12 },
    searchInput: { 
      flex: 1, 
      fontSize: 16, 
      color: t.colors.text, 
      fontFamily: 'Roboto_400Regular' 
    },

    content: { flex: 1, paddingHorizontal: 20 },
    showsContent: { paddingBottom: 30 },
    
    sectionHeader: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      paddingVertical: 12,
      marginBottom: 4,
    },
    sectionTitle: { 
      fontSize: 18, 
      color: t.colors.text, 
      fontFamily: 'Montserrat_600SemiBold' 
    },
    headerButtons: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 10 
    },
    locationButton: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingHorizontal: 14, 
      paddingVertical: 9, 
      borderRadius: 20, 
      backgroundColor: t.colors.accent,
      shadowColor: t.colors.accent,
      shadowOpacity: 0.3,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    locationButtonText: { 
      fontSize: 13, 
      color: t.dark ? '#0E1A2A' : t.colors.text, 
      fontFamily: 'Roboto_500Medium', 
      marginLeft: 6 
    },
    iconButton: { 
      padding: 10, 
      borderRadius: 10, 
      backgroundColor: t.colors.surface, 
      borderWidth: 1, 
      borderColor: t.colors.border 
    },
    iconButtonActive: { 
      backgroundColor: t.colors.highlight, 
      borderColor: t.colors.accent 
    },

    showCard: {
      backgroundColor: t.colors.surface,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: t.colors.border,
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 14,
      shadowColor: '#000',
      shadowOpacity: t.dark ? 0.25 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    showCardContainer: { position: 'relative' },
    featuredCard: { 
      borderWidth: 2, 
      borderColor: t.colors.accent,
      shadowOpacity: t.dark ? 0.35 : 0.12,
    },

    favStarBtn: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.95)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
      borderWidth: 1,
      borderColor: t.colors.softBorder,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },

    leftRail: { 
      width: 76, 
      alignItems: 'center', 
      alignSelf: 'stretch', 
      justifyContent: 'flex-start',
      paddingTop: 4,
    },
    leftIconWrap: {
      width: 60, 
      height: 60, 
      borderRadius: 16,
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: t.dark ? '#1A2738' : '#E8EEF6',
      borderWidth: 1.5, 
      borderColor: t.colors.border,
      marginBottom: 10,
      shadowColor: t.colors.accent,
      shadowOpacity: t.dark ? 0.15 : 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    leftTypePill: {
      paddingHorizontal: 8, 
      paddingVertical: 5, 
      borderRadius: 999,
      backgroundColor: t.colors.chip, 
      borderWidth: 1, 
      borderColor: t.colors.border,
    },
    leftTypeText: { 
      fontSize: 10, 
      color: t.colors.subtext, 
      fontFamily: 'Roboto_500Medium', 
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },

    cardBody: { flex: 1 },
    showInfo: { flex: 1 },
    
    showName: { 
      fontSize: 16, 
      lineHeight: 22,
      color: t.colors.text, 
      fontFamily: 'Roboto_500Medium', 
      marginBottom: 10,
      paddingRight: 40,
    },

    showDetails: { 
      gap: 8,
      marginBottom: 10,
    },
    showDetailRow: { 
      flexDirection: 'row', 
      alignItems: 'center',
      gap: 8,
    },
    showDetailText: { 
      fontSize: 14, 
      color: t.colors.subtext, 
      fontFamily: 'Roboto_400Regular',
      flex: 1,
    },

    featuredBadgeFooter: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: t.colors.accent, 
      paddingHorizontal: 10, 
      paddingVertical: 6, 
      borderRadius: 10,
      alignSelf: 'flex-start',
    },
    featuredTextFooter: { 
      fontSize: 11, 
      color: t.dark ? '#0E1A2A' : t.colors.text, 
      fontFamily: 'Roboto_500Medium', 
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    chevronContainerAbsolute: { 
      position: 'absolute', 
      right: 16, 
      top: '50%',
      transform: [{ translateY: -10 }],
    },

    footerBtnRow: { 
      flexDirection: 'row', 
      gap: 12, 
      marginTop: 16 
    },
    footerBtn: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: t.dark ? 'rgba(255,255,255,0.05)' : t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.softBorder,
      shadowColor: '#000',
      shadowOpacity: t.dark ? 0.25 : 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      alignItems: 'center',
    },
    footerBtnPrimary: {
      backgroundColor: t.colors.accent,
      borderColor: t.dark ? 'rgba(0,0,0,0.25)' : '#C39B2C',
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
    },
    footerBtnInner: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 8 
    },
    footerBtnLabel: { 
      fontSize: 14, 
      color: t.colors.text, 
      fontFamily: 'Roboto_500Medium' 
    },
    footerBtnLabelPrimary: { 
      color: t.dark ? '#0E1A2A' : t.colors.text 
    },
    footerBtnSublabel: { 
      fontSize: 12, 
      color: t.colors.subtext, 
      marginTop: 4, 
      fontFamily: 'Roboto_400Regular' 
    },
    footerBtnSublabelPrimary: { 
      color: t.dark ? '#0E1A2A' : t.colors.text, 
      opacity: 0.9 
    },

    adCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      marginBottom: 14,
      backgroundColor: t.dark ? 'rgba(234,219,166,0.06)' : '#FFF7E0',
      borderColor: t.colors.accent,
      gap: 12,
    },
    adIconBubble: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.dark ? 'rgba(234,219,166,0.18)' : '#FDEFC4',
      borderWidth: 1,
      borderColor: t.colors.accent,
    },
    adTextWrap: { flex: 1 },
    adTitle: {
      fontSize: 14,
      fontFamily: 'Roboto_500Medium',
      color: t.colors.text,
      marginBottom: 3,
    },
    adSubtitle: {
      fontSize: 12,
      fontFamily: 'Roboto_400Regular',
      color: t.colors.subtext,
      lineHeight: 17,
    },
    adTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.chip,
    },
    adTagText: {
      fontSize: 10,
      fontFamily: 'Roboto_500Medium',
      color: t.colors.subtext,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    modalOverlay: { 
      flex: 1, 
      backgroundColor: 'rgba(0,0,0,0.6)', 
      justifyContent: 'center', 
      alignItems: 'center', 
      paddingHorizontal: 20 
    },
    modalOverlayTouchable: { 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0 
    },

    locationModalContent: { 
      backgroundColor: t.colors.surface, 
      borderRadius: 24, 
      width: '100%', 
      maxWidth: 420, 
      zIndex: 1, 
      borderWidth: 1, 
      borderColor: t.colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
    },
    filterModalContent: { 
      backgroundColor: t.colors.surface, 
      borderTopLeftRadius: 24, 
      borderTopRightRadius: 24, 
      maxHeight: '80%', 
      width: '100%', 
      zIndex: 1, 
      borderWidth: 1, 
      borderColor: t.colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: -10 },
    },
    locationModalHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: 24, 
      borderBottomWidth: 1, 
      borderBottomColor: t.colors.border 
    },
    locationModalTitle: { 
      fontSize: 20, 
      color: t.colors.text, 
      fontFamily: 'Montserrat_600SemiBold' 
    },

    locationInputContainer: { padding: 24 },
    labelRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 10 
    },
    inputLabel: { 
      fontSize: 14, 
      color: t.colors.text, 
      fontFamily: 'Roboto_500Medium',
      marginBottom: 10,
    },
    locateMeButton: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: 'transparent', 
      paddingHorizontal: 10, 
      paddingVertical: 4, 
      borderRadius: 12, 
      gap: 4 
    },
    locateMeText: { 
      fontSize: 13, 
      color: t.colors.accent, 
      fontFamily: 'Roboto_500Medium' 
    },
    locateMeButtonLarge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.dark ? 'rgba(234,219,166,0.12)' : '#FFF6DA',
      borderWidth: 2,
      borderColor: t.colors.accent,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 24,
      marginTop: 16,
      gap: 10,
      shadowColor: t.colors.accent,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    locateMeTextLarge: {
      fontSize: 16,
      color: t.colors.accent,
      fontFamily: 'Montserrat_600SemiBold',
      letterSpacing: 0.3,
    },
    detectedCityCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.dark ? 'rgba(16,185,129,0.12)' : '#D1FAE5',
      borderWidth: 2,
      borderColor: t.colors.success,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 24,
      marginTop: 16,
      gap: 10,
      shadowColor: t.colors.success,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    detectedCityText: {
      fontSize: 17,
      color: t.colors.text,
      fontFamily: 'Montserrat_600SemiBold',
      letterSpacing: 0.3,
      flex: 1,
      textAlign: 'center',
    },

    zipRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 10, 
      flexWrap: 'wrap' 
    },
    zipCodeInput: { 
      backgroundColor: t.dark ? 'rgba(255,255,255,0.04)' : t.colors.inputBg, 
      borderRadius: 14, 
      paddingHorizontal: 16, 
      paddingVertical: 14, 
      borderWidth: 1, 
      borderColor: t.colors.border, 
      fontSize: 16, 
      color: t.colors.text, 
      fontFamily: 'Roboto_400Regular',
      width: '100%',
    },

    previewPill: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: t.colors.pillGoldBg, 
      borderRadius: 999, 
      paddingHorizontal: 12, 
      paddingVertical: 8, 
      borderWidth: 1, 
      borderColor: t.colors.accent 
    },
    previewPillText: { 
      fontSize: 13, 
      color: t.colors.text, 
      fontFamily: 'Roboto_500Medium', 
      marginLeft: 6 
    },

    suggestBox: { 
      marginTop: 10, 
      borderRadius: 14, 
      backgroundColor: t.colors.surface, 
      borderWidth: 1, 
      borderColor: t.colors.border, 
      maxHeight: 240, 
      overflow: 'hidden' 
    },
    suggestRow: { 
      paddingVertical: 12, 
      paddingHorizontal: 16, 
      flexDirection: 'row', 
      alignItems: 'baseline' 
    },
    suggestCity: { 
      fontSize: 14, 
      color: t.colors.text, 
      fontFamily: 'Roboto_500Medium' 
    },
    suggestState: { 
      fontSize: 14, 
      color: t.colors.text, 
      fontFamily: 'Roboto_400Regular' 
    },
    suggestZip: { 
      fontSize: 12, 
      color: t.colors.subtext, 
      fontFamily: 'Roboto_400Regular' 
    },
    suggestSep: { 
      height: 1, 
      backgroundColor: t.colors.softBorder 
    },

    // New slider styles
    sliderSection: {
      marginTop: 20,
    },
    sliderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sliderValue: {
      fontSize: 17,
      color: t.colors.accent,
      fontFamily: 'Montserrat_600SemiBold',
      letterSpacing: 0.5,
    },
    sliderContainer: {
      position: 'relative',
      width: '100%',
    },
    sliderHashmarks: {
      position: 'absolute',
      top: 15,
      left: 14,
      right: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      zIndex: 0,
    },
    hashmark: {
      width: 2,
      height: 12,
      backgroundColor: t.dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
      borderRadius: 1,
    },
    sliderTrack: {
      height: 6,
      borderRadius: 3,
    },
    sliderThumb: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: t.colors.accent,
      borderWidth: 4,
      borderColor: t.colors.surface,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 5,
    },
    sliderMarkers: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingHorizontal: 14,
    },
    markerContainer: {
      alignItems: 'center',
    },
    sliderMarker: {
      fontSize: 13,
      color: t.colors.subtext,
      fontFamily: 'Montserrat_600SemiBold',
      letterSpacing: 0.3,
    },
    showAllToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: t.colors.chip,
      borderWidth: 1,
      borderColor: t.colors.border,
      marginTop: 16,
    },
    showAllToggleActive: {
      backgroundColor: t.colors.highlight,
      borderColor: t.colors.accent,
    },
    showAllText: {
      fontSize: 14,
      color: t.colors.text,
      fontFamily: 'Roboto_500Medium',
    },

    locationModalFooter: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      padding: 24, 
      paddingTop: 16, 
      borderTopWidth: 1, 
      borderTopColor: t.colors.border 
    },
    cancelLocationButtonText: { 
      fontSize: 14, 
      color: t.colors.subtext, 
      fontFamily: 'Roboto_500Medium' 
    },
    submitLocationButtonText: { 
      fontSize: 14, 
      color: t.dark ? '#0E1A2A' : t.colors.text, 
      fontFamily: 'Roboto_500Medium' 
    },
    cancelLocationButtonContainer: { 
      flex: 1, 
      paddingVertical: 14, 
      marginRight: 8, 
      borderRadius: 12, 
      borderWidth: 1, 
      borderColor: t.colors.border, 
      alignItems: 'center', 
      backgroundColor: t.colors.chip 
    },
    submitLocationButtonContainer: { 
      flex: 1, 
      paddingVertical: 14, 
      marginLeft: 8, 
      borderRadius: 12, 
      backgroundColor: t.colors.accent, 
      alignItems: 'center' 
    },
    disabledButton: { opacity: 0.5 },

    filterModalBody: { padding: 24 },
    filterSection: { marginBottom: 28 },
    filterSectionHeaderRow: { 
      flexDirection: 'row', 
      alignItems: 'baseline', 
      justifyContent: 'space-between', 
      marginBottom: 14 
    },
    filterSectionTitle: { 
      fontSize: 16, 
      color: t.colors.text, 
      fontFamily: 'Montserrat_600SemiBold' 
    },

    typeCardGrid: { 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      gap: 12 
    },
    typeCard: {
      width: '48%',
      minHeight: 110,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.chip,
      padding: 16,
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    typeCardActive: { 
      backgroundColor: activeBg, 
      borderColor: t.colors.accent, 
      shadowOpacity: 0.15 
    },
    typeHeaderRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 10 
    },
    typeIconWrap: {
      width: 44, 
      height: 44, 
      borderRadius: 12,
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: t.colors.pillGoldBg,
      borderWidth: 1, 
      borderColor: t.colors.accent,
    },
    typeTitle: { 
      fontSize: 16, 
      fontFamily: 'Roboto_500Medium', 
      color: t.colors.text 
    },
    typeSubtitle: { 
      marginTop: 8, 
      fontSize: 12, 
      color: t.colors.subtext, 
      fontFamily: 'Roboto_400Regular' 
    },

    sortBody: { padding: 24, gap: 8 },
    sortRow: { 
      paddingVertical: 14, 
      paddingHorizontal: 16, 
      borderRadius: 12, 
      backgroundColor: t.colors.chip, 
      borderWidth: 1, 
      borderColor: t.colors.border, 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    },
    sortRowActive: { 
      backgroundColor: t.colors.highlight, 
      borderColor: t.colors.accent 
    },
    sortFooter: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      padding: 24, 
      paddingTop: 16, 
      borderTopWidth: 1, 
      borderTopColor: t.colors.border 
    },

    eventModalContent: { 
      position: 'absolute', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      backgroundColor: t.colors.surface, 
      borderTopLeftRadius: 28, 
      borderTopRightRadius: 28, 
      maxHeight: '90%', 
      paddingBottom: 40, 
      borderWidth: 1, 
      borderColor: t.colors.border 
    },
    eventModalHeader: { 
      flexDirection: 'row', 
      justifyContent: 'flex-end', 
      padding: 20, 
      paddingBottom: 0 
    },
    eventCloseButton: { padding: 8 },

    eventHeaderWrap: { 
      paddingHorizontal: 24, 
      paddingTop: 14, 
      paddingBottom: 16 
    },
    eventTitle: { 
      fontSize: 26, 
      lineHeight: 32, 
      color: t.colors.text, 
      fontFamily: 'Montserrat_700Bold', 
      marginRight: 28 
    },
    eventBadgeRow: { 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      gap: 8, 
      marginTop: 12 
    },

    badge: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 6, 
      paddingHorizontal: 10, 
      paddingVertical: 6, 
      borderRadius: 999, 
      backgroundColor: t.colors.chip, 
      borderWidth: 1, 
      borderColor: t.colors.border 
    },
    badgeVenue: { 
      backgroundColor: t.colors.pillGoldBg, 
      borderColor: t.colors.accent 
    },
    badgeFeatured: { 
      backgroundColor: t.colors.highlight, 
      borderColor: t.colors.accent 
    },
    badgeText: { 
      fontSize: 12, 
      color: t.colors.text, 
      fontFamily: 'Roboto_500Medium' 
    },

    quickRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      paddingHorizontal: 20, 
      paddingTop: 8, 
      paddingBottom: 16,
      gap: 8,
    },
    quickBtn: { 
      flex: 1, 
      borderRadius: 14, 
      borderWidth: 1, 
      borderColor: t.colors.border, 
      backgroundColor: t.colors.surface, 
      paddingVertical: 14, 
      alignItems: 'center', 
      gap: 6 
    },
    quickText: { 
      fontSize: 12, 
      color: t.colors.text, 
      fontFamily: 'Roboto_500Medium' 
    },

    infoCard: { 
      marginHorizontal: 20, 
      marginBottom: 16, 
      paddingHorizontal: 18, 
      paddingVertical: 12, 
      borderRadius: 18, 
      backgroundColor: t.colors.surface, 
      borderWidth: 1, 
      borderColor: t.colors.border 
    },
    infoRow: { 
      flexDirection: 'row', 
      alignItems: 'flex-start', 
      paddingVertical: 12 
    },
    infoText: { 
      marginLeft: 12, 
      flex: 1 
    },
    infoLabel: { 
      fontSize: 12, 
      color: t.colors.subtext, 
      fontFamily: 'Roboto_400Regular', 
      marginBottom: 3 
    },
    infoValue: { 
      fontSize: 16, 
      color: t.colors.text, 
      fontFamily: 'Roboto_500Medium', 
      lineHeight: 22 
    },

    primaryCta: { 
      backgroundColor: t.colors.primary, 
      marginHorizontal: 20, 
      marginTop: 6, 
      marginBottom: 24, 
      paddingVertical: 16, 
      borderRadius: 14, 
      alignItems: 'center' 
    },
    primaryCtaText: { 
      color: '#fff', 
      fontSize: 16, 
      fontFamily: 'Montserrat_600SemiBold' 
    },

    zeroStateCard: { 
      backgroundColor: t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(30,58,95,0.05)', 
      borderRadius: 20, 
      borderWidth: 1, 
      borderColor: t.colors.softBorder, 
      padding: 24, 
      alignItems: 'center', 
      justifyContent: 'center' 
    },
    zeroStateTitle: { 
      fontSize: 17, 
      color: t.colors.text, 
      fontFamily: 'Montserrat_600SemiBold', 
      marginTop: 8 
    },
    zeroStateSub: { 
      fontSize: 14, 
      color: t.colors.subtext, 
      fontFamily: 'Roboto_400Regular', 
      textAlign: 'center', 
      marginTop: 8, 
      lineHeight: 20 
    },
    zeroCta: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 8, 
      backgroundColor: t.colors.accent, 
      borderRadius: 999, 
      paddingHorizontal: 18, 
      paddingVertical: 11, 
      marginTop: 16 
    },
    zeroCtaText: { 
      color: t.dark ? '#0E1A2A' : t.colors.text, 
      fontSize: 14, 
      fontFamily: 'Roboto_500Medium' 
    },
    zeroBadgeRow: { 
      flexDirection: 'row', 
      gap: 10, 
      marginTop: 14 
    },
    zeroBadge: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 6, 
      borderWidth: 1, 
      borderColor: t.colors.border, 
      backgroundColor: t.colors.chip, 
      paddingHorizontal: 10, 
      paddingVertical: 6, 
      borderRadius: 999 
    },
    zeroBadgeText: { 
      fontSize: 12, 
      color: t.colors.subtext, 
      fontFamily: 'Roboto_500Medium' 
    },
  });
}

/* ---------------- Types ---------------- */
type SortField = 'distance' | 'attendees' | 'date' | null;
type SortOrder = 'asc' | 'desc';

/* ---------------- Ad Banner ---------------- */
function AdBanner({ theme, styles }: { theme: ReturnType<typeof getTheme>; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.adCard}>
      <View style={styles.adIconBubble}>
        <Star size={18} color={theme.colors.accent} />
      </View>
      <View style={styles.adTextWrap}>
        <Text style={styles.adTitle}>Curator Perk: Ad-Free Events</Text>
        <Text style={styles.adSubtitle}>
          Curators enjoy a clean, ad-free feed plus advanced tools for serious collectors.
        </Text>
      </View>
      <View style={styles.adTag}>
        <Text style={styles.adTagText}>Curio Ad</Text>
      </View>
    </View>
  );
}

function EventsInner() {
  // Theme & membership
  const [mode, setMode] = useState<AppThemeMode>('light');
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

  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Location & filters
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [zipInput, setZipInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [zipSuggestions, setZipSuggestions] = useState<Array<{ z: string; c: string; s: string }>>([]);
  const [selectedDisplay, setSelectedDisplay] = useState<string>('');
  const [zipError, setZipError] = useState<string | null>(null);
  const [isSubmittingZip, setIsSubmittingZip] = useState(false);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedShowTypes, setSelectedShowTypes] = useState<string[]>(['All']);

  // Favorites
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(EVENTS_FAV_STORAGE_KEY);
        if (raw) setFavIds(new Set(JSON.parse(raw)));
      } catch {}
    })();
  }, []);
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(EVENTS_FAV_STORAGE_KEY, JSON.stringify(Array.from(favIds)));
      } catch {}
    })();
  }, [favIds]);
  const isFav = useCallback((id: string) => favIds.has(id), [favIds]);
  const toggleFav = useCallback(async (id: string) => {
    setFavIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Radius with slider (default 100; null = Show All)
  const [radiusMiles, setRadiusMiles] = useState<number | null>(100);
  const [showAllDistance, setShowAllDistance] = useState(false);

  // Date range in days (default 60; null = Show All)
  const [dateRangeDays, setDateRangeDays] = useState<number | null>(60);

  // Load saved filters
  useEffect(() => {
    (async () => {
      const savedZip = await AsyncStorage.getItem(LOCATION_ZIP_STORAGE_KEY);
      if (savedZip) setCurrentLocation(savedZip);
      const savedRadius = await AsyncStorage.getItem(RADIUS_STORAGE_KEY);
      if (savedRadius === 'ALL') {
        setRadiusMiles(null);
        setShowAllDistance(true);
      } else if (savedRadius) {
        const n = parseInt(savedRadius, 10);
        if (!isNaN(n)) setRadiusMiles(n);
      }
      const savedDateRange = await AsyncStorage.getItem(DATE_RANGE_STORAGE_KEY);
      if (savedDateRange === 'ALL') setDateRangeDays(null);
      else if (savedDateRange) {
        const n = parseInt(savedDateRange, 10);
        if (!isNaN(n)) setDateRangeDays(n);
      }
    })();
  }, []);

  useEffect(() => { (async () => {
    await AsyncStorage.setItem(RADIUS_STORAGE_KEY, radiusMiles == null ? 'ALL' : String(radiusMiles));
  })(); }, [radiusMiles]);

  useEffect(() => { (async () => {
    await AsyncStorage.setItem(DATE_RANGE_STORAGE_KEY, dateRangeDays == null ? 'ALL' : String(dateRangeDays));
  })(); }, [dateRangeDays]);

  // ZIP helpers
  const normalizeZip = (txt: string) => txt.replace(/\D+/g, '').slice(0, 5);
  const isZipValid = (z: string) => z.length === 5 && Boolean((zipMap as any)[z]);

  const setZipAndValidate = (val: string) => {
    const digits = normalizeZip(val);
    setZipInput(digits);

    if (digits.length >= 2) {
      const pref = digits;
      const out: Array<{ z: string; c: string; s: string }> = [];
      for (let i = 0, count = 0; i < (zipList as any).length; i++) {
        const row = (zipList as any)[i];
        if (row.z.startsWith(pref)) { out.push(row); count++; if (count >= 12) break; }
      }
      setZipSuggestions(out);
    } else setZipSuggestions([]);

    if (!digits) { setSelectedDisplay(''); setZipError(null); return; }
    if (digits.length === 5) {
      if (isZipValid(digits)) {
        const rec = (zipMap as any)[digits];
        setSelectedDisplay(`${rec.c}, ${rec.s}`);
        setZipError(null);
        setZipSuggestions([]);
      } else { setSelectedDisplay(''); setZipError('Please enter a valid US ZIP code'); }
    } else { setSelectedDisplay(''); setZipError(null); }
  };

  const onPickSuggestion = (zip: string) => setZipAndValidate(zip);
  const canSubmitLocation = isZipValid(zipInput);

  // Save location
  const saveLocationAndUpdate = async (zip: string) => {
    await AsyncStorage.setItem(LOCATION_ZIP_STORAGE_KEY, zip);
    setCurrentLocation(zip);
    recalcDistances(zip);
  };

  // Locate me
  const [isLocating, setIsLocating] = useState(false);
  const handleLocateMe = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Geolocation is not available on web platform. Please enter your zip code manually.');
      return;
    }
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to auto-populate your zip code.');
        setIsLocating(false); return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude, longitude: location.coords.longitude,
      });
      if (reverseGeocode.length > 0 && reverseGeocode[0].postalCode) {
        const detectedZip = reverseGeocode[0].postalCode!;
        setZipAndValidate(detectedZip);
      } else {
        Alert.alert('Location Found', 'Unable to determine zip code from your location. Please enter it manually.');
      }
    } catch {
      Alert.alert('Error', 'Failed to get your location. Please try again or enter your zip code manually.');
    } finally { setIsLocating(false); }
  };

  // Shows
  const [sheetShows, setSheetShows] = useState<ShowRow[]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState<boolean>(true);
  const [sheetError, setSheetError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setIsLoadingSheet(true);
        setSheetError(null);
        console.log('📊 Starting to fetch shows from sheet...');
        const rows = await fetchShowsFromSheet();
        console.log(`✅ Fetched ${rows.length} shows successfully`);
        setSheetShows(rows);
      } catch (e: any) {
        console.error('❌ Error fetching shows:', e);
        console.error('Error details:', e.message, e.stack);
        setSheetError(e?.message || 'Failed to load events.');
      } finally { setIsLoadingSheet(false); }
    })();
  }, []);

  const [derivedShows, setDerivedShows] = useState<ShowRow[]>([]);
  const recalcDistances = useCallback((userZip: string) => {
    if (!userZip || !(zipMap as any)[userZip]) { setDerivedShows(sheetShows); return; }
    setDerivedShows(withDistances(sheetShows, userZip, zipMap as any));
  }, [sheetShows]);

  useEffect(() => {
    if (sheetShows.length === 0) return;
    recalcDistances(currentLocation);
  }, [sheetShows, currentLocation, recalcDistances]);

  // Sort & filter (default: date soonest first)
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const saneTime = (d?: Date) => (!d || isNaN(d.getTime())) ? Number.POSITIVE_INFINITY : d.getTime();
  const formatDate = (date?: Date) => formatEventDateUTC(date);

  const displayedShows = useMemo(() => {
    const todayUTC = new Date(); todayUTC.setUTCHours(0, 0, 0, 0);
    let list = derivedShows.filter((s) => {
      const end = s.endDate || s.startDate;
      if (!end || isNaN(end.getTime())) return true;
      const d = new Date(end); d.setUTCHours(0, 0, 0, 0);
      return d >= todayUTC;
    });

    if (dateRangeDays != null) {
      const maxDate = new Date(todayUTC);
      maxDate.setUTCDate(maxDate.getUTCDate() + dateRangeDays);
      list = list.filter((s) => {
        if (!s.startDate || isNaN(s.startDate.getTime())) return true;
        const startD = new Date(s.startDate); startD.setUTCHours(0, 0, 0, 0);
        return startD <= maxDate;
      });
    }

    // Enhanced search: name, venue, location, address, type
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter((s) => {
        return (
          s.name.toLowerCase().includes(query) ||
          s.venue?.toLowerCase().includes(query) ||
          s.location?.toLowerCase().includes(query) ||
          s.address?.toLowerCase().includes(query) ||
          s.typeLabel.toLowerCase().includes(query)
        );
      });
    }

    if (!selectedShowTypes.includes('All')) {
      const types = new Set(selectedShowTypes);
      list = list.filter((s) => types.has(s.typeLabel));
    }

    if (!showAllDistance && radiusMiles != null && currentLocation) {
      list = list.filter((s) => {
        if (s.distance == null) return false;
        const distance = Number(s.distance);
        const radius = Number(radiusMiles);
        return distance <= radius;
      });
    }

    if (favoritesOnly) {
      list = list.filter((s) => favIds.has(s.id));
    }

    list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));

    if (sortField) {
      list = list.sort((a, b) => {
        const aVal = sortField === 'date' ? saneTime(a.startDate)
                  : sortField === 'distance' ? (a.distance ?? Number.POSITIVE_INFINITY)
                  : (a.expectedAttendees ?? -1);
        const bVal = sortField === 'date' ? saneTime(b.startDate)
                  : sortField === 'distance' ? (b.distance ?? Number.POSITIVE_INFINITY)
                  : (b.expectedAttendees ?? -1);
        const dir = sortOrder === 'asc' ? 1 : -1;
        if (aVal === bVal) return 0;
        return aVal < bVal ? -1 * dir : 1 * dir;
      });
    }
    return list;
  }, [
    derivedShows, searchQuery, selectedShowTypes, radiusMiles, dateRangeDays,
    sortField, sortOrder, currentLocation, favoritesOnly, favIds, showAllDistance
  ]);

  const handleShowTypeToggle = (type: string) => {
    if (type === 'All') return setSelectedShowTypes(['All']);
    const base = selectedShowTypes.includes('All') ? [] : [...selectedShowTypes];
    const next = base.includes(type) ? base.filter((t) => t !== type) : [...base, type];
    setSelectedShowTypes(next.length ? next : ['All']);
  };

  // Event modal
  const [selectedEvent, setSelectedEvent] = useState<ShowRow | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const safeGoBack = () => {
    if (showEventModal) { setShowEventModal(false); return; }
    if (showLocationModal) { setShowLocationModal(false); return; }
    if (showFilterModal) { setShowFilterModal(false); return; }
    if (showSortModal) { setShowSortModal(false); return; }
    router.replace('/');
  };

  // Date range CTAs
  const handleAddDays = async () => {
    const current = dateRangeDays ?? 60;
    setDateRangeDays(current + 30);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const handleShowAllDates = async () => {
    setDateRangeDays(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Slider helpers
  const getDistanceLabel = () => {
    if (showAllDistance || radiusMiles === null) return 'Show All';
    return `${radiusMiles} mi`;
  };

  const handleSliderChange = (value: number) => {
    const index = Math.round(value);
    setRadiusMiles(DISTANCE_PRESETS[index]);
    setShowAllDistance(false);
  };

  const getSliderValue = () => {
    if (showAllDistance || radiusMiles === null) return 0;
    const index = DISTANCE_PRESETS.indexOf(radiusMiles);
    return index >= 0 ? index : 1; // Default to 100mi if not found
  };

  // ---- REFINED CARD RENDERER with LEFT RAIL ----
  const renderShowCard = (show: ShowRow) => {
    const distanceStr = Number.isFinite(show.distance as number) ? `${show.distance}mi` : '—';
    const dateDisplay = show.endDate && !sameUTCDate(show.endDate, show.startDate)
      ? `${formatDate(show.startDate)} – ${formatDate(show.endDate)}`
      : formatDate(show.startDate);

    const iconInk = theme.dark ? '#FFFFFF' : theme.colors.primary;

    let eventIconLarge: React.ReactNode = <Grid3X3 size={32} color={iconInk} />;

    if (show.typeLabel === 'Card Show') {
      eventIconLarge = TradingCardBlank
        ? <TradingCardBlank width={32} height={32} ink={iconInk} />
        : <BookOpen size={32} color={iconInk} />;
    } else if (show.typeLabel === 'Coin Show') {
      eventIconLarge = CoinDollarIcon
        ? <CoinDollarIcon size={32} color={iconInk} reeded={false} />
        : <Grid3X3 size={32} color={iconInk} />;
    } else if (show.typeLabel === 'Comic Con' || show.typeLabel === 'Mixed') {
      eventIconLarge = <BookOpen size={32} color={iconInk} />;
    }

    const fav = isFav(show.id);

    return (
      <TouchableOpacity
        key={show.id}
        style={[styles.showCard, show.featured && styles.featuredCard, styles.showCardContainer]}
        onPress={() => { setSelectedEvent(show); setShowEventModal(true); }}
        activeOpacity={0.85}
      >
        <TouchableOpacity
          style={styles.favStarBtn}
          onPress={(e) => { e.stopPropagation?.(); toggleFav(show.id); }}
          accessibilityLabel={fav ? 'Remove favorite' : 'Add to favorites'}
        >
          <Star size={18} color={fav ? theme.colors.favOn : theme.colors.muted} fill={fav ? theme.colors.favOn : 'none'} />
        </TouchableOpacity>

        <View style={styles.leftRail}>
          <View style={styles.leftIconWrap}>{eventIconLarge}</View>
          <View style={styles.leftTypePill}>
            <Text style={styles.leftTypeText} numberOfLines={1}>{show.typeLabel}</Text>
          </View>
        </View>

        <View style={[styles.cardBody, styles.showInfo]}>
          <Text style={styles.showName} numberOfLines={2}>{show.name}</Text>
          
          <View style={styles.showDetails}>
            <View style={styles.showDetailRow}>
              <Calendar size={16} color={theme.colors.muted} />
              <Text style={styles.showDetailText}>{dateDisplay}</Text>
            </View>
            <View style={styles.showDetailRow}>
              <MapPin size={16} color={theme.colors.muted} />
              <Text style={styles.showDetailText}>{show.location} • {distanceStr}</Text>
            </View>
            {show.expectedAttendees != null && (
              <View style={styles.showDetailRow}>
                <Users size={16} color={theme.colors.muted} />
                <Text style={styles.showDetailText}>{show.expectedAttendees} expected</Text>
              </View>
            )}
          </View>

          {show.featured && (
            <View style={styles.featuredBadgeFooter}>
              <Star size={12} color={theme.dark ? '#0E1A2A' : theme.colors.text} fill={theme.dark ? '#0E1A2A' : theme.colors.text} />
              <Text style={styles.featuredTextFooter}>Featured</Text>
            </View>
          )}
        </View>

        <View style={styles.chevronContainerAbsolute}>
          <ChevronRight size={20} color={theme.colors.muted} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderShowsWithAds = (shows: ShowRow[]) => {
    if (isPremium) return shows.map(renderShowCard);

    const nodes: React.ReactNode[] = [];
    shows.forEach((show, index) => {
      if (index > 0 && index % AD_FREQUENCY === 0) {
        nodes.push(<AdBanner key={`ad-${index}`} theme={theme} styles={styles} />);
      }
      nodes.push(renderShowCard(show));
    });
    return nodes;
  };

  return (
    <View style={styles.container}>
      {!fontsLoaded && <View style={{ padding: 20 }}><Text style={{ color: theme.colors.subtext }}>Loading…</Text></View>}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={safeGoBack}>
            <ArrowLeft size={24} color={theme.colors.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Events Near Me</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={theme.colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.muted}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.showsContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Shows</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => { setShowLocationModal(true); setZipInput(currentLocation || ''); setSelectedDisplay(''); setZipError(null); }}
              >
                <MapPin size={16} color={theme.dark ? '#0E1A2A' : theme.colors.text} />
                <Text style={styles.locationButtonText}>{currentLocation ? currentLocation : 'Find me'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={() => setShowSortModal(true)}>
                <ArrowUpDown size={16} color={theme.colors.muted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={() => setShowFilterModal(true)}>
                <Filter size={16} color={theme.colors.muted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconButton, favoritesOnly && styles.iconButtonActive]}
                onPress={() => setFavoritesOnly((v) => !v)}
              >
                <Star size={16} color={favoritesOnly ? theme.colors.favOn : theme.colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Zero state */}
          {!currentLocation && (
            <View style={styles.zeroStateCard}>
              <LocatorIllustration accent={theme.colors.accent} ink={theme.colors.text} soft={theme.colors.listStripe} />
              <Text style={styles.zeroStateTitle}>Find shows near you</Text>
              <Text style={styles.zeroStateSub}>Set your location so we can find the closest events near you!</Text>
              <TouchableOpacity
                style={styles.zeroCta}
                onPress={() => { setShowLocationModal(true); setZipInput(''); setSelectedDisplay(''); setZipError(null); }}
                activeOpacity={0.9}
              >
                <MapPin size={16} color={theme.dark ? '#0E1A2A' : theme.colors.text} />
                <Text style={styles.zeroCtaText}>Set your location</Text>
              </TouchableOpacity>
              <View style={styles.zeroBadgeRow}>
                <View style={styles.zeroBadge}><Search size={14} color={theme.colors.subtext} /><Text style={styles.zeroBadgeText}>Search any city</Text></View>
                <View style={styles.zeroBadge}><Filter size={14} color={theme.colors.subtext} /><Text style={styles.zeroBadgeText}>Use filters</Text></View>
              </View>
            </View>
          )}

          {!!currentLocation && isLoadingSheet && (
            <View style={[styles.showCard]}><Text style={styles.showDetailText}>Loading events…</Text></View>
          )}
          {!!currentLocation && sheetError && (
            <View style={[styles.showCard]}><Text style={styles.showDetailText}>Error: {sheetError}</Text></View>
          )}

          {!!currentLocation && !isLoadingSheet && !sheetError && renderShowsWithAds(displayedShows)}

          {!!currentLocation && (
            <View style={styles.footerBtnRow}>
              <TouchableOpacity
                style={styles.footerBtn}
                onPress={handleAddDays}
                activeOpacity={0.9}
                disabled={dateRangeDays == null}
              >
                <View style={styles.footerBtnInner}>
                  <Calendar size={18} color={theme.colors.text} />
                  <Text style={styles.footerBtnLabel}>+30 Days</Text>
                </View>
                <Text style={styles.footerBtnSublabel}>
                  {dateRangeDays == null ? 'All dates shown' : `Next ${(dateRangeDays ?? 60) + 30} days`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.footerBtn, styles.footerBtnPrimary]}
                onPress={handleShowAllDates}
                activeOpacity={0.9}
                disabled={dateRangeDays == null}
              >
                <View style={styles.footerBtnInner}>
                  <Globe size={18} color={theme.dark ? '#0E1A2A' : theme.colors.text} />
                  <Text style={[styles.footerBtnLabel, styles.footerBtnLabelPrimary]}>Show All</Text>
                </View>
                <Text style={[styles.footerBtnSublabel, styles.footerBtnSublabelPrimary]}>
                  {dateRangeDays == null ? 'All dates' : 'Remove date limit'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Location Modal */}
      <Modal visible={showLocationModal} transparent animationType="slide" onRequestClose={() => setShowLocationModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalOverlayTouchable} activeOpacity={1} onPress={() => setShowLocationModal(false)} />
          <View style={styles.locationModalContent}>
            <View style={styles.locationModalHeader}>
              <Text style={styles.locationModalTitle}>Set Your Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <X size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.locationInputContainer}>
              <Text style={styles.inputLabel}>Zip Code</Text>

              <TextInput
                style={[styles.zipCodeInput, zipError ? { borderColor: theme.colors.danger } : {}]}
                placeholder="Enter your zip code"
                value={zipInput}
                onChangeText={setZipAndValidate}
                placeholderTextColor={theme.colors.muted}
                keyboardType="numeric"
                maxLength={5}
                returnKeyType="done"
                onSubmitEditing={async () => {
                  if (isZipValid(zipInput)) {
                    setIsSubmittingZip(true);
                    await saveLocationAndUpdate(zipInput);
                    setIsSubmittingZip(false);
                    setShowLocationModal(false);
                  } else setZipError('Please enter a valid US ZIP code');
                }}
              />

              {zipSuggestions.length > 0 && (
                <View style={styles.suggestBox}>
                  <FlatList
                    keyboardShouldPersistTaps="handled"
                    data={zipSuggestions}
                    keyExtractor={(item) => item.z}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.suggestRow} onPress={() => onPickSuggestion(item.z)}>
                        <Text style={styles.suggestCity}>{item.c}</Text>
                        <Text style={styles.suggestState}>&nbsp;{item.s}</Text>
                        <Text style={styles.suggestZip}> · {item.z}</Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.suggestSep} />}
                  />
                </View>
              )}

              {/* Conditional display: Locate Me button OR Detected City */}
              {!selectedDisplay ? (
                <TouchableOpacity 
                  style={styles.locateMeButtonLarge} 
                  onPress={handleLocateMe} 
                  disabled={isLocating}
                  activeOpacity={0.8}
                >
                  {isLocating ? (
                    <>
                      <Locate size={20} color={theme.colors.accent} />
                      <Text style={styles.locateMeTextLarge}>Locating…</Text>
                    </>
                  ) : (
                    <>
                      <Locate size={20} color={theme.colors.accent} />
                      <Text style={styles.locateMeTextLarge}>Locate me</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.detectedCityCard}>
                  <MapPin size={20} color={theme.colors.accent} />
                  <Text style={styles.detectedCityText}>{selectedDisplay}</Text>
                  <Check size={18} color={theme.colors.success} />
                </View>
              )}

              {!!zipError && (
                <Text style={{ marginTop: 12, fontSize: 13, color: theme.colors.danger, fontFamily: 'Roboto_500Medium' }}>
                  {zipError}
                </Text>
              )}

              <Text style={{ marginTop: 16, fontSize: 13, color: theme.colors.muted, fontFamily: 'Roboto_400Regular' }}>
                Tip: We use your zip code to measure distance to nearby shows. Adjust distance in Filters.
              </Text>
            </View>

            <View style={styles.locationModalFooter}>
              <TouchableOpacity style={styles.cancelLocationButtonContainer} onPress={() => setShowLocationModal(false)}>
                <Text style={styles.cancelLocationButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitLocationButtonContainer, !canSubmitLocation || isSubmittingZip ? styles.disabledButton : null]}
                disabled={!canSubmitLocation || isSubmittingZip}
                onPress={async () => {
                  setIsSubmittingZip(true);
                  await saveLocationAndUpdate(zipInput);
                  setIsSubmittingZip(false);
                  setShowLocationModal(false);
                }}
              >
                <Text style={styles.submitLocationButtonText}>
                  {isSubmittingZip ? 'Updating…' : 'Update Location'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal with Distance Slider */}
      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalOverlayTouchable} activeOpacity={1} onPress={() => setShowFilterModal(false)} />
        <View style={styles.filterModalContent}>
          <View style={styles.locationModalHeader}>
            <Text style={styles.locationModalTitle}>Filter Shows</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <X size={24} color={theme.colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterModalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeaderRow}>
                <Text style={styles.filterSectionTitle}>Show Types</Text>
              </View>

              <View style={styles.typeCardGrid}>
                {[
                  { key: 'All', title: 'All', subtitle: 'See everything nearby', icon: 'all' },
                  { key: 'Card Show', title: 'Card Show', subtitle: 'Sports, TCG & more', icon: 'card' },
                  { key: 'Coin Show', title: 'Coin Show', subtitle: 'Currency & numismatics', icon: 'coin' },
                  { key: 'Comic Con', title: 'Comic Con', subtitle: 'Comics, cosplay, artists', icon: 'comic' },
                ].map(({ key, title, subtitle, icon }) => {
                  const active = selectedShowTypes.includes(key);
                  const filterIconInk = theme.dark ? '#FFFFFF' : theme.colors.primary;
                  const IconEl =
                    icon === 'all'   ? <Grid3X3 size={28} color={filterIconInk} /> :
                    icon === 'card'  ? (TradingCardBlank
                      ? <TradingCardBlank width={28} height={28} ink={filterIconInk} />
                      : <BookOpen size={28} color={filterIconInk} />) :
                    icon === 'coin'  ? (CoinDollarIcon
                      ? <CoinDollarIcon size={28} color={filterIconInk} reeded />
                      : <Grid3X3 size={28} color={filterIconInk} />) :
                    /* comic */        <BookOpen size={28} color={filterIconInk} />;

                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.typeCard, active && styles.typeCardActive]}
                      onPress={() => handleShowTypeToggle(key)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.typeHeaderRow}>
                        <View style={styles.typeIconWrap}>{IconEl}</View>
                        <Text style={styles.typeTitle}>{title}</Text>
                      </View>
                      <Text style={styles.typeSubtitle}>{subtitle}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Distance Slider Section */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeaderRow}>
                <Text style={styles.filterSectionTitle}>Distance</Text>
                <Text style={styles.sliderValue}>{getDistanceLabel()}</Text>
              </View>

              {!showAllDistance && (
                <View style={styles.sliderContainer}>
                  {/* Hashmarks layer */}
                  <View style={styles.sliderHashmarks}>
                    {DISTANCE_PRESETS.map((_, index) => (
                      <View key={index} style={styles.hashmark} />
                    ))}
                  </View>

                  {/* Slider */}
                  <Slider
                    containerStyle={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={DISTANCE_PRESETS.length - 1}
                    step={1}
                    value={getSliderValue()}
                    onValueChange={(value) => handleSliderChange(Array.isArray(value) ? value[0] : value)}
                    minimumTrackTintColor={theme.colors.accent}
                    maximumTrackTintColor={theme.colors.border}
                    thumbTintColor={theme.colors.accent}
                    trackStyle={styles.sliderTrack}
                    thumbStyle={styles.sliderThumb}
                  />

                  {/* Value markers below */}
                  <View style={styles.sliderMarkers}>
                    {DISTANCE_PRESETS.map((dist, index) => (
                      <View key={dist} style={styles.markerContainer}>
                        <Text style={styles.sliderMarker}>{dist}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.showAllToggle, showAllDistance && styles.showAllToggleActive]}
                onPress={() => {
                  setShowAllDistance(!showAllDistance);
                  if (!showAllDistance) setRadiusMiles(null);
                  else setRadiusMiles(100);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.showAllText}>Show all distances</Text>
                <View style={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: 10, 
                  borderWidth: 2, 
                  borderColor: showAllDistance ? theme.colors.accent : theme.colors.border,
                  backgroundColor: showAllDistance ? theme.colors.accent : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  {showAllDistance && <Check size={12} color={theme.dark ? '#0E1A2A' : theme.colors.text} />}
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.locationModalFooter}>
            <TouchableOpacity
              style={styles.cancelLocationButtonContainer}
              onPress={() => { 
                setSelectedShowTypes(['All']); 
                setRadiusMiles(100);
                setShowAllDistance(false);
              }}
            >
              <Text style={styles.cancelLocationButtonText}>Clear Filters</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitLocationButtonContainer} onPress={() => setShowFilterModal(false)}>
              <Text style={styles.submitLocationButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalOverlayTouchable} activeOpacity={1} onPress={() => setShowSortModal(false)} />
          <View style={styles.filterModalContent}>
            <View style={styles.locationModalHeader}>
              <Text style={styles.locationModalTitle}>Sort Shows</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <X size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.sortBody}>
              {[
                { f: 'distance' as SortField, o: 'asc' as SortOrder, label: 'Distance (near → far)' },
                { f: 'distance' as SortField, o: 'desc' as SortOrder, label: 'Distance (far → near)' },
                { f: 'attendees' as SortField, o: 'desc' as SortOrder, label: 'Attendees (high → low)' },
                { f: 'attendees' as SortField, o: 'asc' as SortOrder, label: 'Attendees (low → high)' },
                { f: 'date' as SortField, o: 'asc' as SortOrder, label: 'Date (soonest → latest)' },
                { f: 'date' as SortField, o: 'desc' as SortOrder, label: 'Date (latest → soonest)' },
              ].map(row => {
                const active = sortField === row.f && sortOrder === row.o;
                return (
                  <TouchableOpacity
                    key={`${row.f}-${row.o}`}
                    style={[styles.sortRow, active && styles.sortRowActive]}
                    onPress={() => { setSortField(row.f); setSortOrder(row.o); }}
                  >
                    <Text style={{ color: theme.colors.text, fontFamily: 'Roboto_500Medium' }}>{row.label}</Text>
                    {active && <Check size={18} color={theme.colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.locationModalFooter}>
              <TouchableOpacity style={styles.cancelLocationButtonContainer} onPress={() => { setSortField('date'); setSortOrder('asc'); }}>
                <Text style={styles.cancelLocationButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitLocationButtonContainer} onPress={() => setShowSortModal(false)}>
                <Text style={styles.submitLocationButtonText}>Apply Sort</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Event Modal */}
      <Modal visible={showEventModal} animationType="slide" transparent onRequestClose={() => setShowEventModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalOverlayTouchable} activeOpacity={1} onPress={() => setShowEventModal(false)} />
          <View style={styles.eventModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.eventModalHeader}>
                <TouchableOpacity style={styles.eventCloseButton} onPress={() => setShowEventModal(false)}>
                  <X size={24} color={theme.colors.muted} />
                </TouchableOpacity>
              </View>

              {selectedEvent && (
                <>
                  <View style={styles.eventHeaderWrap}>
                    <Text style={styles.eventTitle} numberOfLines={3}>{selectedEvent.name}</Text>
                    <View style={styles.eventBadgeRow}>
                      {!!selectedEvent.venue && (
                        <View style={[styles.badge, styles.badgeVenue]}>
                          <MapPin size={12} color={theme.dark ? '#0E1A2A' : theme.colors.text} />
                          <Text style={styles.badgeText} numberOfLines={1}>{selectedEvent.venue}</Text>
                        </View>
                      )}
                      <View style={styles.badge}><Text style={styles.badgeText}>{selectedEvent.typeLabel}</Text></View>
                      {selectedEvent.featured && (
                        <View style={[styles.badge, styles.badgeFeatured]}>
                          <Star size={12} color={theme.dark ? '#0E1A2A' : theme.colors.text} />
                          <Text style={styles.badgeText}>Featured</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.quickRow}>
                    <TouchableOpacity style={styles.quickBtn} onPress={() => Linking.openURL(gmapsUrl(selectedEvent.address, selectedEvent.location))}>
                      <MapPin size={18} color={theme.colors.primary} />
                      <Text style={styles.quickText}>Directions</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickBtn} onPress={() => {
                      // Use native Share API for calendar events
                      const dateStr = fmtRange(selectedEvent.startDate, selectedEvent.endDate);
                      const venueStr = selectedEvent.venue ? `${selectedEvent.venue}\n` : '';
                      const addressStr = selectedEvent.address || selectedEvent.location || '';
                      
                      const calendarMessage = 
                        `📅 ${selectedEvent.name}\n\n` +
                        `📍 ${venueStr}${addressStr}\n\n` +
                        `🗓 ${dateStr}\n\n` +
                        `Add this event to your calendar!`;

                      if (Platform.OS === 'ios' || Platform.OS === 'android') {
                        // Native sharing on mobile
                        if ((global as any)?.navigator?.share) {
                          (navigator as any).share({ 
                            title: `📅 ${selectedEvent.name}`,
                            text: calendarMessage,
                          }).catch(() => {
                            // Fallback if share fails
                            Alert.alert('Event Details', calendarMessage, [
                              { text: 'Open in Browser', onPress: () => Linking.openURL(gcalUrl(selectedEvent)) },
                              { text: 'Close', style: 'cancel' }
                            ]);
                          });
                        } else {
                          // Fallback for devices without share API
                          Alert.alert(
                            'Add to Calendar',
                            calendarMessage,
                            [
                              { text: 'Open in Browser', onPress: () => Linking.openURL(gcalUrl(selectedEvent)) },
                              { text: 'Copy Details', onPress: () => Alert.alert('Copied', 'Event details copied!') },
                              { text: 'Close', style: 'cancel' }
                            ]
                          );
                        }
                      } else {
                        // Web fallback
                        Linking.openURL(gcalUrl(selectedEvent));
                      }
                    }}>
                      <Calendar size={18} color={theme.colors.primary} />
                      <Text style={styles.quickText}>Add to Calendar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickBtn}
                      onPress={() => {
                        const msg =
                          `${selectedEvent.name}\n${fmtRange(selectedEvent.startDate, selectedEvent.endDate)}\n` +
                          `${selectedEvent.venue ? selectedEvent.venue + ', ' : ''}${selectedEvent.address || selectedEvent.location}\n` +
                          `${gmapsUrl(selectedEvent.address, selectedEvent.location)}`;
                        if ((global as any)?.navigator?.share) {
                          (navigator as any).share({ title: selectedEvent.name, text: msg });
                        } else {
                          Alert.alert('Copied details', 'Share coming soon.');
                        }
                      }}
                    >
                      <ShareIcon size={18} color={theme.colors.primary} />
                      <Text style={styles.quickText}>Share</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Calendar size={18} color={theme.colors.muted} />
                      <View style={styles.infoText}>
                        <Text style={styles.infoLabel}>Date</Text>
                        <Text style={styles.infoValue}>{fmtRange(selectedEvent.startDate, selectedEvent.endDate)}</Text>
                      </View>
                    </View>

                    {!!selectedEvent.venue && (
                      <View style={styles.infoRow}>
                        <MapPin size={18} color={theme.colors.muted} />
                        <View style={styles.infoText}>
                          <Text style={styles.infoLabel}>Venue</Text>
                          <Text style={styles.infoValue}>{selectedEvent.venue}</Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.infoRow}>
                      <MapPin size={18} color={theme.colors.muted} />
                      <View style={styles.infoText}>
                        <Text style={styles.infoLabel}>City</Text>
                        <Text style={styles.infoValue}>{selectedEvent.location}</Text>
                      </View>
                    </View>

                    {!!selectedEvent.address && (
                      <View style={styles.infoRow}>
                        <MapPin size={18} color={theme.colors.muted} />
                        <View style={styles.infoText}>
                          <Text style={styles.infoLabel}>Address</Text>
                          <Text style={styles.infoValue}>{selectedEvent.address}</Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.infoRow}>
                      <TrendingUp size={18} color={theme.colors.muted} />
                      <View style={styles.infoText}>
                        <Text style={styles.infoLabel}>Distance</Text>
                        <Text style={styles.infoValue}>{selectedEvent.distance == null ? '—' : `${selectedEvent.distance} miles away`}</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryCta, { backgroundColor: isFav(selectedEvent.id) ? theme.colors.favOn : theme.colors.primary }]}
                    onPress={() => toggleFav(selectedEvent.id)}
                  >
                    <Text style={styles.primaryCtaText}>
                      {isFav(selectedEvent.id) ? 'Remove Favorite' : 'Add to Favorites'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.primaryCta, { opacity: 0.6 }]} onPress={() => {}} disabled>
                    <Text style={styles.primaryCtaText}>RSVP coming soon</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------- Export ---------------- */
export default function EventsScreen() {
  return (
    <EventsProvider>
      <EventsInner />
    </EventsProvider>
  );
}