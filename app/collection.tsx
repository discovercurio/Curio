// app/(tabs)/collection.tsx - UX REFINED VERSION
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  DeviceEventEmitter,
  Platform,
  Dimensions,
} from 'react-native';
import {
  Search,
  Grid3x3 as Grid3X3,
  List,
  ArrowLeft,
  Plus,
  Filter as FilterIcon,
  ChevronDown,
  X,
  Trash2,
  PencilLine,
  Heart,
  Check,
  RotateCcw,
  Star,
} from 'lucide-react-native';
import {
  useFonts,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_600SemiBold,
} from '@expo-google-fonts/roboto';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCollection } from '@/contexts/CollectionContext';
import PhotoEnlargeModal from '@/components/PhotoEnlargeModal';

/* ---------------- constants ---------------- */
const SEARCH_HEIGHT = Platform.OS === 'android' ? 50 : 46;
const FILTER_STORAGE_KEY = 'CURIO_COLLECTION_FILTERS_V2';
const THEME_STORAGE_KEY = 'APP_THEME_MODE';
const CURIO_THEME_CHANGED = 'CURIO_THEME_CHANGED';
const AD_FREQUENCY = 4; // Show ad every 4 items
type ThemeMode = 'light' | 'dark';

/* ---------------- theme glue ---------------- */
function getTheme(mode: ThemeMode) {
  if (mode === 'dark') {
    return {
      dark: true,
      colors: {
        appBg: '#0B1320',
        headerBg: '#0E1A2A',
        card: '#101B2C',
        chip: 'rgba(255,255,255,0.06)',
        subtle: 'rgba(255,255,255,0.04)',
        border: 'rgba(255,255,255,0.08)',
        softBorder: 'rgba(255,255,255,0.06)',
        text: '#D9E4EF',
        subtext: '#A9B6C6',
        muted: '#9CA3AF',
        primary: '#EADBA6',
        accent: '#D4AF37',
        inputBg: '#0F1B2B',
        imageBg: '#15243A',
        heartActive: '#EF4444',
        filterActive: 'rgba(212,175,55,0.15)',
        filterActiveBorder: '#D4AF37',
      },
    };
  }
  return {
    dark: false,
    colors: {
      appBg: '#F5F7FA',
      headerBg: '#1E3A5F',
      card: '#FFFFFF',
      chip: '#F8FAFC',
      subtle: '#F3F4F6',
      border: '#E5E7EB',
      softBorder: '#EEF2F7',
      text: '#1E3A5F',
      subtext: '#6B7280',
      muted: '#9CA3AF',
      primary: '#1E3A5F',
      accent: '#D4AF37',
      inputBg: '#FFFFFF',
      imageBg: '#F3F4F6',
      heartActive: '#DC2626',
      filterActive: '#FEF3C7',
      filterActiveBorder: '#D4AF37',
    },
  };
}

