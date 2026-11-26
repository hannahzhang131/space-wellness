import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { deleteStoredPhoto, loadLibrary, saveLibrary } from '@/lib/files';
import {
  canAddPhoto,
  canAddProperty,
  canAddRoom,
  createId,
  createProperty,
  emptyLibrary,
  photosFor,
  type Library,
  type Photo,
  type Property,
  type VisitKind,
} from '@/lib/model';

type LibraryContextValue = {
  ready: boolean;
  persistError: string | null;
  library: Library;
  addProperty: (name: string, address: string) => Property;
  addRoom: (propertyId: string, name: string) => boolean;
  addPhoto: (photo: Photo) => void;
  updatePhotoNote: (photoId: string, note: string) => void;
  deletePhoto: (photoId: string) => void;
  updateProperty: (propertyId: string, name: string, address: string) => void;
  deleteProperty: (propertyId: string) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<Library>(emptyLibrary);
  const [ready, setReady] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [persistError, setPersistError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLibrary()
      .then((loaded) => {
        if (cancelled) return;
        if (loaded) setLibrary(loaded);
        setCanSave(true);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!canSave) return;
    saveLibrary(library).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Could not save on this device.';
      setPersistError(message);
    });
  }, [library, canSave]);

  const addProperty = useCallback((name: string, address: string) => {
    const property = createProperty(name, address);
    setLibrary((current) => ({ ...current, properties: [property, ...current.properties] }));
    return property;
  }, []);

  const addRoom = useCallback((propertyId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    setLibrary((current) => ({
      ...current,
      properties: current.properties.map((property) =>
        property.id === propertyId
          ? {
              ...property,
              rooms: [...property.rooms, { id: createId(), name: trimmed, custom: true }],
            }
          : property,
      ),
    }));
    return true;
  }, []);

  const addPhoto = useCallback((photo: Photo) => {
    setLibrary((current) => ({ ...current, photos: [...current.photos, photo] }));
  }, []);

  const updatePhotoNote = useCallback((photoId: string, note: string) => {
    setLibrary((current) => ({
      ...current,
      photos: current.photos.map((photo) => (photo.id === photoId ? { ...photo, note } : photo)),
    }));
  }, []);

  const deletePhoto = useCallback((photoId: string) => {
    setLibrary((current) => {
      const photo = current.photos.find((item) => item.id === photoId);
      if (photo) deleteStoredPhoto(photo.stored);
      return { ...current, photos: current.photos.filter((item) => item.id !== photoId) };
    });
  }, []);

  const updateProperty = useCallback((propertyId: string, name: string, address: string) => {
    setLibrary((current) => ({
      ...current,
      properties: current.properties.map((property) =>
        property.id === propertyId ? { ...property, name: name.trim(), address: address.trim() } : property,
      ),
    }));
  }, []);

  const deleteProperty = useCallback((propertyId: string) => {
    setLibrary((current) => {
      current.photos.filter((photo) => photo.propertyId === propertyId).forEach((photo) => {
        deleteStoredPhoto(photo.stored);
      });
      return {
        ...current,
        properties: current.properties.filter((property) => property.id !== propertyId),
        photos: current.photos.filter((photo) => photo.propertyId !== propertyId),
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      ready,
      persistError,
      library,
      addProperty,
      addRoom,
      addPhoto,
      updatePhotoNote,
      deletePhoto,
      updateProperty,
      deleteProperty,
    }),
    [
      ready,
      persistError,
      library,
      addProperty,
      addRoom,
      addPhoto,
      updatePhotoNote,
      deletePhoto,
      updateProperty,
      deleteProperty,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const value = useContext(LibraryContext);
  if (!value) throw new Error('LibraryProvider is missing');
  return value;
}

export function useProperty(propertyId: string | undefined): Property | undefined {
  const { library } = useLibrary();
  return library.properties.find((property) => property.id === propertyId);
}

export { canAddPhoto, canAddProperty, canAddRoom, photosFor };
export type { Photo, VisitKind };
