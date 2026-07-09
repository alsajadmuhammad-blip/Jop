"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowRight, ShoppingCart, Check,
  Zap, Clock, Star, Truck, MapPin, Package,
  Globe, MessageSquare, CreditCard,
  User, Phone, Wallet, Loader2, X,
} from "lucide-react";
import { ProductRatingWrapper } from "@/components/product-rating-wrapper";
import { supabase } from "@/services/supabase";
import { fetchStoreById } from "@/services/supabase-db";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product, Store, OrderItem } from "@/lib/types";
import {
  hasActiveFlashSale, hasActiveDiscount, getEffectivePrice,
} from "@/lib/types";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ProductGallery } from "@/components/product-gallery";
import { createOrder } from "@/services/orders";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const IRAQI_GOVERNORATES = [
  "بغداد", "البصرة", "نينوى", "أربيل", "الأنبار",
  "كركوك", "النجف", "كربلاء", "ذي قار", "بابل",
  "صلاح الدين", "ديالى", "واسط", "القادسية", "المثنى",
  "السليمانية", "دهوك", "ميسان", "حلبجة",
];

interface CheckoutForm {
  name: string;
  phone: string;
  phoneBackup: string;
  governorate: string;
  address: string;
  notes: string;
}

const emptyForm: CheckoutForm = {
  name: "", phone: "", phoneBackup: "", governorate: "", address: "", notes: "",
};

/* ────────────────────────────────────────────
   عداد الفلاش سيل
──────────────────────────────────────────── */
function FlashCountdown({ endsAt }: { endsAt: string }) {
  const { formatted, isExpired } = useCountdown(endsAt);
  if (isExpired) return null;
  const [hh, mm, ss] = formatted.split(":");
  return (
    <div className="flex items-center gap-1.5">
      <Clock className="w-3.5 h-3.5 text-amber-600" />
      <span className="text-[12px] font-bold text-amber-700 tabular-nums">{hh}:{mm}:{ss}</span>
    </div>
  );
}

