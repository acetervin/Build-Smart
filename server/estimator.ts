import { EstimationInput, EstimationResult, MaterialResult, MixRatio, Densities } from "@shared/schema";

/**
 * Core calculation engine using volumetric mix method as specified in the PDF guide
 * This implements the exact mathematical formulas from SR2 with precise calculations
 */

// Default material densities (kg/m³) from Appendix A
export const DEFAULT_DENSITIES: Densities = {
  cement: 1440,
  sand: 1600,
  agg: 1750,
};

// Default material costs (USD per unit) - can be overridden with supplier pricing
export const DEFAULT_MATERIAL_COSTS = {
  cement: 10.0, // per 50kg bag
  sand: 50.0,   // per tonne
  agg: 35.0,    // per tonne
};

/**
 * Pure calculation function that estimates materials using the volumetric mix method
 * Follows the exact algorithm from SR2 with step-by-step computation
 */
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

  if (densities.cement <= 0 || densities.sand <= 0 || densities.agg <= 0) {
    throw new Error('All densities must be greater than 0');
  }

  // Step-by-step calculation following SR2 algorithm
  
  // 1. Calculate total parts
  const S = pCement + pSand + pAgg;
  
  // 2. Apply dry volume factor to account for bulking
  const adjustedVolume = volumeM3 * dryFactor;
  
  // 3. Calculate individual material volumes (m³)
  const cementVolume = (pCement / S) * adjustedVolume;
  const sandVolume = (pSand / S) * adjustedVolume;
  const aggVolume = (pAgg / S) * adjustedVolume;
  
  // 4. Calculate masses using densities (kg)
  const cementMass = cementVolume * densities.cement;
  const sandMass = sandVolume * densities.sand;
  const aggMass = aggVolume * densities.agg;
  
  // 5. Apply wastage factor
  const wastageMultiplier = 1 + (wastageFactor / 100);
  const cementMassWithWastage = cementMass * wastageMultiplier;
  const sandMassWithWastage = sandMass * wastageMultiplier;
  const aggMassWithWastage = aggMass * wastageMultiplier;
  
  // 6. Convert to practical units
  const cementBags = Math.ceil(cementMassWithWastage / 50); // 50kg bags, round up
  const cementTonnes = cementMassWithWastage / 1000;
  const sandTonnes = sandMassWithWastage / 1000;
  const aggTonnes = aggMassWithWastage / 1000;
  
  // 7. Calculate estimated costs
  const cementCost = cementBags * DEFAULT_MATERIAL_COSTS.cement;
  const sandCost = sandTonnes * DEFAULT_MATERIAL_COSTS.sand;
  const aggCost = aggTonnes * DEFAULT_MATERIAL_COSTS.agg;
  const totalCost = cementCost + sandCost + aggCost;
  
  // 8. Prepare results
  const cementResult: MaterialResult = {
    volume: parseFloat(cementVolume.toFixed(6)),
    mass: parseFloat(cementMassWithWastage.toFixed(2)),
    bags: cementBags,
    tonnes: parseFloat(cementTonnes.toFixed(3)),
  };
  
  const sandResult: MaterialResult = {
    volume: parseFloat(sandVolume.toFixed(6)),
    mass: parseFloat(sandMassWithWastage.toFixed(2)),
    tonnes: parseFloat(sandTonnes.toFixed(3)),
  };
  
  const aggResult: MaterialResult = {
    volume: parseFloat(aggVolume.toFixed(6)),
    mass: parseFloat(aggMassWithWastage.toFixed(2)),
    tonnes: parseFloat(aggTonnes.toFixed(3)),
  };
  
  return {
    cement: cementResult,
    sand: sandResult,
    aggregate: aggResult,
    totals: {
      volume: parseFloat(adjustedVolume.toFixed(6)),
      mass: parseFloat((cementMassWithWastage + sandMassWithWastage + aggMassWithWastage).toFixed(2)),
      estimatedCost: parseFloat(totalCost.toFixed(2)),
    },
    parameters: input,
  };
}

/**
 * Validate estimation input parameters
 */
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
  
  if (input.densities) {
    const { cement, sand, agg } = input.densities;
    if (cement && cement <= 0) errors.push('Cement density must be positive');
    if (sand && sand <= 0) errors.push('Sand density must be positive');
    if (agg && agg <= 0) errors.push('Aggregate density must be positive');
  }
  
  if (input.dryFactor && (input.dryFactor <= 0 || input.dryFactor > 3)) {
    errors.push('Dry factor must be between 0 and 3');
  }
  
  if (input.wastageFactor && (input.wastageFactor < 0 || input.wastageFactor > 50)) {
    errors.push('Wastage factor must be between 0% and 50%');
  }
  
  return errors;
}

/**
 * Get preset mix ratios for common concrete classes
 */
export function getPresetMixRatios(): Record<string, MixRatio> {
  return {
    "C20/25": { cement: 1, sand: 2, agg: 4 },    // Class 20
    "C25/30": { cement: 1, sand: 1.5, agg: 3 },  // Class 25
    "C30/37": { cement: 1, sand: 1.2, agg: 2.4 }, // Class 30
    "C35/45": { cement: 1, sand: 1, agg: 2 },     // Class 35
  };
}

/**
 * Format estimation results for display
 */
export function formatEstimationResults(results: EstimationResult) {
  return {
    materials: {
      cement: {
        name: "Portland Cement",
        volume: `${results.cement.volume} m³`,
        mass: `${results.cement.mass.toLocaleString()} kg`,
        units: `${results.cement.bags} bags (50kg)`,
        tonnes: `${results.cement.tonnes} tonnes`,
        cost: `$${(results.cement.bags! * DEFAULT_MATERIAL_COSTS.cement).toFixed(2)}`,
      },
      sand: {
        name: "Fine Sand",
        volume: `${results.sand.volume} m³`,
        mass: `${results.sand.mass.toLocaleString()} kg`,
        units: `${results.sand.tonnes} tonnes`,
        cost: `$${(results.sand.tonnes * DEFAULT_MATERIAL_COSTS.sand).toFixed(2)}`,
      },
      aggregate: {
        name: "Coarse Aggregate",
        volume: `${results.aggregate.volume} m³`,
        mass: `${results.aggregate.mass.toLocaleString()} kg`,
        units: `${results.aggregate.tonnes} tonnes`,
        cost: `$${(results.aggregate.tonnes * DEFAULT_MATERIAL_COSTS.agg).toFixed(2)}`,
      },
    },
    totals: {
      volume: `${results.totals.volume} m³`,
      mass: `${results.totals.mass.toLocaleString()} kg`,
      cost: `$${results.totals.estimatedCost.toFixed(2)}`,
    },
    parameters: {
      mixRatio: `${results.parameters.mixRatio.cement}:${results.parameters.mixRatio.sand}:${results.parameters.mixRatio.agg}`,
      dryFactor: results.parameters.dryFactor?.toFixed(2) || "1.54",
      wastageFactor: `${results.parameters.wastageFactor || 5}%`,
    },
  };
}
