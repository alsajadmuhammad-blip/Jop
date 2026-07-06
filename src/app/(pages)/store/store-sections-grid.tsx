"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Section } from "@/lib/types";

interface StoreSectionsGridProps {
  sections: Section[];
  storeId: string;
}

const GRADIENTS = [
  ["#6d28d9", "#7c3aed"],
  ["#dc2626", "#e11d48"],
  ["#d97706", "#ea580c"],
  ["#059669", "#0d9488"],
  ["#0284c7", "#2563eb"],
  ["#c026d3", "#db2777"],
  ["#64748b", "#475569"],
  ["#b45309", "#92400e"],
];

export function StoreSectionsGrid({ sections, storeId }: StoreSectionsGridProps) {
  const router = useRouter();

  if (!sections.length) return null;

  return (
    <div className="px-3 sm:px-4 pt-5 pb-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full block" />
          تصفح حسب القسم
        </h2>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">
          {sections.length} قسم
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {sections.map((section, i) => {
          const [c1, c2] = GRADIENTS[i % GRADIENTS.length];
          return (
            <motion.button
              key={section.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push(`/store/section?id=${storeId}&section=${section.id}`)}
              className="group relative overflow-hidden rounded-2xl focus:outline-none"
              style={{ aspectRatio: "4/3" }}
            >
              {section.imageUrl ? (
                <Image
                  src={section.imageUrl}
                  alt={section.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: `linear-gradient(135deg, ${c1}22, ${c2}44)`, backgroundColor: "#f8fafc" }}
                >
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{ background: `radial-gradient(circle at 70% 30%, ${c1}, transparent 60%)` }}
                  />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />

              <div className="absolute bottom-0 right-0 left-0 p-3 text-right">
                <span className="block text-white font-bold text-sm leading-snug drop-shadow-sm">
                  {section.name}
                </span>
                <span
                  className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white/90"
                  style={{ background: `${c1}88` }}
                >
                  تصفح →
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
