import { useMemo } from 'react';

export interface HeatmapData {
  /** Map of date string 'YYYY-MM-DD' to contribution count */
  data: Record<string, number>;
}

/**
 * GitHub-style contribution heatmap.
 * Shows the last N weeks ending today, with day-of-week rows.
 */
export function Heatmap({ data, weeks = 18 }: HeatmapData & { weeks?: number }) {
  const days = useMemo(() => {
    const result: { date: string; count: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = weeks * 7;
    // Start from the Sunday of the earliest week
    const start = new Date(today);
    start.setDate(today.getDate() - totalDays + 1);
    // Align to Sunday
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: data[key] ?? 0 });
    }
    return result;
  }, [data, weeks]);

  // Group into weeks (columns)
  const weekColumns = useMemo(() => {
    const cols: { date: string; count: number }[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      cols.push(days.slice(i, i + 7));
    }
    return cols;
  }, [days]);

  const getLevel = (count: number): string => {
    if (count <= 0) return 'bg-slate-800/60 border-slate-700/40';
    if (count === 1) return 'bg-teal-900/80 border-teal-700/40';
    if (count <= 3) return 'bg-teal-700/80 border-teal-600/40';
    if (count <= 5) return 'bg-teal-500/90 border-teal-400/50';
    return 'bg-teal-400 border-teal-300/60';
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]">
        {weekColumns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} contribution${day.count === 1 ? '' : 's'}`}
                className={`h-[11px] w-[11px] rounded-[2px] border ${getLevel(day.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="font-mono text-[10px] text-slate-500">Less</span>
        <div className={`h-[10px] w-[10px] rounded-[2px] border ${getLevel(0)}`} />
        <div className={`h-[10px] w-[10px] rounded-[2px] border ${getLevel(1)}`} />
        <div className={`h-[10px] w-[10px] rounded-[2px] border ${getLevel(3)}`} />
        <div className={`h-[10px] w-[10px] rounded-[2px] border ${getLevel(5)}`} />
        <div className={`h-[10px] w-[10px] rounded-[2px] border ${getLevel(7)}`} />
        <span className="font-mono text-[10px] text-slate-500">More</span>
      </div>
    </div>
  );
}
