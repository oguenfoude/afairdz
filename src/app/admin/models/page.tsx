'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, GripVertical } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';
import SaveBar from '@/components/admin/SaveBar';
import Toast from '@/components/admin/Toast';

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

const snapshot = (m: WatchModel[]) => JSON.stringify(m);

export default function AdminModels() {
  const [models, setModels] = useState<WatchModel[]>([]);
  const [initial, setInitial] = useState('');
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
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const dragIdxRef = useRef<number | null>(null);

  const dirty = snapshot(models) !== initial && initial !== '';

  const fetchModels = async () => {
    try {
      const res = await adminFetch('/api/admin/models');
      if (res.ok) {
        const data = (await res.json()) as WatchModel[];
        const sorted = data.sort((a, b) => a.order - b.order);
        setModels(sorted);
        setInitial(snapshot(sorted));
      }
    } catch {
      setError('فشل تحميل الموديلات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModels(); }, []);

  const renumber = (list: WatchModel[]) => {
    list.forEach((m, i) => { m.order = i + 1; });
    return list;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(''); setSuccess('');
    try {
      const res = await adminFetch('/api/admin/models', {
        method: 'PUT',
        body: JSON.stringify(models),
      });
      if (res.ok) {
        setInitial(snapshot(models));
        setSuccess('تم الحفظ بنجاح — المتجر تحدث');
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
      setModels(JSON.parse(initial));
    } catch { fetchModels(); }
  };

  const handleAdd = () => {
    if (!newModel.name || !newModel.image) {
      setError('الاسم والصورة مطلوبان');
      return;
    }
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
        setSuccess('تم رفع الصورة — اضغط حفظ');
      } else {
        setError(data.error || 'فشل الرفع');
      }
    } catch {
      setError('حدث خطأ في الرفع');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= models.length || to >= models.length) return;
    const list = [...models];
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    setModels(renumber(list));
  };

  const moveUp = (i: number) => move(i, i - 1);
  const moveDown = (i: number) => move(i, i + 1);

  const onDragStart = (i: number) => {
    dragIdxRef.current = i;
    setDragIdx(i);
  };
  const onDragOverRow = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdxRef.current !== null && dragIdxRef.current !== i) setDropIdx(i);
  };
  const onDropRow = (i: number) => {
    const from = dragIdxRef.current;
    dragIdxRef.current = null;
    setDragIdx(null);
    setDropIdx(null);
    if (from !== null) move(from, i);
  };
  const onDragEnd = () => {
    dragIdxRef.current = null;
    setDragIdx(null);
    setDropIdx(null);
  };

  const toggleAvailable = (index: number) => {
    setModels(models.map((m, i) => i === index ? { ...m, available: !m.available } : m));
  };

  const removeModel = (index: number) => {
    if (!confirm('حذف هذا الموديل؟ سيبقى في سجل الطلبات السابقة.')) return;
    setModels(renumber(models.filter((_, i) => i !== index)));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#222355] border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة الموديلات</h1>
          <p className="text-slate-500 mt-1">اسحب للترتيب، أو استعمل الأسهم — ثم اضغط حفظ</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#222355] text-white rounded-lg hover:bg-[#1a1b4a] transition-colors"
        >
          <Plus className="h-4 w-4" /> إضافة موديل
        </button>
      </div>

      <Toast msg={error} type="error" onDone={() => setError('')} />
      <Toast msg={success} type="success" onDone={() => setSuccess('')} />

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 text-right font-medium text-slate-500 w-24">الترتيب</th>
                <th className="p-3 text-right font-medium text-slate-500 w-16">صورة</th>
                <th className="p-3 text-right font-medium text-slate-500">الاسم</th>
                <th className="p-3 text-right font-medium text-slate-500 w-32">الحالة</th>
                <th className="p-3 text-right font-medium text-slate-500 w-40">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {models.map((model, index) => (
                <tr
                  key={model.id}
                  draggable
                  onDragStart={() => onDragStart(index)}
                  onDragOver={(e) => onDragOverRow(e, index)}
                  onDrop={() => onDropRow(index)}
                  onDragEnd={onDragEnd}
                  className={`hover:bg-slate-50 transition-colors ${
                    dropIdx === index ? 'border-t-4 border-t-[#222355] bg-[#222355]/5' : ''
                  } ${dragIdx === index ? 'opacity-40' : ''}`}
                >
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <span title="اسحب للترتيب" className="cursor-grab active:cursor-grabbing p-1 text-slate-400">
                        <GripVertical className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-bold text-slate-700 w-6 text-center">{index + 1}</span>
                      <div className="flex flex-col">
                        <button onClick={() => moveUp(index)} disabled={index === 0} className="p-0.5 text-slate-400 hover:text-[#222355] disabled:opacity-30 text-xs leading-none">▲</button>
                        <button onClick={() => moveDown(index)} disabled={index === models.length - 1} className="p-0.5 text-slate-400 hover:text-[#222355] disabled:opacity-30 text-xs leading-none">▼</button>
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <img src={model.image} alt={model.name} className="w-12 h-12 object-cover rounded-lg" draggable={false} />
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
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={handleSave} onReset={handleReset} />

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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الشعار</label>
                  <input
                    type="text"
                    value={newModel.badge || ''}
                    onChange={e => setNewModel({ ...newModel, badge: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    placeholder="الأكثر مبيعاً"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">اللون</label>
                  <input
                    type="text"
                    value={newModel.colorName || ''}
                    onChange={e => setNewModel({ ...newModel, colorName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                    placeholder="فضي"
                  />
                </div>
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
              <p className="text-xs text-amber-600">ستضاف للقائمة — لا تنس الضغط على «حفظ التغييرات» بالأسفل.</p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">إلغاء</button>
                <button onClick={handleAdd} className="px-4 py-2 bg-[#222355] text-white rounded-lg hover:bg-[#1a1b4a] transition-colors">إضافة للقائمة</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
