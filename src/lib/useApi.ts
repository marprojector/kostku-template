"use client";

import { useCallback, useEffect, useState } from "react";

interface RequestState<T> {
  key: string;
  data: T | null;
  error: string | null;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Fetch otomatis saat mount / saat `deps` berubah.
 *
 * State hanya diubah di dalam callback async (bukan sinkron di body effect),
 * dan `loading` diturunkan dari selisih kunci request sehingga tidak ada
 * render berantai.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): ApiState<T> {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<RequestState<T>>({ key: "", data: null, error: null });

  const key = `${JSON.stringify(deps)}#${nonce}`;
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    fetcher().then(
      (data) => {
        if (active) setState({ key, data, error: null });
      },
      (err: unknown) => {
        if (active) {
          setState({
            key,
            data: null,
            error: err instanceof Error ? err.message : "Terjadi kesalahan",
          });
        }
      }
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const settled = state.key === key;

  return {
    data: settled ? state.data : null,
    loading: !settled,
    error: settled ? state.error : null,
    reload,
  };
}
