import { useEffect, useMemo, useState } from "react";

type MonthYearFieldProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  minValue?: string;
  maxValue?: string;
  disabled?: boolean;
};

const months = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("en-GB-u-ca-gregory-nu-latn", { month: "long", timeZone: "UTC" })
    .format(new Date(Date.UTC(2020, index, 1))),
);

function validMonthValue(value: string | undefined) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : "";
}

function isOutsideRange(value: string, minValue: string, maxValue: string) {
  return Boolean((minValue && value < minValue) || (maxValue && value > maxValue));
}

function adjustMonthForYear(year: string, month: string, minValue: string, maxValue: string) {
  if (!month) return "";

  const candidate = `${year}-${month}`;
  if (minValue && candidate < minValue && minValue.slice(0, 4) === year) {
    return minValue.slice(5, 7);
  }
  if (maxValue && candidate > maxValue && maxValue.slice(0, 4) === year) {
    return maxValue.slice(5, 7);
  }
  return month;
}

export function MonthYearField({
  value,
  onChange,
  ariaLabel,
  minValue = "",
  maxValue = "",
  disabled = false,
}: MonthYearFieldProps) {
  const normalizedValue = validMonthValue(value);
  const [month, setMonth] = useState(normalizedValue.slice(5, 7));
  const [year, setYear] = useState(normalizedValue.slice(0, 4));
  const currentYear = new Date().getFullYear();
  const normalizedMin = validMonthValue(minValue);
  const normalizedMax = validMonthValue(maxValue);

  useEffect(() => {
    setMonth(normalizedValue.slice(5, 7));
    setYear(normalizedValue.slice(0, 4));
  }, [normalizedValue]);

  const years = useMemo(() => {
    const storedYears = [year, normalizedMin.slice(0, 4), normalizedMax.slice(0, 4)]
      .filter(Boolean)
      .map(Number);
    const firstYear = Math.min(1950, ...storedYears);
    const lastYear = Math.max(currentYear, ...storedYears);
    return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => String(lastYear - index));
  }, [currentYear, normalizedMax, normalizedMin, year]);

  const commit = (nextYear: string, nextMonth: string) => {
    if (!nextYear || !nextMonth) return;
    const nextValue = `${nextYear}-${nextMonth}`;
    if (!isOutsideRange(nextValue, normalizedMin, normalizedMax)) onChange(nextValue);
  };

  const selectYear = (nextYear: string) => {
    if (!nextYear) {
      setYear("");
      setMonth("");
      onChange("");
      return;
    }

    const nextMonth = adjustMonthForYear(nextYear, month, normalizedMin, normalizedMax);
    setYear(nextYear);
    setMonth(nextMonth);
    commit(nextYear, nextMonth);
  };

  const selectMonth = (nextMonth: string) => {
    if (!nextMonth) {
      setMonth("");
      setYear("");
      onChange("");
      return;
    }

    const nextYear = year || String(currentYear);
    setYear(nextYear);
    setMonth(nextMonth);
    commit(nextYear, nextMonth);
  };

  return (
    <div className="experience-month-year-control" role="group" aria-label={ariaLabel} dir="rtl">
      <select
        value={month}
        onChange={(event) => selectMonth(event.target.value)}
        disabled={disabled}
        aria-label={`${ariaLabel}، الشهر`}
      >
        <option value="">الشهر</option>
        {months.map((monthName, index) => {
          const monthValue = String(index + 1).padStart(2, "0");
          const candidate = year ? `${year}-${monthValue}` : "";
          return (
            <option
              key={monthValue}
              value={monthValue}
              disabled={Boolean(candidate && isOutsideRange(candidate, normalizedMin, normalizedMax))}
            >
              {monthName}
            </option>
          );
        })}
      </select>
      <select
        value={year}
        onChange={(event) => selectYear(event.target.value)}
        disabled={disabled}
        aria-label={`${ariaLabel}، السنة`}
      >
        <option value="">السنة</option>
        {years.map((yearValue) => {
          const outsideYear = Boolean(
            (normalizedMin && yearValue < normalizedMin.slice(0, 4)) ||
            (normalizedMax && yearValue > normalizedMax.slice(0, 4)),
          );
          return <option key={yearValue} value={yearValue} disabled={outsideYear}>{yearValue}</option>;
        })}
      </select>
    </div>
  );
}