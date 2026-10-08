import React, { useMemo } from 'react';
import { Calendar, History, Sparkles } from 'lucide-react';
import {
  ETHIOPIAN_MONTHS,
  EthiopianDate,
  getCurrentEthiopianDate,
  getDaysInEthiopianMonth,
  formatEthiopianDate,
  toEthiopianDate,
  ethToDate,
} from '../../utils/ethiopianCalendar';

interface EthiopianDateInputProps {
  ethDate: EthiopianDate;
  timeStr: string; // "HH:MM"
  isBacklog: boolean;
  onEthDateChange: (date: EthiopianDate) => void;
  onTimeChange: (time: string) => void;
  onToggleBacklog: (enabled: boolean) => void;
}

export const EthiopianDateInput: React.FC<EthiopianDateInputProps> = ({
  ethDate,
  timeStr,
  isBacklog,
  onEthDateChange,
  onTimeChange,
  onToggleBacklog,
}) => {
  const currentEth = useMemo(() => getCurrentEthiopianDate(), []);

  // Compute available days in the chosen Ethiopian month and year
  const daysInMonth = useMemo(() => {
    return getDaysInEthiopianMonth(ethDate.year, ethDate.month);
  }, [ethDate.year, ethDate.month]);

  // Gregorian equivalent for preview
  const gregorianEquivalent = useMemo(() => {
    try {
      const [hh, mm] = (timeStr || '12:00').split(':').map(Number);
      const d = ethToDate(ethDate.year, ethDate.month, ethDate.day, hh || 12, mm || 0);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  }, [ethDate, timeStr]);

  // Year options: current year and prior years for back-log
  const availableYears = useMemo(() => {
    const years: number[] = [];
    const maxYear = currentEth.year;
    for (let y = maxYear; y >= maxYear - 10; y--) {
      years.push(y);
    }
    return years;
  }, [currentEth.year]);

  const handleSetToday = () => {
    const todayEth = getCurrentEthiopianDate();
    const now = new Date();
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    onEthDateChange(todayEth);
    onTimeChange(nowTime);
    onToggleBacklog(false);
  };

  const handleSetYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    onEthDateChange(toEthiopianDate(yesterday));
    onToggleBacklog(true);
  };

  return (
    <div
      className="rounded-2xl border p-4 space-y-3 transition-all"
      style={{
        backgroundColor: isBacklog ? '#FFF5EA' : '#FFFDF8',
        borderColor: isBacklog ? '#E07A5F' : '#E6DCCB',
      }}
    >
      {/* Top Banner / Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: '#6B1E2B' }}
          >
            <Calendar className="w-4 h-4 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2B2523' }}>
                Ethiopian Calendar (የኢትዮጵያ ዘመን አቆጣጠር)
              </span>
              {isBacklog ? (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide border flex items-center space-x-1"
                  style={{
                    backgroundColor: '#FEF3C7',
                    borderColor: '#F59E0B',
                    color: '#B45309',
                  }}
                >
                  <History className="w-3 h-3" />
                  <span>BACK-LOG MODE</span>
                </span>
              ) : (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1"
                  style={{
                    backgroundColor: '#ECFDF5',
                    borderColor: '#A7F3D0',
                    color: '#065F46',
                  }}
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>TODAY (LIVE)</span>
                </span>
              )}
            </div>
            <p className="text-[11px]" style={{ color: '#6E6460' }}>
              All receipts & reports are recorded in Ethiopian Date (E.C. / ዓ.ም).
            </p>
          </div>
        </div>

        {/* Back-log toggle switch */}
        <label className="inline-flex items-center cursor-pointer select-none self-start sm:self-center">
          <input
            type="checkbox"
            checked={isBacklog}
            onChange={(e) => onToggleBacklog(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6B1E2B]"></div>
          <span className="ml-2 text-xs font-bold" style={{ color: isBacklog ? '#6B1E2B' : '#2B2523' }}>
            Enable Back-Log Date
          </span>
        </label>
      </div>

      {/* Date Pickers (Ethiopian Month, Day, Year, Time) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {/* Month Dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6460' }}>
            Month (ወር)
          </label>
          <select
            value={ethDate.month}
            onChange={(e) => {
              const newMonth = parseInt(e.target.value, 10);
              const maxDays = getDaysInEthiopianMonth(ethDate.year, newMonth);
              onEthDateChange({
                ...ethDate,
                month: newMonth,
                day: Math.min(ethDate.day, maxDays),
              });
              onToggleBacklog(true);
            }}
            disabled={!isBacklog}
            className={`w-full px-2.5 py-2 border rounded-xl text-xs font-bold outline-none transition-all ${
              !isBacklog ? 'bg-neutral-100 opacity-80 cursor-not-allowed' : 'cursor-pointer'
            }`}
            style={{
              backgroundColor: isBacklog ? '#FFF8E7' : '#F5EFE6',
              borderColor: '#E6DCCB',
              color: '#2B2523',
            }}
          >
            {ETHIOPIAN_MONTHS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nameEn} ({m.nameAm})
              </option>
            ))}
          </select>
        </div>

        {/* Day Dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6460' }}>
            Day (ቀን)
          </label>
          <select
            value={ethDate.day}
            onChange={(e) => {
              onEthDateChange({
                ...ethDate,
                day: parseInt(e.target.value, 10),
              });
              onToggleBacklog(true);
            }}
            disabled={!isBacklog}
            className={`w-full px-2.5 py-2 border rounded-xl text-xs font-bold outline-none transition-all ${
              !isBacklog ? 'bg-neutral-100 opacity-80 cursor-not-allowed' : 'cursor-pointer'
            }`}
            style={{
              backgroundColor: isBacklog ? '#FFF8E7' : '#F5EFE6',
              borderColor: '#E6DCCB',
              color: '#2B2523',
            }}
          >
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Year Dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6460' }}>
            Year (ዓ.ም)
          </label>
          <select
            value={ethDate.year}
            onChange={(e) => {
              const newYear = parseInt(e.target.value, 10);
              const maxDays = getDaysInEthiopianMonth(newYear, ethDate.month);
              onEthDateChange({
                ...ethDate,
                year: newYear,
                day: Math.min(ethDate.day, maxDays),
              });
              onToggleBacklog(true);
            }}
            disabled={!isBacklog}
            className={`w-full px-2.5 py-2 border rounded-xl text-xs font-bold outline-none transition-all ${
              !isBacklog ? 'bg-neutral-100 opacity-80 cursor-not-allowed' : 'cursor-pointer'
            }`}
            style={{
              backgroundColor: isBacklog ? '#FFF8E7' : '#F5EFE6',
              borderColor: '#E6DCCB',
              color: '#2B2523',
            }}
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr} E.C. (ዓ.ም)
              </option>
            ))}
          </select>
        </div>

        {/* Time input */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6460' }}>
            Time (ሰዓት)
          </label>
          <input
            type="time"
            value={timeStr}
            onChange={(e) => {
              onTimeChange(e.target.value);
              if (isBacklog) onToggleBacklog(true);
            }}
            disabled={!isBacklog}
            className={`w-full px-2.5 py-2 border rounded-xl text-xs font-bold outline-none transition-all ${
              !isBacklog ? 'bg-neutral-100 opacity-80 cursor-not-allowed' : ''
            }`}
            style={{
              backgroundColor: isBacklog ? '#FFF8E7' : '#F5EFE6',
              borderColor: '#E6DCCB',
              color: '#2B2523',
            }}
          />
        </div>
      </div>

      {/* Date Summary and Quick shortcuts */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs"
        style={{ borderColor: '#E6DCCB' }}
      >
        <div className="flex items-center space-x-2">
          <span className="font-bold text-[11px]" style={{ color: '#6B1E2B' }}>
            Selected Date:
          </span>
          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded border bg-amber-50" style={{ borderColor: '#E6DCCB', color: '#2B2523' }}>
            {ETHIOPIAN_MONTHS[ethDate.month - 1]?.nameEn} {ethDate.day}, {ethDate.year} E.C. ({ETHIOPIAN_MONTHS[ethDate.month - 1]?.nameAm}) at {timeStr}
          </span>
          {gregorianEquivalent && (
            <span className="text-[11px] hidden md:inline text-neutral-500">
              (G.C.: {gregorianEquivalent})
            </span>
          )}
        </div>

        {isBacklog && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSetToday}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer"
              style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB', color: '#2B2523' }}
            >
              Reset to Today
            </button>
            <button
              type="button"
              onClick={handleSetYesterday}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer"
              style={{ backgroundColor: '#FFFDF8', borderColor: '#E6DCCB', color: '#6B1E2B' }}
            >
              Set Yesterday
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
