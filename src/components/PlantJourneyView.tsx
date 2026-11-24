import React, { useEffect, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cloud,
  Edit3,
  Leaf,
  MapPin,
  Plus,
  Sprout,
  Trash2,
  UploadCloud
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  PlantHealthStatus,
  PlantJourneyEntry,
  usePlantJourney
} from '../context/PlantJourneyContext';
import { useScanHistory } from '../context/ScanHistoryContext';
import { GrowthStage } from '../data/growthStageAlerts';
import { AppModal } from './AppModal';

interface PlantJourneyViewProps {
  onScanPlant: (plantId: string) => void;
  onOpenAuth: () => void;
}

const STAGE_OPTIONS: { id: GrowthStage; en: string; ur: string }[] = [
  { id: 'seedling', en: 'Seedling', ur: 'پنیری' },
  { id: 'vegetative', en: 'Leaf Growing', ur: 'پتے بڑھنا' },
  { id: 'flowering', en: 'Flowering', ur: 'پھول آنا' },
  { id: 'fruiting', en: 'Red Harvest', ur: 'پھل اور کٹائی' }
];

const HEALTH_OPTIONS: { id: PlantHealthStatus; en: string; ur: string }[] = [
  { id: 'thriving', en: 'Doing Great', ur: 'صحت مند' },
  { id: 'watch', en: 'Needs Care', ur: 'نگرانی درکار' },
  { id: 'recovering', en: 'Getting Better', ur: 'بہتری کی طرف' }
];

function computeDaysPlanted(dateStr: string): number {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 1;
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  return Math.max(1, diff + 1);
}

