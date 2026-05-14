// components/PriceFetcher.tsx
// used for snap-to-value.tsx
import React, { useImperativeHandle, useState, forwardRef } from 'react';
import {
  View, Text, Modal, ActivityIndicator, TouchableOpacity, StyleSheet,
} from 'react-native';

/** ENV */
const PRICECHARTING_TOKEN = process.env.EXPO_PUBLIC_PRICECHARTING_TOKEN || "";

/** Types */
export type PriceInput = {
  category: 'Card' | 'Coin' | 'Comic' | 'Other';
  productId?: string | number;

  gradingCompany?: string;
  grade?: string;
  certificationNumber?: string;

  year?: string;
  setSeries?: string;
  cardNumber?: string;
  cardName?: string;
  parallelVariant?: string;

  yearDisplayed?: string;
  mintMark?: string;
  coinName?: string;
  denomination?: string;
  strikeType?: string;
  designation?: string;
  variety?: string;

  yearOfPublication?: string;
  publisher?: string;
  seriesTitle?: string;
  issueNumber?: string;
  variantEdition?: string;

  requestGradeBreakdown?: boolean; // NEW: Request all PSA grades for raw cards
};

export type PriceResult = {
  price_low: number;
  price_mid: number;
  price_high: number;
  currency: string;
  confidence: number;
  notes: string;
  comps: Array<{ title: string; price: number; date: string; url: string; marketplace: string }>;
  gradeBreakdown?: Record<string, number>; // NEW: PSA grade breakdown
};

export type DebugLog = {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
};

export type PriceFetcherHandle = { run: (input: PriceInput) => void };

type Props = {
  onPrice: (result: PriceResult) => void;
  onLogsUpdate?: (logs: DebugLog[]) => void;
  accent?: string;
  text?: string;
  surface?: string;
  border?: string;
};

/* ───────────── Helpers ───────────── */

const p2d = (n?: number) => (typeof n === 'number' ? n / 100 : 0);
const clean = (s?: string) => String(s || '').trim();

const slug = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Portable fetch with timeout */
async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, ms = 10000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

