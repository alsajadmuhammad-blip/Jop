"use client"

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Section } from "@/lib/types";

interface StoreSectionsNavProps {
  sections: Section[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export function StoreSectionsNav({
  sections,
  activeSection,
  onSectionChange,
}: StoreSectionsNavProps) {
  const navRef = useRef<HTMLDivElement | null>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const updateShadows = () => {
      setShowLeftShadow(el.scrollLeft > 4);
      setShowRightShadow(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    updateShadows();
    el.addEventListener("scroll", updateShadows, { passive: true });
    window.addEventListener("resize", updateShadows);

    return () => {
      el.removeEventListener("scroll", updateShadows);
      window.removeEventListener("resize", updateShadows);
    };
  }, [sections]);

  return (
    <div className="mb-6 relative">
      <nav
        ref={navRef}
        className="w-full min-w-0 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
        aria-label="تنقل أقسام المتجر"
      >
        <div className="flex min-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 shadow-sm">
          <Button
            variant={activeSection === "all" ? "default" : "outline"}
            className="flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs"
            onClick={() => onSectionChange("all")}
          >
            الكل
          </Button>

          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "outline"}
              className="flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs"
              onClick={() => onSectionChange(section.id)}
            >
              {section.name}
            </Button>
          ))}
        </div>
      </nav>
      {showLeftShadow && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-slate-50 to-transparent" />
      )}
      {showRightShadow && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-slate-50 to-transparent" />
      )}
    </div>
  );
}
