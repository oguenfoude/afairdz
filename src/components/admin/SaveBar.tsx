'use client';

interface Props {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset?: () => void;
  label?: string;
}

export default function SaveBar({ dirty, saving, onSave, onReset, label = 'حفظ التغييرات' }: Props) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 mt-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2 text-sm">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${dirty ? 'bg-amber-500' : 'bg-green-500'}`} />
          <span className="font-medium text-slate-700">
            {saving ? 'جاري الحفظ...' : dirty ? 'لديك تغييرات غير محفوظة' : 'كل التغييرات محفوظة'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onReset && dirty && !saving && (
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              تراجع
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-[#222355] text-white text-sm font-bold rounded-lg hover:bg-[#1a1b4a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {saving ? 'جاري الحفظ...' : label}
          </button>
        </div>
      </div>
    </div>
  );
}