/* ────────────────────────────────────────────
   حالة التحميل
──────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="relative bg-white" style={{ aspectRatio: "1/1", maxHeight: 420 }}>
        <Skeleton className="w-full h-full rounded-none" />
      </div>
      <div className="px-4 pt-5 space-y-3">
        <Skeleton className="h-7 w-3/4 rounded-xl" />
        <Skeleton className="h-5 w-1/3 rounded-xl" />
        <Skeleton className="h-4 w-full rounded-xl" />
        <Skeleton className="h-4 w-2/3 rounded-xl" />
        <Skeleton className="h-14 w-full rounded-2xl mt-6" />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   بطاقة المتجر المصغّرة
──────────────────────────────────────────── */
function MiniStoreCard({ store }: { store: Store }) {
  const router = useRouter();
  const cleanWA = store.whatsappNumber?.replace(/[^0-9+]/g, "") || "";
  const whatsappHref = cleanWA ? `https://wa.me/${cleanWA.replace(/^\+/, "")}` : undefined;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/80">
        <h2 className="text-sm font-bold text-slate-700">من المتجر</h2>
      </div>
      <div className="px-4 py-3 flex items-center gap-3">
        <div
          className="relative w-12 h-12 rounded-xl border border-slate-100 bg-white overflow-hidden flex-shrink-0"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
        >
          {store.logoUrl ? (
            store.logoUrl.startsWith("data:") ? (
              <img src={store.logoUrl} alt={store.name} className="w-full h-full object-contain p-1" />
            ) : (
              <Image src={store.logoUrl} alt={store.name} fill className="object-contain p-1" sizes="48px" />
            )
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-slate-100">
              <Globe className="w-6 h-6 text-primary/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-900 truncate">{store.name}</p>
          {store.marketType && (
            <p className="text-[11px] text-slate-400 font-medium">{store.marketType}</p>
          )}
          {store.reviews > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-amber-700">{store.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => router.push(`/store?id=${store.id}`)}
            className="h-8 px-3 rounded-xl bg-primary text-white text-[11px] font-bold hover:bg-primary/90 transition-colors"
          >
            زيارة المتجر
          </button>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 h-8 px-3 rounded-xl text-white text-[11px] font-bold"
              style={{ background: "#25D366" }}
            >
              <MessageSquare className="w-3 h-3" />
              واتساب
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-50 bg-slate-50/60">
        {store.hasDelivery && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <Truck className="w-3 h-3" />
            توصيل متوفر
          </div>
        )}
        {store.location && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{store.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   نافذة الشراء الفوري
──────────────────────────────────────────── */
function BuyNowDialog({
  open,
  onClose,
  product,
  store,
}: {
  open: boolean;
  onClose: () => void;
  product: Product;
  store: Store | null;
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState<CheckoutForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, name: user?.name || "" });
      setErrors({});
    }
  }, [open, user?.name]);

  const setField = (field: keyof CheckoutForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const e: Partial<CheckoutForm> = {};
    if (!form.name.trim())       e.name       = "مطلوب";
    if (!form.phone.trim())      e.phone      = "مطلوب";
    if (!form.governorate)       e.governorate= "مطلوب";
    if (!form.address.trim())    e.address    = "مطلوب";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    let whatsapp = store?.whatsappNumber?.trim() || "";
    if (!whatsapp) {
      toast({ variant: "destructive", title: "خطأ", description: "رقم واتساب المتجر غير متوفر." });
      return;
    }

    setIsSubmitting(true);
    try {
      const unitPrice  = getEffectivePrice(product);
      const orderItems: OrderItem[] = [{
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice,
      }];

      const order = await createOrder(
        product.storeId,
        store?.name || "",
        user?.id ?? null,
        form.name.trim(),
        form.phone.trim(),
        orderItems,
        unitPrice,
        form.notes.trim() || undefined,
        "whatsapp",
        form.phoneBackup.trim() || undefined,
        form.governorate || undefined,
        form.address.trim() || undefined,
      );

      if (!order) throw new Error("فشل إنشاء الطلب.");

      let msg = `*طلب جديد — منصة مركزي*\n`;
      msg += `────────────────────\n`;
      msg += `*رقم الطلب:* ${order.id.slice(0, 8).toUpperCase()}\n\n`;
      msg += `*المنتج:*\n`;
      msg += `• ${product.name} × 1 = ${unitPrice.toLocaleString()} د.ع\n`;
      msg += `────────────────────\n`;
      msg += `*الإجمالي:* ${unitPrice.toLocaleString()} د.ع\n\n`;
      msg += `*معلومات العميل:*\n`;
      msg += `• الاسم: ${form.name.trim()}\n`;
      msg += `• الهاتف: ${form.phone.trim()}\n`;
      if (form.phoneBackup.trim()) msg += `• هاتف احتياطي: ${form.phoneBackup.trim()}\n`;
      msg += `\n*عنوان التوصيل:*\n`;
      msg += `• المحافظة: ${form.governorate}\n`;
      msg += `• العنوان: ${form.address.trim()}\n`;
      msg += `*الدفع:* عند الاستلام\n`;
      if (form.notes.trim()) msg += `\n*ملاحظات:* ${form.notes.trim()}\n`;
      msg += `\n📱 منصة مركزي`;

      window.open(
        `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`,
        "_blank",
      );

      onClose();
      toast({ title: "تم إرسال الطلب ✓", description: "سيتواصل معك المتجر عبر واتساب." });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: err instanceof Error ? err.message : "حدث خطأ أثناء إرسال الطلب.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const price = getEffectivePrice(product);

  return (
    
      {open && (
        <>
          {/* خلفية معتمة */}
          <div
            key="backdrop"}}}}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* نافذة الشراء */}
          <div
            key="dialog"}}}}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl"
            dir="rtl"
          >
            {/* مقبض */}
            <div className="sticky top-0 bg-white z-10 pt-3 pb-2">
              <div className="mx-auto w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* رأس النافذة */}
            <div className="flex items-center justify-between px-5 pb-4 pt-1">
              <div>
                <h2 className="text-lg font-black text-slate-900">اشتري الآن</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {store?.name ? `الطلب من: ${store.name}` : "إتمام الطلب"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="px-5 space-y-5 pb-8">

              {/* ملخص المنتج */}
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-100 flex-shrink-0">
                  {product.imageUrl ? (
                    product.imageUrl.startsWith("data:") ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="64px" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-7 h-7 text-slate-200" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 line-clamp-2 leading-snug">{product.name}</p>
                  <p className="text-lg font-black text-primary mt-1">
                    {price.toLocaleString()}
                    <span className="text-xs font-bold text-slate-400 mr-1">د.ع</span>
                  </p>
                </div>
              </div>

              {/* معلومات التواصل */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">معلومات التواصل</span>
                </div>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="bn-name" className="text-xs font-semibold text-slate-600">
                      الاسم الكامل <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="bn-name"
                      placeholder="مثال: أحمد محمد"
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      className={`h-11 rounded-xl text-sm ${errors.name ? "border-rose-400 focus-visible:ring-rose-300" : ""}`}
                    />
                    {errors.name && <p className="text-[11px] text-rose-500 font-medium">{errors.name}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label htmlFor="bn-phone" className="text-xs font-semibold text-slate-600">
                        الهاتف <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="bn-phone"
                        placeholder="07xxxxxxxxx"
                        value={form.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                        dir="ltr"
                        className={`h-11 rounded-xl text-sm ${errors.phone ? "border-rose-400" : ""}`}
                      />
                      {errors.phone && <p className="text-[11px] text-rose-500">{errors.phone}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="bn-phone2" className="text-xs font-semibold text-slate-400">
                        هاتف احتياطي
                      </Label>
                      <Input
                        id="bn-phone2"
                        placeholder="07xxxxxxxxx"
                        value={form.phoneBackup}
                        onChange={(e) => setField("phoneBackup", e.target.value)}
                        dir="ltr"
                        className="h-11 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* عنوان التوصيل */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">عنوان التوصيل</span>
                </div>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="bn-gov" className="text-xs font-semibold text-slate-600">
                      المحافظة <span className="text-rose-500">*</span>
                    </Label>
                    <Select value={form.governorate} onValueChange={(v) => setField("governorate", v)}>
                      <SelectTrigger
                        id="bn-gov"
                        className={`h-11 rounded-xl text-sm ${errors.governorate ? "border-rose-400" : ""}`}
                      >
                        <SelectValue placeholder="اختر محافظتك" />
                      </SelectTrigger>
                      <SelectContent>
                        {IRAQI_GOVERNORATES.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.governorate && <p className="text-[11px] text-rose-500">{errors.governorate}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="bn-addr" className="text-xs font-semibold text-slate-600">
                      العنوان التفصيلي <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="bn-addr"
                      placeholder="مثال: الكرخ، شارع المتنبي، بناية رقم 12"
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                      className={`resize-none rounded-xl text-sm ${errors.address ? "border-rose-400" : ""}`}
                      rows={2}
                    />
                    {errors.address && <p className="text-[11px] text-rose-500">{errors.address}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="bn-notes" className="text-xs font-semibold text-slate-400">
                      ملاحظات إضافية <span className="text-[10px]">(اختياري)</span>
                    </Label>
                    <Textarea
                      id="bn-notes"
                      placeholder="أي تعليمات خاصة..."
                      value={form.notes}
                      onChange={(e) => setField("notes", e.target.value)}
                      className="resize-none rounded-xl text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* إشعار الدفع */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">الدفع عند الاستلام</p>
                  <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">
                    سيتم التنسيق النهائي مع المتجر عبر واتساب بعد إرسال الطلب.
                  </p>
                </div>
              </div>

              {/* أزرار الإجراء */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="h-13 rounded-2xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                  style={{ height: "52px" }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-13 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                  style={{
                    height: "52px",
                    background: isSubmitting
                      ? "#64748b"
                      : "linear-gradient(135deg,#1d4ed8 0%,#2563eb 60%,#3b82f6 100%)",
                    boxShadow: isSubmitting ? "none" : "0 6px 20px rgba(37,99,235,0.35)",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4" />
                      إرسال عبر واتساب
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </>
      )}
    
  );
}

/* ────────────────────────────────────────────
   صفحة تفاصيل المنتج الرئيسية
──────────────────────────────────────────── */
export default function ProductPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const storeIdParam = searchParams.get("id");

  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [buyNowOpen, setBuyNowOpen] = useState(false);

  // live rating state — updates after successful submit without page reload
  const [liveRating, setLiveRating] = useState<number | null>(null);
  const [liveReviews, setLiveReviews] = useState<number | null>(null);
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (!productId) { setLoading(false); return; }

    (async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .limit(1)
          .single();

        if (error || !data) throw new Error("المنتج غير موجود");

        let extraImages: string[] = [];
        const rawImages = data.images;
        if (Array.isArray(rawImages)) {
          extraImages = rawImages.filter((u: unknown) => typeof u === "string" && u.length > 0);
        } else if (typeof rawImages === "string" && rawImages.startsWith("[")) {
          try { extraImages = JSON.parse(rawImages).filter((u: unknown) => typeof u === "string"); } catch { /* ignore */ }
        }

        const p: Product = {
          id: String(data.id),
          name: data.name,
          description: data.description || "",
          price: data.price,
          discountPercent: data.discount_percent ?? data.discountPercent,
          imageUrl: data.image_url ?? data.imageUrl,
          images: extraImages.length > 0 ? extraImages : undefined,
          storeId: String(data.store_id ?? data.storeId),
          categoryId: data.category_id ?? data.categoryId,
          sectionId: data.section_id ?? data.sectionId,
          sectionName: data.section_name ?? data.sectionName,
          sku: data.sku,
          stock: data.stock ?? 0,
          isFeatured: data.is_featured ?? data.isFeatured ?? false,
          createdAt: data.created_at ?? data.createdAt,
          updatedAt: data.updated_at ?? data.updatedAt,
          flashPrice: data.flash_price ?? data.flashPrice,
          flashEndsAt: data.flash_ends_at ?? data.flashEndsAt,
          rating: typeof data.rating === "number" ? data.rating : Number(data.rating ?? 0),
          reviews: typeof data.reviews === "number" ? data.reviews : Number(data.reviews ?? 0),
        };

        setProduct(p);

        const sid = storeIdParam || p.storeId;
        if (sid) {
          const fetchedStore = await fetchStoreById(sid);
          if (fetchedStore) setStore(fetchedStore);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [productId, storeIdParam]);

  if (loading) return <LoadingSkeleton />;

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-600">المنتج غير موجود</p>
          <button
            onClick={() => router.back()}
            className="text-sm font-bold text-primary hover:underline"
          >
            رجوع
          </button>
        </div>
      </div>
    );
  }

  const flash = hasActiveFlashSale(product);
  const onSale = flash || hasActiveDiscount(product);
  const displayPrice = getEffectivePrice(product);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const galleryImages: string[] = [];
  if (product.imageUrl) galleryImages.push(product.imageUrl);
  if (product.images) {
    product.images.forEach(img => {
      if (!galleryImages.includes(img)) galleryImages.push(img);
    });
  }

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem(product);
    toast({ title: "أُضيف للسلة ✓", description: product.name, productImage: product.imageUrl });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    setBuyNowOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32" dir="rtl">

      {/* ───── معرض الصور ───── */}
      <ProductGallery images={galleryImages} alt={product.name} priority>
        {/* تدرج علوي */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* زر الرجوع */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-black/30 backdrop-blur-md text-white text-[13px] font-bold px-3 py-2 rounded-full border border-white/20 hover:bg-black/40 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>

        {/* الشارات */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-end">
          {flash && (
            <div className="flex items-center gap-1.5 bg-amber-500 rounded-full px-3 py-1.5">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
              <span className="text-[11px] font-black text-white">فلاش سيل</span>
            </div>
          )}
          {!flash && hasActiveDiscount(product) && (
            <div className="bg-rose-500 text-white text-[11px] font-black px-3 py-1.5 rounded-full">
              خصم {product.discountPercent}%
            </div>
          )}
          {product.isFeatured && !flash && !hasActiveDiscount(product) && (
            <div className="bg-primary text-white text-[11px] font-black px-3 py-1.5 rounded-full">
              مميز
            </div>
          )}
        </div>

        {/* نفد المخزون */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
            <span className="bg-white text-slate-700 text-sm font-black px-6 py-2.5 rounded-full shadow-lg">
              نفد المخزون
            </span>
          </div>
        )}
      </ProductGallery>

      {/* ───── تفاصيل المنتج ───── */}
      <div}}}
        className="px-4 pt-5 space-y-4"
      >
        {/* الاسم + التقييم */}
        <div>
          <h1 className="text-xl font-black text-slate-900 leading-tight">{product.name}</h1>
          {product.sectionName && (
            <span className="inline-block mt-1.5 bg-slate-100 text-slate-600 text-[11px] font-bold px-2.5 py-1 rounded-full">
              {product.sectionName}
            </span>
          )}
          {/* عرض التقييم الحالي */}
          {(() => {
            const r = liveRating ?? product.rating ?? 0;
            const n = liveReviews ?? product.reviews ?? 0;
            return n > 0 ? (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex gap-0.5" dir="ltr">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(r) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`} />
                  ))}
                </div>
                <span className="text-sm font-bold text-amber-700">{r.toFixed(1)}</span>
                <span className="text-xs text-slate-400">({n} تقييم)</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-2">لا توجد تقييمات بعد — كن أول من يُقيّم!</p>
            );
          })()}
        </div>

        {/* السعر */}
        <div className="flex items-end gap-3">
          <div>
            {onSale && (
              <p className="text-xs text-slate-400 line-through mb-0.5">
                {product.price.toLocaleString()} د.ع
              </p>
            )}
            <p className={cn(
              "text-3xl font-black leading-none",
              flash ? "text-amber-600" : onSale ? "text-rose-600" : "text-slate-900"
            )}>
              {displayPrice.toLocaleString()}
              <span className="text-base font-bold text-slate-400 mr-1">د.ع</span>
            </p>
          </div>

          {flash && product.flashEndsAt && (
            <div className="pb-0.5 flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
              <FlashCountdown endsAt={product.flashEndsAt} />
            </div>
          )}
        </div>

        {/* المخزون */}
        {!isOutOfStock && (
          <div className={cn(
            "flex items-center gap-1.5 text-sm font-bold",
            isLowStock ? "text-amber-600" : "text-emerald-600"
          )}>
            <div className={cn("w-2 h-2 rounded-full", isLowStock ? "bg-amber-400" : "bg-emerald-400")} />
            {isLowStock
              ? `آخر ${product.stock} قطع فقط`
              : `متوفر في المخزون (${product.stock} قطعة)`
            }
          </div>
        )}

        {/* الوصف */}
        {product.description && product.description.trim() && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/80">
              <h2 className="text-sm font-bold text-slate-700">وصف المنتج</h2>
            </div>
            <p className="px-4 py-3.5 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {/* معلومات المتجر */}
        {store && <MiniStoreCard store={store} />}

        {/* SKU */}
        {product.sku && (
          <p className="text-[11px] text-slate-400 font-medium">رمز المنتج: {product.sku}</p>
        )}

        {/* زر التقييم */}
        <div className="flex justify-center pt-1">
          <ProductRatingWrapper
            productId={product.id}
            productName={product.name}
            storeOwnerId={store?.ownerId ?? null}
            onRated={(r, n) => { setLiveRating(r); setLiveReviews(n); }}
          />
        </div>
      </div>

      {/* ───── شريط الإجراءات الثابت ───── */}
      <div className="fixed bottom-0 right-0 left-0 z-40 p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]">
        {isOutOfStock ? (
          <button
            disabled
            className="w-full h-14 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2.5 bg-slate-300 cursor-not-allowed"
          >
            <Package className="w-5 h-5" />
            نفد المخزون
          </button>
        ) : (
          <div className="flex gap-3">
            {/* أضف إلى السلة */}
            <button}
              onClick={handleAdd}
              className={cn(
                "flex-1 h-14 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 transition-all",
                added
                  ? "bg-emerald-500 shadow-emerald-200"
                  : "bg-slate-800 hover:bg-slate-700"
              )}
              style={added ? { boxShadow: "0 6px 20px rgba(16,185,129,0.35)" } : undefined}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  أُضيف للسلة
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  أضف للسلة
                </>
              )}
            </button>

            {/* اشتري الآن */}
            <button}
              onClick={handleBuyNow}
              className="flex-[1.4] h-14 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: "linear-gradient(135deg,#1d4ed8 0%,#2563eb 60%,#3b82f6 100%)",
                boxShadow: "0 8px 24px rgba(37,99,235,0.38)",
              }}
            >
              <CreditCard className="w-5 h-5" />
              اشتري الآن
            </button>
          </div>
        )}
      </div>

      {/* ───── نافذة الشراء الفوري ───── */}
      <BuyNowDialog
        open={buyNowOpen}
        onClose={() => setBuyNowOpen(false)}
        product={product}
        store={store}
      />
    </div>
  );
}