/** Normalize card number for matching */
function normCardNo(n?: string) {
  const raw = clean(n).toLowerCase().replace(/^#/, '');
  if (!raw) return '';
  const core = raw.replace(/[^a-z0-9/]/g, '');
  const first = core.split('/')[0];
  return first.replace(/^0+/, '');
}

/** Boundary-safe card number detection */
function hasCardNumberToken(titleLower: string, num: string) {
  const t = titleLower.replace(/\s+/g, ' ');
  const naked = new RegExp(`(?:^|[^a-z0-9])${num}(?![a-z0-9])`);
  return (
    naked.test(t) ||
    new RegExp(`#${num}(?![a-z0-9])`).test(t) ||
    new RegExp(`${num}\\/[0-9]{1,3}`).test(t) ||
    new RegExp(`\\bno\\.?\\s*${num}\\b`).test(t) ||
    new RegExp(`\\bsvp[-\\s]?${num}\\b`).test(t)
  );
}

function buildQuery(input: PriceInput) {
  if (input.category === 'Card') {
    const parts: string[] = [];
    if (input.cardName) parts.push(input.cardName);
    if (input.cardNumber) parts.push(`#${input.cardNumber}`);
    if (input.setSeries) parts.push(input.setSeries);
    
    // CRITICAL: Map variant abbreviations to full names
    if (input.parallelVariant) {
      const variant = input.parallelVariant.toLowerCase();
      if (/\b(sir|special.?ill)/i.test(variant)) {
        parts.push('Special Illustration Rare');
      } else if (/\bfull.?art\b/i.test(variant)) {
        parts.push('Full Art');
      } else if (/\bultra.?rare\b/i.test(variant)) {
        parts.push('Ultra Rare');
      } else if (/\bhyper.?rare\b/i.test(variant)) {
        parts.push('Hyper Rare');
      } else if (/\brainbow\b/i.test(variant)) {
        parts.push('Rainbow Rare');
      } else if (/\bgold\b/i.test(variant)) {
        parts.push('Gold');
      } else {
        parts.push(input.parallelVariant);
      }
    }
    
    if (input.year) parts.push(input.year);
    return parts.filter(Boolean).join(' ').trim();
  }
  if (input.category === 'Coin') {
    // ⭐ CRITICAL FIX: Build smarter coin search queries
    // Prefer specific coin names over generic types
    const parts: string[] = [];
    
    // Year is essential
    if (input.yearDisplayed) parts.push(input.yearDisplayed);
    
    // ⭐ Key insight: coinName might be "Silver Coin" (generic) or "Morgan Dollar" (specific)
    // Filter out generic/unhelpful terms
    const coinName = input.coinName || '';
    const isGeneric = /^(silver coin|gold coin|copper coin|coin)$/i.test(coinName.trim());
    
    if (coinName && !isGeneric) {
      // Use specific name like "Morgan Dollar", "American Eagle", etc.
      parts.push(coinName);
    }
    
    // Denomination
    if (input.denomination) parts.push(input.denomination);
    
    // Mint mark (only if specific)
    if (input.mintMark && input.mintMark.length <= 2) {
      parts.push(input.mintMark);
    }
    
    // Variety/designation/strike if available
    if (input.variety) parts.push(input.variety);
    if (input.designation) parts.push(input.designation);
    if (input.strikeType) parts.push(input.strikeType);
    
    return parts.filter(Boolean).join(' ').trim();
  }
  if (input.category === 'Comic') {
    return [
      input.seriesTitle,
      input.issueNumber ? `#${input.issueNumber}` : '',
      input.publisher,
      input.variantEdition,
      input.yearOfPublication,
    ].filter(Boolean).join(' ').trim();
  }
  return input.cardName || input.coinName || input.seriesTitle || 'graded';
}

/** Scoring with optional strict number requirement */
function scoreProductMatch(product: any, input: PriceInput, opts?: { requireNumber?: boolean }) {
  const title = (product.product_name || product.title || '').toLowerCase();
  const consoleName = (product.console_name || '').toLowerCase();
  let score = 0;

  // Card number matching
  if (input.cardNumber) {
    const num = normCardNo(input.cardNumber);
    if (num) {
      const hasNum = hasCardNumberToken(title, num);
      if (opts?.requireNumber && !hasNum) return -1000;
      if (hasNum) score += 15;
      else score -= 4;
    }
  }

  // Card name matching
  if (input.cardName) {
    const nameLower = clean(input.cardName).toLowerCase();
    if (title.includes(nameLower)) {
      score += 10;
      if (title === nameLower || title.startsWith(nameLower + ' ') || title.endsWith(' ' + nameLower)) {
        score += 5;
      }
    }
  }

  // Set/Series matching
  if (input.setSeries) {
    const setLower = clean(input.setSeries).toLowerCase();
    if (title.includes(setLower) || consoleName.includes(setLower)) score += 8;
  }

  // Year matching
  if (input.year && title.includes(clean(input.year))) score += 2;

  // CRITICAL: Variant matching (strongly weighted)
  if (input.parallelVariant) {
    const varLower = clean(input.parallelVariant).toLowerCase();
    const fullTitle = `${title} ${consoleName}`.toLowerCase();
    
    const variantKeywords = [
      { input: /sir|special.?ill/i, match: /special.?illustration/i, bonus: 12 },
      { input: /full.?art/i, match: /full.?art/i, bonus: 12 },
      { input: /ultra.?rare/i, match: /ultra.?rare/i, bonus: 12 },
      { input: /hyper.?rare/i, match: /hyper.?rare/i, bonus: 12 },
      { input: /rainbow/i, match: /rainbow/i, bonus: 12 },
      { input: /gold/i, match: /\bgold\b/i, bonus: 12 },
      { input: /holo/i, match: /holo/i, bonus: 8 },
      { input: /reverse/i, match: /reverse/i, bonus: 8 },
    ];
    
    let variantMatched = false;
    for (const kw of variantKeywords) {
      if (kw.input.test(varLower)) {
        if (kw.match.test(fullTitle)) {
          score += kw.bonus;
          variantMatched = true;
        } else {
          score -= 15;
        }
        break;
      }
    }
    
    if (!variantMatched && fullTitle.includes(varLower)) {
      score += 6;
    }
  } else {
    const hasVariantKeyword = /special|illustration|full.?art|ultra|hyper|rainbow|gold/i.test(`${title} ${consoleName}`);
    if (hasVariantKeyword) score -= 2;
  }

  // Promo mismatch penalty
  const isPromoInput = /promo|svp/i.test(clean(input.setSeries));
  const isPromoProduct = /promo/i.test(title) || /promo/i.test(consoleName);
  if (isPromoInput !== isPromoProduct) score -= 10;

  // Coins: mint mark matching
  if (input.category === 'Coin' && input.mintMark) {
    const mm = clean(input.mintMark).toUpperCase();
    const hasMM = new RegExp(`\\b${mm}\\b`, 'i').test(title);
    if (hasMM) score += 3;
    const otherMints = ['P', 'D', 'S', 'W'].filter(m => m !== mm);
    if (otherMints.some(m => new RegExp(`\\b${m}\\b`, 'i').test(title))) score -= 4;
  }

  return score;
}

/** Pick product with strict-then-relaxed passes */
function pickProduct(products: any[], input: PriceInput): { chosen: any | null; mode: 'Strict' | 'Relaxed' | 'BestAvailable' } {
  let chosen: any | null = null;
  let mode: 'Strict' | 'Relaxed' | 'BestAvailable' = 'Strict';

  const scoredStrict = products
    .map(p => ({ ...p, __score: scoreProductMatch(p, input, { requireNumber: true }) }))
    .filter(p => p.__score > -1000)
    .sort((a, b) => b.__score - a.__score);

  if (scoredStrict.length) {
    chosen = scoredStrict[0];
  } else {
    const scoredRelaxed = products
      .map(p => ({ ...p, __score: scoreProductMatch(p, input, { requireNumber: false }) }))
      .filter(p => p.__score > -1000)
      .sort((a, b) => b.__score - a.__score);

    if (scoredRelaxed.length) {
      chosen = scoredRelaxed[0];
      mode = 'Relaxed';
    }
  }

  return { chosen, mode };
}

/** Enhanced grade price extraction with CRITICAL FIX for NGC/PCGS coin grades */
function selectExactGradePrice(prodRoot: any, grader?: string, grade?: string) {
  const product = prodRoot?.product ?? prodRoot;
  if (!product || typeof product !== 'object') return { key: '', value: 0 };
  const keys = Object.keys(product);
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const byNorm = new Map<string, string>();
  for (const k of keys) byNorm.set(norm(k), k);

  const g = clean(grader).toLowerCase();
  const gradeStr = clean(grade);
  const numMatch = gradeStr.match(/(\d+(\.\d+)?)/);
  const n = numMatch?.[1] || '';
  if (!g || !n) return { key: '', value: 0 };

  const wants: string[] = [];

  if (g.includes('psa')) {
    const cleanNum = n.replace('.', '');
    const underscoreNum = n.replace('.', '_');
    wants.push(
      // Standard PSA field patterns
      `psa${cleanNum}price`, `psa-${cleanNum}-price`, `psa${underscoreNum}price`, `psa-${n}-price`,
      `psa${cleanNum}`, `psa${underscoreNum}`, `psa-${cleanNum}`, `psa-${n}`,
      `grade${cleanNum}price`, `grade-${cleanNum}-price`, `grade${n}price`, `grade-${n}-price`,
      `condition${cleanNum}price`,
      // CRITICAL: PriceCharting sometimes uses weird field names
      ...(n === '10' || n === '10.0' ? [
        'manual-only-price',  // ← This is where PSA 10 hides sometimes!
        'manualonlyprice',
        'graded-price', 
        'gradedprice'
      ] : [])
    );
  } else if (g.includes('bgs') || g.includes('beckett')) {
    const cleanNum = n.replace('.', '');
    const underscoreNum = n.replace('.', '_');
    wants.push(
      `bgs${cleanNum}price`, `bgs${underscoreNum}price`, `bgs-${cleanNum}-price`, `bgs-${n}-price`,
      `bgs${cleanNum}`, `bgs${underscoreNum}`, `beckett${cleanNum}price`,
      ...(n === '10' ? ['bgs-10-price', 'bgs10price', 'graded-price'] : [])
    );
  } else if (g.includes('cgc')) {
    const cleanNum = n.replace('.', '');
    const cgcConditionMap: Record<string, string[]> = {
      '10': ['condition17price', 'condition-17-price', 'cgc10price', 'cgc-10-price'],
      '9.8': ['condition16price', 'condition-16-price', 'cgc98price', 'cgc-9-8-price'],
      '9.6': ['condition15price', 'condition-15-price', 'cgc96price'],
      '9.4': ['condition14price', 'condition-14-price', 'cgc94price'],
      '9.2': ['condition13price', 'condition-13-price', 'cgc92price'],
      '9.0': ['condition12price', 'condition-12-price', 'cgc90price', 'cgc-9-0-price'],
    };
    wants.push(...(cgcConditionMap[n] || []));
    wants.push(`cgc${cleanNum}price`, `cgc-${n}-price`, `cgc${cleanNum}`, ...(parseFloat(n) >= 9.8 ? ['graded-price'] : []));
  } else if (g.includes('sgc')) {
    const cleanNum = n.replace('.', '');
    const sgcConditionMap: Record<string, string[]> = {
      '10': ['condition18price', 'condition-18-price', 'sgc10price', 'sgc-10-price'],
      '9.5': ['condition19price', 'condition-19-price', 'sgc95price', 'sgc-9-5-price'],
      '9': ['sgc9price', 'sgc-9-price'],
    };
    wants.push(...(sgcConditionMap[n] || []));
    wants.push(`sgc${cleanNum}price`, `sgc-${n}-price`, `sgc${cleanNum}`, ...(parseFloat(n) >= 9.5 ? ['graded-price'] : []));
  } else if (g.includes('pcgs') || g.includes('ngc')) {
    // ⭐ CRITICAL FIX: NGC/PCGS coin grading uses MS (Mint State) prefix
    // MS 70 = condition-18-price (highest grade)
    // MS 69 = condition-17-price
    // MS 68 = condition-16-price
    // MS 67 = condition-15-price
    // MS 66 = condition-14-price
    // MS 65 = condition-13-price
    const prefix = g.includes('pcgs') ? 'pcgs' : 'ngc';
    const cleanNum = n.replace('.', '');
    
    const coinConditionMap: Record<string, string[]> = {
      '70': ['condition18price', 'condition-18-price', `${prefix}ms70price`, `${prefix}-ms-70-price`],
      '69': ['condition17price', 'condition-17-price', `${prefix}ms69price`, `${prefix}-ms-69-price`],
      '68': ['condition16price', 'condition-16-price', `${prefix}ms68price`, `${prefix}-ms-68-price`],
      '67': ['condition15price', 'condition-15-price', `${prefix}ms67price`, `${prefix}-ms-67-price`],
      '66': ['condition14price', 'condition-14-price', `${prefix}ms66price`, `${prefix}-ms-66-price`],
      '65': ['condition13price', 'condition-13-price', `${prefix}ms65price`, `${prefix}-ms-65-price`],
    };
    
    wants.push(...(coinConditionMap[n] || []));
    wants.push(
      `${prefix}${cleanNum}price`, `${prefix}-${n}-price`, `${prefix}ms${cleanNum}price`,
      `${prefix}-ms-${n}-price`
    );
    
    // Only use generic graded-price as LAST resort for perfect grades
    if (parseFloat(n) >= 69) {
      wants.push('graded-price', 'gradedprice');
    }
  } else {
    const cleanNum = n.replace('.', '');
    wants.push(`grade${cleanNum}price`, `grade-${cleanNum}-price`, `condition${cleanNum}price`, 'graded-price');
  }

  for (const want of wants) {
    const k = byNorm.get(norm(want));
    if (!k) continue;
    const cents = Number(product[k]);
    if (Number.isFinite(cents) && cents > 0) {
      return { key: k, value: cents / 100 };
    }
  }
  return { key: '', value: 0 };
}

/** NEW: Extract all PSA grades from product data */
function extractAllPSAGrades(product: any): Record<string, number> {
  if (!product || typeof product !== 'object') return {};
  
  const grades: Record<string, number> = {};
  const keys = Object.keys(product);
  
  // PSA grades 1-10
  for (let grade = 1; grade <= 10; grade++) {
    const gradeStr = grade.toString();
    const result = selectExactGradePrice({ product }, 'PSA', gradeStr);
    if (result.value > 0) {
      grades[gradeStr] = result.value;
    }
  }
  
  return grades;
}

/** Synthesize product URL for promos */
function synthesizeProductUrl(input: PriceInput): string {
  if (input.category !== "Card") return "";
  const series = (input.setSeries || "").toLowerCase();
  if (/^svp/.test(series) || /promo/.test(series)) {
    const name = slug(input.cardName || "");
    const num = (input.cardNumber || "").replace(/[^a-z0-9]/gi, "").replace(/^0+/, "");
    if (name && num) return `https://www.pricecharting.com/game/pokemon-promo/${name}-${num}`;
  }
  return "";
}

/** CRITICAL FIX: Deterministic mid-price choice with ungraded support */
function chooseMidPrice(product: any, isUngraded: boolean = false) {
  const cents = (k: string) => Number(product?.[k]) || 0;
  
  // For ungraded cards, prioritize loose-price (raw card value)
  if (isUngraded) {
    for (const k of ['loose-price', 'price-mid', 'cib-price']) {
      const v = cents(k);
      if (v > 0) return { key: k, value: v / 100 };
    }
  } else {
    // For graded or general lookup, prioritize graded-price
    for (const k of ['graded-price', 'price-mid', 'loose-price', 'cib-price']) {
      const v = cents(k);
      if (v > 0) return { key: k, value: v / 100 };
    }
  }
  
  return { key: '', value: 0 };
}

/** Grade/price scraper from public page */
async function fetchGradeFromPublicPage(
  productUrl: string,
  grader: string,
  grade: string
): Promise<{ key: string; value: number }> {
  try {
    if (!productUrl) return { key: '', value: 0 };
    const proxied = `https://r.jina.ai/${productUrl.replace(/^https?:\/\//, '')}`;
    const res = await fetchWithTimeout(proxied, {}, 10000);
    if (!res.ok) return { key: '', value: 0 };
    let txt = await res.text();

    // Normalize whitespace but preserve line structure
    txt = txt.replace(/\r/g, '').replace(/[ \t]+/g, ' ');
    const lines = txt.split('\n').map(l => l.trim()).filter(Boolean);

    // Build exclusion list (Ungraded and generic Grade N)
    const excludePrices = new Set<number>();
    for (const line of lines) {
      const m = line.match(/^Ungraded\$?\s*([0-9][0-9,]*\.?[0-9]*)/i);
      if (m) {
        excludePrices.add(Number(m[1].replace(/,/g, '')));
        break;
      }
    }
    for (const line of lines) {
      const m = line.match(/^Grade\s+(\d+(?:\.\d+)?)\$?\s*([0-9][0-9,]*\.?[0-9]*)/i);
      if (m) excludePrices.add(Number(m[2].replace(/,/g, '')));
    }

    const graderUpper = clean(grader).toUpperCase();
    const gradeClean = clean(grade);
    const gradeEsc = gradeClean.replace('.', '\\.?');

    // CRITICAL FIX: Match formats like "PSA 10$1,174.49" (no space before $)
    // Pattern 1: "PSA 10$123.45" or "PSA 10 $123.45"
    const directPattern = new RegExp(
      `${graderUpper}\\s*${gradeEsc}\\$?\\s*([0-9][0-9,]*\\.?[0-9]*)`,
      'i'
    );

    // Try to find the pattern in the full text first (most reliable)
    const directMatch = txt.match(directPattern);
    if (directMatch) {
      const val = Number(directMatch[1].replace(/,/g, ''));
      if (Number.isFinite(val) && val > 0 && !excludePrices.has(val)) {
        if (__DEV__) console.log('[Scraper] ✓ Found direct match:', directMatch[0]);
        return { key: `${graderUpper} ${gradeClean} (scraped)`, value: val };
      }
    }

    // Fallback: Line-by-line search with flexible spacing
    const gradePattern = new RegExp(`^${graderUpper}\\s*${gradeEsc}`, 'i');
    
    for (const line of lines) {
      if (gradePattern.test(line)) {
        // Try to extract price from same line
        const priceMatch = line.match(/\$?\s*([0-9][0-9,]*\.?[0-9]*)/);
        if (priceMatch) {
          const val = Number(priceMatch[1].replace(/,/g, ''));
          if (Number.isFinite(val) && val > 0 && !excludePrices.has(val)) {
            if (__DEV__) console.log('[Scraper] ✓ Found line match:', line);
            return { key: `${graderUpper} ${gradeClean} (scraped line)`, value: val };
          }
        }
      }
    }

    // Multi-line fallback (grade on one line, price on next)
    const idx = lines.findIndex(l => gradePattern.test(l));
    if (idx >= 0) {
      for (let j = idx + 1; j < Math.min(idx + 5, lines.length); j++) {
        const priceMatch = lines[j].match(/\$?\s*([0-9][0-9,]*\.?[0-9]*)/);
        if (priceMatch) {
          const val = Number(priceMatch[1].replace(/,/g, ''));
          if (Number.isFinite(val) && val > 0 && !excludePrices.has(val)) {
            if (__DEV__) console.log('[Scraper] ✓ Found multi-line match');
            return { key: `${graderUpper} ${gradeClean} (scraped multi-line)`, value: val };
          }
        }
      }
    }

    if (__DEV__) console.warn('[Scraper] ✗ No valid match found');
    return { key: '', value: 0 };
  } catch (err) {
    console.error('[Scraper] Error:', err);
    return { key: '', value: 0 };
  }
}

/* ───────────── Component ───────────── */

const PriceFetcher = forwardRef<PriceFetcherHandle, Props>(
  ({ onPrice, onLogsUpdate, accent = '#D4AF37', text = '#0E1A2A', surface = '#FFFFFF', border = '#E5E7EB' }, ref) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [last, setLast] = useState<PriceResult | null>(null);
    const [logs, setLogs] = useState<DebugLog[]>([]);

    const addLog = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
      setLogs(prev => {
        const newLogs = [...prev, { timestamp: Date.now(), level, message, data }];
        if (onLogsUpdate) onLogsUpdate(newLogs);
        return newLogs;
      });
    };

    useImperativeHandle(ref, () => ({
      run: (input: PriceInput) => {
        setOpen(true);
        setError(null);
        setLast(null);
        setLogs([]);
        if (onLogsUpdate) onLogsUpdate([]);
        fetchPrice(input).catch(() => {});
      },
    }));

    async function fetchPrice(input: PriceInput) {
      try {
        setLoading(true);
        setError(null);
        addLog('info', 'Starting price lookup', { category: input.category });

        if (!PRICECHARTING_TOKEN) {
          addLog('error', 'Pricing token missing');
          throw new Error('Pricing token missing. Add EXPO_PUBLIC_PRICECHARTING_TOKEN to .env');
        }

        // Determine if this is an ungraded request
        const isUngraded = !input.gradingCompany && !input.grade;
        if (isUngraded) {
          addLog('info', 'Ungraded item - will use loose-price');
        }

        // 1) Resolve product ID
        let productId = input.productId;
        let chosenTitle = '';
        let chosenConsoleName = '';
        let productUrlFromSearch = '';
        let matchMode: 'Strict' | 'Relaxed' | 'BestAvailable' = 'Strict';

        if (!productId) {
          const searchOnce = async (query: string) => {
            const url = `https://www.pricecharting.com/api/products?t=${encodeURIComponent(
              PRICECHARTING_TOKEN
            )}&q=${encodeURIComponent(query)}`;
            const res = await fetchWithTimeout(url, {}, 10000);
            if (!res.ok) throw new Error(`Search failed (HTTP ${res.status})`);
            return res.json();
          };

          // Try multiple queries
          const queries: string[] = [];
          const q0 = buildQuery(input);
          if (!q0) {
            addLog('error', 'Insufficient search parameters');
            throw new Error('Insufficient search parameters.');
          }
          queries.push(q0);
          addLog('info', `Primary search query: ${q0}`);

          if (input.category === 'Card') {
            if (input.parallelVariant) {
              const dropVariant = buildQuery({ ...input, parallelVariant: undefined } as PriceInput);
              if (dropVariant && dropVariant !== q0) queries.push(dropVariant);
            }
            const dropSet = buildQuery({ ...input, setSeries: undefined } as PriceInput);
            if (dropSet && !queries.includes(dropSet)) queries.push(dropSet);
            const dropNumber = buildQuery({ ...input, cardNumber: undefined } as PriceInput);
            if (dropNumber && !queries.includes(dropNumber)) queries.push(dropNumber);
          }

          let productsJson: any = null;
          let usedQuery = '';
          for (const q of queries) {
            addLog('info', `Trying query: ${q}`);
            productsJson = await searchOnce(q);
            if (productsJson?.status === 'success' && productsJson?.products?.length) {
              usedQuery = q;
              addLog('info', `Found ${productsJson.products.length} results`,
                productsJson.products.slice(0, 5).map((p: any) => `${p.product_name || p.title} (ID: ${p.id})`)
              );
              break;
            } else {
              addLog('warn', `Query returned no results: ${q}`);
            }
          }

          if (productsJson?.status !== 'success' || !productsJson?.products?.length) {
            addLog('error', 'No matching products found after all queries');
            throw new Error('No matching products found. Try refining your search.');
          }

          // Strict then relaxed then best-available
          let { chosen, mode } = pickProduct(productsJson.products, input);
          addLog('info', `Product matching mode: ${mode}`);

          if (!chosen && productsJson.products.length > 0) {
            const fallbacks = productsJson.products
              .map((p: any) => ({ ...p, __score: scoreProductMatch(p, input, { requireNumber: false }) }))
              .sort((a: any, b: any) => b.__score - a.__score);

            if (fallbacks[0].__score > -500) {
              chosen = fallbacks[0];
              mode = 'BestAvailable';
              matchMode = 'BestAvailable';
              addLog('warn', 'Using best-available fallback match', { score: fallbacks[0].__score });
            }
          }
          
          if (!chosen) {
            const searchedFor = [
              input.cardName,
              input.cardNumber ? `#${input.cardNumber}` : '',
              input.setSeries,
              input.parallelVariant
            ].filter(Boolean).join(' ');
            addLog('error', `No suitable product match found for: ${searchedFor}`);
            throw new Error(
              `No products found for: "${searchedFor}". ` +
              `Try simplifying your search or check PriceCharting.com directly.`
            );
          }
          matchMode = mode;

          addLog('info', `Selected product: ${chosen.product_name || chosen.title}`, {
            id: chosen.id,
            mode: matchMode,
            score: chosen.__score
          });

          productId = chosen?.id;
          chosenTitle = chosen?.product_name || chosen?.title || '';
          chosenConsoleName = chosen?.console_name || '';
          productUrlFromSearch = chosen?.url || chosen?.product_url || '';
        }

        // 2) Fetch product detail
        const productURL = `https://www.pricecharting.com/api/product?t=${encodeURIComponent(
          PRICECHARTING_TOKEN
        )}&id=${encodeURIComponent(String(productId))}`;

        addLog('info', 'Fetching product details', { productId });
        const prodRes = await fetchWithTimeout(productURL, {}, 10000);
        if (!prodRes.ok) {
          addLog('error', `Product lookup failed (HTTP ${prodRes.status})`);
          throw new Error(`Product lookup failed (HTTP ${prodRes.status})`);
        }

        const prodJson = await prodRes.json();
        if (prodJson?.status !== 'success') {
          addLog('error', 'Product pricing unavailable', prodJson?.['error-message']);
          throw new Error(prodJson?.['error-message'] || 'Product pricing unavailable.');
        }

        const product = prodJson.product ?? prodJson;

        const priceFields = Object.keys(product || {})
          .filter(k => /price|grade|condition/i.test(k) && typeof product[k] === 'number');
        addLog('info', `Found ${priceFields.length} price fields in product data`,
          priceFields.slice(0, 10).map(k => `${k}: $${(product[k] / 100).toFixed(2)}`)
        );

        // 3) Product URL (with aggressive fallback construction)
        let productUrl =
          product?.url ||
          product?.['product-url'] ||
          productUrlFromSearch ||
          synthesizeProductUrl(input) ||
          '';

        // CRITICAL FIX: If we have product ID but no URL, construct it
        if (!productUrl && productId && chosenTitle) {
          addLog('warn', 'Product URL missing, constructing from title');
          const titleSlug = chosenTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

          if (input.category === 'Card') {
            const consolePart = (chosenConsoleName || input.setSeries || 'pokemon-cards')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');

            productUrl = `https://www.pricecharting.com/game/${consolePart}/${titleSlug}`;
          }
        }

        if (productUrl) {
          addLog('info', `Product URL: ${productUrl}`);
        } else {
          addLog('warn', 'No product URL available - scraping will fail');
        }

        // 4) NEW: Extract PSA grade breakdown if requested
        let gradeBreakdown: Record<string, number> | undefined;
        if (input.requestGradeBreakdown && input.category === 'Card') {
          addLog('info', 'Extracting PSA grade breakdown');
          gradeBreakdown = extractAllPSAGrades(product);
          const gradeCount = Object.keys(gradeBreakdown).length;
          addLog('info', `Found ${gradeCount} PSA grades`, gradeBreakdown);
        }

        // 5) Extract price (grade → scrape → fallback)
        let usedKey = '';
        let mid = 0;
        let confidence = 0.5;

        if (input.gradingCompany && input.grade) {
          addLog('info', `Looking up grade: ${input.gradingCompany} ${input.grade}`);

          // Step 1: Try exact grade field from API
          const pick = selectExactGradePrice(prodJson, input.gradingCompany, input.grade);
          usedKey = pick.key;
          mid = pick.value;

          if (mid > 0) {
            confidence = 0.85;
            addLog('info', `✓ Found exact grade in API: ${pick.key} = $${pick.value}`);
          } else {
            // Step 2: ALWAYS try scraping for graded items when API fails
            addLog('warn', 'Grade not found in API, attempting web scrape');

            if (productUrl) {
              addLog('info', `Scraping: ${productUrl}`);
              const scraped = await fetchGradeFromPublicPage(productUrl, input.gradingCompany, input.grade);

              if (scraped.value > 0) {
                usedKey = scraped.key;
                mid = scraped.value;
                confidence = 0.80;
                addLog('info', `✓ Scraping succeeded: ${scraped.key} = $${scraped.value}`);
              } else {
                addLog('error', '✗ Scraping failed or returned $0');
              }
            } else {
              addLog('error', '✗✗✗ NO PRODUCT URL - CANNOT SCRAPE');
            }
          }
        }

        // Fallback only if no grade requested OR both API + scrape failed
        if (!mid) {
          if (input.gradingCompany && input.grade) {
            addLog('warn', '⚠️ Falling back to generic pricing (may be inaccurate for graded item)');
          }
          
          // CRITICAL FIX: Pass isUngraded flag to chooseMidPrice
          const pick = chooseMidPrice(product, isUngraded);
          usedKey = pick.key;
          mid = pick.value;
          
          confidence =
            usedKey === 'loose-price'  ? 0.70 : // Higher confidence for ungraded using loose-price
            usedKey === 'graded-price' ? 0.65 :
            usedKey === 'price-mid'    ? 0.67 :
            usedKey === 'cib-price'    ? 0.58 : confidence;

          if (input.gradingCompany && input.grade) {
            usedKey += ' (fallback - grade not found)';
            confidence = Math.max(0.45, confidence - 0.15);
            addLog('error', `✗✗✗ Using fallback ${pick.key} for graded item - price may be inaccurate`);
          } else {
            addLog('info', `Using ${pick.key} = $${pick.value}`);
          }
        } else {
          addLog('info', `✓✓✓ SUCCESS! Final price: $${mid} from ${usedKey}`);
        }

        if (!mid || mid <= 0) {
          addLog('error', 'No valid price found');
          throw new Error('Price unavailable for this item/grade. Try a different grade or check PriceCharting directly.');
        }

        // Confidence adjustments
        if (input.category === 'Card') {
          const strongNumber = !!input.cardNumber;
          const strongSet = !!input.setSeries && (chosenTitle.toLowerCase().includes(clean(input.setSeries).toLowerCase()));
          if (strongNumber && strongSet) {
            confidence = Math.min(0.9, confidence + 0.05);
            addLog('info', 'Confidence boost: strong number + set match');
          }

          if (matchMode === 'Relaxed') {
            confidence = Math.max(0.4, confidence - 0.05);
            addLog('info', 'Confidence penalty: relaxed match mode');
          }
          if (matchMode === 'BestAvailable') {
            confidence = Math.max(0.35, confidence - 0.15);
            addLog('warn', 'Confidence penalty: best-available fallback match');
          }
        }

        // 6) Build result
        const price_mid = Number(mid.toFixed(2));
        const price_low = Number((price_mid * 0.85).toFixed(2));
        const price_high = Number((price_mid * 1.15).toFixed(2));

        const result: PriceResult = {
          price_low,
          price_mid,
          price_high,
          currency: 'USD',
          confidence,
          notes: [
            `Product: ${chosenTitle}${chosenConsoleName ? ` (${chosenConsoleName})` : ''}`,
            `ID: ${productId}`,
            `Source: ${usedKey || 'n/a'}`,
            `Match: ${matchMode}${matchMode === 'BestAvailable' ? ' ⚠️' : ''}`,
            input.gradingCompany && input.grade ? `Grade: ${input.gradingCompany} ${input.grade}` : 'Ungraded',
            matchMode === 'BestAvailable' ? 'WARNING: Product match uncertain - verify manually' : '',
            productUrl ? `URL: ${productUrl}` : ''
          ].filter(Boolean).join(' • '),
          comps: [],
          gradeBreakdown, // NEW: Include grade breakdown in result
        };

        addLog('info', `Price lookup complete: $${price_mid} (confidence: ${(confidence * 100).toFixed(0)}%)`);
        setLast(result);
        onPrice(result);
      } catch (e: any) {
        const msg = typeof e?.message === 'string'
          ? e.message
          : 'Pricing lookup failed. Please try again.';
        addLog('error', `Fatal error: ${msg}`);
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    return (
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={[styles.wrap, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.row}>
              <Text style={[styles.title, { color: text }]}>Market Price</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={[styles.closeBtn, { borderColor: border }]}>
                <Text style={{ color: text, fontWeight: '700', fontSize: 20 }}>×</Text>
              </TouchableOpacity>
            </View>

            {loading && (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <ActivityIndicator size="large" color={accent} />
                <Text style={{ marginTop: 12, color: text, opacity: 0.7 }}>
                  Fetching market data…
                </Text>
              </View>
            )}

            {error && !loading && (
              <View style={{ marginTop: 12, padding: 12, backgroundColor: '#FEE', borderRadius: 8 }}>
                <Text style={{ color: '#B00020' }}>{error}</Text>
              </View>
            )}

            {last && !loading && (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.price, { color: accent }]}>
                  {last.currency}{' '}
                  {last.price_mid.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </Text>
                <Text style={{ color: text, opacity: 0.7, marginTop: 6, fontSize: 13 }}>
                  Range: {last.currency}{' '}
                  {last.price_low.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} – {last.currency}{' '}
                  {last.price_high.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </Text>
                <Text style={{ color: text, opacity: 0.6, marginTop: 4, fontSize: 12 }}>
                  Confidence: {(last.confidence * 100).toFixed(0)}%
                </Text>
                {last.notes && (
                  <Text style={{
                    color: text,
                    opacity: 0.5,
                    marginTop: 10,
                    fontSize: 11,
                    lineHeight: 16
                  }}>
                    {last.notes}
                  </Text>
                )}
              </View>
            )}

            {!loading && (
              <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  onPress={() => setOpen(false)}
                  style={[styles.okBtn, { backgroundColor: accent }]}
                >
                  <Text style={{ color: surface, fontWeight: '700', fontSize: 15 }}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: {
    width: '92%',
    maxWidth: 480,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  price: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  okBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center'
  },
});

export default PriceFetcher;