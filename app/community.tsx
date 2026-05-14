// app/community.tsx - OPTIMIZED COMPACT VERSION
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Platform,
  Linking,
  DeviceEventEmitter,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Filter,
  ExternalLink,
  X,
  Check,
  Locate,
  Share as ShareIcon,
  ArrowUpDown,
  Star,
} from 'lucide-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Slider } from '@miblanchard/react-native-slider';


const THEME_STORAGE_KEY = 'APP_THEME_MODE';
const MEMBERSHIP_KEY = 'CURIO_MEMBERSHIP_TIER';
const CURIO_MEMBERSHIP_CHANGED = 'CURIO_MEMBERSHIP_CHANGED';
const CURIO_THEME_CHANGED = 'CURIO_THEME_CHANGED';
const LOCATION_ZIP_STORAGE_KEY = 'USER_LOCATION_ZIP';
const TOURNAMENT_FAV_STORAGE_KEY = 'TOURNAMENT_FAVORITES_V1';

type ThemeMode = 'light' | 'dark';
type MembershipTier = 'collector' | 'curator';

// Distance presets for slider
const DISTANCE_PRESETS = [25, 50, 100, 250, 500];
const STATIC_BASE_URL = process.env.EXPO_BASE_URL || '';

function getTheme(mode: ThemeMode) {
  if (mode === 'dark') {
    return {
      dark: true,
      colors: {
        appBg: '#0B1320',
        headerBg: '#0E1A2A',
        surface: '#15243A',
        surfaceElevated: '#1A2D45',
        text: '#F0F4F8',
        subtext: '#B8C5D6',
        muted: '#8B98A8',
        accent: '#D4AF37',
        accentDim: '#A88929',
        border: 'rgba(255,255,255,0.12)',
        inputBg: '#0F1B2B',
        softBorder: 'rgba(255,255,255,0.08)',
        overlay: 'rgba(4,8,16,0.85)',
        glass: 'rgba(212,175,55,0.10)',
        imageBg: '#1C2E47',
        success: '#10B981',
        warning: '#F59E0B',
        chip: 'rgba(255,255,255,0.06)',
        listStripe: 'rgba(255,255,255,0.04)',
        pillGoldBg: 'rgba(234,219,166,0.12)',
        highlight: 'rgba(234,219,166,0.18)',
        favOn: '#EAB308',
      },
      shadows: { 
        card: 'rgba(0,0,0,0.4)',
        glow: 'rgba(212,175,55,0.3)',
      },
    };
  }
  return {
    dark: false,
    colors: {
      appBg: '#F8FAFC',
      headerBg: '#1E3A5F',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      text: '#1E293B',
      subtext: '#64748B',
      muted: '#94A3B8',
      accent: '#D4AF37',
      accentDim: '#B8922E',
      border: '#E2E8F0',
      inputBg: '#F8FAFC',
      softBorder: '#F1F5F9',
      overlay: 'rgba(15,23,42,0.60)',
      glass: 'rgba(212,175,55,0.08)',
      imageBg: '#F1F5F9',
      success: '#10B981',
      warning: '#F59E0B',
      chip: '#F8FAFC',
      listStripe: '#F3F4F6',
      pillGoldBg: '#FFF6DA',
      highlight: '#FFEEB6',
      favOn: '#CA8A04',
    },
    shadows: { 
      card: 'rgba(30,58,95,0.08)',
      glow: 'rgba(212,175,55,0.2)',
    },
  };
}

