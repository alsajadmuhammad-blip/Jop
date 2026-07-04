"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  fetchDiscountCodesByStore,
  createDiscountCode,
  toggleDiscountCode,
  deleteDiscountCode,
  type DiscountCode,
} from "@/services/discount-codes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Code badge — copy on click ──────────────────────────────
function CodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-mono font-bold text-slate-800 hover:bg-slate-100 transition-colors"
    >
      {code}
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-slate-400" />}
    </button>
  );
}

// ── Single code card ────────────────────────────────────────
function DiscountCodeCard({
  dc,
  onToggle,
  onDelete,
}: {
  dc: DiscountCode;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const isExpired = dc.expiresAt ? new Date(dc.expiresAt) < new Date() : false;
  const isExhausted = dc.maxUses !== null && dc.usedCount >= dc.maxUses;
  const effectivelyActive = dc.isActive && !isExpired && !isExhausted;

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${effectivelyActive ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-slate-50/50 opacity-60"}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <CodeBadge code={dc.code} />
        <div className="flex items-center gap-2">
          {effectivelyActive && (
            <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">نشط</span>
          )}
          {isExpired && (
            <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-bold">منتهي الصلاحية</span>
          )}
          {isExhausted && !isExpired && (
            <span className="rounded-full bg-orange-100 text-orange-600 px-2 py-0.5 text-[10px] font-bold">استُنفد</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
        <span className="font-bold text-rose-600 text-base">{dc.discountPercent}% خصم</span>
        <span>استُخدم: {dc.usedCount}{dc.maxUses !== null ? `/${dc.maxUses}` : ""} مرة</span>
        {dc.expiresAt && (
          <span>ينتهي: {new Date(dc.expiresAt).toLocaleDateString("ar-IQ")}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(dc.id, !dc.isActive)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            dc.isActive
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          {dc.isActive
            ? <><ToggleLeft className="h-3.5 w-3.5" />تعطيل</>
            : <><ToggleRight className="h-3.5 w-3.5" />تفعيل</>}
        </button>
        <button
          onClick={() => onDelete(dc.id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          حذف
        </button>
      </div>
    </div>
  );
}

// ── نسب الخصم الجاهزة ───────────────────────────────────────
const PERCENT_PRESETS = [5, 10, 15, 20, 25, 30, 40, 50];

// ── خيارات المدة ─────────────────────────────────────────────
type DurationOption = { label: string; days: number | null };
const DURATION_OPTIONS: DurationOption[] = [
  { label: "بدون انتهاء", days: null },
  { label: "يوم",         days: 1    },
  { label: "3 أيام",      days: 3    },
  { label: "أسبوع",       days: 7    },
  { label: "أسبوعين",     days: 14   },
  { label: "شهر",         days: 30   },
];

// ── Create form ─────────────────────────────────────────────
function CreateCodeForm({
  storeId,
  onCreated,
}: {
  storeId: string;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState<number | null>(null);
  const [customPercent, setCustomPercent] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [durationDays, setDurationDays] = useState<number | null | "unset">("unset");
  const [saving, setSaving] = useState(false);

  const effectivePercent = percent ?? (customPercent ? Number(customPercent) : null);

  const handleSubmit = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) { toast({ variant: "destructive", title: "أدخل اسم الكود" }); return; }
    if (!/^[A-Z0-9_-]{2,20}$/.test(trimmedCode)) {
      toast({ variant: "destructive", title: "الكود يجب أن يكون أحرف إنجليزية وأرقام فقط (2-20 حرف)" });
      return;
    }
    if (!effectivePercent || effectivePercent < 1 || effectivePercent > 99) {
      toast({ variant: "destructive", title: "اختر نسبة الخصم أولاً" }); return;
    }
    if (durationDays === "unset") {
      toast({ variant: "destructive", title: "اختر مدة صلاحية الكود" }); return;
    }

    const expiresAt = durationDays !== null
      ? new Date(Date.now() + durationDays * 86_400_000).toISOString()
      : null;

    setSaving(true);
    try {
      await createDiscountCode({
        storeId,
        code: trimmedCode,
        discountPercent: effectivePercent,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt,
      });
      toast({ title: "تم إنشاء الكود! 🎟️", description: `الكود "${trimmedCode}" جاهز للاستخدام.` });
      setCode(""); setPercent(null); setCustomPercent(""); setMaxUses(""); setDurationDays("unset");
      onCreated();
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-slate-800">كود خصم جديد</span>
      </div>

      {/* اسم الكود */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600">اسم الكود</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="مثال: RAMADAN"
          maxLength={20}
          dir="ltr"
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-mono uppercase tracking-widest outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {/* نسبة الخصم — chips */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-600">نسبة الخصم</label>
        <div className="flex flex-wrap gap-2">
          {PERCENT_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setPercent(p); setCustomPercent(""); }}
              className={`rounded-full px-4 py-1.5 text-sm font-bold border transition-all ${
                percent === p && !customPercent
                  ? "bg-primary text-white border-primary shadow-sm scale-105"
                  : "bg-white text-slate-700 border-slate-200 hover:border-primary hover:text-primary"
              }`}
            >
              {p}%
            </button>
          ))}
          {/* خانة مخصصة */}
          <div className="relative">
            <input
              type="number"
              min={1}
              max={99}
              value={customPercent}
              onChange={(e) => { setCustomPercent(e.target.value); setPercent(null); }}
              placeholder="أخرى"
              dir="ltr"
              className={`h-9 w-20 rounded-full border px-3 text-sm font-bold text-center outline-none transition-all ${
                customPercent
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-slate-200 bg-white text-slate-500 hover:border-primary"
              }`}
            />
          </div>
        </div>
        {effectivePercent && effectivePercent >= 1 && effectivePercent <= 99 && (
          <p className="text-xs font-semibold text-emerald-600">
            ✅ خصم {effectivePercent}% على كل طلب يستخدم هذا الكود
          </p>
        )}
      </div>

      {/* المدة — chips */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-600">صلاحية الكود</label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((opt) => {
            const isSelected = durationDays !== "unset" && durationDays === opt.days;
            return (
              <button
                key={String(opt.days)}
                type="button"
                onClick={() => setDurationDays(opt.days)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold border transition-all ${
                  isSelected
                    ? "bg-primary text-white border-primary shadow-sm scale-105"
                    : "bg-white text-slate-700 border-slate-200 hover:border-primary hover:text-primary"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* الحد الأقصى للاستخدام */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600">
          الحد الأقصى للاستخدام
          <span className="mr-1 text-slate-400 font-normal">(اختياري — فارغ = غير محدود)</span>
        </label>
        <input
          type="number"
          min={1}
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          placeholder="غير محدود"
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          dir="ltr"
        />
      </div>

      <Button onClick={handleSubmit} disabled={saving} className="w-full rounded-lg gap-2 font-bold">
        <Tag className="h-4 w-4" />
        {saving ? "جاري الإنشاء…" : "إنشاء الكود 🎟️"}
      </Button>
    </div>
  );
}

// ── Main tab ────────────────────────────────────────────────
export function DiscountCodesTab({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await fetchDiscountCodesByStore(storeId);
    setCodes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [storeId]);

  const handleToggle = async (id: string, active: boolean) => {
    await toggleDiscountCode(id, active);
    toast({ title: active ? "تم تفعيل الكود" : "تم تعطيل الكود" });
    load();
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const ok = await deleteDiscountCode(pendingDelete);
    if (ok) { toast({ title: "تم حذف الكود" }); load(); }
    setPendingDelete(null);
  };

  return (
    <>
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف كود الخصم</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد؟ لا يمكن التراجع.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                كودات الخصم
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                أنشئ كوداً وشاركه — الزبون يكتبه عند الطلب ويحصل على خصم تلقائي
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg gap-1.5 font-semibold"
              variant={showForm ? "outline" : "default"}
            >
              <Plus className="h-4 w-4" />
              {showForm ? "إلغاء" : "كود جديد"}
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {showForm && (
              <CreateCodeForm
                storeId={storeId}
                onCreated={() => { setShowForm(false); load(); }}
              />
            )}

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : codes.length > 0 ? (
              <div className="space-y-3">
                {codes.map((dc) => (
                  <DiscountCodeCard
                    key={dc.id}
                    dc={dc}
                    onToggle={handleToggle}
                    onDelete={setPendingDelete}
                  />
                ))}
              </div>
            ) : !showForm ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                  <Tag className="h-7 w-7 text-primary" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-slate-700">لا توجد كودات بعد</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">أنشئ أول كود خصم لزبائنك</p>
                <Button size="sm" onClick={() => setShowForm(true)} className="rounded-lg gap-1.5 font-semibold">
                  <Tag className="h-4 w-4" />
                  إنشاء كود خصم
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
