"use client";

import { useCallback, useRef, useState } from "react";

export type GeoStatus =
  | "idle"
  | "requesting"
  | "high-accuracy"
  | "low-accuracy-fallback"
  | "success"
  | "denied"
  | "timeout"
  | "error";

interface GeoSuccessState {
  status: "success";
  lat: number;
  lng: number;
  accuracy: number;
}

interface GeoErrorState {
  status: "denied" | "timeout" | "error";
  message: string;
}

type GeoState = { status: Exclude<GeoStatus, "success" | "denied" | "timeout" | "error"> } | GeoSuccessState | GeoErrorState;

interface UseGeolocationOptions {
  highAccuracyTimeout?: number;
  lowAccuracyTimeout?: number;
}

export function useGeolocation(opts?: UseGeolocationOptions) {
  const [state, setState] = useState<GeoState>({ status: "idle" });
  const watchId = useRef<number | null>(null);
  const abortRef = useRef<boolean>(false);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: "error", message: "La géolocalisation n'est pas supportée par votre navigateur." });
      return;
    }

    abortRef.current = false;
    setState({ status: "requesting" });

    // Phase 1: high accuracy
    setState({ status: "high-accuracy" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (abortRef.current) return;
        setState({
          status: "success",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        if (abortRef.current) return;

        // Permission denied — no retry
        if (err.code === err.PERMISSION_DENIED) {
          setState({
            status: "denied",
            message: "L'accès à la localisation a été refusé. Autorisez-la dans les paramètres de votre navigateur.",
          });
          return;
        }

        // Phase 2: low accuracy fallback
        setState({ status: "low-accuracy-fallback" });
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (abortRef.current) return;
            setState({
              status: "success",
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          },
          (err2) => {
            if (abortRef.current) return;

            if (err2.code === err2.PERMISSION_DENIED) {
              setState({
                status: "denied",
                message: "L'accès à la localisation a été refusé. Autorisez-la dans les paramètres de votre navigateur.",
              });
              return;
            }
            if (err2.code === err2.TIMEOUT) {
              setState({
                status: "timeout",
                message: "La géolocalisation a pris trop de temps. Réessayez ou entrez votre adresse manuellement.",
              });
              return;
            }
            setState({
              status: "error",
              message: "Impossible d'obtenir votre position. Entrez votre adresse manuellement.",
            });
          },
          { enableHighAccuracy: false, timeout: opts?.lowAccuracyTimeout ?? 8000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: opts?.highAccuracyTimeout ?? 6000, maximumAge: 0 }
    );
  }, [opts?.highAccuracyTimeout, opts?.lowAccuracyTimeout]);

  const watch = useCallback(
    (onPosition: (lat: number, lng: number, accuracy: number) => void) => {
      if (!navigator.geolocation) {
        setState({ status: "error", message: "La géolocalisation n'est pas supportée." });
        return;
      }
      setState({ status: "high-accuracy" });
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;
          setState({ status: "success", lat, lng, accuracy });
          onPosition(lat, lng, accuracy);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setState({ status: "denied", message: "Localisation refusée." });
          } else {
            setState({ status: "error", message: "Suivi de position échoué." });
          }
        },
        { enableHighAccuracy: true }
      );
    },
    []
  );

  const stopWatch = useCallback(() => {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    stopWatch();
    setState({ status: "idle" });
  }, [stopWatch]);

  const coords =
    state.status === "success" ? { lat: state.lat, lng: state.lng } : null;
  const accuracy = state.status === "success" ? state.accuracy : null;

  return { ...state, coords, accuracy, locate, watch, stopWatch, reset };
}
