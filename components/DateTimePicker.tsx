"use client";

import { useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function toDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  label
}: {
  value: string;
  onChange: (dateStr: string) => void;
  minDate?: Date;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + "T00:00:00") : null;
  const [viewDate, setViewDate] = useState(selected ?? new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const min = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : null;

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  function isDisabled(day: number) {
    if (!min) return false;
    return new Date(year, month, day) < min;
  }

  function selectDay(day: number) {
    if (isDisabled(day)) return;
    onChange(toDateString(new Date(year, month, day)));
    setOpen(false);
  }

  const displayLabel = selected
    ? selected.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "Select date";

  return (
    <div className="relative">
      {label && <span className="block text-sm font-medium text-brown mb-1">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between border border-brown/20 rounded-sm px-3 py-2.5 bg-white text-left"
      >
        <span className={selected ? "text-brown" : "text-brown/40"}>{displayLabel}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-teal flex-shrink-0">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
          <line x1="8" y1="3" x2="8" y2="6.5" />
          <line x1="16" y1="3" x2="16" y2="6.5" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close date picker"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute z-50 mt-2 bg-white border border-brown/15 rounded-sm shadow-lg p-4 w-72">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="text-brown/60 hover:text-teal p-1"
                aria-label="Previous month"
              >
                ‹
              </button>
              <span className="font-display text-brown">{MONTHS[month]} {year}</span>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="text-brown/60 hover:text-teal p-1"
                aria-label="Next month"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((w, i) => (
                <span key={i} className="text-center text-[11px] text-brown/40 font-medium">{w}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <span key={i} />;
                const disabled = isDisabled(day);
                const isSelected =
                  selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
                return (
                  <button
                    type="button"
                    key={i}
                    disabled={disabled}
                    onClick={() => selectDay(day)}
                    className={`h-8 w-8 rounded-full text-sm mx-auto ${
                      isSelected
                        ? "bg-teal text-cream font-medium"
                        : disabled
                        ? "text-brown/20 cursor-not-allowed"
                        : "text-brown hover:bg-caramel/20"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ["00", "15", "30", "45"];

export function TimePicker({
  value,
  onChange,
  label
}: {
  value: string;
  onChange: (timeStr: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  let hour12 = 12, minute = "00", meridiem: "AM" | "PM" = "AM";
  if (value) {
    const [h, m] = value.split(":").map(Number);
    meridiem = h >= 12 ? "PM" : "AM";
    hour12 = h % 12 === 0 ? 12 : h % 12;
    minute = String(m).padStart(2, "0");
  }

  function commit(nextHour12: number, nextMinute: string, nextMeridiem: "AM" | "PM") {
    let h24 = nextHour12 % 12;
    if (nextMeridiem === "PM") h24 += 12;
    onChange(`${String(h24).padStart(2, "0")}:${nextMinute}`);
  }

  const displayLabel = value
    ? `${hour12}:${minute} ${meridiem}`
    : "Select time";

  return (
    <div className="relative">
      {label && <span className="block text-sm font-medium text-brown mb-1">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between border border-brown/20 rounded-sm px-3 py-2.5 bg-white text-left"
      >
        <span className={value ? "text-brown" : "text-brown/40"}>{displayLabel}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-teal flex-shrink-0">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close time picker"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute z-50 mt-2 bg-white border border-brown/15 rounded-sm shadow-lg p-3 w-56 flex gap-2">
            <div className="flex-1 max-h-40 overflow-y-auto">
              {HOURS.map((h) => (
                <button
                  type="button"
                  key={h}
                  onClick={() => commit(h, minute, meridiem)}
                  className={`w-full text-center py-1.5 rounded-sm text-sm ${
                    hour12 === h ? "bg-teal text-cream" : "text-brown hover:bg-caramel/20"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="flex-1 max-h-40 overflow-y-auto">
              {MINUTES.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => commit(hour12, m, meridiem)}
                  className={`w-full text-center py-1.5 rounded-sm text-sm ${
                    minute === m ? "bg-teal text-cream" : "text-brown hover:bg-caramel/20"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              {(["AM", "PM"] as const).map((mer) => (
                <button
                  type="button"
                  key={mer}
                  onClick={() => commit(hour12, minute, mer)}
                  className={`py-1.5 rounded-sm text-sm ${
                    meridiem === mer ? "bg-caramel text-brown font-medium" : "text-brown hover:bg-caramel/20"
                  }`}
                >
                  {mer}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
