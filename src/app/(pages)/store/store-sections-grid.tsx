"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import type { Section } from "@/lib/types";

interface StoreSectionsGridProps {
  sections: Section[];
  storeId: string;
}

const GRADIENTS = [
  "from-violet-400 to-purple-600",
  "from-rose-400 to-pink-600",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-600",
  "from-sky-400 to-blue-600",
  "from-fuchsia-400 to-pink-500",
  "from-slate-400 to-slate-600",
  "from-orange-400 to-red-500",
];

/* ══ الشريحة الواحدة ══ */
function SectionCard({
  section,
  index,
  onClick,
  isSlider,
}: {
  section: Section;
  index: number;
  onClick: () => void;
  isSlider: boolean;
}) {
  const grad = GRADIENTS[index % GRADIENTS.length];

  return (
    <button
      onClick={onClick}
      className={`group flex-shrink-0 focus:outline-none ${
        isSlider ? "w-28 sm:w-32" : "w-full"
      }`}
    >
      {/* صورة / تدرج */}
      <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "3/4" }}>
        {section.imageUrl ? (
          <Image
            src={section.imageUrl}
            alt={section.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="128px"
            quality={70}
            decoding="async"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-end justify-start p-2`}>
            <span className="text-4xl font-black text-white/25 select-none leading-none">
              {section.name.charAt(0)}
            </span>
          </div>
        )}
        {/* تدرج سفلي خفيف */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-2xl" />
        {/* اسم القسم فوق الصورة */}
        <div className="absolute bottom-0 inset-x-0 px-2.5 pb-2.5">
          <p className="text-white text-[12px] font-bold leading-tight line-clamp-2 text-right drop-shadow">
            {section.name}
          </p>
        </div>
      </div>
    </button>
  );
}

export function StoreSectionsGrid({ sections, storeId }: StoreSectionsGridProps) {
  const router  = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);

  if (!sections.length) return null;

  const isSlider = sections.length > 4;

  const navigate = (section: Section) =>
    router.push(`/store/section?id=${storeId}&section=${section.id}`);

  return (
    <div className="pt-4 pb-2">
      {/* رأس القسم */}
      <div className="flex items-center justify-between mb-3 px-3 sm:px-4">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full block" />
          الأقسام
        </h2>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">
          {sections.length}
        </span>
      </div>

      {isSlider ? (
        /* ── سلايدر أفقي عند أكثر من 4 أقسام ── */
        <div className="relative">
          <div
            ref={trackRef}
            className="flex gap-2.5 overflow-x-auto px-3 sm:px-4 pb-2"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          >
            {sections.map((section, i) => (
              <SectionCard
                key={section.id}
                section={section}
                index={i}
                onClick={() => navigate(section)}
                isSlider
              />
            ))}
            {/* spacer للإيحاء بوجود المزيد */}
            <div className="w-4 flex-shrink-0" aria-hidden="true" />
          </div>

          {/* تدرج يمين يوحي بأن هناك محتوى مخفي */}
          <div
            className="pointer-events-none absolute top-0 left-0 bottom-2 w-10"
            style={{ background: "linear-gradient(to left, rgba(248,250,252,0.95), transparent)" }}
          />
        </div>
      ) : (
        /* ── شبكة عند 4 أقسام أو أقل ── */
        <div className="grid grid-cols-4 gap-2.5 px-3 sm:px-4">
          {sections.map((section, i) => (
            <SectionCard
              key={section.id}
              section={section}
              index={i}
              onClick={() => navigate(section)}
              isSlider={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
