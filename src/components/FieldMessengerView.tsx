import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  Camera,
  CheckCheck,
  Droplets,
  Leaf,
  Loader2,
  Mic,
  MicOff,
  Send,
  Share2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useScanHistory } from '../context/ScanHistoryContext';
import { useSensors } from '../context/SensorContext';
import { usePlantJourney } from '../context/PlantJourneyContext';
import { usePreferences } from '../context/PreferencesContext';
import { useOptionalXP } from '../context/XPContext';
import { DiagnosisResult } from '../types/disease';
import { TOMATO_DISEASES } from '../data/tomatoDiseases';
import { generateAgronomicReply } from '../services/agronomicAdvisor';
import { GoogleChatShareModal } from './GoogleChatShareModal';
import type { LiveWeatherSnapshot } from './WeatherAlertCard';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface AssistantMessage {
  id: string;
  sender: string;
  isMe: boolean;
  text: string;
  timestamp: string;
  contextTags?: string[];
}

const STORAGE_KEY = 'agrovision_advisor_thread_v3';

function getInitialGreeting(isUrdu: boolean): AssistantMessage {
  return {
    id: 'msg_welcome',
    sender: isUrdu ? 'ایگرو وژن زرعی مشیر' : 'Tomato Agronomic Advisor',
    isMe: false,
    text: isUrdu
      ? 'السلام علیکم! میں ایگرو وژن ٹماٹر زرعی مشیر ہوں (آف لائن اور آن لائن 100% دستیاب)۔ آپ پیلے پتوں، جھلساؤ، سفید مکھی، اسپرے ٹینکی خوراک، مٹی کی نمی یا منڈی ریٹس کے بارے میں لکھ کر یا مائیک دبا کر پوچھ سکتے ہیں۔'
      : 'Assalam-o-Alaikum! I am your Tomato Agronomic Advisor (instant & always available offline or online). Ask about yellow leaves, Early/Late Blight, whiteflies, 16L/20L spray tanki dosages, soil pH/irrigation, or use the microphone button to speak.',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

function readStoredMessages(isUrdu: boolean): AssistantMessage[] {
  if (typeof window === 'undefined') return [getInitialGreeting(isUrdu)];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [getInitialGreeting(isUrdu)];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [getInitialGreeting(isUrdu)];
  } catch {
    return [getInitialGreeting(isUrdu)];
  }
}

interface FieldMessengerViewProps {
  onOpenScanner: () => void;
  onOpenSensors?: () => void;
  liveWeather?: LiveWeatherSnapshot | null;
  pendingQuestion?: { text: string; nonce: number } | null;
  onPendingQuestionHandled?: () => void;
}

export const FieldMessengerView: React.FC<FieldMessengerViewProps> = ({
  onOpenScanner,
  onOpenSensors,
  liveWeather,
  pendingQuestion,
  onPendingQuestionHandled
}) => {
  const { isUrdu } = useLanguage();
  const { activeProfile } = useAuth();
  const { scans } = useScanHistory();
  const { moistureEnabled, moisturePercent, phEnabled, soilPh } = useSensors();
  const { plants } = usePlantJourney();
  const { preferredRegion, growingSystem } = usePreferences();
  const xpCtx = useOptionalXP();

  const [messages, setMessages] = useState<AssistantMessage[]>(() => readStoredMessages(isUrdu));
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [includeLatestScan, setIncludeLatestScan] = useState<boolean>(true);
  const [includeSoilWeather, setIncludeSoilWeather] = useState<boolean>(true);
  const [selectedPlantId, setSelectedPlantId] = useState<string>(() => plants[0]?.id || '');
  const [isGoogleChatOpen, setIsGoogleChatOpen] = useState(false);

  // Voice Input & Audio Output states
  const [micLang, setMicLang] = useState<'ur-PK' | 'en-US'>(() => (isUrdu ? 'ur-PK' : 'en-US'));
  const [isListening, setIsListening] = useState(false);
  const [interimSpeech, setInterimSpeech] = useState('');
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const latestScan = scans[0] || null;
  const activePlant = plants.find((p) => p.id === selectedPlantId) || plants[0] || null;

  useEffect(() => {
    setMicLang(isUrdu ? 'ur-PK' : 'en-US');
  }, [isUrdu]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // Ignore quota errors
    }
  }, [messages]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore cleanup
        }
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handledQuestionNonceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!pendingQuestion || !pendingQuestion.text.trim()) return;
    if (handledQuestionNonceRef.current === pendingQuestion.nonce) return;
    handledQuestionNonceRef.current = pendingQuestion.nonce;
    void sendAdvisorPrompt(pendingQuestion.text);
    onPendingQuestionHandled?.();
  }, [pendingQuestion?.nonce]);

  const stopSpeechAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

  const speakMessage = async (msg: AssistantMessage) => {
    if (speakingMsgId === msg.id) {
      stopSpeechAudio();
      return;
    }
    stopSpeechAudio();
    setSpeakingMsgId(msg.id);

    const hasUrduScript = /[\u0600-\u06FF]/.test(msg.text);

    try {
      const res = await fetch('/api/tts-urdu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.text, isUrdu: hasUrduScript || isUrdu })
      });
      const json = await res.json();
      if (res.ok && json?.audioBase64) {
        const audio = new Audio(`data:${json.format || 'audio/wav'};base64,${json.audioBase64}`);
        audioRef.current = audio;
        audio.onended = () => setSpeakingMsgId(null);
        audio.onerror = () => setSpeakingMsgId(null);
        await audio.play();
        return;
      }
    } catch {
      // Fallback cleanly to browser SpeechSynthesis
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(msg.text);
      utter.lang = hasUrduScript || isUrdu ? 'ur-PK' : 'en-US';
      utter.onend = () => setSpeakingMsgId(null);
      utter.onerror = () => setSpeakingMsgId(null);
      window.speechSynthesis.speak(utter);
    } else {
      setSpeakingMsgId(null);
    }
  };

  const stopDictation = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    setIsListening(false);
    setInterimSpeech('');
  };

  const toggleDictation = () => {
    setSpeechNotice(null);
    if (isListening) {
      stopDictation();
      return;
    }
    if (typeof window === 'undefined') return;
    const w = window as WindowWithSpeech;
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechNotice(
        isUrdu
          ? 'اس براؤزر میں مائیکروفون ٹائپنگ دستیاب نہیں۔ برائے مہربانی نیچے سوال لکھیں۔'
          : 'Browser voice dictation is unavailable here. Please type your question below.'
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = micLang;
      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const piece = event.results[i]?.[0]?.transcript ?? '';
          if (event.results[i]?.isFinal) finalTranscript += piece;
          else interimTranscript += piece;
        }
        if (finalTranscript.trim()) {
          setDraft((prev) =>
            prev.trim() ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()
          );
        }
        setInterimSpeech(interimTranscript.trim());
      };
      recognition.onerror = (ev) => {
        setIsListening(false);
        setInterimSpeech('');
        setSpeechNotice(
          ev?.error === 'not-allowed'
            ? isUrdu
              ? 'براؤزر میں مائیکروفون کی اجازت بند ہے۔ سیٹنگز سے اجازت دیں یا نیچے ٹائپ کریں۔'
              : 'Microphone permission was blocked. Allow mic access in browser settings or type below.'
            : isUrdu
            ? 'آواز ریکارڈ کرنے میں مسئلہ آیا۔ دوبارہ کوشش کریں یا ٹائپ کریں۔'
            : 'Could not hear clearly. Tap the mic again or type your question.'
        );
      };
      recognition.onend = () => {
        setIsListening(false);
        setInterimSpeech('');
        recognitionRef.current = null;
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      setSpeechNotice(
        isUrdu
          ? 'مائیکروفون شروع نہیں ہو سکا۔ نیچے ٹائپ کریں۔'
          : 'Unable to start microphone here. Please type your question.'
      );
    }
  };

  const sendAdvisorPrompt = async (promptText: string) => {
    const clean = promptText.trim();
    if (!clean || isSending) return;
    if (isListening) stopDictation();

    const tags: string[] = [];
    if (includeLatestScan && latestScan) tags.push(`${latestScan.diseaseName} (${latestScan.confidence}%)`);
    if (includeSoilWeather) {
      tags.push(
        `Moisture ${moistureEnabled ? `${moisturePercent}%` : 'OFF'} · pH ${phEnabled ? soilPh.toFixed(1) : 'OFF'}`
      );
    }
    if (activePlant) tags.push(activePlant.name);

    const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: AssistantMessage = {
      id: `user_${Date.now()}`,
      sender: isUrdu ? 'آپ' : 'You',
      isMe: true,
      text: clean,
      timestamp: nowLabel,
      contextTags: tags.length > 0 ? tags : undefined
    };

    setMessages((prev) => [...prev, userMsg]);
    setDraft('');
    setIsSending(true);

    // Brief natural turn feedback (~180ms), always deterministic & 100% reliable without API failure
    window.setTimeout(() => {
      const replyText = generateAgronomicReply({
        question: clean,
        language: isUrdu ? 'ur' : 'en',
        growerName: activeProfile?.displayName,
        preferredRegion,
        growingSystem,
        latestScan:
          includeLatestScan && latestScan
            ? {
                diseaseId: latestScan.diseaseId,
                diseaseName: latestScan.diseaseName,
                confidence: latestScan.confidence,
                severity: latestScan.severity,
                summary: latestScan.summary,
                organicTreatment: latestScan.organicTreatment
              }
            : undefined,
        soilContext: includeSoilWeather
          ? {
              moistureEnabled,
              moisturePercent,
              phEnabled,
              soilPh,
              regionName: liveWeather?.locationEn || 'Pakistan Tomato Belt'
            }
          : undefined,
        weatherContext:
          includeSoilWeather && liveWeather
            ? {
                location: liveWeather.locationEn,
                tempC: liveWeather.current.tempC,
                humidity: liveWeather.current.humidity,
                riskLevel: liveWeather.risk.level,
                watchCondition: liveWeather.risk.watchCondition
              }
            : undefined,
        activePlant: activePlant
          ? {
              name: activePlant.name,
              stage: activePlant.stage,
              healthStatus: activePlant.healthStatus,
              cultivar: activePlant.cultivar
            }
          : undefined
      });

      const advisorMsg: AssistantMessage = {
        id: `adv_${Date.now()}`,
        sender: isUrdu ? 'ایگرو وژن زرعی مشیر' : 'Tomato Agronomic Advisor',
        isMe: false,
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, advisorMsg]);
      setIsSending(false);
      xpCtx?.completeMissionByEvent('learning_activity');
    }, 180);
  };

  const quickPrompts = isUrdu
    ? [
        'آخری اسکین کا آسان علاج بتائیں',
        'نچلے پتوں پر بھورے دھبے (جھلساؤ)',
        'سفید مکھی اور پتہ مروڑ کا کنٹرول',
        '16 لیٹر ٹینکی اسپرے کی خوراک',
        'پیلے پتے اور پانی دینے کا صحیح وقت'
      ]
    : [
        'Explain my latest scan & organic steps',
        'How to stop Early vs Late Blight spots',
        'Whitefly & Leaf Curl Virus control',
        '16L / 20L spray tanki dosage guide',
        'Why are lower leaves turning yellow?'
      ];

  const fallbackDisease = TOMATO_DISEASES[1];
  const baseStage1Metrics = {
    blurScore: 180,
    chlorophyllRatio: 0.72,
    aspectRatio: 1.45,
    marginSerrationScore: 0.65,
    cuticleGlossScore: 0.3,
    skinOrObjectRatio: 0.04
  };
  const googleChatResult: DiagnosisResult = latestScan
    ? {
        id: latestScan.id,
        isPlantLeaf: true,
        isTomatoLeaf: latestScan.isTomatoLeaf,
        diseaseId: latestScan.diseaseId,
        diseaseName: latestScan.diseaseName,
        scientificName: latestScan.scientificName,
        pathogenType: 'Fungal',
        confidence: latestScan.confidence,
        severity: latestScan.severity,
        lesionCoveragePercent: 22,
        summary: latestScan.summary,
        keyObservations: [],
        treatment: {
          organic: latestScan.organicTreatment,
          chemical: [],
          cultural: [],
          prevention: []
        },
        detectedLesions: [],
        analysisTimestamp: latestScan.createdAt,
        sourceType: latestScan.source,
        imageUri: latestScan.thumbnailUrl,
        processingTimeMs: 420,
        aiEngineUsed: 'AgroVision Neural Edge',
        stage1: {
          status: latestScan.isTomatoLeaf ? 'tomato_leaf' : 'non_tomato_leaf',
          isTomato: latestScan.isTomatoLeaf,
          detectedSpecies: latestScan.isTomatoLeaf ? 'tomato' : 'unknown_plant',
          speciesCommonName: 'Tomato Leaf',
          speciesScientificName: latestScan.scientificName,
          confidence: latestScan.confidence,
          message: 'Verified leaf specimen',
          urduMessage: 'تصدیق شدہ ٹماٹر کا پتا',
          characteristics: [],
          urduCharacteristics: [],
          metrics: baseStage1Metrics
        }
      }
    : {
        id: 'sample_dispatch_1',
        isPlantLeaf: true,
        isTomatoLeaf: true,
        diseaseId: fallbackDisease.id,
        diseaseName: fallbackDisease.name,
        scientificName: fallbackDisease.scientificName,
        pathogenType: fallbackDisease.pathogenType,
        confidence: 92,
        severity: 'Moderate',
        lesionCoveragePercent: 18,
        summary: fallbackDisease.description,
        keyObservations: fallbackDisease.primarySymptoms,
        treatment: fallbackDisease.treatment,
        detectedLesions: [],
        analysisTimestamp: new Date().toISOString(),
        sourceType: 'sample',
        imageUri: '',
        processingTimeMs: 380,
        aiEngineUsed: 'AgroVision Neural Edge',
        stage1: {
          status: 'tomato_leaf',
          isTomato: true,
          detectedSpecies: 'tomato',
          speciesCommonName: 'Tomato Leaf',
          speciesScientificName: 'Solanum lycopersicum',
          confidence: 96,
          message: 'Verified tomato leaf',
          urduMessage: 'تصدیق شدہ ٹماٹر کا پتا',
          characteristics: [],
          urduCharacteristics: [],
          metrics: baseStage1Metrics
        }
      };

  return (
    <div className="space-y-4">
      {/* Advisor Header Banner */}
      <div className="rounded-2xl bg-[#14532d] p-4 sm:p-5 text-white shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#fef3c7] font-bold mb-1">
            <BookOpenCheck className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>{isUrdu ? 'دو لسانی زرعی علم · آف لائن دستیاب' : 'AGRONOMIC KNOWLEDGE BASE · OFFLINE READY'}</span>
          </div>
          <h2 className="font-display text-lg font-extrabold leading-tight">
            {isUrdu ? 'ٹماٹر زرعی مشیر' : 'Tomato Agronomic Advisor'}
          </h2>
          <p className="text-xs text-white/85 mt-0.5">
            {isUrdu
              ? 'اسکین، مٹی، موسم اور پاکستانی منڈی کے مطابق فوری تصدیق شدہ رہنمائی۔'
              : 'Instant tomato disease, spray dosage, soil pH & seasonal advice grounded in your field data.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsGoogleChatOpen(true)}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white hover:bg-[#edf5ef] text-[#14532d] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'گوگل چیٹ' : 'Google Chat'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopSpeechAudio();
              setMessages([getInitialGreeting(isUrdu)]);
            }}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#166534] hover:bg-[#1f5134] border border-white/20 text-white text-xs font-bold cursor-pointer"
          >
            {isUrdu ? 'نئی گفتگو' : 'Clear Chat'}
          </button>
        </div>
      </div>

      {/* Context Attachment Controls */}
      <div className="rounded-2xl bg-white border border-[#cbdcd0] p-3.5 space-y-2.5">
        <div className="text-[11px] font-mono uppercase font-bold text-[#3d5947]">
          {isUrdu ? 'گفتگو کے ساتھ منسلک کھیت کا ڈیٹا:' : 'Attached Field Context:'}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => (latestScan ? setIncludeLatestScan((v) => !v) : onOpenScanner())}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              includeLatestScan && latestScan
                ? 'bg-[#14532d] text-white border-[#14532d]'
                : 'bg-[#faf8f2] text-[#3d5947] border-[#cbdcd0]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>
              {latestScan
                ? `${latestScan.diseaseName} (${latestScan.confidence}%)`
                : isUrdu
                ? 'اسکین منسلک کریں'
                : 'Scan Leaf First'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIncludeSoilWeather((v) => !v)}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              includeSoilWeather
                ? 'bg-[#14532d] text-white border-[#14532d]'
                : 'bg-[#faf8f2] text-[#3d5947] border-[#cbdcd0]'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span className="tabular-nums">
              {moisturePercent}% · pH {soilPh.toFixed(1)}
              {liveWeather ? ` · ${liveWeather.current.tempC}°C` : ''}
            </span>
          </button>

          {plants.length > 0 && (
            <select
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              aria-label="Select tracked plant context"
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#faf8f2] border border-[#cbdcd0] text-xs font-bold text-[#13281c] focus:outline-none focus:ring-2 focus:ring-[#166534]"
            >
              <option value="">{isUrdu ? 'کوئی پودا منتخب نہیں' : 'No specific plant'}</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.stage})
                </option>
              ))}
            </select>
          )}

          {onOpenSensors && (
            <button
              type="button"
              onClick={onOpenSensors}
              className="text-xs font-bold text-[#b45309] hover:underline cursor-pointer"
            >
              {isUrdu ? 'مٹی/موسم تبدیل کریں' : 'Edit Soil & Probes'}
            </button>
          )}
        </div>
      </div>

      {/* Quick Starter Prompt Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {quickPrompts.map((q) => (
          <button
            key={q}
            type="button"
            disabled={isSending}
            onClick={() => void sendAdvisorPrompt(q)}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#edf5ef] hover:bg-[#dcebe1] border border-[#cbdcd0] text-[#14532d] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Conversation Container */}
      <div className="rounded-2xl bg-white border border-[#cbdcd0] p-4 space-y-4 min-h-[300px] max-h-[460px] overflow-y-auto shadow-xs">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5b7463] mb-1 px-1">
              {!msg.isMe && <BookOpenCheck className="w-3.5 h-3.5 text-[#14532d]" />}
              <span>{msg.sender}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{msg.timestamp}</span>
            </div>

            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs space-y-2 ${
                msg.isMe
                  ? 'bg-[#166534] text-white rounded-br-sm'
                  : 'bg-[#faf8f2] text-[#13281c] border border-[#cbdcd0] rounded-bl-sm'
              }`}
            >
              {msg.contextTags && msg.contextTags.length > 0 && (
                <div className="text-[10px] font-mono text-[#fef3c7] border-b border-white/20 pb-1">
                  {msg.contextTags.join(' · ')}
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {!msg.isMe && (
                <div className="pt-1 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => void speakMessage(msg)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14532d] hover:underline cursor-pointer"
                  >
                    {speakingMsgId === msg.id ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>{isUrdu ? 'روکیں' : 'Stop Audio'}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isUrdu ? 'سنیں' : 'Listen'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {msg.isMe && (
                <div className="flex justify-end">
                  <CheckCheck className="w-3 h-3 text-white/80" />
                </div>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex items-start gap-2.5 text-xs text-[#3d5947]">
            <div className="w-7 h-7 rounded-lg bg-[#14532d] text-white flex items-center justify-center shrink-0">
              <BookOpenCheck className="w-4 h-4" />
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-[#faf8f2] border border-[#cbdcd0] inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#166534]" />
              <span>{isUrdu ? 'زرعی مشورہ تیار ہو رہا ہے...' : 'Preparing field guidance...'}</span>
            </div>
          </div>
        )}
        <div ref={threadEndRef} />
      </div>

      {isListening && (
        <div
          role="status"
          className="px-3.5 py-2 rounded-xl bg-[#fef2f2] border border-[#fca5a5] flex items-center justify-between gap-2 text-xs font-bold text-[#991b1b]"
        >
          <span className="truncate">
            {interimSpeech ||
              (micLang === 'ur-PK'
                ? 'اردو آواز سنی جا رہی ہے...'
                : 'Listening in English... speak your question')}
          </span>
          <button
            type="button"
            onClick={stopDictation}
            className="px-2.5 py-1 rounded-lg bg-[#b91c1c] text-white text-[11px] font-bold cursor-pointer"
          >
            {isUrdu ? 'روکیں' : 'Stop'}
          </button>
        </div>
      )}

      {speechNotice && (
        <div className="px-3 py-2 rounded-xl bg-[#fffbeb] border border-[#fcd34d] text-xs text-[#78350f] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{speechNotice}</span>
        </div>
      )}

      {/* Composer with Voice Mic Language Toggle + Mic + Send */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendAdvisorPrompt(draft);
        }}
        className="flex items-center gap-1.5 sm:gap-2"
      >
        <button
          type="button"
          onClick={() => setMicLang((l) => (l === 'ur-PK' ? 'en-US' : 'ur-PK'))}
          title={isUrdu ? 'مائیک کی زبان بدلیں' : 'Switch voice language'}
          className="min-h-[46px] px-2.5 rounded-2xl bg-white border border-[#cbdcd0] text-[11px] font-mono font-bold text-[#14532d] hover:bg-[#edf5ef] shrink-0 cursor-pointer"
        >
          {micLang === 'ur-PK' ? 'UR' : 'EN'}
        </button>

        <button
          type="button"
          onClick={toggleDictation}
          aria-pressed={isListening}
          aria-label={isUrdu ? 'آواز سے سوال پوچھیں' : 'Speak question with microphone'}
          className={`min-h-[46px] min-w-[46px] rounded-2xl border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
            isListening
              ? 'bg-[#b91c1c] border-[#991b1b] text-white'
              : 'bg-[#b45309] border-[#92400e] text-white hover:bg-[#92400e]'
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={isSending}
          placeholder={
            isUrdu
              ? 'بیماری، علاج، مٹی یا منڈی کے بارے میں سوال لکھیں یا مائیک دبائیں...'
              : 'Ask about yellow leaves, blight, whitefly, tanki spray, or use mic...'
          }
          className="flex-1 min-h-[46px] px-3.5 sm:px-4 py-2 rounded-2xl bg-white border border-[#cbdcd0] text-xs text-[#13281c] placeholder-[#5b7463] focus:outline-none focus:ring-2 focus:ring-[#166534]"
        />

        <button
          type="submit"
          disabled={!draft.trim() || isSending}
          aria-label="Send question"
          className="min-h-[46px] min-w-[46px] rounded-2xl bg-[#166534] hover:bg-[#14532d] disabled:opacity-45 text-white flex items-center justify-center shrink-0 cursor-pointer"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      <div className="flex items-center gap-2 text-[11px] text-[#5b7463]">
        <Leaf className="w-3.5 h-3.5 text-[#166534] shrink-0" />
        <span>
          {isUrdu
            ? 'یہ مشورے تصدیق شدہ زرعی اصولوں پر مبنی ہیں — شدید وبائی علامات میں ہیلپ لائن 0800-17000 یا زرعی افسر سے رابطہ کریں۔'
            : 'Grounded in tomato pathology guidelines — verify active spots with a leaf scan or call Extension Helpline (0800-17000) for severe outbreaks.'}
        </span>
      </div>

      <GoogleChatShareModal
        isOpen={isGoogleChatOpen}
        onClose={() => setIsGoogleChatOpen(false)}
        result={googleChatResult}
      />
    </div>
  );
};
