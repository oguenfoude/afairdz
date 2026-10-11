'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Truck, Settings, LogOut } from 'lucide-react';
import { getAdminPassword, clearAdminPassword, adminFetch } from '@/lib/adminFetch';

const navItems = [
  { href: '/admin', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/admin/models', label: 'الموديلات', icon: Package },
  { href: '/admin/shipping', label: 'رسوم التوصيل', icon: Truck },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setAuthed(false);
      setChecking(false);
      return;
    }

    const pw = getAdminPassword();
    if (!pw) {
      router.replace('/admin/login');
      return;
    }

    adminFetch('/api/admin/models')
      .then(r => r.json())
      .then(() => { setAuthed(true); setChecking(false); })
      .catch(() => {
        clearAdminPassword();
        router.replace('/admin/login');
      });
  }, [pathname, router]);

  const handleLogout = () => {
    clearAdminPassword();
    window.location.href = '/admin/login';
  };

  // Login page renders without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#222355] border-t-transparent" />
      </div>
    );
  }

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row" dir="rtl">
      <aside className="w-full md:w-64 shrink-0 bg-white border-b md:border-b-0 md:border-l border-slate-200 md:min-h-screen flex md:flex-col">
        <div className="px-4 py-4 md:p-6 md:border-b border-slate-200">
          <h1 className="text-lg md:text-xl font-bold text-[#222355]">إدارة Affaire DZ</h1>
        </div>

        <nav className="flex-1 flex md:block gap-1 overflow-x-auto px-3 pb-3 md:p-4 md:space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#222355] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 md:p-4 md:border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="h-5 w-5" />
            خروج
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
