// lib/eventsFromSheet.ts
export const SHEET_CSV_URL =
  process.env.EXPO_PUBLIC_EVENTS_CSV_URL ||
  'https://docs.google.com/spreadsheets/d/1klK-ReImMigmOStP_j53XjfyFE5sh1g0-FqpKj8toXw/export?format=csv&gid=0';

export type RawRow = {
  show_type: string;
  event_name: string;
  start_date: string;
  end_date: string;
  city: string;
  state: string;
  venue: string;
  address: string;
  zip_code?: string;   // prefer this if present
  featured?: string;
};

export type ShowTypeLabel = 'Coin Show' | 'Comic Con' | 'Card Show' | 'Mixed';
export type ShowRow = {
  id: string;
  show_type: string;
  typeLabel: ShowTypeLabel;
  name: string;
  startDate: Date;
  endDate: Date | undefined;
  date: Date;
  city: string;
  state: string;
  venue: string;
  address: string;
  location: string;          // City, ST
  zip: string | null;        // 5-digit ZIP (from zip_code or parsed from address)
  distance: number | null;   // miles from user ZIP/city centroid
  expectedAttendees: number | null;
  featured: boolean;
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i+1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += ch;
      continue;
    }
    if (ch === '"') { inQ = true; continue; }
    if (ch === ',') { cur.push(field); field = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; continue; }
    field += ch;
  }
  cur.push(field);
  if (cur.length > 1 || (cur.length === 1 && cur[0].trim() !== '')) rows.push(cur);
  return rows;
}

const normHdr = (h: string) => h.trim().toLowerCase().replace(/\s+/g, '_');
const truthy = (v?: string | null) => !!v && ['true','yes','y','1'].includes(v.trim().toLowerCase());
const mapType = (t: string): ShowTypeLabel =>
  t.toLowerCase().includes('coin') ? 'Coin Show' :
  t.toLowerCase().includes('comic') ? 'Comic Con' :
  t.toLowerCase().includes('card') ? 'Card Show' : 'Mixed';

const normZip = (z?: string) => { if (!z) return null; const d = z.replace(/\D+/g,'').slice(0,5); return d.length===5? d : null; };
const extractZip = (addr: string) => { const m = addr.match(/\b(\d{5})(?:-\d{4})?\b/g); return m ? normZip(m[m.length-1]) : null; };
const makeId = (r: RawRow) => (`${r.event_name}-${r.start_date}-${r.city}-${r.state}`).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');

/** Strict, platform-safe date parser (no "today" fallback) */
function parseEventDate(input: string): Date | undefined {
  const s = (input || '').trim();
  if (!s) return undefined;

  // YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const year = +m[1];
    const month = +m[2] - 1;
    const day = +m[3];
    const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return isNaN(date.getTime()) ? undefined : date;
  }

  // ISO-ish (with time component)
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s.endsWith('Z') ? s : `${s}Z`);
    return isNaN(d.getTime()) ? undefined : d;
  }

  // "Nov 6, 2025" or "November 6, 2025"
  m = s.match(/([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) {
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const monthStr = m[1].slice(0, 3).toLowerCase();
    const mi = months.indexOf(monthStr);
    if (mi >= 0) {
      const year = +m[3];
      const day = +m[2];
      const date = new Date(Date.UTC(year, mi, day, 0, 0, 0, 0));
      return isNaN(date.getTime()) ? undefined : date;
    }
  }

  // MM/DD/YYYY
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const year = +m[3];
    const month = +m[1] - 1;
    const day = +m[2];
    const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return isNaN(date.getTime()) ? undefined : date;
  }

  // M/D/YYYY (single digit month/day)
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let year = +m[3];
    if (year < 100) year += 2000;
    const month = +m[1] - 1;
    const day = +m[2];
    const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return isNaN(date.getTime()) ? undefined : date;
  }

  // Last resort: try native parsing but force UTC interpretation
  // Only accept if it produces a valid date
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    // Extract components and recreate as UTC to avoid timezone issues
    const year = parsed.getFullYear();
    const month = parsed.getMonth();
    const day = parsed.getDate();
    const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return isNaN(utcDate.getTime()) ? undefined : utcDate;
  }

  return undefined;
}

