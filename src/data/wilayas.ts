import rawWilayas from './wilayasData.json';

export interface CommuneDeliveryOption {
  available: boolean;
  fee_da: number | null;
  desk_info?: string | null;
}

export interface Commune {
  commune_id: number;
  commune_name: string;
  domicile: CommuneDeliveryOption;
  stop_desk: CommuneDeliveryOption;
}

export interface Wilaya {
  wilaya_id: number;
  wilaya_name: string;
  has_stop_desk_service: boolean;
  total_communes: number;
  communes: Commune[];
}

export const wilayas: Wilaya[] = rawWilayas as Wilaya[];

// 58 Algerian Wilayas Arabic Names Map
export const WILAYA_ARABIC_NAMES: Record<number, string> = {
  1: 'أدرار',
  2: 'الشلف',
  3: 'الأغواط',
  4: 'أم البواقي',
  5: 'باتنة',
  6: 'بجاية',
  7: 'بسكرة',
  8: 'بشار',
  9: 'البليدة',
  10: 'البويرة',
  11: 'تمنراست',
  12: 'تبسة',
  13: 'تلمسان',
  14: 'تيارت',
  15: 'تيزي وزو',
  16: 'الجزائر',
  17: 'الجلفة',
  18: 'جيجل',
  19: 'سطيف',
  20: 'سعيدة',
  21: 'سكيكدة',
  22: 'سيدي بلعباس',
  23: 'عنابة',
  24: 'قالمة',
  25: 'قسنطينة',
  26: 'المدية',
  27: 'مستغانم',
  28: 'المسيلة',
  29: 'معسكر',
  30: 'ورقلة',
  31: 'وهران',
  32: 'البيض',
  33: 'إليزي',
  34: 'برج بوعريريج',
  35: 'بومرداس',
  36: 'الطارف',
  37: 'تندوف',
  38: 'تيسمسيلت',
  39: 'الوادي',
  40: 'خنشلة',
  41: 'سوق أهراس',
  42: 'تيبازة',
  43: 'ميلة',
  44: 'عين الدفلى',
  45: 'النعامة',
  46: 'عين تموشنت',
  47: 'غرداية',
  48: 'غليزان',
  49: 'تيميمون',
  50: 'برج باجي مختار',
  51: 'أولاد جلال',
  52: 'بني عباس',
  53: 'عين صالح',
  54: 'عين قزام',
  55: 'تقرت',
  56: 'جانت',
  57: 'المغير',
  58: 'المنيعة'
};

export function getWilayaById(id: number): Wilaya | undefined {
  return wilayas.find(w => w.wilaya_id === id);
}

export function getWilayaArabicName(id: number): string {
  return WILAYA_ARABIC_NAMES[id] || '';
}

export function getWilayaDisplayName(wilaya: Wilaya): string {
  const code = wilaya.wilaya_id < 10 ? `0${wilaya.wilaya_id}` : `${wilaya.wilaya_id}`;
  const arName = WILAYA_ARABIC_NAMES[wilaya.wilaya_id];
  if (arName) {
    return `${code} - ${arName} (${wilaya.wilaya_name})`;
  }
  return `${code} - ${wilaya.wilaya_name}`;
}

export function getAllCommunesForWilaya(id: number): Commune[] {
  const wilaya = getWilayaById(id);
  if (!wilaya || !wilaya.communes) return [];
  return [...wilaya.communes].sort((a, b) => a.commune_name.localeCompare(b.commune_name, undefined, { sensitivity: 'base' }));
}

// Communes where home delivery (domicile) is available
export function getDomicileCommunesForWilaya(id: number): Commune[] {
  const wilaya = getWilayaById(id);
  if (!wilaya || !wilaya.communes) return [];
  return wilaya.communes
    .filter(c => c.domicile && c.domicile.available)
    .sort((a, b) => a.commune_name.localeCompare(b.commune_name, undefined, { sensitivity: 'base' }));
}

// Communes where Stop Desk (bureau) is located
export function getDeskCommunesForWilaya(id: number): Commune[] {
  const wilaya = getWilayaById(id);
  if (!wilaya || !wilaya.communes) return [];
  return wilaya.communes
    .filter(c => c.stop_desk && c.stop_desk.available)
    .sort((a, b) => a.commune_name.localeCompare(b.commune_name, undefined, { sensitivity: 'base' }));
}

// Return only deliverable communes, cleanly sorted alphabetically
export function getDeliverableCommunesForWilaya(id: number): Commune[] {
  const wilaya = getWilayaById(id);
  if (!wilaya || !wilaya.communes) return [];
  return wilaya.communes
    .filter(c => (c.domicile && c.domicile.available) || (c.stop_desk && c.stop_desk.available))
    .sort((a, b) => a.commune_name.localeCompare(b.commune_name, undefined, { sensitivity: 'base' }));
}

export function getCommuneByName(wilayaId: number, communeName: string): Commune | undefined {
  const wilaya = getWilayaById(wilayaId);
  if (!wilaya || !wilaya.communes) return undefined;
  return wilaya.communes.find(c => c.commune_name.toLowerCase() === communeName.toLowerCase());
}

export function isStopDeskAvailableForWilaya(wilayaId: number): boolean {
  const wilaya = getWilayaById(wilayaId);
  if (!wilaya) return false;
  return Boolean(wilaya.has_stop_desk_service || wilaya.communes.some(c => c.stop_desk && c.stop_desk.available));
}

export const isStopDeskAvailable = isStopDeskAvailableForWilaya;

export function isStopDeskAvailableForCommune(wilayaId: number, communeName: string): boolean {
  const commune = getCommuneByName(wilayaId, communeName);
  return !!(commune && commune.stop_desk && commune.stop_desk.available);
}

export function isDomicileAvailableForCommune(wilayaId: number, communeName: string): boolean {
  const commune = getCommuneByName(wilayaId, communeName);
  return !!(commune && commune.domicile && commune.domicile.available);
}

export function getStopDeskFeeForWilaya(wilayaId: number): number {
  const wilaya = getWilayaById(wilayaId);
  if (!wilaya) return 450;
  const deskCommune = wilaya.communes.find(c => c.stop_desk && c.stop_desk.available && c.stop_desk.fee_da);
  return deskCommune?.stop_desk?.fee_da ?? 450;
}

export function getDomicileFeeForCommune(wilayaId: number, communeName?: string): number {
  const wilaya = getWilayaById(wilayaId);
  if (!wilaya) return 750;
  if (communeName) {
    const commune = getCommuneByName(wilayaId, communeName);
    if (commune && commune.domicile && commune.domicile.available && commune.domicile.fee_da) {
      return commune.domicile.fee_da;
    }
  }
  const domCommune = wilaya.communes.find(c => c.domicile && c.domicile.available && c.domicile.fee_da);
  return domCommune?.domicile?.fee_da ?? 750;
}

export function getDeliveryFee(
  wilayaId: number,
  deliveryType: 'desk' | 'domicile',
  communeName?: string
): number {
  if (deliveryType === 'desk') {
    return getStopDeskFeeForWilaya(wilayaId);
  }
  return getDomicileFeeForCommune(wilayaId, communeName);
}
