import type { ReactNode } from "react";
import { X } from "lucide-react";

export function ModalShell({ onClose, title, children }: { onClose: () => void; title: string; children: ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal-panel"><div className="modal-header"><h3>{title}</h3><button className="close-btn" onClick={onClose} aria-label="إغلاق"><X size={19} /></button></div>{children}</div></div>;
}