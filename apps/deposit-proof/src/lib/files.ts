import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

import { parseLibrary, type Library } from '@/lib/model';

const LIBRARY_KEY = 'deposit-proof.library';
const OWNED_KEY = 'deposit-proof.owned';

function webStorage(): Storage | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

export async function loadLibrary(): Promise<Library | null> {
  const raw = Platform.OS === 'web' ? webStorage()?.getItem(LIBRARY_KEY) : await readNativeText('library.json');
  if (!raw) return null;
  try {
    return parseLibrary(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveLibrary(library: Library): Promise<void> {
  const raw = JSON.stringify(library);
  if (Platform.OS === 'web') {
    const storage = webStorage();
    if (!storage) return;
    storage.setItem(LIBRARY_KEY, raw);
    return;
  }
  const file = new File(Paths.document, 'library.json');
  await file.write(raw);
}

export async function loadOwned(): Promise<boolean> {
  const raw = Platform.OS === 'web' ? webStorage()?.getItem(OWNED_KEY) : await readNativeText('owned.txt');
  return raw === 'yes';
}

export async function saveOwned(owned: boolean): Promise<void> {
  const raw = owned ? 'yes' : 'no';
  if (Platform.OS === 'web') {
    webStorage()?.setItem(OWNED_KEY, raw);
    return;
  }
  const file = new File(Paths.document, 'owned.txt');
  await file.write(raw);
}

async function readNativeText(name: string): Promise<string | null> {
  const file = new File(Paths.document, name);
  if (!file.exists) return null;
  return file.text();
}

export async function persistPhoto(sourceUri: string, id: string): Promise<string> {
  const context = ImageManipulator.manipulate(sourceUri, { maxWidth: 1600 });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    compress: 0.72,
    format: SaveFormat.JPEG,
    base64: Platform.OS === 'web',
  });
  if (Platform.OS === 'web') {
    if (!saved.base64) throw new Error('Could not store that photo in this browser.');
    return `data:image/jpeg;base64,${saved.base64}`;
  }
  const folder = new Directory(Paths.document, 'photos');
  if (!folder.exists) folder.create();
  const destination = new File(folder, `${id}.jpg`);
  if (destination.exists) destination.delete();
  await new File(saved.uri).copy(destination);
  return `${id}.jpg`;
}

export function resolvePhotoUri(stored: string): string {
  if (
    stored.startsWith('data:') ||
    stored.startsWith('file:') ||
    stored.startsWith('blob:') ||
    stored.startsWith('content:') ||
    stored.startsWith('http')
  ) {
    return stored;
  }
  return new File(Paths.document, 'photos', stored).uri;
}

export function deleteStoredPhoto(stored: string): void {
  if (Platform.OS === 'web' || stored.startsWith('data:')) return;
  const file = new File(Paths.document, 'photos', stored);
  if (file.exists) file.delete();
}

export async function photoSourceForPdf(stored: string): Promise<string> {
  const uri = resolvePhotoUri(stored);
  if (uri.startsWith('data:image/jpeg')) return uri;
  const context = ImageManipulator.manipulate(uri, { maxWidth: 1400 });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  if (!saved.base64) throw new Error('Could not prepare a photo for the PDF.');
  return `data:image/jpeg;base64,${saved.base64}`;
}
