// components/CurioAIAnalyzer.tsx - Updated with GPT-4.5 web search pricing
import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { X } from 'lucide-react-native';
import { CurioCategory } from '@/lib/LastScanStore';
import PriceFetcher, { 
  PriceFetcherHandle, 
  PriceInput as PFPriceInput, 
  PriceResult as PFPriceResult,
  DebugLog as PFDebugLog 
} from '@/components/PriceFetcher';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY || '';

/* ---------------- Types ---------------- */
export type DebugLog = PFDebugLog;

export interface AIAnalysisResult {
  category?: string;
  title_for_ui?: string;
  estimated_value_usd?: number;
  fact_description?: string;
  grading_company?: string;
  grade?: string;
  certification_number?: string;
  country?: string;
  // Card fields
  year?: string;
  set?: string;
  card_number?: string;
  brand?: string;
  character?: string;
  tcg_category?: string;
  tcg_edition?: string;
  variation_details?: string;
  autographed?: string;
  autographed_by?: string;
  auto_grade?: string;
  qualifier?: string;
  // Coin fields
  coins_type?: string;
  coin_product_name?: string;
  denomination?: string;
  currency?: string;
  year_displayed?: string;
  mint_mark?: string;
  mint_location?: string;
  production_type?: string;
  design_variation?: string;
  design_variation_details?: string;
  special_designation?: string;
  designer?: string;
  special_label?: string;
  pedigree?: string;
  series_name?: string;
  metal_fineness?: string;
  weight?: string;
  design_details?: string;
  // Comic fields
  publisher?: string;
  comic_title?: string;
  comic_issue_number?: string;
  variant?: string;
  first_appearance?: string;
  [key: string]: any;
}

export interface PriceInput {
  category: 'Card' | 'Coin' | 'Comic' | 'Other';
  gradingCompany?: string;
  grade?: string;
  certificationNumber?: string;
  country?: string;
  // Card
  year?: string;
  setSeries?: string;
  cardNumber?: string;
  cardName?: string;
  sportGenre?: string;
  parallelVariant?: string;
  autograph?: boolean;
  autographWho?: string;
  // Coin
  yearDisplayed?: string;
  mintMark?: string;
  mintLocation?: string;
  coinName?: string;
  denomination?: string;
  strikeType?: string;
  designation?: string;
  variety?: string;
  specialDesignation?: string;
  designer?: string;
  specialLabel?: string;
  pedigree?: string;
  seriesName?: string;
  metalFineness?: string;
  weight?: string;
  designDetails?: string;
  // Comic
  yearOfPublication?: string;
  publisher?: string;
  seriesTitle?: string;
  issueNumber?: string;
  variantEdition?: string;
}

export interface PriceResult {
  price_low: number;
  price_mid: number;
  price_high: number;
  confidence: number;
  currency: string;
  source?: string;
  notes?: string;
}

export interface CurioAIAnalyzerHandle {
  analyzeImage: (
    category: CurioCategory,
    imageUri: string,
    signal?: AbortSignal
  ) => Promise<AIAnalysisResult>;
  fetchPrice: (input: PriceInput) => void;
}

interface CurioAIAnalyzerProps {
  onPriceResult?: (result: PriceResult) => void;
  onLogsUpdate?: (logs: DebugLog[]) => void;
  accent?: string;
  text?: string;
  surface?: string;
  border?: string;
}

/* ---------------- Schema Builders ---------------- */
function buildSchema(properties: Record<string, any>) {
  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  };
}

const cardSchema = {
  name: 'CardPayload',
  schema: buildSchema({
    category: { type: 'string' },
    year: { type: 'string' },
    set: { type: 'string' },
    card_number: { type: 'string' },
    brand: { type: 'string' },
    character: { type: 'string' },
    genre: { type: 'string' },
    artist_illustrator: { type: 'string' },
    manufacturer: { type: 'string' },
    product_type: { type: 'string' },
    edition: { type: 'string' },
    variation_details: { type: 'string' },
    grading_company: { type: 'string' },
    grade: { type: 'string' },
    certification_number: { type: 'string' },
    autographed: { type: 'string' },
    autographed_by: { type: 'string' },
    auto_grade: { type: 'string' },
    qualifier: { type: 'string' },
    title_for_ui: { type: 'string' },
    fact_description: { type: 'string' },
    country: { type: 'string' },
  }),
};

