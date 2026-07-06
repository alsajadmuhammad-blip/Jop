"use client";

import Image from "next/image";
import { X, ArrowLeftRight, Trash2, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompare } from "./compare-context";

export function CompareBar() {
  const ctx = useCompare();
  if (!ctx) return null;
  const { selected, removeProduct, clearAll, openSheet } = ctx;

  return (
    <AnimatePresence>
      {selected.length > 0 && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="fixed bottom-0 right-0 left-0 z-50 px-3 pb-4 pt-2"
          dir="rtl"
        >
          <div
            className="mx-auto max-w-lg rounded-2xl border border-white/30 overflow-hidden"
            style={{
              background: "rgba(15,23,42,0.92)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 -4px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            {/* رأس الشريط */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-3.5 h-3.5 text-white/60" />
                <span className="text-[12px] font-black text-white/80 tracking-wide uppercase">
                  المقارنة
                </span>
                <span className="text-[11px] font-bold text-white/40">
                  {selected.length}/2
                </span>
              </div>
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                مسح
              </button>
            </div>

            {/* المنتجات المختارة */}
            <div className="flex items-center gap-3 px-4 pb-3">
              {[0, 1].map(i => {
                const p = selected[i];
                return (
                  <div key={i} className="flex-1">
                    <AnimatePresence mode="popLayout">
                      {p ? (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                          className="relative flex items-center gap-2 bg-white/10 rounded-xl p-2 border border-white/10"
                        >
                          {/* صورة مصغرة */}
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                            {p.imageUrl ? (
                              p.imageUrl.startsWith("data:") ? (
                                <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Image src={p.imageUrl} alt="" fill className="object-cover" sizes="40px" />
                              )
                            ) : (
                              <div className="flex items-center justify-center w-full h-full">
                                <ImageIcon className="w-4 h-4 text-white/20" />
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] font-bold text-white/90 line-clamp-2 leading-tight flex-1 min-w-0">
                            {p.name}
                          </p>
                          {/* زر الحذف */}
                          <button
                            onClick={() => removeProduct(p.id)}
                            className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-600 border border-white/20 flex items-center justify-center hover:bg-rose-500 transition-colors"
                          >
                            <X className="w-2.5 h-2.5 text-white" />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-center h-14 rounded-xl border border-dashed border-white/15 text-white/25 text-[11px] font-bold"
                        >
                          + اختر منتج
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* زر المقارنة */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={openSheet}
                disabled={selected.length < 2}
                className="flex-shrink-0 flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl font-black text-[11px] transition-all disabled:opacity-30"
                style={
                  selected.length === 2
                    ? {
                        background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                        boxShadow: "0 4px 16px rgba(124,58,237,0.5)",
                        color: "white",
                      }
                    : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)" }
                }
              >
                <ArrowLeftRight className="w-4 h-4" />
                قارن
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
