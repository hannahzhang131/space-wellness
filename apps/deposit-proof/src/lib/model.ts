export const FREE_PROPERTY_LIMIT = 1;
export const FREE_PHOTOS_PER_ROOM_VISIT = 3;
export const LIFETIME_PRODUCT_ID = 'lifetime';
export const FALLBACK_PRICE = '$3.99';

export const PRESET_ROOMS = [
  'Entrance',
  'Living room',
  'Kitchen',
  'Bedroom',
  'Bathroom',
  'Hallway',
] as const;

export type VisitKind = 'move-in' | 'move-out';

export type Room = {
  id: string;
  name: string;
  custom: boolean;
};

export type Property = {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  rooms: Room[];
};

export type Photo = {
  id: string;
  propertyId: string;
  roomId: string;
  visit: VisitKind;
  takenAt: string;
  /** Street address captured with the photo. Null when location was off. */
  place: string | null;
  note: string;
  /** File name inside the app photos folder, or a data URL on web. */
  stored: string;
};

export type Library = {
  version: 1;
  properties: Property[];
  photos: Photo[];
};

export const emptyLibrary: Library = { version: 1, properties: [], photos: [] };

export function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createProperty(name: string, address: string, now = new Date().toISOString()): Property {
  return {
    id: createId(),
    name: name.trim(),
    address: address.trim(),
    createdAt: now,
    rooms: PRESET_ROOMS.map((roomName) => ({
      id: createId(),
      name: roomName,
      custom: false,
    })),
  };
}

export function canAddProperty(count: number, isPro: boolean): boolean {
  return isPro || count < FREE_PROPERTY_LIMIT;
}

export function canAddPhoto(count: number, isPro: boolean): boolean {
  return isPro || count < FREE_PHOTOS_PER_ROOM_VISIT;
}

export function canAddRoom(isPro: boolean): boolean {
  return isPro;
}

export function photosFor(
  photos: Photo[],
  propertyId: string,
  roomId: string,
  visit: VisitKind,
): Photo[] {
  return photos
    .filter((photo) => photo.propertyId === propertyId && photo.roomId === roomId && photo.visit === visit)
    .sort((a, b) => a.takenAt.localeCompare(b.takenAt));
}

export function visitLabel(visit: VisitKind): string {
  return visit === 'move-in' ? 'Move-in' : 'Move-out';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseRoom(value: unknown): Room | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') return null;
  return { id: value.id, name: value.name, custom: value.custom === true };
}

function parseProperty(value: unknown): Property | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.address !== 'string') {
    return null;
  }
  if (typeof value.createdAt !== 'string' || !Array.isArray(value.rooms)) return null;
  const rooms = value.rooms.map(parseRoom).filter((room): room is Room => room !== null);
  if (rooms.length === 0) return null;
  return { id: value.id, name: value.name, address: value.address, createdAt: value.createdAt, rooms };
}

function parsePhoto(value: unknown): Photo | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== 'string' ||
    typeof value.propertyId !== 'string' ||
    typeof value.roomId !== 'string' ||
    typeof value.takenAt !== 'string' ||
    typeof value.stored !== 'string'
  ) {
    return null;
  }
  if (value.visit !== 'move-in' && value.visit !== 'move-out') return null;
  return {
    id: value.id,
    propertyId: value.propertyId,
    roomId: value.roomId,
    visit: value.visit,
    takenAt: value.takenAt,
    place: typeof value.place === 'string' ? value.place : null,
    note: typeof value.note === 'string' ? value.note : '',
    stored: value.stored,
  };
}

export function parseLibrary(raw: unknown): Library | null {
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.properties) || !Array.isArray(raw.photos)) {
    return null;
  }
  const properties = raw.properties.map(parseProperty).filter((item): item is Property => item !== null);
  const propertyIds = new Set(properties.map((property) => property.id));
  const roomIds = new Set(properties.flatMap((property) => property.rooms.map((room) => room.id)));
  const photos = raw.photos
    .map(parsePhoto)
    .filter((photo): photo is Photo => photo !== null && propertyIds.has(photo.propertyId) && roomIds.has(photo.roomId));
  return { version: 1, properties, photos };
}