function makeStyles(theme: ReturnType<typeof getTheme>) {
  const windowHeight = Dimensions.get('window').height;
  const SHEET_MAX_HEIGHT = windowHeight * 0.85;
  const SHEET_HEIGHT = windowHeight * 0.7;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.appBg },

    /* Header - Refined */
    header: {
      backgroundColor: theme.colors.headerBg,
      paddingTop: 50,
      paddingBottom: 20,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.softBorder,
      shadowColor: theme.dark ? '#000' : '#1E3A5F',
      shadowOpacity: theme.dark ? 0.3 : 0.12,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 4,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    circleBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.dark ? 'rgba(234,219,166,0.18)' : 'rgba(212,175,55,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.accent,
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },
    headerTitle: {
      fontSize: 24,
      color: theme.colors.accent,
      fontFamily: 'Montserrat_700Bold',
      letterSpacing: 0.5,
    },

    /* Search - Enhanced */
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      paddingHorizontal: 18,
      height: SEARCH_HEIGHT + 4,
      width: '100%',
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.dark ? '#000' : '#1E3A5F',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },
    searchIcon: { marginRight: 14, alignSelf: 'center' },
    searchInput: {
      flexGrow: 1,
      flexShrink: 1,
      height: '100%',
      fontSize: 16,
      lineHeight: 20,
      color: theme.colors.text,
      fontFamily: 'Roboto_400Regular',
      textAlignVertical: 'center',
      includeFontPadding: false,
      paddingVertical: 0,
      paddingTop: 0,
      paddingBottom: 0,
    },

    /* Toolbar Card - Cleaner */
    toolbarCard: {
      marginTop: 16,
      marginHorizontal: 20,
      backgroundColor: theme.colors.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.dark ? '#000' : '#1E3A5F',
      shadowOpacity: theme.dark ? 0.25 : 0.08,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 8,
      elevation: 3,
    },
    toolbarTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    toolbarLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },

    pillButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.colors.chip,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.dark ? '#000' : '#1E3A5F',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      elevation: 1,
    },
    pillButtonActive: {
      backgroundColor: theme.colors.filterActive,
      borderColor: theme.colors.filterActiveBorder,
      borderWidth: 1.5,
      shadowOpacity: 0.15,
    },
    pillButtonSmall: { paddingHorizontal: 14 },
    pillButtonText: {
      fontSize: 14,
      color: theme.colors.text,
      fontFamily: 'Roboto_500Medium',
      marginLeft: 8,
      letterSpacing: 0.2,
    },
    pillButtonWide: { flex: 1, minWidth: 0, justifyContent: 'space-between' },

    viewToggle: {
      flexDirection: 'row',
      backgroundColor: theme.colors.chip,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexShrink: 0,
      padding: 3,
    },
    viewToggleBtn: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 11,
    },
    viewToggleBtnActive: {
      backgroundColor: theme.colors.accent,
      shadowColor: theme.colors.accent,
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },

    toolbarDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 14 },
    toolbarMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    metaText: { fontSize: 13, color: theme.colors.subtext, fontFamily: 'Roboto_400Regular' },
    metaLabel: { color: theme.colors.subtext },
    metaValue: { color: theme.colors.text, fontFamily: 'Roboto_500Medium', letterSpacing: 0.2 },
    metaDot: { marginHorizontal: 12, color: theme.colors.muted },

    /* Active filters badge */
    activeFiltersRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
    activeFiltersBadge: {
      backgroundColor: theme.dark ? 'rgba(234,219,166,0.15)' : '#FEF3C7',
      borderColor: theme.colors.border,
      borderWidth: 1,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 10,
      marginLeft: 6,
      shadowColor: theme.colors.accent,
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 1,
    },
    activeFiltersText: {
      fontSize: 11,
      color: theme.colors.text,
      fontFamily: 'Roboto_500Medium',
      letterSpacing: 0.3,
    },

    /* Content */
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

    /* Grid - Improved spacing */
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 30,
    },
    gridItem: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      marginBottom: 16,
      width: '48%',
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      shadowColor: theme.dark ? '#000' : '#1E3A5F',
      shadowOpacity: theme.dark ? 0.3 : 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 3,
    },
    gridThumbWrap: { position: 'relative' },
    gridItemImage: {
      width: '100%',
      aspectRatio: 4 / 4.5,
      backgroundColor: theme.colors.imageBg,
    },
    heartBtnGrid: {
      position: 'absolute',
      right: 10,
      bottom: 10,
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },
    itemInfo: { padding: 16, flex: 1, justifyContent: 'space-between' },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    itemName: {
      fontSize: 14,
      color: theme.colors.text,
      fontFamily: 'Roboto_500Medium',
      marginBottom: 4,
      lineHeight: 19,
      letterSpacing: 0.2,
    },
    itemType: {
      fontSize: 11,
      color: theme.colors.subtext,
      fontFamily: 'Roboto_400Regular',
      letterSpacing: 0.2,
    },
    itemGrade: {
      fontSize: 11,
      color: theme.colors.accent,
      fontFamily: 'Roboto_600SemiBold',
      flexShrink: 0,
      lineHeight: 16,
      letterSpacing: 0.3,
    },

    gridFooterRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    itemChange: { fontSize: 11, fontFamily: 'Roboto_400Regular' },
    itemValue: {
      fontSize: 17,
      color: theme.colors.text,
      fontFamily: 'Montserrat_600SemiBold',
      letterSpacing: 0.3,
    },

    /* List - Better visual hierarchy */
    listContainer: { marginBottom: 30 },
    listItem: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      marginBottom: 14,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      shadowColor: theme.dark ? '#000' : '#1E3A5F',
      shadowOpacity: theme.dark ? 0.25 : 0.08,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 8,
      elevation: 3,
    },
    listThumbWrap: {
      position: 'relative',
      width: 100,
      height: 100,
      borderRadius: 14,
      backgroundColor: theme.colors.imageBg,
      marginLeft: 12,
      marginVertical: 12,
      overflow: 'hidden',
    },
    listItemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    listItemInfo: { flex: 1, padding: 16, paddingRight: 12, flexShrink: 1 },

    listTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'nowrap',
      marginBottom: 6,
      gap: 8,
    },
    listType: {
      fontSize: 11,
      color: theme.colors.subtext,
      fontFamily: 'Roboto_500Medium',
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : '#EEF2F7',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      overflow: 'hidden',
      flexShrink: 0,
      lineHeight: 14,
      letterSpacing: 0.3,
    },
    listGrade: {
      fontSize: 11,
      color: theme.colors.accent,
      fontFamily: 'Roboto_600SemiBold',
      backgroundColor: theme.dark ? 'rgba(234,219,166,0.15)' : '#FEF3C7',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      overflow: 'hidden',
      flexShrink: 0,
      lineHeight: 14,
      letterSpacing: 0.3,
    },
    listItemName: {
      fontSize: 15,
      color: theme.colors.text,
      fontFamily: 'Roboto_500Medium',
      marginTop: 2,
      marginBottom: 5,
      lineHeight: 20,
      letterSpacing: 0.2,
    },
    listItemDescription: {
      fontSize: 13,
      color: theme.colors.muted,
      fontFamily: 'Roboto_400Regular',
      lineHeight: 18,
    },

    listItemRight: {
      paddingRight: 16,
      paddingLeft: 10,
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 10,
      minWidth: 130,
    },
    listItemChange: {
      fontSize: 11,
      fontFamily: 'Roboto_400Regular',
      textAlign: 'right',
      maxWidth: '100%',
    },
    listItemValue: {
      fontSize: 17,
      color: theme.colors.text,
      fontFamily: 'Montserrat_600SemiBold',
      textAlign: 'right',
      maxWidth: '100%',
      letterSpacing: 0.3,
    },

    heartBtnList: {
      position: 'absolute',
      right: 8,
      bottom: 8,
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },

    /* Filter Modal */
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      height: SHEET_HEIGHT,
      maxHeight: SHEET_MAX_HEIGHT,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: -6 },
      shadowRadius: 16,
      elevation: 10,
    },

    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalHeaderLeft: { flex: 1 },
    modalTitle: {
      fontSize: 24,
      color: theme.colors.text,
      fontFamily: 'Montserrat_700Bold',
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    modalSubtitle: {
      fontSize: 14,
      color: theme.colors.subtext,
      fontFamily: 'Roboto_400Regular',
      letterSpacing: 0.2,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.chip,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
    },

    modalBody: { flex: 1 },
    modalScrollContent: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 100,
    },

    filterSection: { marginBottom: 32 },
    filterSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    filterSectionTitle: {
      fontSize: 18,
      color: theme.colors.text,
      fontFamily: 'Montserrat_600SemiBold',
      letterSpacing: 0.3,
    },
    filterCount: {
      backgroundColor: theme.colors.accent,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    filterCountText: {
      fontSize: 12,
      color: theme.dark ? '#0E1A2A' : '#FFFFFF',
      fontFamily: 'Roboto_600SemiBold',
      letterSpacing: 0.3,
    },

    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: theme.colors.chip,
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentButtonActive: {
      backgroundColor: theme.colors.accent,
      shadowColor: theme.colors.accent,
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    },
    segmentText: {
      fontSize: 14,
      color: theme.colors.subtext,
      fontFamily: 'Roboto_500Medium',
      letterSpacing: 0.2,
    },
    segmentTextActive: {
      color: theme.dark ? '#0E1A2A' : '#FFFFFF',
      fontFamily: 'Roboto_600SemiBold',
      letterSpacing: 0.3,
    },

    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    chipButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.colors.chip,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    chipButtonActive: {
      backgroundColor: theme.colors.filterActive,
      borderColor: theme.colors.filterActiveBorder,
      borderWidth: 2,
    },
    chipText: {
      fontSize: 14,
      color: theme.colors.text,
      fontFamily: 'Roboto_500Medium',
      letterSpacing: 0.2,
    },
    chipTextActive: {
      color: theme.colors.accent,
      fontFamily: 'Roboto_600SemiBold',
      letterSpacing: 0.3,
    },
    checkIcon: { marginLeft: -2 },

    modalFooter: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      gap: 12,
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 34 : 24,
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: -4 },
      shadowRadius: 8,
      elevation: 8,
    },
    resetButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.chip,
      gap: 8,
    },
    resetButtonText: {
      fontSize: 16,
      color: theme.colors.text,
      fontFamily: 'Roboto_600SemiBold',
      letterSpacing: 0.3,
    },
    applyButton: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: theme.colors.accent,
      gap: 8,
      shadowColor: theme.colors.accent,
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 6,
    },
    applyButtonText: {
      fontSize: 16,
      color: theme.dark ? '#0E1A2A' : '#FFFFFF',
      fontFamily: 'Roboto_600SemiBold',
      letterSpacing: 0.4,
    },

    /* Sort Modal */
    sortOption: {
      paddingVertical: 18,
      paddingHorizontal: 22,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sortOptionActive: {
      backgroundColor: theme.dark ? 'rgba(234,219,166,0.12)' : '#FEF3C7',
    },
    sortOptionText: {
      fontSize: 17,
      color: theme.colors.text,
      fontFamily: 'Roboto_400Regular',
      letterSpacing: 0.2,
    },
    sortOptionTextActive: {
      fontFamily: 'Roboto_500Medium',
      color: theme.colors.accent,
      letterSpacing: 0.3,
    },

    /* Detail Modal */
    detailModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.92)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    detailModalContent: {
      width: '90%',
      maxHeight: '90%',
      backgroundColor: theme.colors.card,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.5,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 10,
    },
    detailCloseButton: {
      position: 'absolute',
      top: 18,
      right: 18,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 5,
    },
    detailImageContainer: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: theme.dark ? '#0B1320' : '#FFFFFF',
    },
    detailImage: { width: '100%', height: '100%', resizeMode: 'contain' },

    detailInfoSection: { padding: 26, position: 'relative' },
    editPencil: {
      position: 'absolute',
      top: 14,
      right: 14,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 5,
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 5,
    },

    detailHeader: { marginBottom: 14 },
    detailTypeGrade: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    detailType: {
      fontSize: 15,
      color: theme.colors.subtext,
      fontFamily: 'Roboto_500Medium',
      backgroundColor: theme.colors.subtle,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
      marginRight: 0,
      flexShrink: 0,
      lineHeight: 18,
      letterSpacing: 0.3,
    },
    detailGrade: {
      fontSize: 15,
      color: theme.colors.accent,
      fontFamily: 'Roboto_600SemiBold',
      backgroundColor: theme.dark ? 'rgba(234,219,166,0.15)' : '#FEF3C7',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
      flexShrink: 0,
      lineHeight: 18,
      letterSpacing: 0.3,
    },
    detailName: {
      fontSize: 26,
      color: theme.colors.text,
      fontFamily: 'Montserrat_700Bold',
      marginBottom: 14,
      lineHeight: 34,
      letterSpacing: 0.3,
    },
    detailDescription: {
      fontSize: 16,
      color: theme.colors.subtext,
      fontFamily: 'Roboto_400Regular',
      lineHeight: 26,
      marginBottom: 26,
    },

    detailPriceSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.dark ? '#000' : '#1E3A5F',
      shadowOpacity: theme.dark ? 0.2 : 0.06,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 2,
    },
    detailPriceLabel: {
      fontSize: 14,
      color: theme.colors.subtext,
      fontFamily: 'Roboto_400Regular',
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    detailPriceValue: {
      fontSize: 30,
      color: theme.colors.text,
      fontFamily: 'Montserrat_700Bold',
      letterSpacing: 0.3,
    },
    detailMarketData: { alignItems: 'flex-end' },
    detailMarketLabel: {
      fontSize: 14,
      color: theme.colors.subtext,
      fontFamily: 'Roboto_400Regular',
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    detailMarketChange: {
      fontSize: 17,
      fontFamily: 'Roboto_600SemiBold',
      letterSpacing: 0.2,
    },

    detailMetadata: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.dark ? '#000' : '#1E3A5F',
      shadowOpacity: theme.dark ? 0.2 : 0.06,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 2,
    },
    metadataRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
    metadataItem: { flex: 1 },
    detailMetadataLabel: {
      fontSize: 14,
      color: theme.colors.subtext,
      fontFamily: 'Roboto_400Regular',
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    detailMetadataValue: {
      fontSize: 17,
      color: theme.colors.text,
      fontFamily: 'Roboto_500Medium',
      letterSpacing: 0.2,
    },

    hiddenBlock: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 14,
      shadowColor: theme.dark ? '#000' : '#1E3A5F',
      shadowOpacity: theme.dark ? 0.2 : 0.06,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 2,
    },
    hiddenLabel: {
      fontSize: 15,
      color: theme.colors.subtext,
      fontFamily: 'Roboto_400Regular',
      marginBottom: 10,
      letterSpacing: 0.2,
    },
    hiddenValue: {
      fontSize: 15,
      color: theme.colors.text,
      fontFamily: 'Roboto_400Regular',
      lineHeight: 22,
    },
    hiddenInput: {
      minHeight: 100,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.inputBg,
      borderRadius: 12,
      padding: 14,
      color: theme.colors.text,
      textAlignVertical: 'top',
      fontFamily: 'Roboto_400Regular',
      fontSize: 15,
      lineHeight: 22,
    },

    editActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
      marginBottom: 18,
    },
    cancelBtn: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.chip,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cancelBtnTxt: {
      color: theme.colors.subtext,
      fontFamily: 'Roboto_500Medium',
      fontSize: 15,
      letterSpacing: 0.2,
    },

    saveBtn: {
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.accent,
      shadowColor: theme.colors.accent,
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 4,
    },
    saveBtnTxt: {
      color: theme.dark ? '#0E1A2A' : theme.colors.text,
      fontFamily: 'Roboto_600SemiBold',
      fontSize: 15,
      letterSpacing: 0.3,
    },

    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#DC2626',
      borderRadius: 14,
      padding: 18,
      marginTop: 6,
      shadowColor: '#DC2626',
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 4,
    },
    deleteButtonText: {
      fontSize: 17,
      color: '#FFFFFF',
      fontFamily: 'Roboto_600SemiBold',
      marginLeft: 10,
      letterSpacing: 0.3,
    },
  });
}