function makeStyles(t: ReturnType<typeof getTheme>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.appBg },
    
    // Header
    header: {
      backgroundColor: t.colors.headerBg,
      paddingBottom: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
      }),
    },
    headerRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    brand: { 
      fontSize: 24, 
      color: t.colors.accent, 
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.colors.glass,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: t.colors.softBorder,
    },
    
    // Tabs
    tabs: {
      backgroundColor: t.colors.surface,
      flexDirection: 'row',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.colors.border,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        },
        android: { elevation: 1 },
      }),
    },
    tab: { 
      flex: 1, 
      paddingVertical: 12, 
      alignItems: 'center', 
      justifyContent: 'center',
    },
    activeTab: { 
      backgroundColor: t.colors.glass,
      borderWidth: 1,
      borderColor: t.colors.accent,
      margin: -1,
    },
    
    // Content
    content: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 100 },
    
    // Consolidated Controls Row
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      minWidth: 120,
      maxWidth: 180,
      backgroundColor: t.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderWidth: 1,
      borderColor: t.colors.border,
      fontSize: 14,
      color: t.colors.text,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        },
        android: { elevation: 1 },
      }),
    },
    locationButton: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingHorizontal: 14, 
      paddingVertical: 11, 
      borderRadius: 12, 
      backgroundColor: t.colors.accent,
      shadowColor: t.colors.accent,
      shadowOpacity: 0.25,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
    },
    locationButtonText: { 
      fontSize: 13, 
      color: t.dark ? '#0E1A2A' : t.colors.text, 
      fontWeight: '700',
      marginLeft: 5,
    },
    iconButton: { 
      width: 42,
      height: 42,
      borderRadius: 12, 
      backgroundColor: t.colors.surface, 
      borderWidth: 1, 
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconButtonActive: { 
      backgroundColor: t.colors.highlight, 
      borderColor: t.colors.accent 
    },
    
    // Compact Cards
    eventCard: {
      backgroundColor: t.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 14,
      marginBottom: 12,
      ...Platform.select({
        ios: {
          shadowColor: t.shadows.card,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 6,
        },
        android: { elevation: 2 },
      }),
    },
    eventHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 10,
    },
    trophyIcon: {
      width: 42,
      height: 42,
      borderRadius: 10,
      backgroundColor: t.colors.glass,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: t.colors.accent,
    },
    eventMeta: { flex: 1 },
    eventTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: t.colors.text,
      marginBottom: 4,
      lineHeight: 20,
    },
    eventGame: {
      fontSize: 13,
      fontWeight: '600',
      color: t.colors.subtext,
      marginBottom: 3,
    },
    
    // Right side badges container
    eventBadges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    
    // Info rows - more compact
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 6,
    },
    infoText: {
      fontSize: 13,
      color: t.colors.text,
      flex: 1,
    },
    
    // Badges - smaller
    attendeeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: t.colors.glass,
      borderWidth: 1,
      borderColor: t.colors.accent,
    },
    attendeeText: {
      fontSize: 13,
      fontWeight: '800',
      color: t.colors.accent,
    },
    
    // Divider - thinner
    divider: { 
      height: 1, 
      backgroundColor: t.colors.border, 
      marginVertical: 10,
    },
    
    // Buttons - more compact
    primaryBtn: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: t.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: t.shadows.glow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 5,
        },
        android: { elevation: 3 },
      }),
    },
    primaryBtnText: { 
      color: '#0E1A2A', 
      fontWeight: '900',
      fontSize: 14,
      letterSpacing: 0.3,
    },
    secondaryBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtnText: {
      color: t.colors.text,
      fontWeight: '700',
      fontSize: 13,
    },
    
    // Floating action button
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: t.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: t.shadows.glow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
        },
        android: { elevation: 8 },
      }),
    },
    
    // Modals
    modalOverlay: {
      flex: 1,
      backgroundColor: t.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalOverlayTouchable: { 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0 
    },
    
    // Location Modal
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
      marginHorizontal: 20,
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
      fontWeight: '700',
    },
    locationInputContainer: { padding: 24 },
    inputLabel: { 
      fontSize: 14, 
      color: t.colors.text, 
      fontWeight: '600',
      marginBottom: 10,
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
      width: '100%',
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
      fontWeight: '700',
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
      fontWeight: '700',
      letterSpacing: 0.3,
      flex: 1,
      textAlign: 'center',
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
      fontWeight: '600',
    },
    suggestState: { 
      fontSize: 14, 
      color: t.colors.text,
    },
    suggestZip: { 
      fontSize: 12, 
      color: t.colors.subtext,
    },
    suggestSep: { 
      height: 1, 
      backgroundColor: t.colors.softBorder 
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
      fontWeight: '600',
    },
    submitLocationButtonText: { 
      fontSize: 14, 
      color: t.dark ? '#0E1A2A' : t.colors.text, 
      fontWeight: '600',
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

    // Filter Modal
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
      fontWeight: '700',
    },
    
    // Slider
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
      fontWeight: '700',
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
      fontWeight: '700',
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
      fontWeight: '600',
    },

    // Game type cards
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
      backgroundColor: t.colors.highlight, 
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
      fontWeight: '600',
      color: t.colors.text 
    },
    typeSubtitle: { 
      marginTop: 8, 
      fontSize: 12, 
      color: t.colors.subtext,
    },

    // Sort Modal
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

    // Tournament Detail Modal
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
    badgeText: { 
      fontSize: 12, 
      color: t.colors.text, 
      fontWeight: '600',
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
      fontWeight: '600',
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
    infoCardRow: { 
      flexDirection: 'row', 
      alignItems: 'flex-start', 
      paddingVertical: 12 
    },
    infoTextWrap: { 
      marginLeft: 12, 
      flex: 1 
    },
    infoLabel: { 
      fontSize: 12, 
      color: t.colors.subtext,
      marginBottom: 3 
    },
    infoValue: { 
      fontSize: 16, 
      color: t.colors.text, 
      fontWeight: '600',
      lineHeight: 22 
    },
    primaryCta: { 
      backgroundColor: t.colors.accent, 
      marginHorizontal: 20, 
      marginTop: 6, 
      marginBottom: 24, 
      paddingVertical: 16, 
      borderRadius: 14, 
      alignItems: 'center' 
    },
    primaryCtaText: { 
      color: t.dark ? '#0E1A2A' : '#FFFFFF',
      fontSize: 16, 
      fontWeight: '700',
    },
    
    // WebView modal
    webViewModal: {
      flex: 1,
      backgroundColor: t.colors.surface,
    },
    webViewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: t.colors.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    webViewTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: t.colors.accent,
      flex: 1,
      marginLeft: 12,
    },
    
    // Empty state
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: t.colors.glass,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: t.colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: t.colors.subtext,
      textAlign: 'center',
      maxWidth: 280,
    },
    
    // Curator badge
    curatorBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: t.colors.glass,
      borderWidth: 1,
      borderColor: t.colors.accent,
    },
    curatorBadgeText: {
      fontSize: 12,
      fontWeight: '800',
      color: t.colors.accent,
      letterSpacing: 0.5,
    },
    
    // Favorite button - inline version
    favStarBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.colors.glass,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.colors.border,
    },
  });
}

// Tournament type with extended details
type TournamentEvent = {
  id: string;
  title: string;
  game: string;
  location: string;
  date: string;
  host: string;
  attendees: number;
  going: boolean;
  // Extended details
  venue?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  format?: string;
  prizePool?: string;
  entryFee?: string;
  description?: string;
  website?: string;
  distance?: number | null;
};