const coinSchema = {
  name: 'CoinPayload',
  schema: buildSchema({
    category: { type: 'string' },
    coins_type: { type: 'string' },
    coin_product_name: { type: 'string' },
    denomination: { type: 'string' },
    currency: { type: 'string' },
    year_displayed: { type: 'string' },
    mint_mark: { type: 'string' },
    mint_location: { type: 'string' },
    production_type: { type: 'string' },
    design_variation: { type: 'string' },
    design_variation_details: { type: 'string' },
    grading_company: { type: 'string' },
    grade: { type: 'string' },
    certification_number: { type: 'string' },
    special_designation: { type: 'string' },
    autographed: { type: 'string' },
    autographed_by: { type: 'string' },
    designer: { type: 'string' },
    special_label: { type: 'string' },
    pedigree: { type: 'string' },
    series_name: { type: 'string' },
    metal_fineness: { type: 'string' },
    weight: { type: 'string' },
    design_details: { type: 'string' },
    title_for_ui: { type: 'string' },
    fact_description: { type: 'string' },
    country: { type: 'string' },
  }),
};

const comicSchema = {
  name: 'ComicPayload',
  schema: buildSchema({
    category: { type: 'string' },
    year: { type: 'string' },
    publisher: { type: 'string' },
    comic_title: { type: 'string' },
    comic_issue_number: { type: 'string' },
    variant: { type: 'string' },
    first_appearance: { type: 'string' },
    grading_company: { type: 'string' },
    grade: { type: 'string' },
    certification_number: { type: 'string' },
    title_for_ui: { type: 'string' },
    fact_description: { type: 'string' },
    country: { type: 'string' },
  }),
};

/* ---------------- GPT-4.5 Web Search Price Schema ---------------- */
const priceSchema = {
  name: 'PriceEstimate',
  schema: buildSchema({
    price_usd: { type: 'number' },
    price_range_low: { type: 'number' },
    price_range_high: { type: 'number' },
    confidence: { type: 'string' },
    source_summary: { type: 'string' },
  }),
};

/* ---------------- Prompts ---------------- */
const CARD_PROMPT = `Read a graded or raw trading card image. Prefer slab label when present. If unknown, leave empty. DO NOT estimate price. Return strict JSON per schema; no explanations.`;

