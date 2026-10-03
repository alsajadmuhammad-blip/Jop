import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getBaghdadToday } from "../../lib/date";

type DatePickerFieldProps = {
  id: string;
  label: string;
  value: string;
  min?: string;
  required?: boolean;
  onChange: (value: string) => void;
};

const weekdays = [
  { short: "س", full: "السبت" },
  { short: "ح", full: "الأحد" },
  { short: "ن", full: "الإثنين" },
  { short: "ث", full: "الثلاثاء" },
  { short: "ر", full: "الأربعاء" },
  { short: "خ", full: "الخميس" },
  { short: "ج", full: "الجمعة" },
];

const arabicNumber = new Intl.NumberFormat("ar-IQ");

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("ar-IQ-u-ca-gregory", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function DatePickerField({
  id,
  label,
  value,
  min = getBaghdadToday(),
  required = false,
  onChange,
}: DatePickerFieldProps) {
  const today = getBaghdadToday();
  const earliestDate = min || today;
  const safeStartDate = value && value >= earliestDate ? value : earliestDate;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = parseDate(safeStartDate);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  useEffect(() => {
    if (!open) return;
    const date = parseDate(safeStartDate);
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }, [open, safeStartDate]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 1) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const minimum = parseDate(earliestDate);
  const previousMonthDisabled =
    year < minimum.getFullYear() ||
    (year === minimum.getFullYear() && month <= minimum.getMonth());
  const monthLabel = new Intl.DateTimeFormat("ar-IQ-u-ca-gregory", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1, 12)));

  return (
    <div className="admin-date-picker-field" ref={rootRef}>
      <label className="admin-date-picker-label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <div className="admin-date-picker-anchor">
        <button
          id={id}
          ref={triggerRef}
          type="button"
          className={`admin-date-picker-trigger${open ? " is-open" : ""}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={`${id}-calendar`}
          aria-required={required}
          onClick={() => setOpen((current) => !current)}
        >
          <CalendarDays size={19} aria-hidden="true" />
          <span className={`admin-date-picker-value${value ? "" : " is-placeholder"}`}>
            {value ? formatDate(value) : "اختر التاريخ"}
          </span>
          <ChevronDown className="admin-date-picker-chevron" size={17} aria-hidden="true" />
        </button>
        {open && (
          <div
            id={`${id}-calendar`}
            className="admin-date-picker-popover"
            role="dialog"
            aria-label={`اختيار ${label}`}
            dir="rtl"
          >
            <div className="admin-date-picker-month">
              <button
                type="button"
                className="admin-date-picker-nav"
                aria-label="الشهر السابق"
                disabled={previousMonthDisabled}
                onClick={() => setVisibleMonth(new Date(year, month - 1, 1))}
              >
                <ChevronRight size={18} />
              </button>
              <strong aria-live="polite">{monthLabel}</strong>
              <button
                type="button"
                className="admin-date-picker-nav"
                aria-label="الشهر التالي"
                onClick={() => setVisibleMonth(new Date(year, month + 1, 1))}
              >
                <ChevronLeft size={18} />
              </button>
            </div>
            <div className="admin-date-picker-grid admin-date-picker-weekdays" aria-hidden="true">
              {weekdays.map((weekday) => <span key={weekday.full} title={weekday.full}>{weekday.short}</span>)}
            </div>
            <div className="admin-date-picker-grid admin-date-picker-days">
              {days.map((day, index) => {
                if (!day) return <span key={`empty-${index}`} aria-hidden="true" />;
                const dateKey = toDateKey(year, month, day);
                const disabled = dateKey < earliestDate;
                const classes = [
                  "admin-date-picker-day",
                  dateKey === value ? "is-selected" : "",
                  dateKey === today ? "is-today" : "",
                ].filter(Boolean).join(" ");

                return (
                  <button
                    key={dateKey}
                    type="button"
                    className={classes}
                    aria-label={formatDate(dateKey)}
                    aria-pressed={dateKey === value}
                    disabled={disabled}
                    onClick={() => {
                      onChange(dateKey);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                  >
                    {arabicNumber.format(day)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}