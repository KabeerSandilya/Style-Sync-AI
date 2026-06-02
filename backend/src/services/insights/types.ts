import { Garment, Outfit } from "../../types";

export interface GarmentWithStats extends Garment {
  wearCount: number;
}

export interface OutfitWithStats extends Outfit {
  wearCount: number;
}
