"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, AlertCircle, RefreshCw, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useGeolocation } from "@/hooks/use-geolocation";
import { toast } from "@/components/ui/toast";

interface LocationLoaderProps {
  onLocated: (lat: number, lng: number) => void;
  currentCoords?: { lat: number; lng: number } | null;
}

export function LocationLoader({ onLocated, currentCoords }: LocationLoaderProps) {
  const geo = useGeolocation();
  const [manualAddress, setManualAddress] = useState("");
  const [showManual, setShowManual] = useState(false);

  const handleLocate = () => {
    geo.locate();
  };

  // React to success
  if (geo.status === "success" && geo.coords) {
    // Fire callback on next tick to avoid setState during render
    Promise.resolve().then(() => {
      onLocated(geo.coords!.lat, geo.coords!.lng);
      if (geo.accuracy && geo.accuracy > 100) {
        toast.success(`Position détectée (précision : ${Math.round(geo.accuracy)}m)`);
      } else {
        toast.success("Position détectée");
      }
      geo.reset();
    });
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {(geo.status === "idle" || geo.status === "success") && !showManual && (
          <motion.div
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button variant="outline" size="sm" onClick={handleLocate}>
              <MapPin className="h-4 w-4" />
              {currentCoords ? "Actualiser la position" : "Ma position"}
            </Button>
          </motion.div>
        )}

        {(geo.status === "requesting" || geo.status === "high-accuracy") && (
          <motion.div
            key="requesting"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 text-sm text-text-secondary"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Localisation en cours…
          </motion.div>
        )}

        {geo.status === "low-accuracy-fallback" && (
          <motion.div
            key="fallback"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 text-sm text-amber-600"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Basse précision — tentative de secours…
          </motion.div>
        )}

        {geo.status === "denied" && (
          <motion.div
            key="denied"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="py-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm">{geo.message}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={handleLocate}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Réessayer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowManual(true)}>
                    <Search className="h-3 w-3 mr-1" />
                    Entrer mon adresse
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(geo.status === "timeout" || geo.status === "error") && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <Card className="border-border">
              <CardContent className="py-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-brand-red mt-0.5 shrink-0" />
                  <p className="text-sm">{geo.message}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={handleLocate}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Réessayer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowManual(true)}>
                    <Search className="h-3 w-3 mr-1" />
                    Entrer mon adresse
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {showManual && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-2"
        >
          <Input
            placeholder="Entrez votre adresse (ex. Cotonou, Akpakpa)"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!manualAddress.trim()}
              onClick={() => {
                // Geocode the address using Nominatim (OpenStreetMap)
                void (async () => {
                  try {
                    const res = await fetch(
                      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddress)}&limit=1`,
                      { headers: { "Accept-Language": "fr" } }
                    );
                    const data = await res.json();
                    if (data.length > 0) {
                      const lat = parseFloat(data[0].lat);
                      const lng = parseFloat(data[0].lon);
                      onLocated(lat, lng);
                      setShowManual(false);
                      setManualAddress("");
                      toast.success("Adresse localisée");
                    } else {
                      toast.error("Adresse introuvable. Essayez une autre formulation.");
                    }
                  } catch {
                    toast.error("Erreur de recherche. Réessayez.");
                  }
                })();
              }}
            >
              <Search className="h-3 w-3 mr-1" />
              Rechercher
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowManual(false); setManualAddress(""); }}>
              Annuler
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