/* ---------------- types ---------------- */
interface CollectibleItem {
  id: string;
  name: string;
  type: string;
  value: number;
  initialValue?: number;
  grade?: string;
  gradingCompany?: string;
  imageUrl: string;
  description: string;
  dateAdded: Date | string;
  marketData?: { priceChange: number; priceChangePercent: number };
  favorite?: boolean;
  meta?: { favorite?: boolean; hiddenDescription?: string };
}

type ViewMode = 'grid' | 'list';
type AutographedOpt = 'All' | 'Yes' | 'No';
type FavoritesOpt = 'All' | 'Only Favorites';

type Filters = {
  type: string;
  gradingCompany: string;
  grade: string;
  autographed: AutographedOpt;
  favorites: FavoritesOpt;
};

const DEFAULT_FILTERS: Filters = {
  type: 'All',
  gradingCompany: 'All',
  grade: 'All',
  autographed: 'All',
  favorites: 'All',
};

/* ---------------- helpers ---------------- */
const norm = (s?: string) => (s || '').toString().trim().toLowerCase();

function detectAutograph(description?: string) {
  const d = description || '';
  return /(auto|autograph|autographed|signed)/i.test(d);
}

function getFavoriteFlag(item: CollectibleItem) {
  return Boolean(item.favorite ?? item.meta?.favorite);
}