const COIN_PROMPT = `Read a coin/medal slab image. Extract ALL visible information from the label.

CRITICAL INSTRUCTIONS:
1. coin_product_name: SPECIFIC coin/medal name - CRITICAL EXAMPLES:
   - Label "American Liberty Series 2025 P Silver 1oz Medal" → coin_product_name="American Liberty Medal"
   - Label "2023 Peace $1" → coin_product_name="Peace Dollar"
   - Label "American Silver Eagle" → coin_product_name="American Silver Eagle"
   - Label "Morgan Dollar" → coin_product_name="Morgan Dollar"
   - NEVER use generic terms like "Silver Coin", "Gold Coin", "Medal" alone
   - If series name present, derive product name from series (e.g., "American Liberty Series" → "American Liberty Medal")
2. coins_type: Material/category ONLY (e.g., "Silver", "Gold", "Copper", "Platinum") - NOT the product name
3. year_displayed: Exact year text from coin (may include ranges like "1776-1976" or single year "2023")
4. mint_mark: ONLY single letter mint marks (P, D, S, W, CC, O). Leave empty if not present.
5. mint_location: Full mint description if shown (e.g., "Struck at Philadelphia", "West Point")
6. production_type: Extract grade prefix (MS, PF, PR, SP, PL, DMPL) - e.g., "MS 70" → production_type="MS"
7. grade: FULL grade text including prefix (e.g., "MS 70", "PF 70 ULTRA CAMEO", "PR 70DCAM")
8. special_designation: First Day of Issue, Early Releases, First Strike, First Releases, etc.
9. autographed: "yes" or "no" (look for "Authentic Hand-Signed")
10. autographed_by: Name of signer if autographed (e.g., "Joel Iskowitz", "Ron Harrigal")
11. designer: Coin designer name if shown
12. special_label: Any special labels (e.g., "Master Coin Designer", "Ultra Cameo", "Deep Cameo", "High Relief", "US Mint Director of Design and Engraving Ret.")
13. pedigree: Special collections or pedigrees mentioned
14. series_name: Series if mentioned (e.g., "American Liberty Series", "America the Beautiful")
15. metal_fineness: Metal purity if shown (e.g., ".999 Fine", ".9999", "24K")
16. weight: Weight if shown (e.g., "1oz", "5oz", "1/10oz")
17. design_details: Special design features (e.g., "High Relief", "X-Ray Ag", "with Star Privy", "Mummy - X-Ray Ag")
18. design_variation: Main design type (e.g., "Type 1", "Type 2")
19. design_variation_details: Detailed variety info (VAM numbers, overdates, etc.)
20. denomination: Face value (e.g., "$1", "$5", "50¢", "1oz Medal")
21. country: Issuing country (e.g., "United States", "Cook Islands")
22. title_for_ui: Build a complete title combining key elements:
   - Format: "[Year] [Coin Product Name] [Denomination] [(Mint Mark)] — [Grading Company] [Grade]"
   - Example: "2025 American Liberty Medal 1oz (P) — NGC PF 70 ULTRA CAMEO"
   - Example: "2023 Peace Dollar $1 — NGC MS 70"
   - Use coin_product_name (not coins_type) in title
   - Include special_designation if significant (e.g., "First Day of Issue")

IMPORTANT PARSING RULES:
- For coin_product_name: If series_name is present (e.g., "American Liberty Series"), derive product name from it (e.g., "American Liberty Medal")
- For grade: Include EVERYTHING on the grade line (e.g., "PF 70 ULTRA CAMEO" not just "PF 70")
- For special_label: Capture multi-line special labels fully
- For design_details: Capture descriptive elements like "High Relief", "X-Ray", "with Star Privy"
- For mint_location: Look for "Struck at..." text separate from mint mark
- For series_name: Look for "Series" text at top of label
- Do NOT estimate price.
- Return strict JSON per schema; no explanations.`;


const COMIC_PROMPT = `Read a graded comic image. Prefer label. If unknown, leave empty. DO NOT estimate price. Return strict JSON per schema; no explanations.`;

/* ---------------- OpenAI Helper ---------------- */
async function uriToDataUrl(uri: string) {
  if (uri.startsWith('data:')) return uri;
  if (Platform.OS !== 'web') {
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
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

async function callOpenAIJSONSchema(
  dataUrl: string,
  schema: { name: string; schema: any },
  prompt: string,
  signal?: AbortSignal
): Promise<any> {
  const mock = !OPENAI_KEY || OPENAI_KEY.includes('__placeholder__');
  if (mock) {
    await new Promise(r => setTimeout(r, 900));
    if (schema.name === 'CardPayload')
      return {
        category: 'Card',
        year: '1999',
        set: 'Base Set',
        card_number: '4',
        brand: 'Pokemon',
        character: 'Charizard',
        genre: 'Pokemon',
        grading_company: 'PSA',
        grade: '10',
        certification_number: '12345678',
        variation_details: 'Holo',
        title_for_ui: '1999 Pokémon Base Set #4 Charizard — PSA 10',
        fact_description: 'Iconic first edition Charizard',
        country: 'Japan',
      };
    if (schema.name === 'CoinPayload')
      return {
        category: 'Coin',
        year_displayed: '2022',
        denomination: '$1',
        mint_mark: 'W',
        coins_type: 'Silver',
        coin_product_name: 'American Silver Eagle',
        grading_company: 'NGC',
        grade: '70',
        certification_number: '67890123',
        title_for_ui: '2022 American Silver Eagle $1 (W) — NGC MS 70',
        fact_description: 'Perfect grade American Silver Eagle',
        country: 'United States',
      };
    return {
      category: 'Comic',
      year: '1963',
      publisher: 'Marvel',
      comic_title: 'X-Men',
      comic_issue_number: '1',
      grading_company: 'CGC',
      grade: '8.0',
      certification_number: '55566677',
      title_for_ui: '1963 Marvel X-Men #1 — CGC 8.0',
      fact_description: 'First appearance of the X-Men',
      country: 'United States',
    };
  }

  const payload = {
    model: 'gpt-4o-mini',
    temperature: 0,
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: prompt },
          { type: 'input_image', image_url: dataUrl },
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: schema.name,
        schema: schema.schema,
        strict: true,
      },
    },
    max_output_tokens: 700,
  };

  const resp = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!resp.ok) throw new Error(`OpenAI HTTP ${resp.status}: ${await resp.text()}`);
  const json = await resp.json();
  const text =
    json?.output_text ??
    (Array.isArray(json?.output?.[0]?.content)
      ? json.output[0].content.find((p: any) => p?.type === 'output_text' || p?.text)?.text
      : null);
  if (!text) throw new Error('No JSON returned');
  const cleaned = text.trim().startsWith('```')
    ? text.replace(/^```(?:json)?\s*|\s*```$/g, '')
    : text;
  return JSON.parse(cleaned);
}

