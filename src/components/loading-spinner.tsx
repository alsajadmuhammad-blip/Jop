
"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface LoadingSpinnerProps {
  isLoading: boolean;
}

export function LoadingSpinner({ isLoading }: LoadingSpinnerProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.2,
              duration: 0.4,
              type: "spring",
              stiffness: 100,
            }}
          >
             <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