export const PlantJourneyView: React.FC<PlantJourneyViewProps> = ({
  onScanPlant,
  onOpenAuth
}) => {
  const { isUrdu } = useLanguage();
  const { activeProfile } = useAuth();
  const { plants, addPlant, updatePlant, deletePlant, compressPlantPhoto } = usePlantJourney();
  const { scans } = useScanHistory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [editingPlant, setEditingPlant] = useState<PlantJourneyEntry | null>(null);
  const [name, setName] = useState('');
  const [cultivar, setCultivar] = useState('Roma / Sahil Tomato');
  const [stage, setStage] = useState<GrowthStage>('vegetative');
  const [plantedDate, setPlantedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [healthStatus, setHealthStatus] = useState<PlantHealthStatus>('thriving');
  const [locationNote, setLocationNote] = useState('');
  const [latestNote, setLatestNote] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onEsc);
    };
  }, [isModalOpen]);

  const openCreateModal = () => {
    setEditingPlant(null);
    setName('');
    setCultivar('Roma / Sahil Tomato');
    setStage('vegetative');
    setPlantedDate(new Date().toISOString().slice(0, 10));
    setHealthStatus('thriving');
    setLocationNote('');
    setLatestNote('');
    setThumbnailUrl(undefined);
    setShowOptionalDetails(false);
    setIsModalOpen(true);
  };

  const openEditModal = (plant: PlantJourneyEntry) => {
    setEditingPlant(plant);
    setName(plant.name);
    setCultivar(plant.cultivar);
    setStage(plant.stage);
    setPlantedDate(plant.plantedDate);
    setHealthStatus(plant.healthStatus);
    setLocationNote(plant.locationNote);
    setLatestNote(plant.latestNote);
    setThumbnailUrl(plant.thumbnailUrl);
    setShowOptionalDetails(true);
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      if (raw) {
        const compressed = await compressPlantPhoto(raw);
        setThumbnailUrl(compressed);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingPlant) {
        await updatePlant(editingPlant.id, {
          name: name.trim(),
          cultivar: cultivar.trim() || 'Roma / Sahil Tomato',
          stage,
          plantedDate,
          healthStatus,
          locationNote: locationNote.trim(),
          latestNote: latestNote.trim(),
          thumbnailUrl
        });
      } else {
        await addPlant({
          name: name.trim(),
          cultivar: cultivar.trim() || 'Roma / Sahil Tomato',
          stage,
          plantedDate,
          healthStatus,
          locationNote: locationNote.trim(),
          latestNote: latestNote.trim(),
          thumbnailUrl
        });
      }
      setIsModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#14532d] p-4 sm:p-5 text-white flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#fef3c7] font-bold">
            {isUrdu ? 'بیج سے سرخ ٹماٹر تک ریکارڈ' : 'My Tomato Bed Tracker'}
          </div>
          <h2 className="font-display text-lg font-extrabold mt-0.5">
            {isUrdu ? 'میرے ٹماٹر کے پودے' : 'My Tomato Plants'}
          </h2>
          <p className="text-xs text-white/85 mt-0.5">
            {isUrdu
              ? 'اپنی کیاری یا گملے کا نام لکھیں، مرحلہ چنیں اور پتے کی جانچ جوڑیں۔'
              : 'Follow each plant bed from small seedling to red harvest and save leaf checks.'}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="relative z-10 min-h-[42px] px-4 py-2 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isUrdu ? 'نیا پودا شامل کریں' : 'Add Plant'}</span>
        </button>
      </div>

      {/* Sign-in Reminder when in Guest Mode */}
      {!activeProfile && (
        <div className="p-3.5 rounded-2xl bg-[#edf5ef] border border-[#cbdcd0] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#13281c]">
            <Cloud className="w-4 h-4 text-[#14532d] shrink-0" />
            <span>
              {isUrdu
                ? 'پودوں کا ریکارڈ ابھی اس فون پر محفوظ ہے۔ اکاؤنٹ بنانے کے لیے سائن ان کریں۔'
                : 'Plants are saved on this phone. Sign in to back up your profile.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-3 py-1.5 rounded-xl bg-[#14532d] hover:bg-[#166534] text-white font-bold text-[11px] cursor-pointer shrink-0"
          >
            {isUrdu ? 'سائن ان کریں' : 'Sign In'}
          </button>
        </div>
      )}

      {/* Empty State vs Plant Cards */}
      {plants.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#cbdcd0] p-7 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#edf5ef] text-[#14532d] flex items-center justify-center mx-auto">
            <Sprout className="w-6 h-6" />
          </div>
          <h3 className="font-display text-base font-bold text-[#13281c]">
            {isUrdu ? 'پہلا ٹماٹر کا پودا شامل کریں' : 'Add Your First Tomato Plant'}
          </h3>
          <p className="text-xs text-[#3d5947] max-w-md mx-auto leading-relaxed">
            {isUrdu
              ? 'بس کیاری یا گملے کا نام لکھیں اور پودے کا مرحلہ چنیں — بس اتنا کافی ہے!'
              : 'Just type a plant or bed name and tap its growth stage. Everything else is optional.'}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isUrdu ? 'پودا شامل کریں' : 'Add Plant'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plants.map((plant) => {
            const linkedScans = scans.filter(
              (s) => s.plantId === plant.id || plant.linkedScanIds.includes(s.id)
            );
            const days = computeDaysPlanted(plant.plantedDate);
            const stageIndex = STAGE_OPTIONS.findIndex((s) => s.id === plant.stage);
            const stageLabel = STAGE_OPTIONS[stageIndex >= 0 ? stageIndex : 1];

            return (
              <article
                key={plant.id}
                className="rounded-2xl bg-white border border-[#cbdcd0] overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-32 w-full bg-[#edf5ef] border-b border-[#cbdcd0]">
                    {plant.thumbnailUrl ? (
                      <img
                        src={plant.thumbnailUrl}
                        alt={plant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#14532d]/70 gap-1">
                        <Leaf className="w-7 h-7" />
                        <span className="text-[11px] font-mono">{plant.cultivar}</span>
                      </div>
                    )}

                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(plant)}
                        aria-label={`Edit ${plant.name}`}
                        className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-[#13281c] border border-[#cbdcd0] flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deletePlant(plant.id)}
                        aria-label={`Delete ${plant.name}`}
                        className="w-8 h-8 rounded-lg bg-white/95 hover:bg-[#fef2f2] text-[#b91c1c] border border-[#cbdcd0] flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#5b7463]">
                        <span>
                          {isUrdu ? `دن ${days}` : `Day ${days}`} ·{' '}
                          {isUrdu ? stageLabel.ur : stageLabel.en}
                        </span>
                        <span
                          className={`font-bold ${
                            plant.healthStatus === 'watch'
                              ? 'text-[#b91c1c]'
                              : plant.healthStatus === 'recovering'
                              ? 'text-[#b45309]'
                              : 'text-[#166534]'
                          }`}
                        >
                          {isUrdu
                            ? HEALTH_OPTIONS.find((h) => h.id === plant.healthStatus)?.ur
                            : HEALTH_OPTIONS.find((h) => h.id === plant.healthStatus)?.en}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base text-[#13281c] mt-0.5 truncate">
                        {plant.name}
                      </h3>
                      <div className="text-xs text-[#3d5947] flex items-center gap-1.5">
                        <span>{plant.cultivar}</span>
                        {plant.locationNote && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-0.5 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {plant.locationNote}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Interactive Stage Progress Stepper */}
                    <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#edf5ef] border border-[#cbdcd0]">
                      {STAGE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => void updatePlant(plant.id, { stage: opt.id })}
                          className={`min-h-[30px] px-1 rounded-lg text-[10px] leading-tight font-bold transition-colors cursor-pointer ${
                            plant.stage === opt.id
                              ? 'bg-[#14532d] text-white'
                              : 'text-[#3d5947] hover:text-[#13281c]'
                          }`}
                        >
                          {isUrdu ? opt.ur : opt.en}
                        </button>
                      ))}
                    </div>

                    {plant.latestNote && (
                      <p className="text-xs text-[#3d5947] leading-snug line-clamp-2">
                        {plant.latestNote}
                      </p>
                    )}

                    <div className="text-[11px] font-mono text-[#5b7463] flex items-center justify-between pt-1">
                      <span>
                        {isUrdu
                          ? `اسکین ریکارڈ: ${linkedScans.length}`
                          : `Leaf checks: ${linkedScans.length}`}
                      </span>
                      {linkedScans[0] && (
                        <span className="text-[#14532d] font-bold truncate max-w-[140px]">
                          {linkedScans[0].diseaseName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-1">
                  <button
                    type="button"
                    onClick={() => onScanPlant(plant.id)}
                    className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isUrdu ? 'اس پودے کا پتہ چیک کریں' : 'Check Leaf'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Standardized Scrollable Add/Edit Plant Modal */}
      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dir={isUrdu ? 'rtl' : 'ltr'}
        headerTone="forest"
        maxWidthClass="max-w-md"
        bodyClassName="p-4 sm:p-5"
        title={
          editingPlant
            ? isUrdu
              ? 'پودے کی معلومات بدلیں'
              : 'Edit Plant'
            : isUrdu
            ? 'نیا ٹماٹر کا پودا شامل کریں'
            : 'Quick Add Plant'
        }
        subtitle={
          isUrdu
            ? 'بس نام اور مرحلہ چنیں — باقی سب اختیاری ہے'
            : 'Just 2 quick steps — name & growth stage'
        }
        closeLabel={isUrdu ? 'بند کریں' : 'Close'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
                {/* Essential Field 1: Plant / Bed Name */}
                <div>
                  <label className="block font-bold text-[#13281c] mb-1">
                    {isUrdu ? 'پودے یا کیاری کا نام *' : 'Plant or Bed Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isUrdu ? 'مثال: گھر کا گملا یا کیاری 1' : 'e.g. Backyard Pot 1 or Row 2'}
                    className="w-full px-3.5 py-3 rounded-2xl bg-white border border-[#cbdcd0] text-xs text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
                  />
                </div>

                {/* Essential Field 2: Growth Stage Tap Pills */}
                <div>
                  <label className="block font-bold text-[#13281c] mb-1.5">
                    {isUrdu ? 'اب پودا کس مرحلے میں ہے؟ *' : 'Growth Stage *'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {STAGE_OPTIONS.map((o) => {
                      const active = stage === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setStage(o.id)}
                          className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#14532d] text-white border-[#14532d]'
                              : 'bg-white text-[#13281c] border-[#cbdcd0] hover:bg-[#edf5ef]'
                          }`}
                        >
                          {isUrdu ? o.ur : o.en}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toggle Optional Details */}
                <button
                  type="button"
                  onClick={() => setShowOptionalDetails((prev) => !prev)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#edf5ef] border border-[#cbdcd0] text-[#14532d] font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>
                    {isUrdu
                      ? 'مزید تفصیلات شامل کریں (اختیاری)'
                      : 'More Details (Optional)'}
                  </span>
                  {showOptionalDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showOptionalDetails && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#13281c] mb-1">
                          {isUrdu ? 'ٹماٹر کی قسم' : 'Tomato Variety'}
                        </label>
                        <input
                          type="text"
                          value={cultivar}
                          onChange={(e) => setCultivar(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#cbdcd0] text-[#13281c]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#13281c] mb-1">
                          {isUrdu ? 'لگانے کی تاریخ' : 'Planted Date'}
                        </label>
                        <input
                          type="date"
                          value={plantedDate}
                          onChange={(e) => setPlantedDate(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#cbdcd0] text-[#13281c]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#13281c] mb-1">
                          {isUrdu ? 'پودے کی حالت' : 'Plant Condition'}
                        </label>
                        <select
                          value={healthStatus}
                          onChange={(e) => setHealthStatus(e.target.value as PlantHealthStatus)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#cbdcd0] text-[#13281c]"
                        >
                          {HEALTH_OPTIONS.map((h) => (
                            <option key={h.id} value={h.id}>
                              {isUrdu ? h.ur : h.en}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-[#13281c] mb-1">
                          {isUrdu ? 'کھیت یا جگہ' : 'Where It Grows'}
                        </label>
                        <input
                          type="text"
                          value={locationNote}
                          onChange={(e) => setLocationNote(e.target.value)}
                          placeholder={isUrdu ? 'مثال: چھت / کھیت' : 'e.g. Garden / Farm Row'}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#cbdcd0] text-[#13281c]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-[#13281c] mb-1">
                        {isUrdu ? 'یادداشت' : 'Care Notes'}
                      </label>
                      <textarea
                        rows={2}
                        value={latestNote}
                        onChange={(e) => setLatestNote(e.target.value)}
                        placeholder={
                          isUrdu ? 'پانی، کھاد یا اسپرے کی تاریخ...' : 'Watering, compost, or spray notes...'
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbdcd0] text-[#13281c]"
                      />
                    </div>

                    <div>
                      <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-dashed border-[#8bb398] hover:bg-[#edf5ef] cursor-pointer text-[#14532d] font-bold">
                        <UploadCloud className="w-4 h-4" />
                        <span>
                          {thumbnailUrl
                            ? isUrdu
                              ? 'تصویر منسلک ہے (بدلیں)'
                              : 'Photo added (tap to change)'
                            : isUrdu
                            ? 'پودے کی تصویر لگائیں'
                            : 'Add Plant Photo'}
                        </span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#cbdcd0] bg-white text-[#13281c] font-bold cursor-pointer"
                  >
                    {isUrdu ? 'منسوخ' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !name.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isUrdu ? 'محفوظ کریں' : 'Save Plant'}</span>
                  </button>
                </div>
              </form>
      </AppModal>
    </div>
  );
};
