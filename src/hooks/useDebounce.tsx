import { useEffect, useState } from "react";

export interface UseDebounceFunction<T> {
  (value: T, delay?: number): T;
}

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id: ReturnType<typeof setTimeout> = setTimeout(
      () => setDebounced(value),
      delay,
    );

    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
