"use client";

import { useCallback, useRef, useState } from "react";

type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; lat: number; lng: number }
  | { status: "error"; message: string };

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
}

export function useGeolocation(opts?: UseGeolocationOptions) {
  const [state, setState] = useState<GeoState>({ status: "idle" });
  const watchId = useRef<number | null>(null);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: "error", message: "Géolocalisation non supportée" });
      return;
    }
    setState({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({ status: "success", lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setState({ status: "error", message: "Impossible d'obtenir la position" });
      },
      { enableHighAccuracy: opts?.enableHighAccuracy ?? true, timeout: opts?.timeout ?? 12000 }
    );
  }, [opts?.enableHighAccuracy, opts?.timeout]);

  const watch = useCallback(
    (onPosition: (lat: number, lng: number) => void) => {
      if (!navigator.geolocation) {
        setState({ status: "error", message: "Géolocalisation non supportée" });
        return;
      }
      setState({ status: "loading" });
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setState({ status: "success", lat, lng });
          onPosition(lat, lng);
        },
        () => {
          setState({ status: "error", message: "Suivi de position échoué" });
        },
        { enableHighAccuracy: opts?.enableHighAccuracy ?? true }
      );
    },
    [opts?.enableHighAccuracy]
  );

  const stopWatch = useCallback(() => {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const coords =
    state.status === "success" ? { lat: state.lat, lng: state.lng } : null;

  return { ...state, coords, locate, watch, stopWatch };
}
