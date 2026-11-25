import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useOptionalXP } from '../context/XPContext';
import { Droplets, Sparkles, CheckCircle2, Clock, Calendar, RefreshCw } from 'lucide-react';

interface PlantSchedule {
  wateringIntervalDays: number;
  fertilizerIntervalDays: number;
  lastWateredDate: string;
  lastFertilizedDate: string;
  waterDoneToday: boolean;
  fertilizerDoneToday: boolean;
}

const STORAGE_KEY = 'agrovision_plant_schedule_v1';

function getDefaultSchedule(): PlantSchedule {
  const today = new Date().toISOString().split('T')[0];
  return {
    wateringIntervalDays: 2,
    fertilizerIntervalDays: 7,
    lastWateredDate: today,
    lastFertilizedDate: today,
    waterDoneToday: false,
    fertilizerDoneToday: false
  };
}

export const PlantScheduleCard: React.FC = () => {
  const { isUrdu } = useLanguage();
  const xpCtx = useOptionalXP();
  const [schedule, setSchedule] = useState<PlantSchedule>(() => {
    if (typeof window === 'undefined') return getDefaultSchedule();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultSchedule();
      return JSON.parse(raw) as PlantSchedule;
    } catch {
      return getDefaultSchedule();
    }
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
    } catch {
      // ignore
    }
  }, [schedule]);

  const handleToggleWater = () => {
    const today = new Date().toISOString().split('T')[0];
    const markingDone = !schedule.waterDoneToday;
    setSchedule((prev) => ({
      ...prev,
      waterDoneToday: !prev.waterDoneToday,
      lastWateredDate: !prev.waterDoneToday ? today : prev.lastWateredDate
    }));
    if (markingDone) {
      xpCtx?.completeMissionByEvent('daily_plant_care');
    }
  };

  const handleToggleFertilizer = () => {
    const today = new Date().toISOString().split('T')[0];
    const markingDone = !schedule.fertilizerDoneToday;
    setSchedule((prev) => ({
      ...prev,
      fertilizerDoneToday: !prev.fertilizerDoneToday,
      lastFertilizedDate: !prev.fertilizerDoneToday ? today : prev.lastFertilizedDate
    }));
    if (markingDone) {
      xpCtx?.completeMissionByEvent('daily_plant_care');
    }
  };

  return (
    <section className="rounded-2xl bg-white border border-[#cbdcd0] p-4 sm:p-5 space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#cbdcd0]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#edf5ef] text-[#14532d] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-[#13281c] truncate">
              {isUrdu ? 'ٹماٹر کیئر شیڈول و یاد دہانی' : 'Tomato Care & Watering Schedule'}
            </h2>
            <p className="text-[10.5px] text-[#5b7463] truncate">
              {isUrdu ? 'پانی اور کھاد کے شیڈول کا انتظام کریں' : 'Custom irrigation & fertilizer reminder planner'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing((prev) => !prev)}
          className="px-2.5 py-1 rounded-xl bg-[#faf8f2] hover:bg-[#edf5ef] border border-[#cbdcd0] text-[11px] font-bold text-[#14532d] cursor-pointer shrink-0"
        >
          {isEditing ? (isUrdu ? 'محفوظ' : 'Done') : isUrdu ? 'ترتیب' : 'Configure'}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-3 p-3 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] animate-in fade-in">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[#13281c]">
              {isUrdu ? 'پانی دینے کا وقفہ (دن)' : 'Watering Interval (Days)'}
            </label>
            <select
              value={schedule.wateringIntervalDays}
              onChange={(e) =>
                setSchedule((prev) => ({ ...prev, wateringIntervalDays: Number(e.target.value) }))
              }
              className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-[#cbdcd0] text-xs font-bold text-[#13281c]"
            >
              <option value={1}>Daily / روزانہ</option>
              <option value={2}>Every 2 Days / ہر 2 دن</option>
              <option value={3}>Every 3 Days / ہر 3 دن</option>
              <option value={5}>Every 5 Days / ہر 5 دن</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[#13281c]">
              {isUrdu ? 'کھاد کا وقفہ (دن)' : 'Fertilizer Interval (Days)'}
            </label>
            <select
              value={schedule.fertilizerIntervalDays}
              onChange={(e) =>
                setSchedule((prev) => ({ ...prev, fertilizerIntervalDays: Number(e.target.value) }))
              }
              className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-[#cbdcd0] text-xs font-bold text-[#13281c]"
            >
              <option value={7}>Weekly (7 Days) / ہفتہ وار</option>
              <option value={14}>Bi-Weekly (14 Days) / دو ہفتے</option>
              <option value={30}>Monthly (30 Days) / ماہانہ</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Watering Reminder Tile */}
          <div className="p-3 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#166534] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Droplets className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-[#13281c]">
                  {isUrdu ? 'پانی دینا' : 'Watering'}
                </div>
                <div className="text-[10px] text-[#5b7463] mt-0.5">
                  {isUrdu
                    ? `ہر ${schedule.wateringIntervalDays} دن بعد`
                    : `Every ${schedule.wateringIntervalDays} ${schedule.wateringIntervalDays === 1 ? 'day' : 'days'}`}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleWater}
              className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                schedule.waterDoneToday
                  ? 'bg-[#166534] text-white'
                  : 'bg-white hover:bg-[#edf5ef] border border-[#cbdcd0] text-[#14532d]'
              }`}
            >
              {schedule.waterDoneToday ? (isUrdu ? 'ہو گیا ✓' : 'Done ✓') : isUrdu ? 'پانی دیں' : 'Water'}
            </button>
          </div>

          {/* Fertilizer Reminder Tile */}
          <div className="p-3 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#b45309] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-[#13281c]">
                  {isUrdu ? 'نامیاتی کھاد' : 'Fertilizer'}
                </div>
                <div className="text-[10px] text-[#5b7463] mt-0.5">
                  {isUrdu
                    ? `ہر ${schedule.fertilizerIntervalDays} دن بعد`
                    : `Every ${schedule.fertilizerIntervalDays} days`}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleFertilizer}
              className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                schedule.fertilizerDoneToday
                  ? 'bg-[#b45309] text-white'
                  : 'bg-white hover:bg-[#edf5ef] border border-[#cbdcd0] text-[#b45309]'
              }`}
            >
              {schedule.fertilizerDoneToday ? (isUrdu ? 'ہو گیا ✓' : 'Done ✓') : isUrdu ? 'کھاد دیں' : 'Feed'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
