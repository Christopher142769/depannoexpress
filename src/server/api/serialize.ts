import type { Types } from "mongoose";

type Loc = {
  type?: string;
  coordinates?: number[];
  address?: string;
} | null | undefined;

function loc(value: Loc) {
  if (!value?.coordinates || value.coordinates.length < 2) return null;
  const [lng, lat] = value.coordinates;
  return {
    lng,
    lat,
    address: value.address,
  };
}

export function serializeId(id: Types.ObjectId | string | undefined | null) {
  if (!id) return undefined;
  return typeof id === "string" ? id : id.toString();
}

export function serializeIntervention(doc: {
  _id: Types.ObjectId;
  clientId: Types.ObjectId | { _id: Types.ObjectId; name?: string; phone?: string };
  proId?: Types.ObjectId | { _id: Types.ObjectId; name?: string; phone?: string; specialty?: string };
  status: string;
  problem: string;
  clientLocation: Loc;
  proLocation?: Loc;
  estimatedPrice?: number;
  finalPrice?: number;
  cancellationPenalty?: number;
  cancelledBy?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}) {
  const client =
    doc.clientId && typeof doc.clientId === "object" && "name" in doc.clientId
      ? {
          id: serializeId(doc.clientId._id),
          name: doc.clientId.name,
          phone: doc.clientId.phone,
        }
      : { id: serializeId(doc.clientId as Types.ObjectId) };

  const pro =
    doc.proId && typeof doc.proId === "object" && "_id" in doc.proId
      ? {
          id: serializeId(doc.proId._id),
          name: "name" in doc.proId ? doc.proId.name : undefined,
          phone: "phone" in doc.proId ? doc.proId.phone : undefined,
          specialty: "specialty" in doc.proId ? doc.proId.specialty : undefined,
        }
      : doc.proId
        ? { id: serializeId(doc.proId as Types.ObjectId) }
        : null;

  return {
    id: serializeId(doc._id),
    clientId: client.id,
    client,
    proId: pro?.id,
    pro,
    status: doc.status,
    problem: doc.problem,
    clientLocation: loc(doc.clientLocation),
    proLocation: loc(doc.proLocation),
    estimatedPrice: doc.estimatedPrice,
    finalPrice: doc.finalPrice,
    cancellationPenalty: doc.cancellationPenalty,
    cancelledBy: doc.cancelledBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    completedAt: doc.completedAt,
  };
}
