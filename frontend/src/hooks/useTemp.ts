import { useCallback, useEffect, useRef, useState } from "react";
import { tempStore } from "../services/tempStore";

type Updater<T> = T | ((prev: T | undefined) => T);

export function useTemp<T>(key: string, initial?: T) {
  const initialRef = useRef(initial); // lock initial once

  const [value, setValue] = useState<T | undefined>(() => {
    const v = tempStore.get<T>(key);
    return v === undefined ? initialRef.current : v;
  });

  useEffect(() => {
    const unsub = tempStore.subscribe<T>((e) => {
      if (!e.key || e.key !== key) return;
      setValue(tempStore.get<T>(key));
    });

    // one-time sync for this key
    setValue(tempStore.get<T>(key) ?? initialRef.current);
    return unsub;
  }, [key]); // <-- no "initial" here

  const set = useCallback(
    (next: Updater<T>, ttlMs?: number) => {
      const prev = tempStore.get<T>(key) ?? initialRef.current;
      const resolved =
        typeof next === "function"
          ? (next as (p: T | undefined) => T)(prev)
          : next;
      tempStore.set<T>(key, resolved, ttlMs);
    },
    [key]
  );

  const remove = useCallback(() => tempStore.remove(key), [key]);

  return { value, set, remove };
}