// DFW-area seed tournaments with full details
const seedEvents: TournamentEvent[] = [
  {
    id: 'e1',
    title: 'Curio Championship: Modern Pokémon',
    game: 'Pokémon TCG',
    format: 'Standard Format',
    location: 'Plano, TX',
    venue: 'Legacy Hall',
    address: '7800 Windrose Ave',
    city: 'Plano',
    state: 'TX',
    zip: '75024',
    date: 'Saturday, Dec 14 • 3:00 PM',
    host: 'Curator League',
    attendees: 24,
    going: false,
    prizePool: '$500 + Prize Packs',
    entryFee: '$25',
    description: 'Join us for the premiere Pokémon TCG tournament in the DFW area. Standard format with championship points on the line.',
    website: 'https://curioapp.com/tournaments/pokemon-plano',
  },
  {
    id: 'e2',
    title: 'Vintage Sports Card Showcase',
    game: 'Trading Cards',
    format: 'Multi-Sport',
    location: 'Fort Worth, TX',
    venue: 'Will Rogers Memorial Center',
    address: '3401 W Lancaster Ave',
    city: 'Fort Worth',
    state: 'TX',
    zip: '76107',
    date: 'Sunday, Dec 15 • 1:00 PM',
    host: 'Curio Sports Collectors',
    attendees: 18,
    going: false,
    prizePool: 'Rare vintage cards',
    entryFee: 'Free',
    description: 'Showcase your vintage sports cards and compete for rare prizes. Categories for baseball, basketball, and football.',
    website: 'https://curioapp.com/tournaments/sports-fortworth',
  },
  {
    id: 'e3',
    title: 'Magic: The Gathering Commander Night',
    game: 'MTG',
    format: 'Commander / EDH',
    location: 'Dallas, TX',
    venue: 'Madness Games & Comics',
    address: '5757 Alpha Rd #100',
    city: 'Dallas',
    state: 'TX',
    zip: '75240',
    date: 'Friday, Dec 20 • 7:00 PM',
    host: 'MTG Community Hub',
    attendees: 32,
    going: true,
    prizePool: 'Store credit & boosters',
    entryFee: '$10',
    description: 'Weekly Commander tournament with casual and competitive pods. Prizes for top performers in each pod.',
    website: 'https://madnessgames.com/commander',
  },
  {
    id: 'e4',
    title: 'Yu-Gi-Oh! Regional Championship',
    game: 'Yu-Gi-Oh!',
    format: 'Advanced Format',
    location: 'Irving, TX',
    venue: 'Irving Convention Center',
    address: '500 W Las Colinas Blvd',
    city: 'Irving',
    state: 'TX',
    zip: '75039',
    date: 'Saturday, Dec 21 • 10:00 AM',
    host: 'Konami Official',
    attendees: 128,
    going: false,
    prizePool: '$2,000 + Championship Invite',
    entryFee: '$40',
    description: 'Official Konami regional championship. Top players qualify for nationals. Full vendor hall and side events.',
    website: 'https://www.yugioh-card.com/en/events/',
  },
  {
    id: 'e5',
    title: 'Disney Lorcana Constructed',
    game: 'Disney Lorcana',
    format: 'Constructed',
    location: 'Frisco, TX',
    venue: 'Common Grounds Games',
    address: '8380 Warren Pkwy #100',
    city: 'Frisco',
    state: 'TX',
    zip: '75034',
    date: 'Sunday, Dec 22 • 2:00 PM',
    host: 'Common Grounds',
    attendees: 16,
    going: false,
    prizePool: 'Booster boxes & promos',
    entryFee: '$15',
    description: 'Constructed Lorcana tournament with exclusive promo cards for all participants. Casual-competitive environment.',
    website: 'https://commongroundsgames.com',
  },
];

