'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';
import SaveBar from '@/components/admin/SaveBar';
import Toast from '@/components/admin/Toast';

interface PackageOffer {
  quantity: number;
  title: string;
  pricePerUnit: number;
  totalPrice: number;
  originalTotal: number;
  savings: number;
  bonus: string;
}

export default function AdminSettings() {
  const [packages, setPackages] = useState<PackageOffer[]>([]);
  const [notices, setNotices] = useState('');
  const [initial, setInitial] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const snap = (p: PackageOffer[], n: string) => JSON.stringify({ p, n });
  const dirty = initial !== '' && snap(packages, notices) !== initial;

  const fetchData = async () => {
    try {
      const res = await adminFetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const pkgs = data.packages || [];
        const nts = data.notices || '';
        setPackages(pkgs);
        setNotices(nts);
        setInitial(snap(pkgs, nts));
      }
    } catch {
      setError('فشل التحميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ packages, notices }),
      });
      if (res.ok) {
        setInitial(snap(packages, notices));
        setSuccess('تم الحفظ بنجاح — الأسعار والإشعارات تحدثت في المتجر');
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
    try {
      const parsed = JSON.parse(initial);
      setPackages(parsed.p);
      setNotices(parsed.n);
    } catch { fetchData(); }
  };

  const addPackage = () => {
    const q = packages.length + 1;
    const basePrice = q === 1 ? 1500 : q === 2 ? 1400 : 1300;
    setPackages([...packages, {
      quantity: q,
      title: `${q} ${q === 1 ? 'ساعة' : 'ساعات'}`,
      pricePerUnit: basePrice,
      totalPrice: basePrice * q,
      originalTotal: 3000 * q,
      savings: (3000 - basePrice) * q,
      bonus: `${basePrice * q} دج${q > 1 ? ` (توفير ${(3000 - basePrice) * q} دج)` : ''}`,
    }]);
  };

  const removePackage = (index: number) => {
    if (!confirm('حذف هذه الباقة؟')) return;
    const newPackages = packages.filter((_, i) => i !== index).map((p, i) => ({
      ...p, quantity: i + 1, title: `${i + 1} ${i === 0 ? 'ساعة' : 'ساعات'}`
    }));
    setPackages(newPackages);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newPackages = [...packages];
    [newPackages[index - 1], newPackages[index]] = [newPackages[index], newPackages[index - 1]];
    newPackages.forEach((p, i) => { p.quantity = i + 1; p.title = `${i + 1} ${i === 0 ? 'ساعة' : 'ساعات'}`; });
    setPackages(newPackages);
  };

  const moveDown = (index: number) => {
    if (index === packages.length - 1) return;
    const newPackages = [...packages];
    [newPackages[index], newPackages[index + 1]] = [newPackages[index + 1], newPackages[index]];
    newPackages.forEach((p, i) => { p.quantity = i + 1; p.title = `${i + 1} ${i === 0 ? 'ساعة' : 'ساعات'}`; });
    setPackages(newPackages);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#222355] border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الإعدادات</h1>
          <p className="text-slate-500 mt-1">باقات الأسعار والإشعارات — تظهر مباشرة في المتجر بعد الحفظ</p>
        </div>
        <button onClick={addPackage} className="inline-flex items-center gap-2 px-4 py-2 bg-[#222355] text-white rounded-lg hover:bg-[#1a1b4a] transition-colors">
          <Plus className="h-4 w-4" /> إضافة باقة
        </button>
      </div>

      <Toast msg={error} type="error" onDone={() => setError('')} />
      <Toast msg={success} type="success" onDone={() => setSuccess('')} />

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">باقات الأسعار</h2>
        <div className="space-y-3 mb-6">
          {packages.map((pkg, index) => (
            <div key={pkg.quantity} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex items-center gap-1">
                  <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"><GripVertical className="h-4 w-4" /></button>
                  <button onClick={() => moveDown(index)} disabled={index === packages.length - 1} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"><GripVertical className="h-4 w-4 rotate-180" /></button>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-slate-500 mb-1">العنوان</label>
                  <input
                    type="text"
                    value={pkg.title}
                    onChange={e => setPackages(packages.map((p, i) => i === index ? { ...p, title: e.target.value } : p))}
                    className="w-full px-3 py-1 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-slate-500 mb-1">الكمية</label>
                  <input
                    type="number"
                    value={pkg.quantity}
                    onChange={e => setPackages(packages.map((p, i) => i === index ? { ...p, quantity: parseInt(e.target.value) || 1 } : p))}
                    className="w-full px-3 py-1 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                    min="1"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs text-slate-500 mb-1">سعر الوحدة (دج)</label>
                  <input
                    type="number"
                    value={pkg.pricePerUnit}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setPackages(packages.map((p, i) => i === index ? { 
                        ...p, 
                        pricePerUnit: val,
                        totalPrice: val * p.quantity,
                        savings: (p.originalTotal / p.quantity - val) * p.quantity,
                        bonus: `${val * p.quantity} دج${p.quantity > 1 ? ` (توفير ${(p.originalTotal / p.quantity - val) * p.quantity} دج)` : ''}`
                      } : p));
                    }}
                    className="w-full px-3 py-1 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                    min="0"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs text-slate-500 mb-1">الإجمالي الأصلي (دج)</label>
                  <input
                    type="number"
                    value={pkg.originalTotal}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setPackages(packages.map((p, i) => i === index ? { 
                        ...p, 
                        originalTotal: val,
                        savings: val - p.totalPrice,
                      } : p));
                    }}
                    className="w-full px-3 py-1 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                    min="0"
                  />
                </div>
                <div className="w-40">
                  <label className="block text-xs text-slate-500 mb-1">نص التوفير</label>
                  <input
                    type="text"
                    value={pkg.bonus}
                    onChange={e => setPackages(packages.map((p, i) => i === index ? { ...p, bonus: e.target.value } : p))}
                    className="w-full px-3 py-1 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                  />
                </div>
                <button
                  onClick={() => removePackage(index)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">إشعارات الموقع</h2>
        <textarea
          value={notices}
          onChange={e => setNotices(e.target.value)}
          rows={4}
          placeholder="رسالة تظهر للعملاء (اختياري)"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
        />
        <p className="text-sm text-slate-500 mt-2">يدعم HTML بسيط. سيظهر في أعلى الصفحة.</p>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={handleSave} onReset={handleReset} label="حفظ جميع الإعدادات" />
    </div>
  );
}