function buildGradeFacet(items: CollectibleItem[]) {
  const set = new Set<string>();
  let hasUngraded = false;

  for (const it of items) {
    const gRaw = (it.grade ?? '').toString().trim();
    if (!gRaw) {
      hasUngraded = true;
      continue;
    }
    if (/^ungraded|raw|authentic$/i.test(gRaw)) {
      hasUngraded = true;
      continue;
    }
    set.add(gRaw);
  }

  const grades = Array.from(set);
  grades.sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    const aIsNum = !isNaN(numA);
    const bIsNum = !isNaN(numB);
    if (aIsNum && bIsNum) return numB - numA;
    if (aIsNum) return -1;
    if (bIsNum) return 1;
    const p = (s: string) => (s.startsWith('MS') || s.startsWith('PR') ? 0 : 1);
    const pa = p(a),
      pb = p(b);
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });

  const out = ['All', ...grades];
  if (hasUngraded) out.push('Ungraded');
  return out;
}

function buildFacets(items: CollectibleItem[]) {
  const typeSet = new Set<string>(
    items.map(i => (i.type || '').trim()).filter(Boolean)
  );
  const types = ['All', ...Array.from(typeSet).sort()];

  const companySet = new Set<string>(
    items.map(i => (i.gradingCompany || '').trim()).filter(Boolean)
  );
  const companies = ['All', ...Array.from(companySet).sort()];

  const grades = buildGradeFacet(items);
  const autographed: AutographedOpt[] = ['All', 'Yes', 'No'];
  const favorites: FavoritesOpt[] = ['All', 'Only Favorites'];

  return { types, companies, grades, autographed, favorites };
}