// Calculate distance between two zip codes
function calculateDistance(zip1: string, zip2: string, zipMapData: any): number | null {
  const loc1 = zipMapData[zip1];
  const loc2 = zipMapData[zip2];
  
  if (!loc1 || !loc2) return null;
  
  const lat1 = loc1.lat;
  const lon1 = loc1.lon;
  const lat2 = loc2.lat;
  const lon2 = loc2.lon;
  
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

/* ───────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ─────────────────────────────────────────────────────────────────────────── */
type TabKey = 'Tournaments' | 'Trading' | 'Discussions';
type SortField = 'distance' | 'attendees' | 'date' | null;
type SortOrder = 'asc' | 'desc';

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<ThemeMode>('light');
  const [membership, setMembership] = useState<MembershipTier>('collector');
  const isPremium = membership === 'curator';

  useEffect(() => {
    (async () => {
      const storedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedMode === 'dark' || storedMode === 'light') setMode(storedMode);

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
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [tab, setTab] = useState<TabKey>('Tournaments');

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.replace('/')}>
            <ArrowLeft size={20} color={theme.colors.accent} />
          </TouchableOpacity>
          <Text style={s.brand}>Community</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={s.tabs}>
          <TabButton
            icon={<Trophy size={18} color={theme.colors.text} />}
            label="Tournaments"
            active={tab === 'Tournaments'}
            onPress={() => {
              setTab('Tournaments');
              Haptics.selectionAsync();
            }}
            theme={theme}
            styles={s}
          />
          <TabButton
            icon={
              <MaterialCommunityIcons
                name="swap-horizontal"
                size={20}
                color={theme.colors.text}
              />
            }
            label="Trading"
            active={tab === 'Trading'}
            onPress={() => {
              setTab('Trading');
              Haptics.selectionAsync();
            }}
            theme={theme}
            styles={s}
          />
          <TabButton
            icon={
              <MaterialCommunityIcons
                name="forum-outline"
                size={18}
                color={theme.colors.text}
              />
            }
            label="Discussions"
            active={tab === 'Discussions'}
            onPress={() => {
              setTab('Discussions');
              Haptics.selectionAsync();
            }}
            theme={theme}
            styles={s}
          />
        </View>
      </View>

      <View style={s.content}>
        {tab === 'Tournaments' && <TournamentsTab theme={theme} styles={s} isCurator={isPremium} />}
        {tab === 'Trading' && <ComingSoonTab theme={theme} styles={s} type="Trading" />}
        {tab === 'Discussions' && <ComingSoonTab theme={theme} styles={s} type="Discussions" />}
      </View>
    </SafeAreaView>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   TOURNAMENTS TAB
   ─────────────────────────────────────────────────────────────────────────── */
function TournamentsTab({
  theme,
  styles: s,
  isCurator,
}: {
  theme: ReturnType<typeof getTheme>;
  styles: ReturnType<typeof makeStyles>;
  isCurator: boolean;
}) {
  const [events, setEvents] = useState<TournamentEvent[]>(seedEvents);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TournamentEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Location
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [zipInput, setZipInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [zipSuggestions, setZipSuggestions] = useState<Array<{ z: string; c: string; s: string }>>([]);
  const [selectedDisplay, setSelectedDisplay] = useState<string>('');
  const [zipError, setZipError] = useState<string | null>(null);
  const [isSubmittingZip, setIsSubmittingZip] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Filters
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedGameTypes, setSelectedGameTypes] = useState<string[]>(['All']);
  const [radiusMiles, setRadiusMiles] = useState<number | null>(100);
  const [showAllDistance, setShowAllDistance] = useState(false);
  const [zipMapData, setZipMapData] = useState<Record<string, any>>({});
  const [zipListData, setZipListData] = useState<Array<{ z: string; c: string; s: string }>>([]);

  // Favorites
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Sort
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Load saved data
  useEffect(() => {
    (async () => {
      const savedZip = await AsyncStorage.getItem(LOCATION_ZIP_STORAGE_KEY);
      if (savedZip) {
        setCurrentLocation(savedZip);
      }
      
      try {
        const raw = await AsyncStorage.getItem(TOURNAMENT_FAV_STORAGE_KEY);
        if (raw) setFavIds(new Set(JSON.parse(raw)));
      } catch {}
    })();
  }, []);

  // Load ZIP reference data from public assets instead of bundling 5MB+ JSON into the app shell.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [mapRes, listRes] = await Promise.all([
          fetch(`${STATIC_BASE_URL}/data/zipMap.min.json`),
          fetch(`${STATIC_BASE_URL}/data/zipList.min.json`),
        ]);
        const [mapJson, listJson] = await Promise.all([mapRes.json(), listRes.json()]);
        if (alive) {
          setZipMapData(mapJson);
          setZipListData(listJson);
        }
      } catch (error) {
        console.warn('Failed to load ZIP reference data', error);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Save favorites
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(TOURNAMENT_FAV_STORAGE_KEY, JSON.stringify(Array.from(favIds)));
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

  // ZIP helpers
  const normalizeZip = (txt: string) => txt.replace(/\D+/g, '').slice(0, 5);
  const isZipValid = (z: string) => z.length === 5 && Boolean(zipMapData[z]);

  const setZipAndValidate = (val: string) => {
    const digits = normalizeZip(val);
    setZipInput(digits);

    if (digits.length >= 2) {
      const pref = digits;
      const out: Array<{ z: string; c: string; s: string }> = [];
      for (let i = 0, count = 0; i < zipListData.length; i++) {
        const row = zipListData[i];
        if (row.z.startsWith(pref)) { out.push(row); count++; if (count >= 12) break; }
      }
      setZipSuggestions(out);
    } else setZipSuggestions([]);

    if (!digits) { setSelectedDisplay(''); setZipError(null); return; }
    if (digits.length === 5) {
      if (isZipValid(digits)) {
        const rec = zipMapData[digits];
        setSelectedDisplay(`${rec.c}, ${rec.s}`);
        setZipError(null);
        setZipSuggestions([]);
      } else { setSelectedDisplay(''); setZipError('Please enter a valid US ZIP code'); }
    } else { setSelectedDisplay(''); setZipError(null); }
  };

  const onPickSuggestion = (zip: string) => setZipAndValidate(zip);
  const canSubmitLocation = isZipValid(zipInput);

  const saveLocationAndUpdate = async (zip: string) => {
    await AsyncStorage.setItem(LOCATION_ZIP_STORAGE_KEY, zip);
    setCurrentLocation(zip);
    recalcDistances(zip);
  };

  // Locate me
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

  // Calculate distances
  const recalcDistances = useCallback((userZip: string) => {
    if (!userZip || !zipMapData[userZip]) { 
      setEvents(seedEvents);
      return;
    }
    
    const updated = seedEvents.map(event => ({
      ...event,
      distance: event.zip ? calculateDistance(userZip, event.zip, zipMapData) : null,
    }));
    
    setEvents(updated);
  }, [zipMapData]);

  useEffect(() => {
    if (currentLocation && Object.keys(zipMapData).length > 0) {
      recalcDistances(currentLocation);
    }
  }, [currentLocation, zipMapData, recalcDistances]);

  // Filter and sort
  const displayedEvents = useMemo(() => {
    let list = [...events];

    // Search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.game.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q) ||
        e.host.toLowerCase().includes(q)
      );
    }

    // Game type filter
    if (!selectedGameTypes.includes('All')) {
      const types = new Set(selectedGameTypes);
      list = list.filter(e => types.has(e.game));
    }

    // Distance filter
    if (!showAllDistance && radiusMiles != null && currentLocation) {
      list = list.filter(e => {
        if (e.distance == null) return false;
        return e.distance <= radiusMiles;
      });
    }

    // Favorites filter
    if (favoritesOnly) {
      list = list.filter(e => favIds.has(e.id));
    }

    // Sort
    if (sortField) {
      list.sort((a, b) => {
        const aVal = sortField === 'date' ? 0 // Would need actual date objects
                  : sortField === 'distance' ? (a.distance ?? Number.POSITIVE_INFINITY)
                  : a.attendees;
        const bVal = sortField === 'date' ? 0
                  : sortField === 'distance' ? (b.distance ?? Number.POSITIVE_INFINITY)
                  : b.attendees;
        const dir = sortOrder === 'asc' ? 1 : -1;
        return aVal < bVal ? -1 * dir : aVal > bVal ? 1 * dir : 0;
      });
    }

    return list;
  }, [events, query, selectedGameTypes, radiusMiles, showAllDistance, currentLocation, favoritesOnly, favIds, sortField, sortOrder]);

  const handleGameTypeToggle = (type: string) => {
    if (type === 'All') return setSelectedGameTypes(['All']);
    const base = selectedGameTypes.includes('All') ? [] : [...selectedGameTypes];
    const next = base.includes(type) ? base.filter(t => t !== type) : [...base, type];
    setSelectedGameTypes(next.length ? next : ['All']);
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
    return index >= 0 ? index : 2; // Default to 100mi
  };

  const toggleRSVP = (id: string) => {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === id
          ? {
              ...ev,
              going: !ev.going,
              attendees: ev.attendees + (ev.going ? -1 : 1),
            }
          : ev,
      ),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const openForm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFormOpen(true);
  };

  const openEventDetail = (event: TournamentEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const gmapsUrl = (address?: string, fallback?: string) => {
    const q = address && address.trim().length ? address : (fallback || '');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Consolidated Controls Row */}
        <View style={s.controlsRow}>
          <TextInput
            style={s.searchInput}
            placeholder="Search tournaments..."
            placeholderTextColor={theme.colors.muted}
            value={query}
            onChangeText={setQuery}
          />

          <TouchableOpacity
            style={s.locationButton}
            onPress={() => { 
              setShowLocationModal(true); 
              setZipInput(currentLocation || ''); 
              setSelectedDisplay(''); 
              setZipError(null); 
            }}
          >
            <MapPin size={14} color={theme.dark ? '#0E1A2A' : theme.colors.text} />
            <Text style={s.locationButtonText}>{currentLocation || 'Location'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.iconButton} onPress={() => setShowSortModal(true)}>
            <ArrowUpDown size={16} color={theme.colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={s.iconButton} onPress={() => setShowFilterModal(true)}>
            <Filter size={16} color={theme.colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.iconButton, favoritesOnly && s.iconButtonActive]}
            onPress={() => setFavoritesOnly(v => !v)}
          >
            <Star size={16} color={favoritesOnly ? theme.colors.favOn : theme.colors.muted} fill={favoritesOnly ? theme.colors.favOn : 'none'} />
          </TouchableOpacity>
        </View>

        {/* Events list */}
        {displayedEvents.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Trophy size={36} color={theme.colors.accent} />
            </View>
            <Text style={s.emptyTitle}>No Tournaments Found</Text>
            <Text style={s.emptyText}>
              {query ? 'Try adjusting your search terms' : 'Check back soon for upcoming events!'}
            </Text>
          </View>
        ) : (
          displayedEvents.map((event) => {
            const distanceStr = event.distance != null ? `${event.distance}mi` : '—';
            const fav = isFav(event.id);

            return (
              <TouchableOpacity
                key={event.id}
                style={s.eventCard}
                onPress={() => openEventDetail(event)}
                activeOpacity={0.85}
              >
                <View style={s.eventHeader}>
                  <View style={s.trophyIcon}>
                    <Trophy size={22} color={theme.colors.accent} />
                  </View>
                  <View style={s.eventMeta}>
                    <Text style={s.eventTitle}>{event.title}</Text>
                    <Text style={s.eventGame}>{event.game}{event.format ? ` • ${event.format}` : ''}</Text>
                  </View>
                  <View style={s.eventBadges}>
                    <View style={s.attendeeBadge}>
                      <Users size={14} color={theme.colors.accent} />
                      <Text style={s.attendeeText}>{event.attendees}</Text>
                    </View>
                    <TouchableOpacity
                      style={s.favStarBtn}
                      onPress={(e) => { e.stopPropagation?.(); toggleFav(event.id); }}
                      accessibilityLabel={fav ? 'Remove favorite' : 'Add to favorites'}
                    >
                      <Star size={14} color={fav ? theme.colors.favOn : theme.colors.muted} fill={fav ? theme.colors.favOn : 'none'} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={s.infoRow}>
                  <Calendar size={14} color={theme.colors.subtext} />
                  <Text style={s.infoText}>{event.date}</Text>
                </View>

                <View style={s.infoRow}>
                  <MapPin size={14} color={theme.colors.subtext} />
                  <Text style={s.infoText}>{event.location} • {distanceStr}</Text>
                </View>

                {event.venue && (
                  <View style={s.infoRow}>
                    <MaterialCommunityIcons
                      name="store-outline"
                      size={14}
                      color={theme.colors.subtext}
                    />
                    <Text style={s.infoText}>{event.venue}</Text>
                  </View>
                )}

                <View style={s.divider} />

                <TouchableOpacity
                  style={event.going ? s.secondaryBtn : s.primaryBtn}
                  onPress={(e) => { e.stopPropagation(); toggleRSVP(event.id); }}
                >
                  <Text style={event.going ? s.secondaryBtnText : s.primaryBtnText}>
                    {event.going ? '✓ Going' : 'RSVP'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button (Curator only) */}
      {isCurator && (
        <TouchableOpacity style={s.fab} onPress={openForm}>
          <Plus size={26} color="#0E1A2A" strokeWidth={3} />
        </TouchableOpacity>
      )}

      {/* Location Modal */}
      <Modal visible={showLocationModal} transparent animationType="slide" onRequestClose={() => setShowLocationModal(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalOverlayTouchable} activeOpacity={1} onPress={() => setShowLocationModal(false)} />
          <View style={s.locationModalContent}>
            <View style={s.locationModalHeader}>
              <Text style={s.locationModalTitle}>Set Your Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <X size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={s.locationInputContainer}>
              <Text style={s.inputLabel}>Zip Code</Text>

              <TextInput
                style={[s.zipCodeInput, zipError ? { borderColor: theme.colors.warning } : {}]}
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
                <View style={s.suggestBox}>
                  <FlatList
                    keyboardShouldPersistTaps="handled"
                    data={zipSuggestions}
                    keyExtractor={(item) => item.z}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={s.suggestRow} onPress={() => onPickSuggestion(item.z)}>
                        <Text style={s.suggestCity}>{item.c}</Text>
                        <Text style={s.suggestState}>&nbsp;{item.s}</Text>
                        <Text style={s.suggestZip}> · {item.z}</Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={s.suggestSep} />}
                  />
                </View>
              )}

              {!selectedDisplay ? (
                <TouchableOpacity 
                  style={s.locateMeButtonLarge} 
                  onPress={handleLocateMe} 
                  disabled={isLocating}
                  activeOpacity={0.8}
                >
                  {isLocating ? (
                    <>
                      <Locate size={20} color={theme.colors.accent} />
                      <Text style={s.locateMeTextLarge}>Locating…</Text>
                    </>
                  ) : (
                    <>
                      <Locate size={20} color={theme.colors.accent} />
                      <Text style={s.locateMeTextLarge}>Locate me</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={s.detectedCityCard}>
                  <MapPin size={20} color={theme.colors.accent} />
                  <Text style={s.detectedCityText}>{selectedDisplay}</Text>
                  <Check size={18} color={theme.colors.success} />
                </View>
              )}

              {!!zipError && (
                <Text style={{ marginTop: 12, fontSize: 13, color: theme.colors.warning }}>
                  {zipError}
                </Text>
              )}
            </View>

            <View style={s.locationModalFooter}>
              <TouchableOpacity style={s.cancelLocationButtonContainer} onPress={() => setShowLocationModal(false)}>
                <Text style={s.cancelLocationButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitLocationButtonContainer, !canSubmitLocation || isSubmittingZip ? s.disabledButton : null]}
                disabled={!canSubmitLocation || isSubmittingZip}
                onPress={async () => {
                  setIsSubmittingZip(true);
                  await saveLocationAndUpdate(zipInput);
                  setIsSubmittingZip(false);
                  setShowLocationModal(false);
                }}
              >
                <Text style={s.submitLocationButtonText}>
                  {isSubmittingZip ? 'Updating…' : 'Update Location'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalOverlayTouchable} activeOpacity={1} onPress={() => setShowFilterModal(false)} />
          <View style={s.filterModalContent}>
            <View style={s.locationModalHeader}>
              <Text style={s.locationModalTitle}>Filter Tournaments</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.filterModalBody} showsVerticalScrollIndicator={false}>
              {/* Game Types */}
              <View style={s.filterSection}>
                <View style={s.filterSectionHeaderRow}>
                  <Text style={s.filterSectionTitle}>Game Types</Text>
                </View>

                <View style={s.typeCardGrid}>
                  {[
                    { key: 'All', title: 'All', subtitle: 'See all games' },
                    { key: 'Pokémon TCG', title: 'Pokémon', subtitle: 'Trading card game' },
                    { key: 'MTG', title: 'Magic', subtitle: 'The Gathering' },
                    { key: 'Yu-Gi-Oh!', title: 'Yu-Gi-Oh!', subtitle: 'Dueling monsters' },
                    { key: 'Trading Cards', title: 'Sports', subtitle: 'Multi-sport cards' },
                    { key: 'Disney Lorcana', title: 'Lorcana', subtitle: 'Disney TCG' },
                  ].map(({ key, title, subtitle }) => {
                    const active = selectedGameTypes.includes(key);
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[s.typeCard, active && s.typeCardActive]}
                        onPress={() => handleGameTypeToggle(key)}
                        activeOpacity={0.9}
                      >
                        <View style={s.typeHeaderRow}>
                          <View style={s.typeIconWrap}>
                            <Trophy size={24} color={theme.colors.accent} />
                          </View>
                          <Text style={s.typeTitle}>{title}</Text>
                        </View>
                        <Text style={s.typeSubtitle}>{subtitle}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Distance Slider */}
              <View style={s.filterSection}>
                <View style={s.filterSectionHeaderRow}>
                  <Text style={s.filterSectionTitle}>Distance</Text>
                  <Text style={s.sliderValue}>{getDistanceLabel()}</Text>
                </View>

                {!showAllDistance && (
                  <View style={s.sliderContainer}>
                    <View style={s.sliderHashmarks}>
                      {DISTANCE_PRESETS.map((_, index) => (
                        <View key={index} style={s.hashmark} />
                      ))}
                    </View>

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
                      trackStyle={s.sliderTrack}
                      thumbStyle={s.sliderThumb}
                    />

                    <View style={s.sliderMarkers}>
                      {DISTANCE_PRESETS.map((dist, index) => (
                        <View key={dist} style={s.markerContainer}>
                          <Text style={s.sliderMarker}>{dist}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[s.showAllToggle, showAllDistance && s.showAllToggleActive]}
                  onPress={() => {
                    setShowAllDistance(!showAllDistance);
                    if (!showAllDistance) setRadiusMiles(null);
                    else setRadiusMiles(100);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={s.showAllText}>Show all distances</Text>
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

            <View style={s.locationModalFooter}>
              <TouchableOpacity
                style={s.cancelLocationButtonContainer}
                onPress={() => { 
                  setSelectedGameTypes(['All']); 
                  setRadiusMiles(100);
                  setShowAllDistance(false);
                }}
              >
                <Text style={s.cancelLocationButtonText}>Clear Filters</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.submitLocationButtonContainer} onPress={() => setShowFilterModal(false)}>
                <Text style={s.submitLocationButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalOverlayTouchable} activeOpacity={1} onPress={() => setShowSortModal(false)} />
          <View style={s.filterModalContent}>
            <View style={s.locationModalHeader}>
              <Text style={s.locationModalTitle}>Sort Tournaments</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <X size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={s.sortBody}>
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
                    style={[s.sortRow, active && s.sortRowActive]}
                    onPress={() => { setSortField(row.f); setSortOrder(row.o); }}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{row.label}</Text>
                    {active && <Check size={18} color={theme.colors.accent} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={s.locationModalFooter}>
              <TouchableOpacity style={s.cancelLocationButtonContainer} onPress={() => { setSortField('date'); setSortOrder('asc'); }}>
                <Text style={s.cancelLocationButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.submitLocationButtonContainer} onPress={() => setShowSortModal(false)}>
                <Text style={s.submitLocationButtonText}>Apply Sort</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tournament Detail Modal */}
      <Modal visible={showEventModal} animationType="slide" transparent onRequestClose={() => setShowEventModal(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalOverlayTouchable} activeOpacity={1} onPress={() => setShowEventModal(false)} />
          <View style={s.eventModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.eventModalHeader}>
                <TouchableOpacity style={s.eventCloseButton} onPress={() => setShowEventModal(false)}>
                  <X size={24} color={theme.colors.muted} />
                </TouchableOpacity>
              </View>

              {selectedEvent && (
                <>
                  <View style={s.eventHeaderWrap}>
                    <Text style={s.eventTitle} numberOfLines={3}>{selectedEvent.title}</Text>
                    <View style={s.eventBadgeRow}>
                      {selectedEvent.venue && (
                        <View style={[s.badge, s.badgeVenue]}>
                          <MapPin size={12} color={theme.dark ? '#0E1A2A' : theme.colors.text} />
                          <Text style={s.badgeText} numberOfLines={1}>{selectedEvent.venue}</Text>
                        </View>
                      )}
                      <View style={s.badge}>
                        <Text style={s.badgeText}>{selectedEvent.game}</Text>
                      </View>
                      {selectedEvent.format && (
                        <View style={s.badge}>
                          <Text style={s.badgeText}>{selectedEvent.format}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={s.quickRow}>
                    <TouchableOpacity 
                      style={s.quickBtn} 
                      onPress={() => {
                        const fullAddress = selectedEvent.address && selectedEvent.city 
                          ? `${selectedEvent.address}, ${selectedEvent.city}, ${selectedEvent.state} ${selectedEvent.zip}`
                          : selectedEvent.location;
                        Linking.openURL(gmapsUrl(fullAddress));
                      }}
                    >
                      <MapPin size={18} color={theme.colors.accent} />
                      <Text style={s.quickText}>Directions</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={s.quickBtn}
                      onPress={() => {
                        const msg = `${selectedEvent.title}\n${selectedEvent.date}\n${selectedEvent.venue ? selectedEvent.venue + ', ' : ''}${selectedEvent.location}`;
                        if ((global as any)?.navigator?.share) {
                          (navigator as any).share({ title: selectedEvent.title, text: msg });
                        }
                      }}
                    >
                      <ShareIcon size={18} color={theme.colors.accent} />
                      <Text style={s.quickText}>Share</Text>
                    </TouchableOpacity>

                    {selectedEvent.website && (
                      <TouchableOpacity 
                        style={s.quickBtn}
                        onPress={() => Linking.openURL(selectedEvent.website!)}
                      >
                        <ExternalLink size={18} color={theme.colors.accent} />
                        <Text style={s.quickText}>Website</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={s.infoCard}>
                    <View style={s.infoCardRow}>
                      <Calendar size={18} color={theme.colors.muted} />
                      <View style={s.infoTextWrap}>
                        <Text style={s.infoLabel}>Date & Time</Text>
                        <Text style={s.infoValue}>{selectedEvent.date}</Text>
                      </View>
                    </View>

                    {selectedEvent.venue && (
                      <View style={s.infoCardRow}>
                        <MapPin size={18} color={theme.colors.muted} />
                        <View style={s.infoTextWrap}>
                          <Text style={s.infoLabel}>Venue</Text>
                          <Text style={s.infoValue}>{selectedEvent.venue}</Text>
                        </View>
                      </View>
                    )}

                    {selectedEvent.address && (
                      <View style={s.infoCardRow}>
                        <MapPin size={18} color={theme.colors.muted} />
                        <View style={s.infoTextWrap}>
                          <Text style={s.infoLabel}>Address</Text>
                          <Text style={s.infoValue}>
                            {selectedEvent.address}, {selectedEvent.city}, {selectedEvent.state} {selectedEvent.zip}
                          </Text>
                        </View>
                      </View>
                    )}

                    {selectedEvent.distance != null && (
                      <View style={s.infoCardRow}>
                        <MaterialCommunityIcons name="map-marker-distance" size={18} color={theme.colors.muted} />
                        <View style={s.infoTextWrap}>
                          <Text style={s.infoLabel}>Distance</Text>
                          <Text style={s.infoValue}>{selectedEvent.distance} miles away</Text>
                        </View>
                      </View>
                    )}

                    <View style={s.infoCardRow}>
                      <Users size={18} color={theme.colors.muted} />
                      <View style={s.infoTextWrap}>
                        <Text style={s.infoLabel}>Expected Attendees</Text>
                        <Text style={s.infoValue}>{selectedEvent.attendees} players</Text>
                      </View>
                    </View>

                    {selectedEvent.prizePool && (
                      <View style={s.infoCardRow}>
                        <Trophy size={18} color={theme.colors.muted} />
                        <View style={s.infoTextWrap}>
                          <Text style={s.infoLabel}>Prize Pool</Text>
                          <Text style={s.infoValue}>{selectedEvent.prizePool}</Text>
                        </View>
                      </View>
                    )}

                    {selectedEvent.entryFee && (
                      <View style={s.infoCardRow}>
                        <MaterialCommunityIcons name="cash" size={18} color={theme.colors.muted} />
                        <View style={s.infoTextWrap}>
                          <Text style={s.infoLabel}>Entry Fee</Text>
                          <Text style={s.infoValue}>{selectedEvent.entryFee}</Text>
                        </View>
                      </View>
                    )}

                    {selectedEvent.description && (
                      <View style={s.infoCardRow}>
                        <MaterialCommunityIcons name="text" size={18} color={theme.colors.muted} />
                        <View style={s.infoTextWrap}>
                          <Text style={s.infoLabel}>Description</Text>
                          <Text style={s.infoValue}>{selectedEvent.description}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[s.primaryCta, { backgroundColor: isFav(selectedEvent.id) ? theme.colors.favOn : theme.colors.accent }]}
                    onPress={() => toggleFav(selectedEvent.id)}
                  >
                    <Text style={s.primaryCtaText}>
                      {isFav(selectedEvent.id) ? '★ Saved to Favorites' : 'Save to Favorites'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={s.primaryCta}
                    onPress={() => toggleRSVP(selectedEvent.id)}
                  >
                    <Text style={s.primaryCtaText}>
                      {selectedEvent.going ? '✓ You\'re Going!' : 'RSVP for Tournament'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Google Form Modal */}
      <Modal
        visible={formOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFormOpen(false)}
      >
        <SafeAreaView style={s.webViewModal} edges={['top', 'bottom']}>
          <View style={s.webViewHeader}>
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => {
                setFormOpen(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <ArrowLeft size={20} color={theme.colors.accent} />
            </TouchableOpacity>
            <Text style={s.webViewTitle}>Create Tournament</Text>
            <View style={s.curatorBadge}>
              <MaterialCommunityIcons name="crown" size={14} color={theme.colors.accent} />
              <Text style={s.curatorBadgeText}>CURATOR</Text>
            </View>
          </View>
          <WebView
            source={{ uri: 'https://docs.google.com/forms/d/e/1FAIpQLSddinuShHf2P1UGZt2PNMnaB8qo02QoSDdzEKl7JV-Gl6ozJw/viewform?embedded=true' }}
            style={{ flex: 1 }}
            startInLoadingState
            scalesPageToFit
            javaScriptEnabled
            domStorageEnabled
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   COMING SOON TAB
   ─────────────────────────────────────────────────────────────────────────── */
function ComingSoonTab({
  theme,
  styles: s,
  type,
}: {
  theme: ReturnType<typeof getTheme>;
  styles: ReturnType<typeof makeStyles>;
  type: 'Trading' | 'Discussions';
}) {
  const icon =
    type === 'Trading' ? (
      <MaterialCommunityIcons name="swap-horizontal" size={48} color={theme.colors.accent} />
    ) : (
      <MaterialCommunityIcons name="forum-outline" size={48} color={theme.colors.accent} />
    );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <View style={s.emptyIcon}>{icon}</View>
      <Text style={s.emptyTitle}>{type} Coming Soon</Text>
      <Text style={s.emptyText}>
        We're working on bringing you amazing {type.toLowerCase()} features. Stay tuned!
      </Text>
    </View>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   TAB BUTTON
   ─────────────────────────────────────────────────────────────────────────── */
function TabButton({
  icon,
  label,
  active,
  onPress,
  theme,
  styles: s,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof getTheme>;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.tab, active && s.activeTab]}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        {icon}
        <Text
          style={{
            color: active ? theme.colors.accent : theme.colors.text,
            fontWeight: active ? '900' : '700',
            fontSize: 12,
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}