/* ---------------- GPT-5.1 Web Search Price Fetcher ---------------- */
async function fetchPriceWithGPT51(
  itemDescription: string,
  signal?: AbortSignal
): Promise<{ price_usd: number; price_range_low: number; price_range_high: number; confidence: string; source_summary: string }> {
  const mock = !OPENAI_KEY || OPENAI_KEY.includes('__placeholder__');
  
  if (mock) {
    await new Promise(r => setTimeout(r, 1200));
    return {
      price_usd: 150,
      price_range_low: 120,
      price_range_high: 180,
      confidence: 'high',
      source_summary: 'Mock data from recent sales',
    };
  }

  const prompt = `Search the web for current market prices of: ${itemDescription}

INSTRUCTIONS:
- Find recent sales and listings
- Calculate average from typical price range
- Return ONE number as price_usd (the average/mid-point)
- Include price_range_low and price_range_high
- Set confidence: "high", "medium", or "low"
- Provide brief source_summary (max 100 chars)
- Be token-efficient
- Return only JSON, no explanation`;

  const payload = {
    model: 'gpt-5.1',
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: priceSchema.name,
        schema: priceSchema.schema,
        strict: true,
      },
    },
    max_completion_tokens: 300,
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!resp.ok) throw new Error(`OpenAI HTTP ${resp.status}: ${await resp.text()}`);
  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No price data returned');
  
  const cleaned = content.trim().startsWith('```')
    ? content.replace(/^```(?:json)?\s*|\s*```$/g, '')
    : content;
  
  return JSON.parse(cleaned);
}

