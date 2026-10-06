import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type AppSelectOption = {
  value: string;
  label: string;
};

type AppSelectProps = {
  value: string;
  options: AppSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function AppSelect({
  value,
  options,
  onChange,
  placeholder = "اختر",
  disabled = false,
  className = "",
  ariaLabel,
}: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const select = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`app-select ${open ? "is-open" : ""} ${className}`}>
      <button
        type="button"
        className="app-select-trigger"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? "" : "placeholder"}>{selected?.label || placeholder}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && !disabled && (
        <div className="app-select-menu" role="listbox" aria-label={ariaLabel || placeholder}>
          {options.length ? options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={option.value === value ? "selected" : ""}
              key={option.value}
              onClick={() => select(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={15} aria-hidden="true" />}
            </button>
          )) : <span className="app-select-empty">لا توجد خيارات حالياً</span>}
        </div>
      )}
    </div>
  );
}