"use client";

import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";
import { toast } from "@/components/ui/toast";

interface LocationLoaderProps {
  onLocated: (lat: number, lng: number) => void;
  currentCoords?: { lat: number; lng: number } | null;
}

export function LocationLoader({ onLocated, currentCoords }: LocationLoaderProps) {
  const geo = useGeolocation();

  const handleLocate = () => {
    geo.locate();
    const check = setInterval(() => {
      if (geo.status === "success" && geo.coords) {
        clearInterval(check);
        onLocated(geo.coords.lat, geo.coords.lng);
        toast.success("Position détectée");
      }
      if (geo.status === "error") {
        clearInterval(check);
        toast.error(geo.message);
      }
    }, 100);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLocate}
      loading={geo.status === "loading"}
    >
      <MapPin className="h-4 w-4" />
      {currentCoords ? "Actualiser la position" : "Ma position"}
    </Button>
  );
}
