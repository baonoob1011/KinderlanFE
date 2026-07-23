import { useState, useEffect } from 'react';

const STORE_ID_KEY = 'storeId';

/**
 * Shared hook to get/set storeId from localStorage.
 * Returns the storeId string and a setter that also persists to localStorage.
 */
export function useStoreId() {
    const [storeId, setStoreIdState] = useState<string | null>(
        () => localStorage.getItem(STORE_ID_KEY)
    );

    const setStoreId = (id: string) => {
        localStorage.setItem(STORE_ID_KEY, id);
        setStoreIdState(id);
    };

    // Sync if another tab or component changes it
    useEffect(() => {
        const stored = localStorage.getItem(STORE_ID_KEY);
        if (stored && stored !== storeId) setStoreIdState(stored);
    }, []);

    return { storeId, setStoreId };
}
