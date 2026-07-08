"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { Section } from "@/lib/types";

interface StoreSectionsGridProps {
  sections: Section[];
  storeId: string;
}

const ACCENT_COLORS = [
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-500" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", dot: "bg-sky-500" },
  { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", dot: "bg-pink-500" },
  { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", dot: "bg-slate-500" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", dot: "bg-orange-500" },
];

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
  const router = useRouter();

  if (!sections.length) return null;

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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sections.map((section, i) => {
          const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
          const grad = GRADIENT_BG[i % GRADIENT_BG.length];

          return (
            <motion.button
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.28 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push(`/store/section?id=${storeId}&section=${section.id}`)}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 text-right focus:outline-none"
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

              {/* اسم القسم — خارج الصورة */}
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${accent.dot}`} />
                  <span className="text-[13px] font-bold text-slate-800 line-clamp-1">
                    {section.name}
                  </span>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-primary transition-colors" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
