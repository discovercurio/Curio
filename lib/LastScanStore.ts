// lib/LastScanStore.ts
export type CurioCategory = 'Card' | 'Coin' | 'Comic' | 'Other';

export type AICommon = {
  title_for_ui?: string;
  estimated_value_usd?: number;
  grading_company?: string;
  grade?: string;
  certification_number?: string;
  country?: string;
};

export type AICard = AICommon & {
  category?: string;
  year?: string;
  set?: string;
  card_number?: string;
  brand?: string;
  character?: string;
  genre?: string;
  artist_illustrator?: string;
  manufacturer?: string;
  product_type?: string;
  tcg_category?: string;
  tcg_card_type?: string;
  tcg_attributes?: string;
  franchise?: string;
  material?: string;
  language?: string;
  rarity?: string;
  tcg_edition?: string;
  length_in?: string;
  width_in?: string;
  variation_details?: string;
  color?: string;
  autographed?: string;
  auto_grade?: string;
  qualifier?: string;       // aka mint designation label / qualifier
  tcg_ink?: string;
  error_card?: string;
};

export type AICoin = AICommon & {
  category?: string;
  coins_type?: string;
  denomination?: string;
  currency?: string;
  year_displayed?: string;
  mint_mark?: string;
  obverse_description?: string;
  obverse_creator?: string;
  reverse_description?: string;
  reverse_creator?: string;
  edge_type?: string;
  production_type?: string;
  material?: string;
  shape?: string;
  brand?: string;
  person?: string;
  coins_topic_theme?: string;
  mint_or_press?: string;
  design_variation?: string; // designation
  design_variation_details?: string; // variety
  alignment?: string;
  obverse_objects?: string;
  reverse_objects?: string;
  start_end_year?: string;
  coin_product_name?: string;
};

export type AIComic = AICommon & {
  category?: string;
  year?: string;
  comic_issue_number?: string;
  publisher?: string;
  character?: string;
  genre?: string;
  comic_title?: string;
  franchise?: string;
  language?: string;
  brand?: string;
  artist_illustrator?: string;
  writer_author?: string;
  penciller?: string;
  inker?: string;
  letterer?: string;
  number_of_pages?: string;
  variation_details?: string;
  variant?: string;
  team_name?: string;
  first_appearance?: string;
  story_arc?: string;
  person_creator?: string;
  material?: string;
  autographed?: string;
  autographed_by?: string;
  auto_grade?: string;
};

export type LastScanPayload =
  | { category: 'Card'; imageUri: string; ai: AICard }
  | { category: 'Coin'; imageUri: string; ai: AICoin }
  | { category: 'Comic'; imageUri: string; ai: AIComic }
  | { category: 'Other'; imageUri: string; ai: Record<string, any> };

let _scan: LastScanPayload | null = null;

export const LastScanStore = {
  set(v: LastScanPayload) { _scan = v; },
  get(): LastScanPayload | null { return _scan; },
  clear() { _scan = null; },
};
