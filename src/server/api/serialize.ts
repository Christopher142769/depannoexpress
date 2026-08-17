type DbInterventionRow = {
  id: string;
  client_id: string;
  pro_id: string | null;
  status: string;
  problem: string;
  client_location: unknown;
  client_address: string | null;
  pro_location: unknown;
  estimated_price: number | null;
  final_price: number | null;
  cancellation_penalty: number | null;
  cancelled_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  client?: { id: string; name: string; phone: string | null } | null;
  pro?: { id: string; name: string; phone: string | null; specialty: string | null } | null;
};

type GeoPoint = { lng: number; lat: number; address?: string } | null;

function serializeGeoPoint(value: unknown): GeoPoint {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "coordinates" in value) {
    const coords = (value as { coordinates?: number[] }).coordinates;
    if (coords && coords.length >= 2) {
      return { lng: coords[0], lat: coords[1], address: (value as { address?: string }).address };
    }
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed?.coordinates?.length >= 2) {
        return { lng: parsed.coordinates[0], lat: parsed.coordinates[1] };
      }
    } catch {}
  }
  return null;
}

export function serializeIntervention(doc: DbInterventionRow) {
  const client = doc.client
    ? { id: doc.client.id, name: doc.client.name, phone: doc.client.phone }
    : { id: doc.client_id };

  const pro = doc.pro
    ? { id: doc.pro.id, name: doc.pro.name, phone: doc.pro.phone, specialty: doc.pro.specialty }
    : doc.pro_id
      ? { id: doc.pro_id }
      : null;

  return {
    id: doc.id,
    clientId: doc.client_id,
    client,
    proId: doc.pro_id,
    pro,
    status: doc.status,
    problem: doc.problem,
    clientLocation: serializeGeoPoint(doc.client_location),
    proLocation: serializeGeoPoint(doc.pro_location),
    estimatedPrice: doc.estimated_price,
    finalPrice: doc.final_price,
    cancellationPenalty: doc.cancellation_penalty,
    cancelledBy: doc.cancelled_by,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    completedAt: doc.completed_at,
  };
}
