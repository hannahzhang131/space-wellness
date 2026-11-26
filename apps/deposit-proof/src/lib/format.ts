export type GeocodedPlace = {
  formattedAddress?: string | null;
  name?: string | null;
  streetNumber?: string | null;
  street?: string | null;
  district?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatPlace(place: GeocodedPlace | null | undefined): string | null {
  if (!place) return null;
  if (place.formattedAddress?.trim()) return place.formattedAddress.trim();
  const street = [place.streetNumber, place.street].filter(Boolean).join(' ').trim();
  const locality = [place.district, place.city, place.region, place.postalCode].filter(Boolean).join(', ');
  const parts = [place.name, street, locality, place.country].filter((part) => part && part.trim().length > 0);
  const unique = [...new Set(parts.map((part) => part!.trim()))];
  return unique.length > 0 ? unique.join(', ') : null;
}

export function photoPlaceLine(place: string | null, propertyAddress: string): string {
  if (place) return place;
  return `${propertyAddress} (home address)`;
}

export function oneParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
