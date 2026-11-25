import { PlantIdentificationResult } from '../services/plantIdentification';

export type PathogenType = 'Fungal' | 'Bacterial' | 'Viral' | 'Pest' | 'Healthy' | 'None';

export type SeverityLevel = 'None' | 'Mild' | 'Moderate' | 'Severe';

export interface TreatmentPlan {
  organic: string[];
  chemical: string[];
  cultural: string[];
  prevention: string[];
}

export interface DiseaseInfo {
  id: string;
  name: string;
  scientificName: string;
  pathogenType: PathogenType;
  description: string;
  primarySymptoms: string[];
  earlyStageSigns: string[];
  advancedSigns: string[];
  favorableConditions: {
    temperature: string;
    humidity: string;
    spreadVector: string;
  };
  treatment: TreatmentPlan;
  sampleImageUrl: string;
  typicalSeverity: SeverityLevel;
  contagionRisk: 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface LesionBox {
  x: number; // percentage 0-100
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

export interface SensorContextInput {
  moistureEnabled: boolean;
  moisturePercent: number;
  phEnabled: boolean;
  soilPh: number;
}

export interface SensorDiagnosisInsights {
  moistureEnabled: boolean;
  moisturePercent?: number;
  phEnabled: boolean;
  soilPh?: number;
  riskLevel: 'Optimal' | 'Elevated' | 'Critical';
  confidenceDelta: number;
  contextSummary: string;
  urduContextSummary: string;
  agronomicAdjustment: string;
  urduAgronomicAdjustment: string;
}

export interface CareRoutineStep {
  phase: string;
  urduPhase: string;
  title: string;
  urduTitle: string;
  instruction: string;
  urduInstruction: string;
}

export interface DiagnosisResult {
  id: string;
  isPlantLeaf: boolean;
  isTomatoLeaf: boolean;
  stage1: PlantIdentificationResult;
  validationMessage?: string;
  diseaseId: string;
  diseaseName: string;
  scientificName: string;
  pathogenType: PathogenType;
  confidence: number; // 0 - 100
  severity: SeverityLevel;
  lesionCoveragePercent: number;
  detectedLesions: LesionBox[];
  summary: string;
  urduSummary?: string;
  diseaseDefinition?: string;
  urduDiseaseDefinition?: string;
  keyObservations: string[];
  treatment: TreatmentPlan;
  careRoutine?: CareRoutineStep[];
  sensorInsights?: SensorDiagnosisInsights;
  analysisTimestamp: string;
  sourceType: 'upload' | 'camera' | 'sample';
  imageUri: string;
  processingTimeMs: number;
  aiEngineUsed:
    | 'AgroVision Neural Edge (DINOv2)'
    | 'AgroVision Neural Edge'
    | 'AgroVision Offline Edge Fallback'
    | 'Gemini Vision AI'
    | 'Google Gemini 3.8 Flash'
    | 'Google Gemini 4 Hydrogen'
    | 'Google Gemini 3.1 Flash Lite';
}

export interface SampleLeaf {
  id: string;
  title: string;
  condition: string;
  pathogen: PathogenType;
  imageUrl: string;
  description: string;
  category?: 'tomato' | 'non_tomato' | 'blurry' | 'non_leaf';
  expectedStage1?: 'tomato_leaf' | 'non_tomato_leaf' | 'blurry' | 'non_leaf';
}
