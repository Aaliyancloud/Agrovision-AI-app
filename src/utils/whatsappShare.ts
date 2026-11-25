import type { DiagnosisResult } from '../types/disease';
import type { ScanHistoryEntry } from '../context/ScanHistoryContext';

export function buildWhatsAppSummaryText(
  item: Pick<
    DiagnosisResult | ScanHistoryEntry,
    'diseaseName' | 'scientificName' | 'confidence' | 'severity' | 'summary'
  > & { organicSteps: string[] },
  isUrdu: boolean
): string {
  const steps = item.organicSteps.slice(0, 3);
  if (isUrdu) {
    return [
      `*ایگرو وژن فیلڈ رپورٹ*`,
      `تشخیص: ${item.diseaseName} (${item.scientificName})`,
      `یقین: ${item.confidence}% · شدت: ${item.severity}`,
      `خلاصہ: ${item.summary}`,
      steps.length > 0 ? `تجویز کردہ اقدامات:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : ''
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  return [
    `*AgroVision Field Report*`,
    `Condition: ${item.diseaseName} (${item.scientificName})`,
    `Match: ${item.confidence}% · Severity: ${item.severity}`,
    `Summary: ${item.summary}`,
    steps.length > 0 ? `Recommended Steps:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : ''
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