/* ---------------- IMPROVED Ad Banner Component ---------------- */
function AdBanner({ theme }: { theme: ReturnType<typeof getTheme> }) {
  return (
    <View
      style={{
        width: '100%',
        minHeight: 100,
        backgroundColor: theme.dark ? 'rgba(234,219,166,0.08)' : '#FFF7E0',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: theme.colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 20,
        paddingHorizontal: 16,
        overflow: 'hidden',
        shadowColor: theme.colors.accent,
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.dark ? 'rgba(234,219,166,0.2)' : '#FDEFC4',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: theme.colors.accent,
          }}
        >
          <Star size={24} color={theme.colors.accent} fill={theme.colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'Montserrat_700Bold',
              color: theme.colors.text,
              letterSpacing: 0.3,
              marginBottom: 4,
            }}
          >
            Upgrade to Curator
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Roboto_400Regular',
              color: theme.colors.subtext,
              letterSpacing: 0.2,
              lineHeight: 18,
            }}
          >
            Enjoy an ad-free collection experience
          </Text>
        </View>
      </View>
      <View
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: theme.colors.chip,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            fontFamily: 'Roboto_500Medium',
            color: theme.colors.subtext,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          Curio Ad
        </Text>
      </View>
    </View>
  );
}

/* ---------------- component ---------------- */
export default function CollectionScreen() {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [isPremium, setIsPremium] = useState(false); // TODO: Connect to actual premium/Curator status

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') setMode(stored);
    })();
    const sub = DeviceEventEmitter.addListener(CURIO_THEME_CHANGED, (e: any) => {
      if (e?.mode === 'dark' || e?.mode === 'light') setMode(e.mode);
    });
    return () => sub.remove();
  }, []);

  const theme = useMemo(() => getTheme(mode), [mode]);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_600SemiBold,
  });

  const { items, setItems } = useCollection();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState('Recently Added');

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectibleItem | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [hiddenDraft, setHiddenDraft] = useState('');

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters] = useState<Filters>(DEFAULT_FILTERS);

  const detailScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(FILTER_STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const loadedFilters = { ...DEFAULT_FILTERS, ...parsed };
          setFilters(loadedFilters);
          setTempFilters(loadedFilters);
        } catch {}
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters)).catch(() => {});
  }, [filters]);

  const facets = useMemo(
    () => buildFacets(items as CollectibleItem[]),
    [items]
  );

  const toggleFavorite = (id: string) => {
    setItems(prev =>
      prev.map((it: any) => {
        if (it.id !== id) return it;
        const nextFav = !getFavoriteFlag(it);
        if (typeof it.favorite === 'boolean') {
          return { ...it, favorite: nextFav };
        }
        return { ...it, meta: { ...(it.meta || {}), favorite: nextFav } };
      })
    );
  };

  const normalizedSearch = norm(searchQuery);

  const filteredItems = useMemo(() => {
    const arr = (items as CollectibleItem[]).filter(item => {
      if (normalizedSearch) {
        const hay = [
          item.name,
          item.description,
          item.type,
          item.gradingCompany,
          item.grade,
        ]
          .map(x => (x || '').toString().toLowerCase())
          .join(' ');
        if (!hay.includes(normalizedSearch)) return false;
      }

      if (filters.type !== 'All' && item.type !== filters.type) return false;

      if (filters.gradingCompany !== 'All') {
        if ((item.gradingCompany || '').trim() !== filters.gradingCompany)
          return false;
      }

      if (filters.grade !== 'All') {
        if (filters.grade === 'Ungraded') {
          const g = (item.grade || '').trim();
          const isUngraded = !g || /^ungraded|raw|authentic$/i.test(g);
          if (!isUngraded) return false;
        } else {
          if ((item.grade || '').trim() !== filters.grade) return false;
        }
      }

      if (filters.autographed !== 'All') {
        const isAuto = detectAutograph(item.description);
        if (filters.autographed === 'Yes' && !isAuto) return false;
        if (filters.autographed === 'No' && isAuto) return false;
      }

      if (filters.favorites === 'Only Favorites' && !getFavoriteFlag(item)) {
        return false;
      }

      return true;
    });

    arr.sort((a, b) => {
      switch (sortBy) {
        case 'Price (High to Low)':
          return b.value - a.value;
        case 'Price (Low to High)':
          return a.value - b.value;
        case 'Name (A-Z)':
          return a.name.localeCompare(b.name);
        case 'Name (Z-A)':
          return b.name.localeCompare(a.name);
        case 'Recently Added':
        default:
          return (
            new Date(b.dateAdded).getTime() -
            new Date(a.dateAdded).getTime()
          );
      }
    });

    return arr;
  }, [items, filters, normalizedSearch, sortBy]);

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (filters.type !== 'All') n++;
    if (filters.gradingCompany !== 'All') n++;
    if (filters.grade !== 'All') n++;
    if (filters.autographed !== 'All') n++;
    if (filters.favorites !== 'All') n++;
    return n;
  }, [filters]);

  if (!fontsLoaded) return null;

  const getChangeColor = (change: number) => {
    if (change > 0) return '#22C55E';
    if (change < 0) return '#EF4444';
    return theme.colors.muted;
  };

  const formatChange = (change: number, percent: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}$${Math.abs(change).toFixed(2)} (${sign}${percent.toFixed(
      1
    )}%)`;
  };

  const handleItemPress = (item: CollectibleItem) => {
    setSelectedItem(item);
    setHiddenDraft(item.meta?.hiddenDescription ?? '');
    setIsEditing(false);
    setShowDetailModal(true);
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter((i: any) => i.id !== itemId));
    setShowDetailModal(false);
    setSelectedItem(null);
    setIsEditing(false);
  };

  const saveHiddenDraft = () => {
    if (!selectedItem) return;
    const id = selectedItem.id;

    setItems(prev =>
      prev.map((it: any) =>
        it.id === id
          ? { ...it, meta: { ...(it.meta || {}), hiddenDescription: hiddenDraft } }
          : it
      )
    );

    setSelectedItem(prev =>
      prev
        ? { ...prev, meta: { ...(prev.meta || {}), hiddenDescription: hiddenDraft } }
        : prev
    );

    setIsEditing(false);
  };

  const cancelHiddenDraft = () => {
    setHiddenDraft(selectedItem?.meta?.hiddenDescription ?? '');
    setIsEditing(false);
  };

  const safeGoBack = () => {
    if (showDetailModal) {
      setShowDetailModal(false);
      return;
    }
    if (showFilterModal) {
      setShowFilterModal(false);
      return;
    }
    if (showSortModal) {
      setShowSortModal(false);
      return;
    }
    router.replace('/');
  };

  const handleOpenFilters = () => {
    setTempFilters({ ...filters });
    setShowFilterModal(true);
  };

  const handleApplyFilters = () => {
    setFilters({ ...tempFilters });
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    setTempFilters(DEFAULT_FILTERS);
  };

  const renderGridItem = (item: CollectibleItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.gridItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.9}
    >
      <View style={styles.gridThumbWrap}>
        <Image source={{ uri: item.imageUrl }} style={styles.gridItemImage} />
        <TouchableOpacity
          style={styles.heartBtnGrid}
          onPress={e => {
            e.stopPropagation?.();
            toggleFavorite(item.id);
          }}
          activeOpacity={0.8}
          accessibilityLabel={getFavoriteFlag(item) ? 'Unfavorite' : 'Favorite'}
        >
          <Heart
            size={20}
            color={
              getFavoriteFlag(item) ? theme.colors.heartActive : '#FFFFFF'
            }
            fill={
              getFavoriteFlag(item) ? theme.colors.heartActive : 'none'
            }
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.itemInfo}>
        <View>
          <View style={styles.itemHeader}>
            <Text style={styles.itemType} numberOfLines={1} ellipsizeMode="tail">
              {item.type}
            </Text>
            {!!item.grade && (
              <Text
                style={styles.itemGrade}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.grade}
              </Text>
            )}
          </View>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
        </View>

        <View style={styles.gridFooterRow}>
          {item.marketData ? (
            <Text
              style={[
                styles.itemChange,
                { color: getChangeColor(item.marketData.priceChange) },
              ]}
              numberOfLines={1}
            >
              {formatChange(
                item.marketData.priceChange,
                item.marketData.priceChangePercent
              )}
            </Text>
          ) : (
            <View />
          )}
          <Text style={styles.itemValue}>
            ${item.value.toLocaleString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = (item: CollectibleItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.listItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.9}
    >
      <View style={styles.listThumbWrap}>
        <Image source={{ uri: item.imageUrl }} style={styles.listItemImage} />
        <TouchableOpacity
          style={styles.heartBtnList}
          onPress={e => {
            e.stopPropagation?.();
            toggleFavorite(item.id);
          }}
          activeOpacity={0.8}
          accessibilityLabel={getFavoriteFlag(item) ? 'Unfavorite' : 'Favorite'}
        >
          <Heart
            size={20}
            color={
              getFavoriteFlag(item) ? theme.colors.heartActive : '#FFFFFF'
            }
            fill={
              getFavoriteFlag(item) ? theme.colors.heartActive : 'none'
            }
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.listItemInfo}>
        <View style={styles.listTopRow}>
          <Text
            style={styles.listType}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.type}
          </Text>
          {!!item.grade && (
            <Text
              style={styles.listGrade}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.grade}
            </Text>
          )}
        </View>

        <Text style={styles.listItemName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.listItemDescription} numberOfLines={1}>
          {item.description}
        </Text>
      </View>

      <View style={styles.listItemRight}>
        <Text
          style={[
            styles.listItemChange,
            {
              color: item.marketData
                ? getChangeColor(item.marketData.priceChange)
                : theme.colors.muted,
            },
          ]}
          numberOfLines={1}
        >
          {item.marketData
            ? formatChange(
                item.marketData.priceChange,
                item.marketData.priceChangePercent
              )
            : '—'}
        </Text>
        <Text style={styles.listItemValue} numberOfLines={1}>
          ${item.value.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // FIXED: Ad placement logic that works correctly in both grid and list view
  const renderItemsWithAds = () => {
    const elements: React.ReactElement[] = [];
    
    filteredItems.forEach((item, index) => {
      // Add item
      if (viewMode === 'grid') {
        elements.push(renderGridItem(item));
      } else {
        elements.push(renderListItem(item));
      }
      
      // Add ad after every AD_FREQUENCY items (but not after the last item)
      // Only show if user is not premium
      if (!isPremium && (index + 1) % AD_FREQUENCY === 0 && index !== filteredItems.length - 1) {
        // For grid view, we need a full-width wrapper
        if (viewMode === 'grid') {
          elements.push(
            <View key={`ad-${index}`} style={{ width: '100%', marginBottom: 16 }}>
              <AdBanner theme={theme} />
            </View>
          );
        } else {
          elements.push(
            <View key={`ad-${index}`}>
              <AdBanner theme={theme} />
            </View>
          );
        }
      }
    });
    
    return elements;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={safeGoBack}
            activeOpacity={0.8}
          >
            <ArrowLeft size={22} color={theme.colors.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Collection</Text>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.push('/scan')}
            activeOpacity={0.8}
          >
            <Plus size={22} color={theme.colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search
            size={20}
            color={theme.colors.muted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, description, grade, company…"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.muted}
            allowFontScaling={false}
            returnKeyType="search"
            underlineColorAndroid="transparent"
          />
        </View>
      </View>

      <View style={styles.toolbarCard}>
        <View style={styles.toolbarTopRow}>
          <View style={styles.toolbarLeft}>
            <TouchableOpacity
              style={[
                styles.pillButton,
                styles.pillButtonSmall,
                activeFiltersCount > 0 && styles.pillButtonActive,
              ]}
              onPress={handleOpenFilters}
              activeOpacity={0.85}
            >
              <FilterIcon size={18} color={theme.colors.text} strokeWidth={2} />
              <Text style={styles.pillButtonText}>
                {activeFiltersCount > 0
                  ? `Filter (${activeFiltersCount})`
                  : 'Filter'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pillButton, styles.pillButtonWide]}
              onPress={() => setShowSortModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.pillButtonText} numberOfLines={1}>
                {sortBy}
              </Text>
              <ChevronDown size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.viewToggleBtn,
                viewMode === 'grid' && styles.viewToggleBtnActive,
              ]}
              onPress={() => setViewMode('grid')}
              activeOpacity={0.85}
            >
              <Grid3X3
                size={18}
                color={
                  viewMode === 'grid'
                    ? theme.dark
                      ? '#0E1A2A'
                      : theme.colors.text
                    : theme.colors.muted
                }
                strokeWidth={2}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleBtn,
                viewMode === 'list' && styles.viewToggleBtnActive,
              ]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.85}
            >
              <List
                size={18}
                color={
                  viewMode === 'list'
                    ? theme.dark
                      ? '#0E1A2A'
                      : theme.colors.text
                    : theme.colors.muted
                }
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.activeFiltersRow}>
          <Text style={styles.metaText}>
            <Text style={styles.metaLabel}>Total Items: </Text>
            <Text style={styles.metaValue}>{filteredItems.length}</Text>
          </Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>
            <Text style={styles.metaLabel}>Estimated Value: </Text>
            <Text style={styles.metaValue}>
              $
              {filteredItems
                .reduce((sum, i) => sum + i.value, 0)
                .toLocaleString()}
            </Text>
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={
            viewMode === 'grid' ? styles.gridContainer : styles.listContainer
          }
        >
          {renderItemsWithAds()}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle}>Filters</Text>
                <Text style={styles.modalSubtitle}>
                  Refine your collection view
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.8}
              >
                <X size={22} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Favorites */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Text style={styles.filterSectionTitle}>Favorites</Text>
                </View>
                <View style={styles.segmentedControl}>
                  {(['All', 'Only Favorites'] as FavoritesOpt[]).map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.segmentButton,
                        tempFilters.favorites === opt &&
                          styles.segmentButtonActive,
                      ]}
                      onPress={() =>
                        setTempFilters(prev => ({ ...prev, favorites: opt }))
                      }
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          tempFilters.favorites === opt &&
                            styles.segmentTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Type */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Text style={styles.filterSectionTitle}>Type</Text>
                  {tempFilters.type !== 'All' && (
                    <View style={styles.filterCount}>
                      <Text style={styles.filterCountText}>1</Text>
                    </View>
                  )}
                </View>
                <View style={styles.chipGrid}>
                  {facets.types.map(type => {
                    const isActive = tempFilters.type === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.chipButton,
                          isActive && styles.chipButtonActive,
                        ]}
                        onPress={() =>
                          setTempFilters(prev => ({ ...prev, type }))
                        }
                        activeOpacity={0.85}
                      >
                        {isActive && type !== 'All' && (
                          <Check
                            size={16}
                            color={theme.colors.accent}
                            strokeWidth={3}
                            style={styles.checkIcon}
                          />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            isActive && styles.chipTextActive,
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Grading Company */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Text style={styles.filterSectionTitle}>
                    Grading Company
                  </Text>
                  {tempFilters.gradingCompany !== 'All' && (
                    <View style={styles.filterCount}>
                      <Text style={styles.filterCountText}>1</Text>
                    </View>
                  )}
                </View>
                <View style={styles.chipGrid}>
                  {facets.companies.map(company => {
                    const isActive = tempFilters.gradingCompany === company;
                    return (
                      <TouchableOpacity
                        key={company}
                        style={[
                          styles.chipButton,
                          isActive && styles.chipButtonActive,
                        ]}
                        onPress={() =>
                          setTempFilters(prev => ({
                            ...prev,
                            gradingCompany: company,
                          }))
                        }
                        activeOpacity={0.85}
                      >
                        {isActive && company !== 'All' && (
                          <Check
                            size={16}
                            color={theme.colors.accent}
                            strokeWidth={3}
                            style={styles.checkIcon}
                          />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            isActive && styles.chipTextActive,
                          ]}
                        >
                          {company}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Grade */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Text style={styles.filterSectionTitle}>Grade</Text>
                  {tempFilters.grade !== 'All' && (
                    <View style={styles.filterCount}>
                      <Text style={styles.filterCountText}>1</Text>
                    </View>
                  )}
                </View>
                <View style={styles.chipGrid}>
                  {facets.grades.map(grade => {
                    const isActive = tempFilters.grade === grade;
                    return (
                      <TouchableOpacity
                        key={grade}
                        style={[
                          styles.chipButton,
                          isActive && styles.chipButtonActive,
                        ]}
                        onPress={() =>
                          setTempFilters(prev => ({ ...prev, grade }))
                        }
                        activeOpacity={0.85}
                      >
                        {isActive && grade !== 'All' && (
                          <Check
                            size={16}
                            color={theme.colors.accent}
                            strokeWidth={3}
                            style={styles.checkIcon}
                          />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            isActive && styles.chipTextActive,
                          ]}
                        >
                          {grade}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Autographed */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Text style={styles.filterSectionTitle}>Autographed</Text>
                </View>
                <View style={styles.segmentedControl}>
                  {(['All', 'Yes', 'No'] as AutographedOpt[]).map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.segmentButton,
                        tempFilters.autographed === opt &&
                          styles.segmentButtonActive,
                      ]}
                      onPress={() =>
                        setTempFilters(prev => ({ ...prev, autographed: opt }))
                      }
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          tempFilters.autographed === opt &&
                            styles.segmentTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetFilters}
                activeOpacity={0.85}
              >
                <RotateCcw
                  size={18}
                  color={theme.colors.text}
                  strokeWidth={2.5}
                />
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyFilters}
                activeOpacity={0.85}
              >
                <Check
                  size={20}
                  color={theme.dark ? '#0E1A2A' : '#FFFFFF'}
                  strokeWidth={3}
                />
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle}>Sort By</Text>
                <Text style={styles.modalSubtitle}>
                  Choose sorting order
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowSortModal(false)}
                activeOpacity={0.8}
              >
                <X size={22} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {[
                'Recently Added',
                'Price (High to Low)',
                'Price (Low to High)',
                'Name (A-Z)',
                'Name (Z-A)',
              ].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.sortOption,
                    sortBy === option && styles.sortOptionActive,
                  ]}
                  onPress={() => {
                    setSortBy(option);
                    setShowSortModal(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option && styles.sortOptionTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Item Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            <TouchableOpacity
              style={styles.detailCloseButton}
              onPress={() => setShowDetailModal(false)}
              activeOpacity={0.8}
            >
              <X size={26} color="#FFFFFF" />
            </TouchableOpacity>

            {selectedItem && (
              <ScrollView
                ref={detailScrollRef}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={styles.detailImageContainer}
                  onPress={() => setShowPhotoModal(true)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: selectedItem.imageUrl }}
                    style={styles.detailImage}
                  />
                </TouchableOpacity>

                <View style={styles.detailInfoSection}>
                  <TouchableOpacity
                    style={styles.editPencil}
                    onPress={() => {
                      const next = !isEditing;
                      if (next) {
                        setHiddenDraft(
                          selectedItem.meta?.hiddenDescription ?? ''
                        );
                        setTimeout(() => {
                          detailScrollRef.current?.scrollToEnd({
                            animated: true,
                          });
                        }, 100);
                      }
                      setIsEditing(next);
                    }}
                    activeOpacity={0.8}
                    accessibilityLabel={
                      isEditing ? 'Close edit mode' : 'Edit hidden notes'
                    }
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    {isEditing ? (
                      <X size={22} color="#FFFFFF" />
                    ) : (
                      <PencilLine size={22} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>

                  <View style={styles.detailHeader}>
                    <View style={styles.detailTypeGrade}>
                      <Text
                        style={styles.detailType}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {selectedItem.type}
                      </Text>
                      {!!selectedItem.grade && (
                        <Text
                          style={styles.detailGrade}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {selectedItem.grade}
                        </Text>
                      )}
                    </View>
                  </View>

                  <Text style={styles.detailName}>{selectedItem.name}</Text>
                  <Text style={styles.detailDescription}>
                    {selectedItem.description}
                  </Text>

                  <View style={styles.detailPriceSection}>
                    <View>
                      <Text style={styles.detailPriceLabel}>
                        Current Est. Value
                      </Text>
                      <Text style={styles.detailPriceValue}>
                        ${selectedItem.value.toLocaleString()}
                      </Text>
                    </View>
                    {selectedItem.marketData && (
                      <View style={styles.detailMarketData}>
                        <Text style={styles.detailMarketLabel}>
                          Market Change
                        </Text>
                        <Text
                          style={[
                            styles.detailMarketChange,
                            {
                              color: getChangeColor(
                                selectedItem.marketData.priceChange
                              ),
                            },
                          ]}
                        >
                          {formatChange(
                            selectedItem.marketData.priceChange,
                            selectedItem.marketData.priceChangePercent
                          )}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.detailMetadata}>
                    <View style={styles.metadataRow}>
                      <View style={styles.metadataItem}>
                        <Text style={styles.detailMetadataLabel}>
                          Added on
                        </Text>
                        <Text style={styles.detailMetadataValue}>
                          {new Date(
                            selectedItem.dateAdded
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                      {selectedItem.initialValue !== undefined && (
                        <View style={styles.metadataItem}>
                          <Text style={styles.detailMetadataLabel}>
                            Initial Est. Value
                          </Text>
                          <Text style={styles.detailMetadataValue}>
                            $
                            {selectedItem.initialValue.toLocaleString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.hiddenBlock}>
                    <Text style={styles.hiddenLabel}>
                      Hidden description (private)
                    </Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.hiddenInput}
                        multiline
                        value={hiddenDraft}
                        onChangeText={setHiddenDraft}
                        placeholder="Purchase date, gift from, where acquired, insurance notes…"
                        placeholderTextColor={theme.colors.muted}
                      />
                    ) : (
                      <Text style={styles.hiddenValue}>
                        {(selectedItem.meta?.hiddenDescription ?? '').trim() ||
                          '—'}
                      </Text>
                    )}
                  </View>

                  {isEditing && (
                    <View style={styles.editActionsRow}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={cancelHiddenDraft}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.cancelBtnTxt}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={saveHiddenDraft}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.saveBtnTxt}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {isEditing && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteItem(selectedItem.id)}
                      activeOpacity={0.85}
                    >
                      <Trash2 size={22} color="#FFFFFF" />
                      <Text style={styles.deleteButtonText}>
                        Remove from Collection
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <PhotoEnlargeModal
        visible={showPhotoModal}
        imageUri={selectedItem?.imageUrl || null}
        onClose={() => setShowPhotoModal(false)}
        accentColor={theme.colors.accent}
      />
    </View>
  );
}