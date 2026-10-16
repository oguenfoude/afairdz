'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Package, Truck, Settings, Plus, EyeOff, Ban, Undo2 } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';

interface BlockedRow {
  phone: string;
  orderId: string;
  at: number;
  blockedAt: number;
  reason?: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blobOk, setBlobOk] = useState(true);
  const [blobReason, setBlobReason] = useState<string | null>(null);
  const [stats, setStats] = useState({ available: 0, disabled: 0, overrides: 0, packages: 0 });
  const [blocked, setBlocked] = useState<BlockedRow[]>([]);

  const loadBlocked = () => {
    adminFetch('/api/admin/blocked')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setBlocked(d); })
      .catch(() => {});
  };

  const handleUnblock = async (phone: string) => {
    if (!confirm(`إلغاء حظر الرقم ${phone}؟ سيتمكن من الطلب مجدداً.`)) return;
    try {
      await adminFetch('/api/admin/blocked', { method: 'DELETE', body: JSON.stringify({ phone }) });
      setBlocked(blocked.filter(b => b.phone !== phone));
    } catch { /* adminFetch redirects on 401 */ }
  };

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/models').then(r => r.json()),
      adminFetch('/api/admin/settings').then(r => r.json()),
      adminFetch('/api/admin/shipping').then(r => r.json()),
      adminFetch('/api/admin/health').then(r => r.json()).catch(() => ({ blob: true })),
      adminFetch('/api/admin/blocked').then(r => r.json()).catch(() => []),
    ])
      .then(([models, settings, shipping, health, blockedList]) => {
        if (health && health.blob === false) {
          setBlobOk(false);
          setBlobReason(health.blobReason ?? 'unreachable');
        }
        if (Array.isArray(blockedList)) setBlocked(blockedList);
        const list = Array.isArray(models) ? models : [];
        setStats({
          available: list.filter((m: { available: boolean }) => m.available).length,
          disabled: list.filter((m: { available: boolean }) => !m.available).length,
          overrides: Array.isArray(shipping) ? shipping.length : 0,
          packages: Array.isArray(settings?.packages) ? settings.packages.length : 0,
        });
      })
      .catch(() => setError('فشل تحميل الإحصائيات'))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'موديلات متاحة', value: loading ? '...' : stats.available, href: '/admin/models', icon: Package, color: 'bg-blue-100 text-blue-600' },
    { label: 'موديلات معطّلة', value: loading ? '...' : stats.disabled, href: '/admin/models', icon: EyeOff, color: 'bg-amber-100 text-amber-600' },
    { label: 'استثناءات التوصيل', value: loading ? '...' : stats.overrides, href: '/admin/shipping', icon: Truck, color: 'bg-green-100 text-green-600' },
    { label: 'باقات الأسعار', value: loading ? '...' : stats.packages, href: '/admin/settings', icon: Settings, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">لوحة التحكم</h1>
        <p className="text-slate-500 mt-1">إدارة متجر Hama store — كل الأرقام حية من قاعدة البيانات</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {!blobOk && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-sm font-bold leading-relaxed">
          {blobReason === 'private-store'
            ? '⚠️ متجر Blob خاص — الحفظ لن يعمل. اجعله Public من Vercel (Storage → Blob → Settings) أو أنشئ متجراً عاماً جديداً وحدّث BLOB_READ_WRITE_TOKEN ثم أعد النشر.'
            : '⚠️ التخزين غير مهيأ — الحفظ لن يعمل. أضف BLOB_READ_WRITE_TOKEN في Vercel لكل البيئات ثم أعد النشر.'}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="p-5 bg-white border border-slate-200 rounded-xl hover:border-[#222355] hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Ban className="h-5 w-5 text-red-600" />
          أرقام محظورة نهائياً ({loading ? '...' : blocked.length})
        </h2>
        <p className="text-sm text-slate-500 mb-4">أي رقم يطلب أكثر من مرة يُحظر تلقائياً وبشكل دائم — لا طلبات ولا أي نشاط.</p>
        {blocked.length === 0 ? (
          <p className="text-sm text-slate-400">لا توجد أرقام محظورة حالياً.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-slate-500 border-b border-slate-200">
                  <th className="p-2 font-medium">الرقم</th>
                  <th className="p-2 font-medium">الطلب الأصلي</th>
                  <th className="p-2 font-medium">تاريخ الحظر</th>
                  <th className="p-2 font-medium w-32">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blocked.map(b => (
                  <tr key={b.phone} className="hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-900" dir="ltr">{b.phone}</td>
                    <td className="p-2 text-slate-600">{b.orderId}</td>
                    <td className="p-2 text-slate-600">{new Date(b.blockedAt).toLocaleString('fr-FR')}</td>
                    <td className="p-2">
                      <button
                        onClick={() => handleUnblock(b.phone)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-green-100 hover:text-green-700 text-xs font-bold transition-colors"
                      >
                        <Undo2 className="h-3.5 w-3.5" /> إلغاء الحظر
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">إجراءات سريعة</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/models"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#222355] text-white rounded-lg hover:bg-[#1a1b4a] text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" /> إدارة الموديلات
          </Link>
          <Link
            href="/admin/shipping"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors"
          >
            <Truck className="h-4 w-4" /> تعديل رسوم التوصيل
          </Link>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors"
          >
            <Settings className="h-4 w-4" /> إعدادات الأسعار
          </Link>
        </div>
      </div>
    </div>
  );
}
