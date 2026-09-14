"use client";

import { useState } from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight, Check } from "lucide-react";

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
  // Picking a day only stages it here; nothing is committed to the parent
  // (onChange) until the person taps OK, so a stray tap can't silently
  // change what was already confirmed.
  const [draft, setDraft] = useState<Date | null>(selected);

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

  function openPicker() {
    setDraft(selected);
    setViewDate(selected ?? new Date());
    setOpen(true);
  }

  function selectDay(day: number) {
    if (isDisabled(day)) return;
    setDraft(new Date(year, month, day));
  }

  function confirm() {
    if (draft) onChange(toDateString(draft));
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
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="w-full flex items-center justify-between border border-brown/20 rounded-sm px-3 py-2.5 bg-white text-left"
      >
        <span className={selected ? "text-brown" : "text-brown/40"}>{displayLabel}</span>
        <Calendar size={17} strokeWidth={1.75} className="text-teal flex-shrink-0" />
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
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
              <span className="font-display text-brown">{MONTHS[month]} {year}</span>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="text-brown/60 hover:text-teal p-1"
                aria-label="Next month"
              >
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((w, i) => (
                <span key={i} className="text-center text-[11px] text-brown/40 font-medium">{w}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 mb-3">
              {cells.map((day, i) => {
                if (day === null) return <span key={i} />;
                const disabled = isDisabled(day);
                const isDraft =
                  draft && draft.getFullYear() === year && draft.getMonth() === month && draft.getDate() === day;
                return (
                  <button
                    type="button"
                    key={i}
                    disabled={disabled}
                    onClick={() => selectDay(day)}
                    className={`h-8 w-8 rounded-full text-sm mx-auto ${
                      isDraft
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
            <div className="flex justify-end gap-2 pt-2 border-t border-brown/10">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-brown/60 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={!draft}
                className="btn-primary !py-1.5 !px-4 text-sm disabled:opacity-50"
              >
                <Check size={14} strokeWidth={2} />
                OK
              </button>
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

  function parse(v: string) {
    if (!v) return { hour12: 12, minute: "00", meridiem: "AM" as const };
    const [h, m] = v.split(":").map(Number);
    return {
      hour12: h % 12 === 0 ? 12 : h % 12,
      minute: String(m).padStart(2, "0"),
      meridiem: (h >= 12 ? "PM" : "AM") as "AM" | "PM"
    };
  }

  const committed = parse(value);
  // Same staged-draft pattern as DatePicker: taps update the draft only;
  // OK commits it via onChange.
  const [draft, setDraft] = useState(committed);

  function openPicker() {
    setDraft(parse(value));
    setOpen(true);
  }

  function confirm() {
    let h24 = draft.hour12 % 12;
    if (draft.meridiem === "PM") h24 += 12;
    onChange(`${String(h24).padStart(2, "0")}:${draft.minute}`);
    setOpen(false);
  }

  const displayLabel = value
    ? `${committed.hour12}:${committed.minute} ${committed.meridiem}`
    : "Select time";

  return (
    <div className="relative">
      {label && <span className="block text-sm font-medium text-brown mb-1">{label}</span>}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="w-full flex items-center justify-between border border-brown/20 rounded-sm px-3 py-2.5 bg-white text-left"
      >
        <span className={value ? "text-brown" : "text-brown/40"}>{displayLabel}</span>
        <Clock size={17} strokeWidth={1.75} className="text-teal flex-shrink-0" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close time picker"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute z-50 mt-2 bg-white border border-brown/15 rounded-sm shadow-lg p-3 w-56">
            <div className="flex gap-2">
              <div className="flex-1 max-h-40 overflow-y-auto">
                {HOURS.map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => setDraft((d) => ({ ...d, hour12: h }))}
                    className={`w-full text-center py-1.5 rounded-sm text-sm ${
                      draft.hour12 === h ? "bg-teal text-cream" : "text-brown hover:bg-caramel/20"
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
                    onClick={() => setDraft((d) => ({ ...d, minute: m }))}
                    className={`w-full text-center py-1.5 rounded-sm text-sm ${
                      draft.minute === m ? "bg-teal text-cream" : "text-brown hover:bg-caramel/20"
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
                    onClick={() => setDraft((d) => ({ ...d, meridiem: mer }))}
                    className={`py-1.5 rounded-sm text-sm ${
                      draft.meridiem === mer ? "bg-caramel text-brown font-medium" : "text-brown hover:bg-caramel/20"
                    }`}
                  >
                    {mer}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-brown/10">
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-brown/60 px-3 py-1.5">
                Cancel
              </button>
              <button type="button" onClick={confirm} className="btn-primary !py-1.5 !px-4 text-sm">
                <Check size={14} strokeWidth={2} />
                OK
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
