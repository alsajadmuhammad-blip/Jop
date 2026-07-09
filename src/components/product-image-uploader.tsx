"use client";

import { useRef, useCallback } from "react";
import Image from "next/image";
import { Camera, X, Star, Plus, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────── Types ─────────────────── */
export interface ImageItem {
  id: string;
  preview: string;  // data URL or https URL
  file?: File;      // only for new uploads
  url?: string;     // already-uploaded Supabase URL
}

interface ProductImageUploaderProps {
  value: ImageItem[];
  onChange: (items: ImageItem[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

/* ─────────────────── Helper ─────────────────── */
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function ImageThumb({
  item, index, onRemove, onSetPrimary, disabled,
}: {
  item: ImageItem;
  index: number;
  onRemove: () => void;
  onSetPrimary: () => void;
  disabled?: boolean;
}) {
  const isPrimary = index === 0;

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden group select-none bg-slate-100",
        isPrimary ? "row-span-2" : ""
      )}
      style={{ aspectRatio: "1 / 1" }}
    >
      {/* الصورة */}
      {item.preview.startsWith("data:") ? (
        <img src={item.preview} alt="" className="w-full h-full object-cover" />
      ) : (
        <Image src={item.preview} alt="" fill className="object-cover" sizes="200px" />
      )}

      {/* تظليل عند التحوم */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 pointer-events-none" />

      {/* شارة الرئيسية */}
      {isPrimary && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-full shadow-md">
          <Star className="w-2.5 h-2.5 fill-white" />
          رئيسية
        </div>
      )}

      {/* زر حذف */}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* زر تعيين رئيسية (للصور غير الرئيسية) */}
      {!isPrimary && !disabled && (
        <button
          type="button"
          onClick={onSetPrimary}
          title="تعيين كصورة رئيسية"
          className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <Star className="w-2.5 h-2.5" />
          رئيسية
        </button>
      )}
    </div>
  );
}

/* ─────────────────── Main Component ─────────────────── */
export function ProductImageUploader({
  value,
  onChange,
  disabled = false,
  maxImages = 5,
}: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const remaining = maxImages - value.length;
      const toAdd = files.slice(0, remaining);

      const newItems: ImageItem[] = [];
      let loaded = 0;

      toAdd.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newItems.push({
            id: uid(),
            preview: reader.result as string,
            file,
          });
          loaded++;
          if (loaded === toAdd.length) {
            onChange([...value, ...newItems]);
          }
        };
        reader.readAsDataURL(file);
      });

      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [value, onChange, maxImages]
  );

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const setPrimary = (index: number) => {
    const items = [...value];
    const [item] = items.splice(index, 1);
    items.unshift(item);
    onChange(items);
  };

  /* ── حالة: لا توجد صور ── */
  if (value.length === 0) {
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="w-full h-40 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-primary">اضغط لرفع الصور</p>
            <p className="text-[11px] text-slate-400 mt-0.5">JPG · PNG · WEBP · حتى {maxImages} صور · 5MB لكل صورة</p>
          </div>
        </button>
      </div>
    );
  }

  /* ── حالة: يوجد صور ── */
  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* شبكة الصور */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: value.length === 1 ? "1fr" : "3fr 2fr",
          gridTemplateRows: value.length <= 3 ? "1fr 1fr" : "1fr 1fr",
        }}
      >
        {/* الصورة الرئيسية */}
        <ImageThumb
          key={value[0].id}
          item={value[0]}
          index={0}
          onRemove={() => removeImage(0)}
          onSetPrimary={() => setPrimary(0)}
          disabled={disabled}
        />

        {/* الصور الإضافية في grid 2×2 */}
        {value.length > 1 && (
          <div className="grid grid-cols-2 gap-2">
            {value.slice(1, 5).map((item, i) => (
              <ImageThumb
                key={item.id}
                item={item}
                index={i + 1}
                onRemove={() => removeImage(i + 1)}
                onSetPrimary={() => setPrimary(i + 1)}
                disabled={disabled}
              />
            ))}

            {/* زر الإضافة */}
            {value.length < maxImages && !disabled && (
              <button
                key="add-btn"
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-all duration-200"
                style={{ aspectRatio: "1 / 1" }}
              >
                <Plus className="w-5 h-5 text-slate-400" />
                <span className="text-[10px] font-semibold text-slate-400">إضافة</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* شريط معلومات + زر إضافة (عند وجود صورة واحدة فقط) */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-400">
          {value.length} / {maxImages} صور · اضغط على أي صورة لتعيينها رئيسية
        </p>
        {value.length === 1 && value.length < maxImages && !disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة صورة
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── utility: build initial items from URLs ─────────────────── */
export function buildImageItems(primaryUrl?: string, extraUrls?: string[]): ImageItem[] {
  const items: ImageItem[] = [];
  if (primaryUrl) items.push({ id: uid(), preview: primaryUrl, url: primaryUrl });
  (extraUrls ?? []).forEach(url => {
    if (url) items.push({ id: uid(), preview: url, url });
  });
  return items;
}
