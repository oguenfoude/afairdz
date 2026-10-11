'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';
import SaveBar from '@/components/admin/SaveBar';
import Toast from '@/components/admin/Toast';

interface FeeOverride {
  wilayaId: number;
  communeId?: number;
  home?: number;
  office?: number;
}

const WILAYAS = [
  { id: 1, name: 'أدرار' }, { id: 2, name: 'الشلف' }, { id: 3, name: 'الأغواط' },
  { id: 4, name: 'أم البواقي' }, { id: 5, name: 'باتنة' }, { id: 6, name: 'بجاية' },
  { id: 7, name: 'بسكرة' }, { id: 8, name: 'بشار' }, { id: 9, name: 'البليدة' },
  { id: 10, name: 'البويرة' }, { id: 11, name: 'تمنراست' }, { id: 12, name: 'تبسة' },
  { id: 13, name: 'تلمسان' }, { id: 14, name: 'تيارت' }, { id: 15, name: 'تيزي وزو' },
  { id: 16, name: 'الجزائر' }, { id: 17, name: 'الجلفة' }, { id: 18, name: 'جيجل' },
  { id: 19, name: 'سطيف' }, { id: 20, name: 'سعيدة' }, { id: 21, name: 'سكيكدة' },
  { id: 22, name: 'سيدي بلعباس' }, { id: 23, name: 'عنابة' }, { id: 24, name: 'قالمة' },
  { id: 25, name: 'قسنطينة' }, { id: 26, name: 'المدية' }, { id: 27, name: 'مستغانم' },
  { id: 28, name: 'المسيلة' }, { id: 29, name: 'معسكر' }, { id: 30, name: 'ورقلة' },
  { id: 31, name: 'وهران' }, { id: 32, name: 'البيض' }, { id: 33, name: 'إليزي' },
  { id: 34, name: 'برج بوعريريج' }, { id: 35, name: 'بومرداس' }, { id: 36, name: 'الطارف' },
  { id: 37, name: 'تندوف' }, { id: 38, name: 'تيسمسيلت' }, { id: 39, name: 'الوادي' },
  { id: 40, name: 'خنشلة' }, { id: 41, name: 'سوق أهراس' }, { id: 42, name: 'تيبازة' },
  { id: 43, name: 'ميلة' }, { id: 44, name: 'عين الدفلى' }, { id: 45, name: 'عين تموشنت' },
  { id: 46, name: 'غرداية' }, { id: 47, name: 'غليزان' }, { id: 48, name: 'تيميمون' },
  { id: 49, name: 'برج باجي مختار' }, { id: 50, name: 'أولاد جلال' }, { id: 51, name: 'بني عباس' },
  { id: 52, name: 'عين صالح' }, { id: 53, name: 'عين قزام' }, { id: 54, name: 'تقرت' },
  { id: 55, name: 'جانت' }, { id: 56, name: 'المغير' }, { id: 57, name: 'المنيعة' }, { id: 58, name: 'أولاد سي سليمان' },
];

