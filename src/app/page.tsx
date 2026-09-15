'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  ShoppingBag,
  Check,
  Gift,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  wilayas,
  getWilayaById,
  getAllCommunesForWilaya,
  getWilayaDisplayName,
  Commune
} from '@/data/wilayas';
import { trackFBPixel } from '@/components/FacebookPixel';
import { WATCH_MODELS, WatchModel } from '@/data/products';

interface OrderSuccessData {
  orderId: string;
  fullName: string;
  phone: string;
  wilayaName: string;
  communeName: string;
  deliveryType: string;
  addressDetails?: string;
  totalPrice: number;
  selectedModels: { modelName: string; image: string; modelId: number }[];
}

export default function AlgerianWatchLandingPage() {
  const [selectedModel, setSelectedModel] = useState<WatchModel>(WATCH_MODELS[0]);

  // Form Inputs
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilayaId, setWilayaId] = useState<number | ''>('');
  const [communeName, setCommuneName] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'domicile' | 'desk'>('domicile');
  const [addressDetails, setAddressDetails] = useState('');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccessData | null>(null);

  // Swipe State for Image Gallery
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleNextImage = () => {
    const currentIndex = WATCH_MODELS.findIndex(m => m.id === selectedModel.id);
    const nextIndex = (currentIndex + 1) % WATCH_MODELS.length;
    setSelectedModel(WATCH_MODELS[nextIndex]);
  };

  const handlePrevImage = () => {
    const currentIndex = WATCH_MODELS.findIndex(m => m.id === selectedModel.id);
    const prevIndex = currentIndex === 0 ? WATCH_MODELS.length - 1 : currentIndex - 1;
    setSelectedModel(WATCH_MODELS[prevIndex]);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    
    // In RTL, swiping left (finger moves left, distance > 0) usually goes to next
    if (distance > 50) handleNextImage();
    if (distance < -50) handlePrevImage();
  };

  // References
  const formSectionRef = useRef<HTMLDivElement>(null);
  const isOrderCompletedRef = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    trackFBPixel('ViewContent', {
      content_name: 'طقم ساعة يد رجالية فاخرة',
      value: 1500,
      currency: 'DZD'
    });
  }, []);

  const currentWilaya = wilayaId ? getWilayaById(Number(wilayaId)) : undefined;
  const communesList: Commune[] = wilayaId ? getAllCommunesForWilaya(Number(wilayaId)) : [];

  const domicileFee = 700;
  const deskFee = 500;
  const currentDeliveryFee = deliveryType === 'desk' ? deskFee : domicileFee;

  const productPrice = 1500;
  const originalPrice = 3000;
  const totalPrice = productPrice + currentDeliveryFee;

  const hasLocation = Boolean(wilayaId && communeName);
  const cleanPhone = phone.trim().replace(/[\s\-]/g, '');

  const logCustomerData = (stage: string) => {
    if (isOrderCompletedRef.current) return;
    if (cleanPhone.length < 9) return;

    const payload = {
      fullName: fullName.trim(),
      phone: cleanPhone,
      wilayaName: currentWilaya ? currentWilaya.wilaya_name : '',
      communeName: communeName || '',
      deliveryType,
      selectedModels: [{
        modelId: selectedModel.id,
        modelName: selectedModel.name,
        image: selectedModel.image
      }],
      estimatedTotal: totalPrice,
      stage
    };

    fetch('/api/abandoned-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  };

  useEffect(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (phone.trim().length >= 9) {
      idleTimerRef.current = setTimeout(() => {
        logCustomerData('idle_timeout');
      }, 15000);
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, fullName, wilayaId, communeName, deliveryType, selectedModel]);

  const scrollToForm = () => {
    if (formSectionRef.current) {
      const y = formSectionRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) { setErrorMessage('يرجى إدخال الاسم واللقب.'); return; }
    if (!/^(0)(5|6|7)[0-9]{8}$/.test(cleanPhone)) { setErrorMessage('يرجى إدخال رقم هاتف جزائري صحيح.'); return; }
    if (!wilayaId) { setErrorMessage('يرجى اختيار ولاية التوصيل.'); return; }
    if (!communeName) { setErrorMessage('يرجى اختيار البلدية.'); return; }
    if (!addressDetails.trim()) { setErrorMessage('يرجى كتابة العنوان بالتفصيل.'); return; }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        fullName: fullName.trim(),
        phone: cleanPhone,
        wilayaId: Number(wilayaId),
        wilayaName: currentWilaya ? currentWilaya.wilaya_name : '',
        communeName,
        deliveryType,
        addressDetails: addressDetails.trim(),
        quantity: 1,
        productPrice,
        deliveryFee: currentDeliveryFee,
        totalPrice,
        selectedModels: [{
          modelId: selectedModel.id,
          modelName: selectedModel.name,
          image: selectedModel.image
        }]
      };

      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء تسجيل الطلب.');

      isOrderCompletedRef.current = true;
      trackFBPixel('Purchase', {
        value: totalPrice / 100,
        currency: 'USD',
        content_name: selectedModel.name,
        order_id: data.orderId
      });
      setOrderSuccess({ orderId: data.orderId, ...orderPayload });

      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'حدث خطأ غير متوقع.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border-t-8 border-[#222355]">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">تم تأكيد طلبك بنجاح!</h1>
          <p className="text-slate-600 mb-6">رقم الطلب: <span className="font-bold text-[#222355]">{orderSuccess.orderId}</span></p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-right space-y-3">
            <p className="text-sm border-b border-slate-200 pb-2">سنتصل بك قريباً على الرقم <strong className="text-[#222355] block text-base mt-1" dir="ltr">{orderSuccess.phone}</strong></p>
            <p className="text-sm text-slate-700">المبلغ الإجمالي للدفع عند الاستلام: <strong className="text-[#DC2626] text-lg block">{orderSuccess.totalPrice} دج</strong></p>
          </div>
          <button onClick={() => window.location.reload()} className="w-full py-3.5 bg-[#222355] text-white rounded-xl font-bold">العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0" dir="rtl">
      {/* Notice Bar */}
      <aside className="bg-[#DC2626] text-white text-sm font-bold py-2 text-center sticky top-0 z-50">
        توصيل 58 ولاية و الدفع عند الاستلام
      </aside>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 flex justify-center sticky top-[36px] z-40">
        <Image src="/logo.png" alt="Affaire DZ" width={140} height={40} priority className="h-10" style={{ width: 'auto', height: 'auto' }} />
      </header>

      {/* Main Container - Narrow width for YouCan style */}
      <main className="max-w-2xl mx-auto bg-white min-h-screen shadow-sm pb-10">
        
        {/* Breadcrumb / Category */}
        <div className="px-4 pt-4 pb-2 text-xs text-slate-500 flex items-center gap-1">
          <span>الرئيسية</span> <span>/</span> <span className="text-[#222355] font-bold">ساعات رجالية</span>
        </div>

        {/* Product Title */}
        <h1 className="px-4 text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-2">
          الساعة الأكثر طلباً: طقم ساعة رجالية فاخرة + خاتم وبراسلي مجاناً
        </h1>

        {/* Reviews snippet */}
        <div className="px-4 flex items-center gap-1 mb-4">
          <div className="flex text-[#222355]">
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
          </div>
          <span className="text-xs font-bold text-slate-600">(4.9/5 بناء على 145 تقييم)</span>
        </div>

        {/* Price Block */}
        <div className="px-4 flex items-end gap-3 mb-4">
          <div className="text-3xl font-black text-[#DC2626]">{productPrice} دج</div>
          <div className="text-base text-slate-400 line-through font-bold pb-1">{originalPrice} دج</div>
        </div>

        {/* Main Product Image */}
        <div 
          className="w-full aspect-square bg-slate-50 relative border-y border-slate-100 overflow-hidden touch-pan-y group"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndEvent}
        >
          {/* Navigation Arrows (Visible on Desktop / Easier tapping) */}
          <button onClick={handleNextImage} type="button" className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/70 hover:bg-white p-2.5 rounded-full shadow-md text-[#222355] transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={handlePrevImage} type="button" className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/70 hover:bg-white p-2.5 rounded-full shadow-md text-[#222355] transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Model Number Badge Floating on Top */}
          <div className="absolute top-4 right-4 z-10 bg-[#222355] text-white px-4 py-1.5 rounded-full text-sm font-black shadow-lg border border-white/20">
            {selectedModel.name}
          </div>
          <Image
            key={selectedModel.id}
            src={selectedModel.image}
            alt={selectedModel.name}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            priority
            className="object-contain"
          />
        </div>

        {/* Image Gallery Thumbnails */}
        <div className="px-4 py-4 border-b border-slate-100 bg-white">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {WATCH_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model)}
                type="button"
                className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 snap-start bg-slate-50 transition-all ${
                  selectedModel.id === model.id ? 'border-[#222355] ring-2 ring-[#222355]/20' : 'border-slate-200 opacity-60'
                }`}
              >
                <Image src={model.image} alt={model.name} fill sizes="64px" className="object-cover p-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="px-4 py-6 border-b border-slate-100">
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <span className="w-8 h-8 rounded-full bg-[#222355]/10 flex items-center justify-center text-[#222355]"><Check className="w-4 h-4" /></span>
              ساعة كوارتز عالية الجودة
            </li>
            <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <span className="w-8 h-8 rounded-full bg-[#222355]/10 flex items-center justify-center text-[#222355]"><Check className="w-4 h-4" /></span>
              خاتم ستانلس فاخر متناسق مع الساعة
            </li>
            <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <span className="w-8 h-8 rounded-full bg-[#222355]/10 flex items-center justify-center text-[#222355]"><Check className="w-4 h-4" /></span>
              براسلي كلاسيكي هدية
            </li>
            <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <span className="w-8 h-8 rounded-full bg-[#222355]/10 flex items-center justify-center text-[#222355]"><Gift className="w-4 h-4" /></span>
              تأتي جميعها في علبة إهداء أنيقة
            </li>
          </ul>
        </div>

        {/* Checkout Form Section */}
        <div ref={formSectionRef} className="px-4 py-8 bg-white" id="checkout">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-black text-slate-900 mb-2">للطلب، يرجى ملء هذه الاستمارة</h2>
            <p className="text-sm text-slate-500">الدفع يكون بعد استلام المنتج ومعاينته</p>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-4">

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">الاسم الكامل <span className="text-[#DC2626]">*</span></label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                onBlur={() => logCustomerData('input_blur')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#222355] focus:border-transparent outline-none"
                placeholder="الاسم واللقب"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">رقم الهاتف <span className="text-[#DC2626]">*</span></label>
              <input
                type="tel"
                required
                dir="ltr"
                maxLength={10}
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={() => logCustomerData('input_blur')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#222355] focus:border-transparent outline-none text-right"
                placeholder="05 / 06 / 07 XX XX XX XX"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">الولاية <span className="text-[#DC2626]">*</span></label>
              <select
                required
                value={wilayaId}
                onChange={e => { setWilayaId(Number(e.target.value) || ''); setCommuneName(''); }}
                onBlur={() => logCustomerData('input_blur')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#222355] focus:border-transparent outline-none"
              >
                <option value="">-- اختر الولاية --</option>
                {wilayas.map(w => <option key={w.wilaya_id} value={w.wilaya_id}>{getWilayaDisplayName(w)}</option>)}
              </select>
            </div>

            {wilayaId && (
              <div className="animate-fade-in">
                <label className="block text-sm font-bold text-slate-900 mb-1.5">البلدية <span className="text-[#DC2626]">*</span></label>
                <select
                  required
                  value={communeName}
                  onChange={e => setCommuneName(e.target.value)}
                  onBlur={() => logCustomerData('input_blur')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#222355] focus:border-transparent outline-none"
                >
                  <option value="">-- اختر البلدية --</option>
                  {communesList.map(c => <option key={c.commune_id} value={c.commune_name}>{c.commune_name}</option>)}
                </select>
              </div>
            )}

            {hasLocation && (
              <div className="animate-fade-in space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">طريقة التوصيل <span className="text-[#DC2626]">*</span></label>
                  <div className="space-y-2">
                    <button type="button" onClick={() => setDeliveryType('domicile')} className={`w-full flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-colors ${deliveryType === 'domicile' ? 'border-[#222355] bg-[#222355]/5' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${deliveryType === 'domicile' ? 'border-[#222355]' : 'border-slate-300'}`}>
                          {deliveryType === 'domicile' && <div className="w-2.5 h-2.5 rounded-full bg-[#222355]" />}
                        </div>
                        <span className="font-bold text-slate-900 text-sm">توصيل لباب المنزل</span>
                      </div>
                      <span className="font-black text-slate-600 text-sm">700 دج</span>
                    </button>
                    <button type="button" onClick={() => setDeliveryType('desk')} className={`w-full flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-colors ${deliveryType === 'desk' ? 'border-[#222355] bg-[#222355]/5' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${deliveryType === 'desk' ? 'border-[#222355]' : 'border-slate-300'}`}>
                          {deliveryType === 'desk' && <div className="w-2.5 h-2.5 rounded-full bg-[#222355]" />}
                        </div>
                        <span className="font-bold text-slate-900 text-sm">استلام من مكتب التوصيل</span>
                      </div>
                      <span className="font-black text-slate-600 text-sm">500 دج</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">العنوان بالتفصيل <span className="text-[#DC2626]">*</span></label>
                  <input
                    type="text"
                    required
                    value={addressDetails}
                    onChange={e => setAddressDetails(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#222355] focus:border-transparent outline-none"
                    placeholder="اسم الحي أو الشارع"
                  />
                </div>

                {/* Model Selection Dropdown (Inside Form) */}
                <div className="pt-2">
                  <label htmlFor="modelSelectForm" className="block text-sm font-bold text-slate-900 mb-1.5">اختر الموديل (اللون) المطلوب <span className="text-[#DC2626]">*</span></label>
                  <div className="relative">
                    <select
                      id="modelSelectForm"
                      value={selectedModel.id}
                      onChange={(e) => {
                        const model = WATCH_MODELS.find(m => m.id === Number(e.target.value));
                        if (model) setSelectedModel(model);
                      }}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-[#222355] focus:border-transparent outline-none appearance-none pr-4 pl-10"
                    >
                      {WATCH_MODELS.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Total Recap */}
                <div className="bg-[#222355]/5 rounded-xl p-4 border border-[#222355]/20">
                  <div className="flex justify-between items-center mb-2 text-sm text-slate-700">
                    <span>ثمن المنتج:</span>
                    <span className="font-bold">{productPrice} دج</span>
                  </div>
                  <div className="flex justify-between items-center mb-3 text-sm text-slate-700 border-b border-slate-200 pb-3">
                    <span>مصاريف التوصيل:</span>
                    <span className="font-bold">{currentDeliveryFee} دج</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-900 text-base">المجموع النهائي:</span>
                    <span className="font-black text-[#DC2626] text-xl">{totalPrice} دج</span>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200 text-center">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#DC2626] hover:bg-red-700 text-white rounded-xl font-black text-lg shadow-lg shadow-red-500/30 transition-all transform active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2 mt-4"
            >
              {isSubmitting ? (
                <span className="animate-pulse">جاري تسجيل الطلب...</span>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  تأكيد الطلب الآن
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Sticky Mobile Buy Button (Jumps to form) */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-3 lg:hidden z-50">
        <button
          onClick={scrollToForm}
          className="w-full py-3.5 bg-[#DC2626] text-white rounded-xl font-black shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          اطلب الآن - الدفع عند الاستلام
        </button>
      </div>

    </div>
  );
}
