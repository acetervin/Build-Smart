import { EstimationInput, EstimationResult, MixRatio, Densities } from "@shared/schema";

/**
 * Client-side estimation library that mirrors the server implementation
 * Used for real-time preview calculations
 */

export const DEFAULT_DENSITIES: Densities = {
  cement: 1440,
  sand: 1600,
  agg: 1750,
};

export const DEFAULT_MATERIAL_COSTS = {
  cement: 10.0, // per 50kg bag
  sand: 50.0,   // per tonne
  agg: 35.0,    // per tonne
};

export function estimateMaterials(input: EstimationInput): EstimationResult {
  const {
    volumeM3,
    mixRatio,
    densities = DEFAULT_DENSITIES,
    dryFactor = 1.54,
    wastageFactor = 5.0,
  } = input;

  // Input validation
  if (volumeM3 <= 0) {
    throw new Error('Volume must be greater than 0');
  }

  const { cement: pCement, sand: pSand, agg: pAgg } = mixRatio;
  
  if (pCement <= 0 || pSand <= 0 || pAgg <= 0) {
    throw new Error('All mix ratio parts must be greater than 0');
  }

  // Calculate total parts
  const S = pCement + pSand + pAgg;
  
  // Apply dry volume factor
  const adjustedVolume = volumeM3 * dryFactor;
  
  // Calculate individual material volumes (m³)
  const cementVolume = (pCement / S) * adjustedVolume;
  const sandVolume = (pSand / S) * adjustedVolume;
  const aggVolume = (pAgg / S) * adjustedVolume;
  
  // Calculate masses using densities (kg)
  const cementMass = cementVolume * densities.cement;
  const sandMass = sandVolume * densities.sand;
  const aggMass = aggVolume * densities.agg;
  
  // Apply wastage factor
  const wastageMultiplier = 1 + (wastageFactor / 100);
  const cementMassWithWastage = cementMass * wastageMultiplier;
  const sandMassWithWastage = sandMass * wastageMultiplier;
  const aggMassWithWastage = aggMass * wastageMultiplier;
  
  // Convert to practical units
  const cementBags = Math.ceil(cementMassWithWastage / 50);
  const cementTonnes = cementMassWithWastage / 1000;
  const sandTonnes = sandMassWithWastage / 1000;
  const aggTonnes = aggMassWithWastage / 1000;
  
  // Calculate costs
  const cementCost = cementBags * DEFAULT_MATERIAL_COSTS.cement;
  const sandCost = sandTonnes * DEFAULT_MATERIAL_COSTS.sand;
  const aggCost = aggTonnes * DEFAULT_MATERIAL_COSTS.agg;
  const totalCost = cementCost + sandCost + aggCost;
  
  return {
    cement: {
      volume: parseFloat(cementVolume.toFixed(6)),
      mass: parseFloat(cementMassWithWastage.toFixed(2)),
      bags: cementBags,
      tonnes: parseFloat(cementTonnes.toFixed(3)),
    },
    sand: {
      volume: parseFloat(sandVolume.toFixed(6)),
      mass: parseFloat(sandMassWithWastage.toFixed(2)),
      tonnes: parseFloat(sandTonnes.toFixed(3)),
    },
    aggregate: {
      volume: parseFloat(aggVolume.toFixed(6)),
      mass: parseFloat(aggMassWithWastage.toFixed(2)),
      tonnes: parseFloat(aggTonnes.toFixed(3)),
    },
    totals: {
      volume: parseFloat(adjustedVolume.toFixed(6)),
      mass: parseFloat((cementMassWithWastage + sandMassWithWastage + aggMassWithWastage).toFixed(2)),
      estimatedCost: parseFloat(totalCost.toFixed(2)),
    },
    parameters: input,
  };
}

export function validateEstimationInput(input: Partial<EstimationInput>): string[] {
  const errors: string[] = [];
  
  if (!input.volumeM3 || input.volumeM3 <= 0) {
    errors.push('Volume must be a positive number');
  }
  
  if (input.volumeM3 && input.volumeM3 < 0.01) {
    errors.push('Volume is very small (< 0.01 m³). Please verify the input');
  }
  
  if (!input.mixRatio) {
    errors.push('Mix ratio is required');
  } else {
    const { cement, sand, agg } = input.mixRatio;
    if (!cement || cement <= 0) errors.push('Cement ratio must be positive');
    if (!sand || sand <= 0) errors.push('Sand ratio must be positive');
    if (!agg || agg <= 0) errors.push('Aggregate ratio must be positive');
  }
  
  return errors;
}

export function getPresetMixRatios(): Record<string, MixRatio> {
  return {
    "C20/25": { cement: 1, sand: 2, agg: 4 },
    "C25/30": { cement: 1, sand: 1.5, agg: 3 },
    "C30/37": { cement: 1, sand: 1.2, agg: 2.4 },
    "C35/45": { cement: 1, sand: 1, agg: 2 },
  };
}
