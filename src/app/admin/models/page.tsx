'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Save, GripVertical } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';

interface WatchModel {
  id: string;
  name: string;
  image: string;
  badge?: string;
  colorName?: string;
  description?: string;
  available: boolean;
  order: number;
}

export default function AdminModels() {
  const [models, setModels] = useState<WatchModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newModel, setNewModel] = useState<Partial<WatchModel>>({
    name: '', image: '', badge: '', colorName: '', description: '', available: true,
  });
  const [uploading, setUploading] = useState(false);
  const [editingUpload, setEditingUpload] = useState<number | null>(null);

  const fetchModels = async () => {
    try {
      const res = await adminFetch('/api/admin/models');
      if (res.ok) {
        const data = await res.json();
        setModels(data.sort((a: WatchModel, b: WatchModel) => a.order - b.order));
      }
    } catch {
      setError('فشل تحميل الموديلات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModels(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(''); setSuccess('');
    try {
      const res = await adminFetch('/api/admin/models', {
        method: 'PUT',
        body: JSON.stringify(models),
      });
      if (res.ok) {
        setSuccess('تم الحفظ بنجاح');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('فشل الحفظ');
      }
    } catch {
      setError('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newModel.name || !newModel.image) {
      setError('الاسم والصورة مطلوبان');
      return;
    }
    setSaving(true);
    setError('');
    const model: WatchModel = {
      id: `m${Date.now()}`,
      name: newModel.name,
      image: newModel.image,
      badge: newModel.badge,
      colorName: newModel.colorName,
      description: newModel.description,
      available: newModel.available ?? true,
      order: models.length + 1,
    };
    setModels([...models, model]);
    setShowAdd(false);
    setNewModel({ name: '', image: '', badge: '', colorName: '', description: '', available: true });
    setSaving(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await adminFetch('/api/admin/models/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && data.url) {
        if (showAdd) setNewModel({ ...newModel, image: data.url });
        else setModels(models.map((m, i) => i === editingUpload ? { ...m, image: data.url } : m));
        setSuccess('تم رفع الصورة');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.error || 'فشل الرفع');
      }
    } catch {
      setError('حدث خطأ في الرفع');
    } finally {
      setUploading(false);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newModels = [...models];
    [newModels[index - 1], newModels[index]] = [newModels[index], newModels[index - 1]];
    newModels.forEach((m, i) => m.order = i + 1);
    setModels(newModels);
  };

  const moveDown = (index: number) => {
    if (index === models.length - 1) return;
    const newModels = [...models];
    [newModels[index], newModels[index + 1]] = [newModels[index + 1], newModels[index]];
    newModels.forEach((m, i) => m.order = i + 1);
    setModels(newModels);
  };

  const toggleAvailable = (index: number) => {
    const newModels = models.map((m, i) => i === index ? { ...m, available: !m.available } : m);
    setModels(newModels);
  };

  const removeModel = (index: number) => {
    if (!confirm('حذف هذا الموديل؟ سيبقى في سجل الطلبات السابقة.')) return;
    const newModels = models.filter((_, i) => i !== index);
    newModels.forEach((m, i) => m.order = i + 1);
    setModels(newModels);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#222355] border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة الموديلات</h1>
          <p className="text-slate-500 mt-1">أضف، رتّب، أو عطّل الموديلات المعروضة في المتجر</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#222355] text-white rounded-lg hover:bg-[#1a1b4a] transition-colors"
        >
          <Plus className="h-4 w-4" /> إضافة موديل
        </button>
      </div>

      {(error || success) && (
        <div className={`p-4 rounded-lg ${error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          {error || success}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 text-right font-medium text-slate-500 w-12">الترتيب</th>
                <th className="p-3 text-right font-medium text-slate-500 w-16">صورة</th>
                <th className="p-3 text-right font-medium text-slate-500">الاسم</th>
                <th className="p-3 text-right font-medium text-slate-500 w-32">الحالة</th>
                <th className="p-3 text-right font-medium text-slate-500 w-48">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {models.map((model, index) => (
                <tr key={model.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"><GripVertical className="h-4 w-4" /></button>
                      <span className="text-sm text-slate-600 w-6 text-center">{index + 1}</span>
                      <button onClick={() => moveDown(index)} disabled={index === models.length - 1} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"><GripVertical className="h-4 w-4 rotate-180" /></button>
                    </div>
                  </td>
                  <td className="p-2">
                    <img src={model.image} alt={model.name} className="w-12 h-12 object-cover rounded-lg" />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={model.name}
                      onChange={e => setModels(models.map((m, i) => i === index ? { ...m, name: e.target.value } : m))}
                      className="w-full px-3 py-1 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                    />
                  </td>
                  <td className="p-3">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={model.available}
                        onChange={() => toggleAvailable(index)}
                        className="h-4 w-4 text-[#222355] border-slate-300 rounded focus:ring-[#222355]"
                      />
                      <span className="ml-2 text-sm text-slate-600">{model.available ? 'متاح' : 'معطّل'}</span>
                    </label>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingUpload(index); document.getElementById(`upload-${model.id}`)?.click(); }}
                        disabled={uploading}
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="تغيير الصورة"
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                      <input
                        id={`upload-${model.id}`}
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => removeModel(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-[#222355] text-white rounded-lg hover:bg-[#1a1b4a] disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-900 mb-4">إضافة موديل جديد</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم</label>
                <input
                  type="text"
                  value={newModel.name}
                  onChange={e => setNewModel({ ...newModel, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                  placeholder="مثال: الموديل 12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الصورة</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newModel.image}
                    onChange={e => setNewModel({ ...newModel, image: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                    placeholder="ارفع أو الصق رابط الصورة"
                  />
                  <button
                    onClick={() => { setEditingUpload(-1); document.getElementById('new-upload')?.click(); }}
                    disabled={uploading}
                    className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  <input id="new-upload" type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الشعار (اختياري)</label>
                <input
                  type="text"
                  value={newModel.badge || ''}
                  onChange={e => setNewModel({ ...newModel, badge: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                  placeholder="مثال: الأكثر مبيعاً"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم اللون (اختياري)</label>
                <input
                  type="text"
                  value={newModel.colorName || ''}
                  onChange={e => setNewModel({ ...newModel, colorName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                  placeholder="مثال: فضي"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الوصف (اختياري)</label>
                <textarea
                  value={newModel.description || ''}
                  onChange={e => setNewModel({ ...newModel, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#222355] focus:border-transparent outline-none"
                  placeholder="وصف قصير للموديل"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newModel.available ?? true}
                  onChange={e => setNewModel({ ...newModel, available: e.target.checked })}
                  className="h-4 w-4 text-[#222355] border-slate-300 rounded focus:ring-[#222355]"
                />
                <span className="text-sm text-slate-600">متاح للطلب</span>
              </label>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">إلغاء</button>
                <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-[#222355] text-white rounded-lg hover:bg-[#1a1b4a] disabled:opacity-50 transition-colors">
                  {saving ? 'جاري الإضافة...' : 'إضافة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}