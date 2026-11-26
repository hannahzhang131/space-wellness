import * as Location from 'expo-location';

import { formatPlace } from '@/lib/format';

export type CapturedPlace = {
  place: string | null;
};

const empty: CapturedPlace = { place: null };

export async function capturePlace(): Promise<CapturedPlace> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return empty;
    const position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      8000,
    );
    const places = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    return { place: formatPlace(places[0]) };
  } catch {
    return empty;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('location timed out')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
