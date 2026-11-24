export type HapticPattern = number | number[];

function canVibrate(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  if (typeof navigator.vibrate !== 'function') {
    return false;
  }
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  return true;
}

export function triggerHaptic(pattern: HapticPattern): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignore browser security/gesture restrictions silently
  }
}

/** Subtle crisp tap when interacting with the camera scan action */
export function hapticScanTap(): void {
  triggerHaptic(16);
}

/** Distinct double pulse when completing a daily field mission */
export function hapticMissionComplete(): void {
  triggerHaptic([14, 42, 22]);
}

/** Celebratory subtle triple pulse when unlocking a new achievement badge */
export function hapticBadgeUnlock(): void {
  triggerHaptic([18, 45, 22, 55, 34]);
}
