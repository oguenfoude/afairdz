'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Package, Truck, Settings, Plus } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';

export default function AdminDashboard() {
  const [modelCount, setModelCount] = useState('—');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/api/admin/models')
      .then(r => r.json())
      .then(data => setModelCount(data.filter((m: any) => m.available).length))
      .catch(() => setModelCount('—'))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'الموديلات', value: loading ? '...' : modelCount, href: '/admin/models', icon: Package, color: 'bg-blue-100 text-blue-600' },
    { label: 'الوليات المفعّلة', value: '58', href: '/admin/shipping', icon: Truck, color: 'bg-green-100 text-green-600' },
    { label: 'باقات الأسعار', value: '3', href: '/admin/settings', icon: Settings, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">لوحة التحكم</h1>
          <p className="text-slate-500 mt-1">إدارة متجر Affaire DZ</p>
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => {
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
        <h2 className="text-lg font-semibold text-slate-900 mb-4">إجراءات سريعة</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/models"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#222355] text-white rounded-lg hover:bg-[#1a1b4a] text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" /> إضافة موديل
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