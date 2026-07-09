"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Section } from "@/lib/types";

interface StoreSectionsGridProps {
  sections: Section[];
  storeId: string;
}

const GRADIENT_BG = [
  "from-violet-100 to-violet-200",
  "from-rose-100 to-rose-200",
  "from-amber-100 to-amber-200",
  "from-emerald-100 to-emerald-200",
  "from-sky-100 to-sky-200",
  "from-pink-100 to-pink-200",
  "from-slate-100 to-slate-200",
  "from-orange-100 to-orange-200",
];

export function StoreSectionsGrid({ sections, storeId }: StoreSectionsGridProps) {
  const router   = useRouter();
  const isSlider = sections.length > 4;

  if (!sections.length) return null;

  const navigate = (section: Section) =>
    router.push(`/store/section?id=${storeId}&section=${section.id}`);

  const Card = ({ section, i }: { section: Section; i: number }) => {
    const grad = GRADIENT_BG[i % GRADIENT_BG.length];
    return (
      <button
        onClick={() => navigate(section)}
        className={`group flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 text-right focus:outline-none flex-shrink-0 ${
          isSlider ? "w-40 sm:w-44" : "w-full"
        }`}
      >
        {/* صورة القسم */}
        <div className="relative w-full overflow-hidden flex-shrink-0" style={{ aspectRatio: "16/9" }}>
          {section.imageUrl ? (
            <Image
              src={section.imageUrl}
              alt={section.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 33vw"
              quality={65}
              decoding="async"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
              <span className="text-3xl font-black text-white/40 select-none">
                {section.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* اسم القسم */}
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <span className="text-[13px] font-bold text-slate-800 line-clamp-1">
            {section.name}
          </span>
          <ChevronLeft className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-primary transition-colors" />
        </div>
      </button>
    );
  };

  return (
    <div className="px-3 sm:px-4 pt-5 pb-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full block" />
          تصفح حسب القسم
        </h2>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">
          {sections.length} قسم
        </span>
      </div>

      {isSlider ? (
        /* سلايدر أفقي عند أكثر من 4 أقسام */
        <div className="relative">
          <div
            className="flex gap-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          >
            {sections.map((section, i) => (
              <Card key={section.id} section={section} i={i} />
            ))}
            {/* مسافة نهاية تكشف الكرت التالي */}
            <div className="w-2 flex-shrink-0" aria-hidden="true" />
          </div>
          {/* تدرج يمين يوحي بوجود المزيد */}
          <div
            className="pointer-events-none absolute top-0 left-0 bottom-1 w-12"
            style={{ background: "linear-gradient(to left, rgba(248,250,252,0.9), transparent)" }}
          />
        </div>
      ) : (
        /* شبكة 2–4 أعمدة عند 4 أقسام أو أقل */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sections.map((section, i) => (
            <Card key={section.id} section={section} i={i} />
          ))}
        </div>
      )}
    </div>
  );
}
