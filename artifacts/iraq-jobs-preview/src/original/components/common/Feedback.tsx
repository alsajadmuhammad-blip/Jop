import { Search } from "lucide-react";

export function LoadingCards() {
  return <div className="job-grid"><div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" /></div>;
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><span><Search size={24} /></span><h3>{title}</h3><p>{text}</p></div>;
}