/* ---------------- Post-Processing Utilities (exported for item-details) ---------------- */
export function normalizeParallelVariant(...texts: (string | undefined)[]): string {
  const raw = (texts.filter(Boolean).join(' • ') || '').trim();
  if (!raw) return '';

  const editionOrder = [
    { re: /\b1st\s*edition\b/i, label: '1st Edition' },
    { re: /\bfirst\s*edition\b/i, label: '1st Edition' },
    { re: /\bshadowless\b/i, label: 'Shadowless' },
    { re: /\bunlimited\b/i, label: 'Unlimited' },
    { re: /\blimited\s*edition\b/i, label: 'Limited Edition' },
  ];

  const finishOrder = [
    { re: /\breverse\s*holo\b/i, label: 'Reverse Holo' },
    { re: /\bholo\b/i, label: 'Holo' },
    { re: /\bmirror\b/i, label: 'Mirror' },
    { re: /\brefractor\b/i, label: 'Refractor' },
    { re: /\bprizm\b/i, label: 'Prizm' },
    { re: /\bfull\s*art\b/i, label: 'Full Art' },
    { re: /\brainbow\b/i, label: 'Rainbow' },
    { re: /\bhyper\s*rare\b/i, label: 'Hyper Rare' },
    { re: /\bsecret\s*rare\b/i, label: 'Secret Rare' },
    { re: /\bultra\s*rare\b/i, label: 'Ultra Rare' },
    { re: /\bserial\b/i, label: 'Serial Numbered' },
    { re: /\b\d+\s*\/\s*\d+\b/i, label: 'Serial Numbered' },
  ];

  const editions: string[] = [];
  const finishes: string[] = [];
  const seen = new Set<string>();

  const tryPush = (label: string, bucket: string[]) => {
    const clean = label.trim();
    if (!seen.has(clean)) {
      seen.add(clean);
      bucket.push(clean);
    }
  };

  for (const pat of editionOrder) {
    if (pat.re.test(raw)) tryPush(pat.label, editions);
  }
  for (const pat of finishOrder) {
    if (pat.re.test(raw)) tryPush(pat.label, finishes);
  }

  if (editions.length === 0 && finishes.length === 0) {
    return raw
      .split(/[,\uFF0C]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(', ');
  }

  return [...editions, ...finishes].join(', ');
}

export function deriveMintDesignation(ai: AIAnalysisResult | null): string {
  if (!ai) return '';
  const q = (ai.qualifier || '').toString().trim();
  if (q) return q;

  const g = (ai.grade || '').toString().toUpperCase().trim();
  if (!g) return '';

  const designations = [
    'GEM MINT',
    'NM-MT',
    'EX-MT',
    'MINT',
    'AUTHENTIC',
    'NM',
    'EX',
    'VG-EX',
    'VG',
    'GOOD',
    'FAIR',
    'PR',
  ];

  for (const k of designations) {
    if (g.includes(k)) return k;
  }

  const tail = g.replace(/^\d+(\.\d+)?\s*/, '').trim();
  if (tail && /[A-Z]/.test(tail)) return tail;

  return '';
}

export function buildFallbackDescription(
  cat: CurioCategory,
  ai: AIAnalysisResult | null
): string {
  if (!ai) return '';

  if (cat === 'Card') {
    const bits: string[] = [];
    if (ai.title_for_ui) bits.push(ai.title_for_ui);
    const setLine = [ai.set, ai.card_number && `#${ai.card_number}`]
      .filter(Boolean)
      .join(' ');
    if (setLine) bits.push(setLine);
    const gradeLine = [ai.grading_company, ai.grade].filter(Boolean).join(' ');
    const head = [bits.filter(Boolean).join(' — '), gradeLine]
      .filter(Boolean)
      .join(' — ');
    const tail = [ai.tcg_category, ai.country].filter(Boolean).join(' • ');
    return [head, tail].filter(Boolean).join(' • ');
  }

  if (cat === 'Coin') {
    const head = [
      ai.coin_product_name || ai.coins_type,
      ai.year_displayed,
      ai.mint_mark && `(${ai.mint_mark})`,
    ]
      .filter(Boolean)
      .join(' ');
    const grade = [ai.grading_company, ai.grade].filter(Boolean).join(' ');
    const cert = ai.certification_number ? `Cert ${ai.certification_number}` : '';
    return [head, grade, cert].filter(Boolean).join(' — ');
  }

  if (cat === 'Comic') {
    const head = [
      ai.publisher,
      ai.comic_title,
      ai.comic_issue_number && `#${ai.comic_issue_number}`,
    ]
      .filter(Boolean)
      .join(' ');
    const grade = [ai.grading_company, ai.grade].filter(Boolean).join(' ');
    const cert = ai.certification_number ? `Cert ${ai.certification_number}` : '';
    return [head, grade, cert].filter(Boolean).join(' — ');
  }

  return '';
}

/* ---------------- Helper to build description for pricing ---------------- */
function buildPriceQueryDescription(input: PriceInput): string {
  const parts: string[] = [];
  
  if (input.category === 'Coin') {
    if (input.yearDisplayed) parts.push(input.yearDisplayed);
    if (input.coinName) parts.push(input.coinName);
    if (input.seriesName) parts.push(input.seriesName);
    if (input.denomination) parts.push(input.denomination);
    if (input.weight) parts.push(input.weight);
    if (input.metalFineness) parts.push(input.metalFineness);
    if (input.mintMark) parts.push(`(${input.mintMark})`);
    if (input.mintLocation) parts.push(input.mintLocation);
    if (input.gradingCompany && input.grade) {
      parts.push(`${input.gradingCompany} ${input.grade}`);
    }
    if (input.specialDesignation) parts.push(input.specialDesignation);
    if (input.designDetails) parts.push(input.designDetails);
    if (input.designer) parts.push(`Designer: ${input.designer}`);
    if (input.specialLabel) parts.push(input.specialLabel);
    if (input.strikeType) parts.push(input.strikeType);
    if (input.designation) parts.push(input.designation);
    if (input.variety) parts.push(input.variety);
    if (input.pedigree) parts.push(input.pedigree);
  } else if (input.category === 'Comic') {
    if (input.yearOfPublication) parts.push(input.yearOfPublication);
    if (input.publisher) parts.push(input.publisher);
    if (input.seriesTitle) parts.push(input.seriesTitle);
    if (input.issueNumber) parts.push(`#${input.issueNumber}`);
    if (input.variantEdition) parts.push(input.variantEdition);
    if (input.gradingCompany && input.grade) {
      parts.push(`${input.gradingCompany} ${input.grade}`);
    }
  }
  
  return parts.filter(Boolean).join(' ');
}

/* ---------------- Component ---------------- */

const CurioAIAnalyzer = forwardRef<CurioAIAnalyzerHandle, CurioAIAnalyzerProps>(
  ({ onPriceResult, onLogsUpdate, accent = '#D4AF37', text = '#0E1A2A', surface = '#FFFFFF', border = '#E5E7EB' }, ref) => {
    const [loading, setLoading] = useState(false);
    const [priceModalVisible, setPriceModalVisible] = useState(false);
    const [priceProgress, setPriceProgress] = useState('');
    
    // Use PriceFetcher for Cards only
    const priceFetcherRef = useRef<PriceFetcherHandle>(null);
    
    // Internal logs
    const [internalLogs, setInternalLogs] = useState<DebugLog[]>([]);
    
    const addLog = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
      setInternalLogs(prev => {
        const newLogs = [...prev, { timestamp: Date.now(), level, message, data }];
        if (onLogsUpdate) onLogsUpdate(newLogs);
        return newLogs;
      });
    };

    useImperativeHandle(ref, () => ({
      analyzeImage: async (category: CurioCategory, imageUri: string, signal?: AbortSignal) => {
        addLog('info', 'Starting AI image analysis', { category });
        
        try {
          const dataUrl = await uriToDataUrl(imageUri);
          addLog('info', 'Image converted to data URL');
          
          let result: AIAnalysisResult;
          
          if (category === 'Card') {
            result = await callOpenAIJSONSchema(dataUrl, cardSchema, CARD_PROMPT, signal);
          } else if (category === 'Coin') {
            result = await callOpenAIJSONSchema(dataUrl, coinSchema, COIN_PROMPT, signal);
          } else if (category === 'Comic') {
            result = await callOpenAIJSONSchema(dataUrl, comicSchema, COMIC_PROMPT, signal);
          } else {
            throw new Error(`Unsupported category: ${category}`);
          }
          
          addLog('info', 'AI analysis completed', { 
            title: result.title_for_ui,
            category: result.category 
          });
          
          return result;
        } catch (err: any) {
          addLog('error', 'AI analysis failed', { error: err?.message });
          throw err;
        }
      },
      
      fetchPrice: async (input: PriceInput) => {
        addLog('info', 'Price fetch requested', { category: input.category });
        
        // Cards use PriceCharting API via PriceFetcher
        if (input.category === 'Card') {
          addLog('info', 'Using PriceCharting for card pricing');
          const pfInput: PFPriceInput = {
            category: input.category,
            gradingCompany: input.gradingCompany,
            grade: input.grade,
            certificationNumber: input.certificationNumber,
            year: input.year,
            setSeries: input.setSeries,
            cardNumber: input.cardNumber,
            cardName: input.cardName,
            parallelVariant: input.parallelVariant,
          };
          priceFetcherRef.current?.run(pfInput);
          return;
        }
        
        // Coins and Comics use GPT-5.1 web search
        if (input.category === 'Coin' || input.category === 'Comic') {
          try {
            setPriceModalVisible(true);
            setPriceProgress('Searching web for current prices...');
            addLog('info', `Using GPT-5.1 web search for ${input.category.toLowerCase()} pricing`);
            
            const description = buildPriceQueryDescription(input);
            addLog('info', 'Price query description', { description });
            
            setPriceProgress('Analyzing market data...');
            const priceData = await fetchPriceWithGPT51(description);
            
            addLog('info', 'GPT-5.1 price fetch completed', { 
              price: priceData.price_usd,
              confidence: priceData.confidence 
            });
            
            setPriceModalVisible(false);
            
            if (onPriceResult) {
              onPriceResult({
                price_low: priceData.price_range_low,
                price_mid: priceData.price_usd,
                price_high: priceData.price_range_high,
                confidence: priceData.confidence === 'high' ? 0.9 : priceData.confidence === 'medium' ? 0.7 : 0.5,
                currency: 'USD',
                source: 'GPT-5.1 Web Search',
                notes: priceData.source_summary,
              });
            }
          } catch (err: any) {
            setPriceModalVisible(false);
            addLog('error', 'GPT-5.1 price fetch failed', { error: err?.message });
            
            // Return fallback result
            if (onPriceResult) {
              onPriceResult({
                price_low: 0,
                price_mid: 0,
                price_high: 0,
                confidence: 0,
                currency: 'USD',
                source: 'Error',
                notes: 'Could not fetch price',
              });
            }
          }
          return;
        }
        
        // Other categories - no pricing
        addLog('warn', 'No pricing available for category', { category: input.category });
      },
    }));

    // Handle price results from PriceFetcher (Cards only)
    const handlePriceResult = (result: PFPriceResult) => {
      addLog('info', 'PriceCharting price fetched', { 
        price: result.price_mid,
        confidence: result.confidence 
      });
      
      if (onPriceResult) {
        onPriceResult({
          price_low: result.price_low,
          price_mid: result.price_mid,
          price_high: result.price_high,
          confidence: result.confidence,
          currency: result.currency,
          notes: result.notes,
          source: 'PriceCharting',
        });
      }
    };

    // Merge logs from PriceFetcher
    const handleLogsUpdate = (logs: PFDebugLog[]) => {
      const mergedLogs = [...internalLogs, ...logs];
      if (onLogsUpdate) onLogsUpdate(mergedLogs);
    };

    const s = StyleSheet.create({
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
      },
      modalCard: {
        width: '86%',
        backgroundColor: surface,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: border,
        alignItems: 'center',
      },
      modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: text,
        marginBottom: 16,
        textAlign: 'center',
      },
      modalProgress: {
        fontSize: 14,
        color: text,
        marginTop: 12,
        textAlign: 'center',
        opacity: 0.7,
      },
    });

    return (
      <>
        {/* Mount PriceFetcher invisibly for Cards */}
        <PriceFetcher
          ref={priceFetcherRef}
          onPrice={handlePriceResult}
          onLogsUpdate={handleLogsUpdate}
          accent={accent}
          text={text}
          surface={surface}
          border={border}
        />
        
        {/* GPT-4.5 Price Fetching Modal */}
        <Modal
          visible={priceModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPriceModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>Fetching Price...</Text>
              <ActivityIndicator size="large" color={accent} />
              <Text style={s.modalProgress}>{priceProgress}</Text>
            </View>
          </View>
        </Modal>
      </>
    );
  }
);

export default CurioAIAnalyzer;