import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { deleteStoredPhoto, loadLibrary, saveLibrary } from '@/lib/files';
import { createCheckIn, emptyLibrary, type CheckIn, type Library, type Pose, type Settings } from '@/lib/model';

type LibraryContextValue = {
  ready: boolean;
  persistError: string | null;
  library: Library;
  addCheckIn: () => CheckIn;
  setPhoto: (checkInId: string, pose: Pose, stored: string) => void;
  removePhoto: (checkInId: string, pose: Pose) => void;
  setWeight: (checkInId: string, weightKg: number | null) => void;
  setNote: (checkInId: string, note: string) => void;
  deleteCheckIn: (checkInId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

function patchCheckIn(library: Library, checkInId: string, patch: (checkIn: CheckIn) => CheckIn): Library {
  return {
    ...library,
    checkIns: library.checkIns.map((item) => (item.id === checkInId ? patch(item) : item)),
  };
}

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
    saveLibrary(library)
      .then(() => setPersistError(null))
      .catch((error: unknown) => {
        setPersistError(error instanceof Error ? error.message : 'Could not save on this phone.');
      });
  }, [library, canSave]);

  const addCheckIn = useCallback(() => {
    const checkIn = createCheckIn();
    setLibrary((current) => ({ ...current, checkIns: [checkIn, ...current.checkIns] }));
    return checkIn;
  }, []);

  const setPhoto = useCallback((checkInId: string, pose: Pose, stored: string) => {
    setLibrary((current) =>
      patchCheckIn(current, checkInId, (checkIn) => {
        const previous = checkIn.photos[pose];
        if (previous && previous !== stored) deleteStoredPhoto(previous);
        return { ...checkIn, photos: { ...checkIn.photos, [pose]: stored } };
      }),
    );
  }, []);

  const removePhoto = useCallback((checkInId: string, pose: Pose) => {
    setLibrary((current) =>
      patchCheckIn(current, checkInId, (checkIn) => {
        const previous = checkIn.photos[pose];
        if (previous) deleteStoredPhoto(previous);
        const photos = { ...checkIn.photos };
        delete photos[pose];
        return { ...checkIn, photos };
      }),
    );
  }, []);

  const setWeight = useCallback((checkInId: string, weightKg: number | null) => {
    setLibrary((current) => patchCheckIn(current, checkInId, (checkIn) => ({ ...checkIn, weightKg })));
  }, []);

  const setNote = useCallback((checkInId: string, note: string) => {
    setLibrary((current) => patchCheckIn(current, checkInId, (checkIn) => ({ ...checkIn, note })));
  }, []);

  const deleteCheckIn = useCallback((checkInId: string) => {
    setLibrary((current) => {
      const target = current.checkIns.find((item) => item.id === checkInId);
      if (target) Object.values(target.photos).forEach((stored) => stored && deleteStoredPhoto(stored));
      return { ...current, checkIns: current.checkIns.filter((item) => item.id !== checkInId) };
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setLibrary((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      persistError,
      library,
      addCheckIn,
      setPhoto,
      removePhoto,
      setWeight,
      setNote,
      deleteCheckIn,
      updateSettings,
    }),
    [ready, persistError, library, addCheckIn, setPhoto, removePhoto, setWeight, setNote, deleteCheckIn, updateSettings],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const value = useContext(LibraryContext);
  if (!value) throw new Error('LibraryProvider is missing');
  return value;
}

export function useCheckIn(checkInId: string | undefined): CheckIn | undefined {
  const { library } = useLibrary();
  return library.checkIns.find((item) => item.id === checkInId);
}