export default function AdminShipping() {
  const [overrides, setOverrides] = useState<FeeOverride[]>([]);
  const [initial, setInitial] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState<number>(1);
  const [search, setSearch] = useState('');

  const dirty = initial !== '' && JSON.stringify(overrides) !== initial;

  const fetchOverrides = async () => {
    try {
      const res = await adminFetch('/api/admin/shipping');
      if (res.ok) {
        const data = await res.json();
        setOverrides(data);
        setInitial(JSON.stringify(data));
      }
    } catch {
      setError('فشل التحميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOverrides(); }, []);

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await adminFetch('/api/admin/shipping', {
        method: 'PUT',
        body: JSON.stringify(overrides),
      });
      if (res.ok) {
        setInitial(JSON.stringify(overrides));
        setSuccess('تم الحفظ بنجاح — رسوم التوصيل تحدثت في المتجر');
      } else {
        setError('فشل الحفظ');
      }
    } catch {
      setError('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    try { setOverrides(JSON.parse(initial)); }
    catch { fetchOverrides(); }
  };

  // Local staged edit (no auto-PATCH): SaveBar commits everything at once
  const setWilayaFee = (field: 'home' | 'office', value: string) => {
    const val = value === '' ? undefined : parseInt(value, 10);
    if (value !== '' && (val === undefined || isNaN(val))) return;
    const rest = overrides.filter(o => !(o.wilayaId === selectedWilaya && !o.communeId));
    const cur = overrides.find(o => o.wilayaId === selectedWilaya && !o.communeId);
    const next: FeeOverride = { wilayaId: selectedWilaya, home: cur?.home, office: cur?.office, [field]: val };
    if (next.home === undefined && next.office === undefined) {
      setOverrides(rest);
    } else {
      setOverrides([...rest, next]);
    }
  };

  const setCommuneFee = (communeId: number, field: 'home' | 'office', value: string) => {
    if (value === '') {
      const cur = overrides.find(o => o.wilayaId === selectedWilaya && o.communeId === communeId);
      if (!cur) return;
      const next = { ...cur, [field]: undefined };
      if (next.home === undefined && next.office === undefined) {
        setOverrides(overrides.filter(o => !(o.wilayaId === selectedWilaya && o.communeId === communeId)));
      } else {
        setOverrides(overrides.map(o => (o.wilayaId === selectedWilaya && o.communeId === communeId) ? next : o));
      }
      return;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return;
    const cur = overrides.find(o => o.wilayaId === selectedWilaya && o.communeId === communeId);
    if (cur) {
      setOverrides(overrides.map(o => (o.wilayaId === selectedWilaya && o.communeId === communeId) ? { ...o, [field]: parsed } : o));
    } else {
      setOverrides([...overrides, { wilayaId: selectedWilaya, communeId, [field]: parsed }]);
    }
  };

  const getWilayaOverride = () => overrides.find(o => o.wilayaId === selectedWilaya && !o.communeId);
  const getCommuneOverrides = () => overrides.filter(o => o.wilayaId === selectedWilaya && o.communeId);

  const wilaya = WILAYAS.find(w => w.id === selectedWilaya);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#222355] border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">رسوم التوصيل</h1>
          <p className="text-slate-500 mt-1">عدّل ثم اضغط حفظ — الاستثناءات فقط، الباقي من الملف الأساسي</p>
        </div>
        <button onClick={fetchOverrides} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="تحديث">
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      <Toast msg={error} type="error" onDone={() => setError('')} />
      <Toast msg={success} type="success" onDone={() => setSuccess('')} />

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">اختر الولاية</label>
            <select
              value={selectedWilaya}
              onChange={e => setSelectedWilaya(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none bg-white"
            >
              {WILAYAS.map(w => (
                <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">بحث برقم البلدية</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="رقم البلدية..."
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <h3 className="font-medium text-slate-900 mb-3">إعدادات الولاية: {wilaya?.name} (الافتراضية)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رسوم التوصيل للمنزل (دج)</label>
              <input
                type="number"
                value={getWilayaOverride()?.home ?? ''}
                onChange={e => setWilayaFee('home', e.target.value)}
                placeholder="اترك فارغاً للافتراضي"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رسوم المكتب/الإيقاف (دج)</label>
              <input
                type="number"
                value={getWilayaOverride()?.office ?? ''}
                onChange={e => setWilayaFee('office', e.target.value)}
                placeholder="اترك فارغاً للافتراضي"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                min="0"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">القيم الفارغة = استخدام الرسوم الافتراضية من الملف الأساسي</p>
        </div>

        <h3 className="font-medium text-slate-900 mb-3">استثناءات البلديات ({wilaya?.name})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 text-right font-medium text-slate-500">البلدية</th>
                <th className="p-3 text-right font-medium text-slate-500 w-40">المنزل (دج)</th>
                <th className="p-3 text-right font-medium text-slate-500 w-40">المكتب (دج)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {getCommuneOverrides().filter(o => !search || String(o.communeId).includes(search)).map(override => (
                <tr key={`${override.wilayaId}-${override.communeId}`} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-900">بلدية #{override.communeId}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={override.home ?? ''}
                      onChange={e => override.communeId && setCommuneFee(override.communeId, 'home', e.target.value)}
                      placeholder="افتراضي"
                      className="w-full px-3 py-1 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                      min="0"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={override.office ?? ''}
                      onChange={e => override.communeId && setCommuneFee(override.communeId, 'office', e.target.value)}
                      placeholder="افتراضي"
                      className="w-full px-3 py-1 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                      min="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {getCommuneOverrides().length === 0 && (
            <p className="text-center text-slate-500 py-8">لا توجد استثناءات لهذه الولاية — عدّل حقلي الولاية أعلاه لإضافة استثناء.</p>
          )}
        </div>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={handleSave} onReset={handleReset} label="حفظ رسوم التوصيل" />
    </div>
  );
}
