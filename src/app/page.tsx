'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import {
  User,
  Phone,
  MapPin,
  Building2,
  Home,
  Truck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ShoppingBag,
  Package,
  Check,
  Sparkles,
  Gift,
  Clock
} from 'lucide-react';
import {
  wilayas,
  getWilayaById,
  getAllCommunesForWilaya,
  getWilayaDisplayName,
  Commune
} from '@/data/wilayas';
import { trackFBPixel } from '@/components/FacebookPixel';
import { WATCH_MODELS, WatchModel, PACKAGE_OFFERS } from '@/data/products';

export default function AlgerianWatchLandingPage() {
  // Step 1: Model Selection (1 to 10) - starts as null (no pre-selected)
  const [selectedModel, setSelectedModel] = useState<WatchModel | null>(null);
  // Preview model shown in large preview window (defaults to model 1 for visual preview)
  const [previewModel, setPreviewModel] = useState<WatchModel>(WATCH_MODELS[0]);

  useEffect(() => {
    trackFBPixel('ViewContent', {
      content_name: 'طقم ساعة يد رجالية فاخرة',
      value: 1500,
      currency: 'DZD'
    });
  }, []);
  const [quantity, setQuantity] = useState<number>(1);

  // Form Inputs in strict sequence: Name -> Phone -> Wilaya -> Commune -> Delivery Type -> Address Details
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilayaId, setWilayaId] = useState<number | ''>('');
  const [communeName, setCommuneName] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'domicile' | 'desk'>('domicile');
  const [addressDetails, setAddressDetails] = useState('');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // References
  const formSectionRef = useRef<HTMLDivElement>(null);
  const modelSectionRef = useRef<HTMLDivElement>(null);
  const isOrderCompletedRef = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Current Wilaya data
  const currentWilaya = wilayaId ? getWilayaById(Number(wilayaId)) : undefined;

  // Communes list for chosen Wilaya
  const communesList: Commune[] = wilayaId
    ? getAllCommunesForWilaya(Number(wilayaId))
    : [];

  // Reset commune when Wilaya changes
  useEffect(() => {
    setCommuneName('');
  }, [wilayaId]);

  // Delivery Pricing: Home = 700 DZD, Desk = 500 DZD no matter what
  const domicileFee = 700;
  const deskFee = 500;
  const currentDeliveryFee = deliveryType === 'desk' ? deskFee : domicileFee;

  const unitPrice = quantity === 1 ? 1500 : quantity === 2 ? 1400 : 1300;
  const productPrice = quantity * unitPrice;
  const originalPrice = quantity * 3000;
  const totalPrice = productPrice + currentDeliveryFee;

  // Pricing visibility flag: strictly hide any price data until wilaya & commune are selected
  const hasLocation = Boolean(wilayaId && communeName);

  const cleanPhone = phone.trim().replace(/[\s\-]/g, '');
  const isAllInfoFilled = Boolean(
    fullName.trim().length >= 2 &&
    cleanPhone.length >= 9 &&
    wilayaId &&
    communeName &&
    (deliveryType === 'desk' || addressDetails.trim().length >= 2)
  );

  // Real-time Lead Dispatcher
  const logCustomerData = (stage: string) => {
    if (isOrderCompletedRef.current) return;
    if (cleanPhone.length < 9) return;

    const payload = {
      fullName: fullName.trim(),
      phone: cleanPhone,
      wilayaName: currentWilaya ? currentWilaya.wilaya_name : '',
      communeName: communeName || '',
      deliveryType,
      selectedModels: selectedModel
        ? [
            {
              modelId: selectedModel.id,
              modelName: selectedModel.name,
              image: selectedModel.image
            }
          ]
        : [],
      estimatedTotal: totalPrice,
      stage
    };

    fetch('/api/abandoned-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  };

  // Debounced input tracking
  useEffect(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (phone.trim().length >= 9) {
      idleTimerRef.current = setTimeout(() => {
        logCustomerData('idle_timeout');
      }, 4000);
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [phone, fullName, wilayaId, communeName, deliveryType, selectedModel]);

  const scrollToForm = () => {
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToModels = () => {
    if (modelSectionRef.current) {
      modelSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Model selection handler
  const handleSelectModel = (model: WatchModel) => {
    setSelectedModel(model);
    setPreviewModel(model);
    setErrorMessage('');
  };

  // Submit Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedModel) {
      setErrorMessage('يرجى اختيار موديل الساعة أولاً بالضغط على أحد الموديلات (1 إلى 10).');
      scrollToModels();
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage('يرجى إدخال الاسم واللقب.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const algerianPhoneRegex = /^(0)(5|6|7)[0-9]{8}$/;
    if (!algerianPhoneRegex.test(cleanPhone)) {
      setErrorMessage('يرجى إدخال رقم هاتف جزائري صحيح مكوّن من 10 أرقام (05 / 06 / 07).');
      return;
    }

    if (!wilayaId) {
      setErrorMessage('يرجى اختيار ولاية التوصيل.');
      return;
    }

    if (!communeName) {
      setErrorMessage('يرجى اختيار البلدية.');
      return;
    }

    if (!addressDetails.trim()) {
      setErrorMessage('يرجى كتابة عنوانك بالتفصيل (اسم الحي، الشارع، أو رقم المنزل).');
      return;
    }

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
        quantity,
        productPrice,
        deliveryFee: currentDeliveryFee,
        totalPrice,
        selectedModels: [
          {
            modelId: selectedModel.id,
            modelName: selectedModel.name,
            image: selectedModel.image
          }
        ]
      };

      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء تسجيل الطلب.');
      }

      isOrderCompletedRef.current = true;
      trackFBPixel('Purchase', {
        value: totalPrice / 100, // Converted to USD approximation to avoid DZD currency error
        currency: 'USD',
        content_name: selectedModel ? selectedModel.name : 'طقم ساعة رجالية',
        order_id: data.orderId
      });
      setOrderSuccess({
        orderId: data.orderId,
        ...orderPayload
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ غير متوقع. يرجى المحاولة ثانية.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 lg:pb-0 selection:bg-[#222355] selection:text-white" dir="rtl">
      
      {/* 1. TOP ANNOUNCEMENT BAR (Color: Burgundy #222355) */}
      <aside aria-label="تنبيه التوصيل" className="bg-[#222355] text-white text-xs sm:text-sm font-bold py-2.5 px-3 text-center sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2">
          <Truck className="w-4 h-4 shrink-0 animate-pulse" />
          <span>توصيل سريع لـ 58 ولاية • الدفع عند الاستلام بعد فتح ومعاينة الطرد والتأكد 100%</span>
        </div>
      </aside>

      {/* 2. HEADER */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 sticky top-[37px] sm:top-[41px] z-40 bg-white/95 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Affaire DZ"
              width={165}
              height={50}
              priority
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>

          <button
            onClick={scrollToForm}
            className="inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{hasLocation ? `اطلب الآن (${totalPrice} دج)` : 'اطلب الآن'}</span>
          </button>
        </div>
      </header>

      {/* 3. MAIN CONTENT CONTAINER */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ========================================================= */}
          {/* RIGHT COLUMN (Lg: 6 cols): PRODUCT SHOWCASE & SELECTOR     */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-5">
            
            {/* Short & Punchy Hero Card (No long text, strong keywords) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="inline-flex items-center gap-1 bg-[#222355]/10 text-[#222355] px-2.5 py-1 rounded-full text-xs font-black">
                  <Sparkles className="w-3.5 h-3.5" />
                  عرض ترويجي خاص
                </span>
                {hasLocation ? (
                  <span className="inline-block bg-[#DC2626] text-white px-2.5 py-0.5 rounded-md text-xs font-black">
                    وفر {quantity === 1 ? '1500' : quantity === 2 ? '3200' : '5100'} دج (خصم 50%)
                  </span>
                ) : (
                  <span className="inline-block bg-[#DC2626] text-white px-2.5 py-0.5 rounded-md text-xs font-black">
                    تخفيض خاص 50% لفترة محدودة
                  </span>
                )}
              </div>

              <h1 className="text-lg sm:text-xl font-black text-slate-900 mb-1 leading-snug">
                طقم ساعة يد رجالية فاخرة + خاتم وبراسلي مجاناً
              </h1>

              {/* Price Row (Hidden until Wilaya & Commune are selected) */}
              {hasLocation ? (
                <div className="flex items-baseline gap-2.5 my-3 pb-3 border-b border-slate-100">
                  <span className="text-2xl sm:text-3xl font-black text-[#222355]">{productPrice} دج</span>
                  <span className="text-sm text-slate-400 line-through">{originalPrice} دج</span>
                  <span className="text-xs text-slate-600 font-bold mr-auto">الدفع عند الاستلام</span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2.5 my-3 pb-3 border-b border-slate-100 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-900">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                    <span>حدد ولايتك وبلديتك بالأسفل لعرض السعر النهائي</span>
                  </div>
                  <span className="text-[11px] text-slate-600 font-bold shrink-0">الدفع عند الاستلام</span>
                </div>
              )}

              {/* Clear Key Points (No walls of text) */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <Package className="w-4 h-4 text-[#222355] shrink-0" />
                  <span><strong>ساعة كوارتز</strong> أنيقة</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <Check className="w-4 h-4 text-[#222355] shrink-0" />
                  <span><strong>خاتم ستانلس</strong> متناسق</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <Sparkles className="w-4 h-4 text-[#222355] shrink-0" />
                  <span><strong>براسلي كلاسيكي</strong> هدية</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <Gift className="w-4 h-4 text-[#222355] shrink-0" />
                  <span><strong>علبة إهداء</strong> فاخرة</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 font-medium">
                <span>🎁 الخاتم والبراسلي والعلبة ملحقة مجاناً مع الموديل الذي تختاره بالأسفل</span>
              </p>
            </div>

            {/* MODEL SELECTOR WITH BIG INTEGRATED PREVIEW */}
            <div ref={modelSectionRef} id="models" className="bg-white rounded-2xl border-2 border-slate-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#222355] text-white text-xs font-black flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h2 className="font-black text-sm sm:text-base text-slate-900">
                    اختر موديل الساعة (1 إلى 10)
                  </h2>
                </div>
                {selectedModel ? (
                  <span className="text-xs font-black text-[#222355] bg-[#222355]/10 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    تم اختيار: {selectedModel.name}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-[#DC2626] animate-pulse">
                    يرجى تحديد الموديل
                  </span>
                )}
              </div>

              {/* Big Clean Live Preview Box (Large, elegant image, no text clutter) */}
              <div className="mb-4 p-2 sm:p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 flex flex-col items-center justify-center">
                <div className="relative w-full max-w-[340px] aspect-square bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
                  <Image
                    src={previewModel.image}
                    alt={previewModel.name}
                    fill
                    sizes="(max-width: 640px) 300px, 340px"
                    priority
                    className="object-contain p-3"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-[#222355] text-white px-3 py-1 rounded-lg text-xs font-black shadow">
                    {previewModel.name}
                  </div>
                </div>
              </div>

              {/* 10 Clickable Thumbnails (Directly Below Preview) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {WATCH_MODELS.map((model) => {
                  const isSelected = selectedModel?.id === model.id;
                  const isPreviewing = previewModel.id === model.id;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => handleSelectModel(model)}
                      onMouseEnter={() => setPreviewModel(model)}
                      className={`relative p-2 rounded-xl text-center border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#222355] bg-[#222355]/10 ring-2 ring-[#222355]/20 shadow-md scale-102'
                          : isPreviewing
                          ? 'border-[#222355]/70 bg-slate-50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-[#222355] text-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                      <div className={`text-[10px] font-black rounded py-0.5 mb-1 ${
                        isSelected ? 'bg-[#222355] text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {model.name}
                      </div>
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-white">
                        <Image
                          src={model.image}
                          alt={model.name}
                          fill
                          sizes="80px"
                          className="object-contain p-0.5"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Trust Badges */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <Truck className="w-5 h-5 mx-auto mb-1 text-[#222355]" />
                <div className="font-bold text-slate-900">توصيل 58 ولاية</div>
                <div className="text-[10px] text-slate-500">لباب المنزل أو المكتب</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-[#222355]" />
                <div className="font-bold text-slate-900">معاينة قبل الدفع</div>
                <div className="text-[10px] text-slate-500">افتح وتأكد من ساعتك</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <Clock className="w-5 h-5 mx-auto mb-1 text-[#222355]" />
                <div className="font-bold text-slate-900">ضمان الاستبدال</div>
                <div className="text-[10px] text-slate-500">في حال وجود أي عيب</div>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* LEFT COLUMN (Lg: 6 cols): STEP-BY-STEP ORDER FORM          */}
          {/* ========================================================= */}
          <div ref={formSectionRef} id="order-form" className="lg:col-span-6 lg:sticky lg:top-[90px]">
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 sm:p-6 shadow-md">
              
              {/* Form Title */}
              <div className="border-b border-slate-100 pb-3 mb-4">
                <span className="inline-block bg-[#222355] text-white text-[10px] font-black px-2 py-0.5 rounded mb-1">
                  استمارة تأكيد الطلب
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  املأ معلوماتك أدناه لتسجيل طلبك
                </h2>
                <p className="text-xs text-slate-500">
                  سنتصل بك هاتفياً لتأكيد الشحن • الدفع نقداً عند الاستلام
                </p>
              </div>

              {/* Selected Model Confirmation Status */}
              <div className="mb-4 p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700">الموديل المطلوب:</span>
                  <button
                    type="button"
                    onClick={scrollToModels}
                    className="text-[#222355] hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    تغيير الموديل ↺
                  </button>
                </div>
                {selectedModel ? (
                  <div className="flex items-center gap-2.5 bg-white p-2 rounded-lg border border-slate-200">
                    <div className="relative w-12 h-12 bg-slate-50 rounded overflow-hidden shrink-0 border border-slate-100">
                      <Image
                        src={selectedModel.image}
                        alt={selectedModel.name}
                        fill
                        sizes="48px"
                        className="object-contain p-0.5"
                      />
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1">
                        <span>{selectedModel.name}</span>
                        <Check className="w-3.5 h-3.5 text-[#222355]" />
                      </div>
                      <div className="text-[10px] text-slate-500">+ خاتم وبراسلي مجاناً داخل علبة هدية</div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={scrollToModels}
                    className="w-full text-center py-2.5 px-3 rounded-lg border-2 border-dashed border-[#222355] text-[#222355] bg-[#222355]/5 text-xs font-bold hover:bg-[#222355]/10 transition-colors cursor-pointer animate-pulse"
                  >
                    👈 اضغط هنا لاختيار الموديل أولاً (من 1 إلى 10)
                  </button>
                )}
              </div>

              {/* Quantity Options */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الكمية المطلوبة:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PACKAGE_OFFERS.map((offer) => {
                    const isSelected = quantity === offer.quantity;
                    return (
                      <button
                        key={offer.quantity}
                        type="button"
                        onClick={() => setQuantity(offer.quantity)}
                        className={`p-2.5 rounded-xl text-center border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#222355] bg-[#222355]/5 text-slate-900 font-bold shadow-sm'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-black">{offer.title}</div>
                        <div className={`text-xs font-bold mt-0.5 ${isSelected ? 'text-[#222355]' : 'text-slate-800'}`}>
                          {hasLocation ? `${offer.totalPrice} دج` : 'اختر العرض'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STRICT FORM SEQUENCE:
                  1. Name
                  2. Phone
                  3. Wilaya
                  4. Commune
                  5. Delivery Method & Prices (Shows once wilaya & commune selected)
                  6. Detailed Address (Last input before pricing and submit button)
              */}
              <form onSubmit={handleSubmitOrder} className="space-y-3.5">
                
                {/* 1. Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم واللقب <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      required
                      placeholder="مثال: محمد بن علي"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => logCustomerData('input_blur')}
                      className="w-full pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#222355] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* 2. Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الهاتف <span className="text-[#DC2626]">*</span> (10 أرقام)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      required
                      dir="ltr"
                      placeholder="05 / 06 / 07 XX XX XX XX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => logCustomerData('input_blur')}
                      className="w-full pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#222355] focus:border-transparent text-right transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">سنتصل بك هاتفياً لتأكيد الشحن</p>
                </div>

                {/* 3. Wilaya Selection */}
                <div>
                  <label htmlFor="wilayaId" className="block text-xs font-bold text-slate-700 mb-1">
                    الولاية <span className="text-[#DC2626]">*</span> (58 ولاية)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <select
                      id="wilayaId"
                      required
                      value={wilayaId}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : '';
                        setWilayaId(val);
                      }}
                      onBlur={() => logCustomerData('input_blur')}
                      className="w-full pr-9 pl-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#222355] focus:border-transparent appearance-none cursor-pointer transition-all truncate"
                    >
                      <option value="">-- اختر ولايتك من القائمة (58 ولاية) --</option>
                      {wilayas.map((w) => (
                        <option key={w.wilaya_id} value={w.wilaya_id}>
                          {getWilayaDisplayName(w)}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 4. Commune Selection (Immediately follows Wilaya) */}
                {wilayaId ? (
                  <div>
                    <label htmlFor="communeName" className="block text-xs font-bold text-slate-700 mb-1">
                      البلدية <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <select
                        id="communeName"
                        required
                        value={communeName}
                        onChange={(e) => setCommuneName(e.target.value)}
                        onBlur={() => logCustomerData('input_blur')}
                        className="w-full pr-9 pl-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#222355] focus:border-transparent appearance-none cursor-pointer transition-all truncate"
                      >
                        <option value="">-- اختر بلديتك من القائمة --</option>
                        {communesList.map((c) => (
                          <option key={c.commune_id} value={c.commune_name}>
                            {c.commune_name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* 5. Delivery Type (Home: 700 DZD | Desk: 500 DZD no matter what) - Visible ONLY once Wilaya & Commune are chosen */}
                {hasLocation ? (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-fade-in">
                    <label className="block text-xs font-bold text-slate-800">
                      طريقة التوصيل: <span className="text-[#DC2626]">*</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Domicile / Home Option (700 DZD) */}
                      <button
                        type="button"
                        onClick={() => setDeliveryType('domicile')}
                        className={`relative p-3 rounded-xl border-2 text-right transition-all flex flex-col justify-between cursor-pointer ${
                          deliveryType === 'domicile'
                            ? 'border-[#222355] bg-[#222355]/10 text-slate-900 shadow-sm ring-2 ring-[#222355]/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Home className={`w-4 h-4 shrink-0 ${deliveryType === 'domicile' ? 'text-[#222355]' : 'text-slate-400'}`} />
                            <span className="text-xs font-black">توصيل لباب المنزل</span>
                          </div>
                          {deliveryType === 'domicile' && (
                            <span className="w-4 h-4 rounded-full bg-[#222355] text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">
                          يصلك الموزع حتى باب المنزل أو مقر العمل
                        </p>
                        <div className="flex items-baseline justify-between border-t border-slate-200/60 pt-1.5">
                          <span className="text-[10px] text-slate-500 font-medium">سعر التوصيل:</span>
                          <span className="text-sm font-black text-slate-900">700 دج</span>
                        </div>
                      </button>

                      {/* Stop Desk Option (500 DZD) */}
                      <button
                        type="button"
                        onClick={() => setDeliveryType('desk')}
                        className={`relative p-3 rounded-xl border-2 text-right transition-all flex flex-col justify-between cursor-pointer ${
                          deliveryType === 'desk'
                            ? 'border-[#222355] bg-[#222355]/10 text-slate-900 shadow-sm ring-2 ring-[#222355]/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Building2 className={`w-4 h-4 shrink-0 ${deliveryType === 'desk' ? 'text-[#222355]' : 'text-slate-400'}`} />
                            <span className="text-xs font-black">استلام من المكتب (Stop Desk)</span>
                          </div>
                          {deliveryType === 'desk' && (
                            <span className="w-4 h-4 rounded-full bg-[#222355] text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">
                          الاستلام من مكتب التوصيل في ولايتك
                        </p>
                        <div className="flex items-baseline justify-between border-t border-slate-200/60 pt-1.5">
                          <span className="text-[10px] text-slate-500 font-medium">سعر التوصيل:</span>
                          <span className="text-sm font-black text-slate-900">500 دج</span>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : wilayaId ? (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>يرجى اختيار البلدية أعلاه لتحديد طريقة الشحن والتوصيل.</span>
                  </div>
                ) : null}

                {/* 6. Detailed Address (REQUIRED ANYWAY - shown when location is selected) */}
                {hasLocation ? (
                  <div className="animate-fade-in">
                    <label htmlFor="addressDetails" className="block text-xs font-bold text-slate-700 mb-1">
                      العنوان بالتفصيل <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      id="addressDetails"
                      type="text"
                      required
                      placeholder="اسم الحي، الشارع، أو رقم المنزل (أو أقرب مكان معروف)"
                      value={addressDetails}
                      onChange={(e) => setAddressDetails(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#222355] focus:border-transparent transition-all"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      يساعد الموزع في تسليم طلبك بدقة وبدون أي تأخير
                    </p>
                  </div>
                ) : null}

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-xs font-bold flex items-start gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Order Calculation Summary Box (Shown ONLY when Wilaya and Commune are selected) */}
                {hasLocation ? (
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs animate-fade-in">
                    <div className="flex justify-between text-slate-600">
                      <span>ثمن الطقم ({quantity} علبة):</span>
                      <span className="font-bold text-slate-900">{productPrice} دج</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>مصاريف التوصيل ({deliveryType === 'desk' ? 'استلام من المكتب' : 'توصيل للمنزل'}):</span>
                      <span className="font-bold text-slate-900">{currentDeliveryFee} دج</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                      <span className="text-xs sm:text-sm font-black text-slate-900">المجموع للدفع عند الاستلام:</span>
                      <span className="text-lg sm:text-xl font-black text-[#222355]">{totalPrice} دج</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-200/80 flex items-center gap-2 text-xs text-amber-900 font-bold">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>حدد الولاية والبلدية لحساب مصاريف التوصيل وعرض السعر الإجمالي.</span>
                  </div>
                )}

                {/* Big Submit Button (Strict Color: Crimson Red #DC2626) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#DC2626] hover:bg-[#B91C1C] disabled:bg-slate-400 text-white font-black py-3.5 px-5 rounded-2xl text-base sm:text-lg shadow-lg shadow-[#DC2626]/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري تسجيل طلبك...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 shrink-0" />
                      <span>اضغط هنا لتأكيد الطلب الآن</span>
                    </>
                  )}
                </button>

                <div className="text-center text-[10px] text-slate-500 font-medium">
                  🔒 معلوماتك محمية ومحفوظة • نتصل بك هاتفياً لتأكيد الشحن قبل الإرسال
                </div>
              </form>
            </div>
          </div>

        </div>
      </main>

      {/* 4. SUCCESS POPUP MODAL */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 text-center border border-slate-200 shadow-2xl space-y-3.5">
            <div className="w-14 h-14 rounded-full bg-[#222355]/10 text-[#222355] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              تم استلام طلبك بنجاح!
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              شكراً لثقتكم بنا يا <strong className="text-slate-900">{orderSuccess.fullName}</strong>. تم تسجيل طلبكم برقم تتبع:
            </p>

            <div className="inline-block bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-xl font-mono font-bold text-slate-900 text-sm sm:text-base">
              {orderSuccess.orderId}
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 sm:p-4 text-xs text-right space-y-1.5 border border-slate-200 text-slate-700">
              <div><strong>الموديل:</strong> {orderSuccess.selectedModels?.[0]?.modelName || 'ساعة مع طقم'}</div>
              <div><strong>الولاية والبلدية:</strong> {orderSuccess.wilayaName} - {orderSuccess.communeName}</div>
              <div><strong>طريقة الاستلام:</strong> {orderSuccess.deliveryType === 'desk' ? 'استلام من المكتب' : 'لباب المنزل'}</div>
              <div><strong>العنوان:</strong> {orderSuccess.addressDetails}</div>
              <div><strong>المجموع الإجمالي:</strong> <span className="font-bold text-[#222355] text-sm">{orderSuccess.totalPrice} دج</span></div>
            </div>

            <div className="p-3 bg-[#222355]/5 rounded-xl border border-[#222355]/20 text-xs text-[#222355] font-bold">
              📞 سنتصل بك هاتفياً عبر الرقم {orderSuccess.phone} لتأكيد الشحن في أقرب وقت.
            </div>

            <button
              type="button"
              onClick={() => {
                setOrderSuccess(null);
                setSelectedModel(null);
                setWilayaId('');
                setCommuneName('');
                setAddressDetails('');
                setFullName('');
                setPhone('');
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
            >
              العودة للموقع
            </button>
          </div>
        </div>
      )}

      {/* 5. MOBILE STICKY CTA BAR (Bottom on small screens) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 p-2.5 sm:p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-40 shadow-2xl">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div>
            {hasLocation ? (
              <>
                <div className="text-[10px] text-slate-500 font-medium">المجموع الإجمالي:</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-black text-[#222355]">
                    {totalPrice} دج
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400">
                    (مع التوصيل)
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-[10px] text-slate-500 font-medium">طريقة الدفع:</div>
                <div className="text-xs sm:text-sm font-black text-[#222355]">
                  عند الاستلام
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={scrollToForm}
            className="flex-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{hasLocation ? `اطلب الآن (${totalPrice} دج)` : 'اطلب الآن'}</span>
          </button>
        </div>
      </div>

      {/* 6. FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto space-y-1">
          <p className="font-bold text-slate-700">Affaire DZ © {new Date().getFullYear()} - جميع الحقوق محفوظة</p>
          <p className="text-[11px] text-slate-400">طقم الساعات الرجالية • توصيل 58 ولاية • الدفع عند الاستلام بعد المعاينة والتأكد</p>
        </div>
      </footer>
    </div>
  );
}