function rowsToRawObjects(rows: string[][]): RawRow[] {
  if (!rows.length) return [];
  const header = rows[0].map(normHdr);
  const idx = (n: string) => header.indexOf(n);
  const i = {
    type: idx('show_type'), name: idx('event_name'), start: idx('start_date'), end: idx('end_date'),
    city: idx('city'), state: idx('state'), venue: idx('venue'), address: idx('address'),
    zip: idx('zip_code'), featured: idx('featured'),
  };
  const out: RawRow[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]; if (row.every(c => !String(c||'').trim())) continue;
    out.push({
      show_type: row[i.type] ?? '', event_name: row[i.name] ?? '',
      start_date: row[i.start] ?? '', end_date: row[i.end] ?? '',
      city: row[i.city] ?? '', state: row[i.state] ?? '',
      venue: row[i.venue] ?? '', address: row[i.address] ?? '',
      zip_code: i.zip >= 0 ? (row[i.zip] ?? '') : '',
      featured: i.featured >= 0 ? (row[i.featured] ?? '') : '',
    });
  }
  return out;
}

function hydrate(raw: RawRow): ShowRow {
  const addr = (raw.address || '').trim();
  const zip = normZip(raw.zip_code) || extractZip(addr);

  const start = parseEventDate(raw.start_date);
  const end = parseEventDate(raw.end_date || '');

  if (__DEV__ && start && !isNaN(start.getTime())) {
    console.log(`[hydrate] Parsed dates for "${raw.event_name}": start=${raw.start_date} -> ${start.toISOString()}, end=${raw.end_date} -> ${end?.toISOString() || 'none'}`);
  }

  const startSafe = start ?? new Date(NaN);
  const endSafe = end;

  return {
    id: makeId(raw),
    show_type: raw.show_type,
    typeLabel: mapType(raw.show_type),
    name: raw.event_name,
    startDate: startSafe,
    endDate: endSafe,
    date: startSafe,
    city: raw.city,
    state: raw.state,
    venue: raw.venue,
    address: addr,
    location: `${raw.city}${raw.city && raw.state ? ', ' : ''}${raw.state}`.trim(),
    zip,
    distance: null,
    expectedAttendees: null,
    featured: truthy(raw.featured),
  };
}

/** Haversine (miles) */
function haversineMiles(lat1:number,lon1:number,lat2:number,lon2:number){
  const R=3958.7613, toRad=(d:number)=>(d*Math.PI)/180;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
}

type ZipMap = Record<string,{lat:number;lon:number;c?:string;s?:string}>;

function buildCityIndex(zipMap: ZipMap){
  const sums = new Map<string,{lat:number;lon:number;count:number}>();
  for (const z in zipMap){
    const rec = zipMap[z];
    if (!rec?.c || !rec?.s) continue;
    const key = `${rec.c},${rec.s}`.toUpperCase();
    const cur = sums.get(key) || {lat:0,lon:0,count:0};
    cur.lat += rec.lat; cur.lon += rec.lon; cur.count += 1;
    sums.set(key, cur);
  }
  const out = new Map<string,{lat:number;lon:number}>();
  for (const [k,v] of sums){
    out.set(k, { lat: v.lat / v.count, lon: v.lon / v.count });
  }
  return out;
}

const _cityIndexCache = new WeakMap<object, Map<string,{lat:number;lon:number}>>();
function getCityIndex(zipMap: ZipMap){
  if (_cityIndexCache.has(zipMap as any)) return _cityIndexCache.get(zipMap as any)!;
  const idx = buildCityIndex(zipMap);
  _cityIndexCache.set(zipMap as any, idx);
  return idx;
}

export function withDistances(rows: ShowRow[], userZip: string, zipMap: ZipMap): ShowRow[] {
  const user = zipMap[userZip];
  if (!user) return rows.map(r => ({...r, distance: null}));

  const cityIdx = getCityIndex(zipMap);

  return rows.map(r => {
    if (r.zip && zipMap[r.zip]) {
      const z = zipMap[r.zip];
      return { ...r, distance: haversineMiles(user.lat, user.lon, z.lat, z.lon) };
    }
    const key = `${(r.city||'').trim()},${(r.state||'').trim()}`.toUpperCase();
    const centroid = cityIdx.get(key);
    if (centroid) {
      return { ...r, distance: haversineMiles(user.lat, user.lon, centroid.lat, centroid.lon) };
    }
    return { ...r, distance: null };
  });
}

export async function fetchShowsFromSheet(): Promise<ShowRow[]> {
  if (!SHEET_CSV_URL || SHEET_CSV_URL.startsWith('<PASTE'))
    throw new Error('Missing SHEET_CSV_URL. Set EXPO_PUBLIC_EVENTS_CSV_URL or paste your CSV URL.');
  const res = await fetch(SHEET_CSV_URL);
  if (!res.ok) throw new Error(`Sheet HTTP ${res.status}`);
  const text = await res.text();
  const raw = rowsToRawObjects(parseCsv(text));
  const hydrated = raw.map(hydrate);
  if (__DEV__) {
    const withZip = hydrated.filter(h=>!!h.zip).length;
    console.log(`[eventsFromSheet] loaded ${hydrated.length}; ${withZip} have ZIPs`);
  }
  return hydrated;
}
