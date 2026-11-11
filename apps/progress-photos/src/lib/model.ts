export const POSES = ['front', 'side', 'back'] as const;
export type Pose = (typeof POSES)[number];

export const FREE_CHECK_IN_LIMIT = 6;
export const LIFETIME_PRODUCT_ID = 'progresspics.lifetime';
export const FALLBACK_PRICE = '$3.99';

const LB_PER_KG = 2.20462;

export type WeightUnit = 'kg' | 'lb';

export type Reminder = {
  /** 1 is Sunday, 7 is Saturday, matching expo-notifications weekly triggers. */
  weekday: number;
  hour: number;
  minute: number;
};

export type CheckIn = {
  id: string;
  takenAt: string;
  weightKg: number | null;
  note: string;
  /** File names inside the app photos folder, or data URLs on web. */
  photos: Partial<Record<Pose, string>>;
};

export type Settings = {
  unit: WeightUnit;
  reminder: Reminder | null;
  lock: boolean;
};

export type Library = {
  version: 1;
  checkIns: CheckIn[];
  settings: Settings;
};

export const defaultSettings: Settings = { unit: 'kg', reminder: null, lock: false };
export const emptyLibrary: Library = { version: 1, checkIns: [], settings: defaultSettings };

export function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createCheckIn(now = new Date().toISOString()): CheckIn {
  return { id: createId(), takenAt: now, weightKg: null, note: '', photos: {} };
}

export function canAddCheckIn(count: number, isPro: boolean): boolean {
  return isPro || count < FREE_CHECK_IN_LIMIT;
}

export function poseLabel(pose: Pose): string {
  if (pose === 'front') return 'Front';
  if (pose === 'side') return 'Side';
  return 'Back';
}

export function newestFirst(checkIns: CheckIn[]): CheckIn[] {
  return [...checkIns].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

export function oldestFirst(checkIns: CheckIn[]): CheckIn[] {
  return [...checkIns].sort((a, b) => a.takenAt.localeCompare(b.takenAt));
}

export function photoCount(checkIn: CheckIn): number {
  return POSES.filter((pose) => checkIn.photos[pose]).length;
}

/** The most recent earlier photo of this pose, shown faintly over the camera to line up the shot. */
export function ghostFor(checkIns: CheckIn[], checkInId: string, pose: Pose): string | null {
  const current = checkIns.find((item) => item.id === checkInId);
  const candidates = newestFirst(checkIns).filter(
    (item) => item.id !== checkInId && item.photos[pose] && (!current || item.takenAt <= current.takenAt),
  );
  return candidates[0]?.photos[pose] ?? null;
}

/** First and latest check-ins that have at least one photo. */
export function defaultPair(checkIns: CheckIn[]): { before: CheckIn; after: CheckIn } | null {
  const withPhotos = oldestFirst(checkIns).filter((item) => photoCount(item) > 0);
  if (withPhotos.length < 2) return null;
  return { before: withPhotos[0], after: withPhotos[withPhotos.length - 1] };
}

export function sharedPoses(before: CheckIn, after: CheckIn): Pose[] {
  return POSES.filter((pose) => before.photos[pose] && after.photos[pose]);
}

export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : value / LB_PER_KG;
}

export function fromKg(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg * LB_PER_KG;
}

export function parseWeight(text: string, unit: WeightUnit): number | null {
  const value = Number.parseFloat(text.replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0 || value > 700) return null;
  return Math.round(toKg(value, unit) * 100) / 100;
}

export function formatWeight(kg: number | null, unit: WeightUnit): string {
  if (kg === null) return '';
  return `${fromKg(kg, unit).toFixed(1)} ${unit}`;
}

export function weightText(kg: number | null, unit: WeightUnit): string {
  if (kg === null) return '';
  return fromKg(kg, unit).toFixed(1);
}

export function formatWeightChange(beforeKg: number | null, afterKg: number | null, unit: WeightUnit): string | null {
  if (beforeKg === null || afterKg === null) return null;
  const delta = fromKg(afterKg, unit) - fromKg(beforeKg, unit);
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) return `No change in ${unit}`;
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toFixed(1)} ${unit}`;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / 86_400_000);
}

export function spanLabel(fromIso: string, toIso: string): string {
  const days = Math.abs(daysBetween(fromIso, toIso));
  if (days === 0) return 'Same day';
  if (days < 14) return `${days} day${days === 1 ? '' : 's'}`;
  const weeks = Math.round(days / 7);
  return `${weeks} weeks`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parsePhotos(value: unknown): Partial<Record<Pose, string>> {
  if (!isRecord(value)) return {};
  const photos: Partial<Record<Pose, string>> = {};
  for (const pose of POSES) {
    const stored = value[pose];
    if (typeof stored === 'string' && stored.length > 0) photos[pose] = stored;
  }
  return photos;
}

function parseCheckIn(value: unknown): CheckIn | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.takenAt !== 'string') return null;
  const weight = typeof value.weightKg === 'number' && Number.isFinite(value.weightKg) && value.weightKg > 0 ? value.weightKg : null;
  return {
    id: value.id,
    takenAt: value.takenAt,
    weightKg: weight,
    note: typeof value.note === 'string' ? value.note : '',
    photos: parsePhotos(value.photos),
  };
}

function inRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function parseReminder(value: unknown): Reminder | null {
  if (!isRecord(value)) return null;
  if (!inRange(value.weekday, 1, 7) || !inRange(value.hour, 0, 23) || !inRange(value.minute, 0, 59)) return null;
  return { weekday: value.weekday, hour: value.hour, minute: value.minute };
}

function parseSettings(value: unknown): Settings {
  if (!isRecord(value)) return defaultSettings;
  return {
    unit: value.unit === 'lb' ? 'lb' : 'kg',
    reminder: parseReminder(value.reminder),
    lock: value.lock === true,
  };
}

export function parseLibrary(raw: unknown): Library | null {
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.checkIns)) return null;
  const checkIns = raw.checkIns.map(parseCheckIn).filter((item): item is CheckIn => item !== null);
  return { version: 1, checkIns, settings: parseSettings(raw.settings) };
}
