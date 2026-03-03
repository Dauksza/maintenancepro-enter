/** Density of hot liquid asphalt in pounds per gallon (at ~325°F) */
export const ASPHALT_DENSITY_LBS_GAL = 8.7

/** Pounds per short ton */
export const TONS_TO_LBS = 2000

/** US gallons per cubic foot */
export const GAL_PER_CUBIC_FOOT = 7.48052

/**
 * Approximate asphalt density (lbs/gal) at a given temperature (°F).
 * Uses a linear approximation around the 325 °F reference point.
 * Coefficient: ~0.0015 lbs/gal per °F.
 */
export function asphaltDensityAtTemp(tempF: number): number {
  return ASPHALT_DENSITY_LBS_GAL + (325 - tempF) * 0.0015
}

/**
 * Calculate theoretical capacity (gallons) of a vertical cylinder tank.
 * @param diameterFt  Inner diameter in feet
 * @param heightFt    Shell height in feet
 */
export function cylinderCapacityGallons(diameterFt: number, heightFt: number): number {
  const radiusFt = diameterFt / 2
  const volumeCuFt = Math.PI * radiusFt * radiusFt * heightFt
  return volumeCuFt * GAL_PER_CUBIC_FOOT
}

/**
 * Calculate theoretical capacity (gallons) of a horizontal cylinder tank.
 * @param diameterFt  Inner diameter in feet
 * @param lengthFt    Shell length in feet
 */
export function horizontalCylinderCapacityGallons(diameterFt: number, lengthFt: number): number {
  return cylinderCapacityGallons(diameterFt, lengthFt)
}

/**
 * Calculate theoretical capacity (gallons) of a rectangular tank.
 * @param lengthFt  Interior length in feet
 * @param widthFt   Interior width in feet
 * @param heightFt  Interior height in feet
 */
export function rectangularCapacityGallons(lengthFt: number, widthFt: number, heightFt: number): number {
  return lengthFt * widthFt * heightFt * GAL_PER_CUBIC_FOOT
}

/**
 * Fill height (ft) in a horizontal cylinder at a given volume fraction.
 * Useful for level gauge calculations.
 * @param fillFraction  0–1 fraction of total capacity
 * @param diameterFt    Tank inner diameter in feet
 */
export function horizontalCylinderFillHeight(fillFraction: number, diameterFt: number): number {
  const r = diameterFt / 2
  // Binary search: find h such that the circular segment area equals fillFraction * π r²
  let lo = 0, hi = diameterFt
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    const theta = 2 * Math.acos((r - mid) / r)
    const segmentArea = 0.5 * r * r * (theta - Math.sin(theta))
    const fraction = segmentArea / (Math.PI * r * r)
    if (fraction < fillFraction) lo = mid; else hi = mid
  }
  return (lo + hi) / 2
}

// ---------------------------------------------------------------------------
// Asphalt grade properties
// ---------------------------------------------------------------------------

/** Performance-grade continuous high & low temperature (°C) */
export const PG_GRADE_TEMPS: Record<string, { high: number; low: number }> = {
  'PG 52-34': { high: 52, low: -34 },
  'PG 52-28': { high: 52, low: -28 },
  'PG 58-28': { high: 58, low: -28 },
  'PG 64-16': { high: 64, low: -16 },
  'PG 64-22': { high: 64, low: -22 },
  'PG 64-28': { high: 64, low: -28 },
  'PG 70-22': { high: 70, low: -22 },
  'PG 70-28': { high: 70, low: -28 },
  'PG 76-22': { high: 76, low: -22 },
  'PG 76-28': { high: 76, low: -28 },
  'PG 82-22': { high: 82, low: -22 },
  'PG 82-28': { high: 82, low: -28 },
}

/** Typical storage temperature range (°F) by grade */
export const STORAGE_TEMP_RANGE: Record<string, { min: number; max: number; optimal: number }> = {
  'PG 58-28':  { min: 290, max: 340, optimal: 310 },
  'PG 64-22':  { min: 295, max: 350, optimal: 325 },
  'PG 64-28':  { min: 295, max: 350, optimal: 325 },
  'PG 70-22':  { min: 310, max: 365, optimal: 340 },
  'PG 76-22':  { min: 330, max: 380, optimal: 355 },
  'PG 82-22':  { min: 345, max: 390, optimal: 370 },
  'AC-20':     { min: 275, max: 325, optimal: 300 },
  'AC-30':     { min: 280, max: 330, optimal: 305 },
  'Emulsion':  { min: 50,  max: 140, optimal: 70  },
}

// ---------------------------------------------------------------------------
// Polymer modification reference data
// ---------------------------------------------------------------------------

export interface PolymerGuide {
  description: string
  mechanism: string
  /** Weight percent of asphalt binder */
  dosageRange: { min: number; typical: number; max: number }
  /** Recommended blend temperature range (°F) */
  blendTempRange: { min: number; max: number }
  /** Recommended mix time (minutes) */
  mixTimeRange: { min: number; max: number }
  notes: string
}

export const POLYMER_PROPERTIES: Record<string, PolymerGuide> = {
  SBS: {
    description: 'Styrene-Butadiene-Styrene (linear or radial block copolymer)',
    mechanism: 'Swells in asphalt, forming a polymer network that improves elasticity and rutting/cracking resistance',
    dosageRange: { min: 1.5, typical: 3.5, max: 8.5 },
    blendTempRange: { min: 355, max: 390 },
    mixTimeRange: { min: 30, max: 120 },
    notes: 'Use high-shear mill for proper dispersion. Requires compatibility additive with some base asphalts.',
  },
  'SBR Latex': {
    description: 'Styrene-Butadiene Rubber (latex emulsion, ~60–65% solids)',
    mechanism: 'Elastomeric rubber particles improve fatigue and cracking resistance; easier to disperse than SBS',
    dosageRange: { min: 2.0, typical: 3.5, max: 7.0 },
    blendTempRange: { min: 300, max: 360 },
    mixTimeRange: { min: 20, max: 60 },
    notes: 'Latex contains water – heat slowly to avoid foaming. Lower upgrade potential than SBS.',
  },
  Gilsonite: {
    description: 'Natural asphaltite / uintahite (solid, black resinous mineral)',
    mechanism: 'Stiffens binder, raises softening point, improves rutting resistance and fuel/oil resistance',
    dosageRange: { min: 4.0, typical: 10.0, max: 25.0 },
    blendTempRange: { min: 325, max: 375 },
    mixTimeRange: { min: 20, max: 45 },
    notes: 'Add slowly to vortex. Does not significantly improve low-temperature cracking resistance.',
  },
  'Crumb Rubber': {
    description: 'Ground tire rubber (GTR), typically 30–40 mesh',
    mechanism: 'Rubber particles swell in asphalt, increasing viscosity and impact resistance (wet or dry process)',
    dosageRange: { min: 15.0, typical: 20.0, max: 32.0 },
    blendTempRange: { min: 370, max: 410 },
    mixTimeRange: { min: 45, max: 90 },
    notes: 'Terminal blend requires high shear; wet process needs minimum 45 min reaction time. Digestion temp critical.',
  },
  'Polyphosphoric Acid': {
    description: 'PPA (≥105% H₃PO₄ equivalent), inorganic acid',
    mechanism: 'Chemically reacts with asphalt molecules to stiffen binder and improve rutting resistance; low dosage, fast acting',
    dosageRange: { min: 0.1, typical: 0.5, max: 1.5 },
    blendTempRange: { min: 280, max: 360 },
    mixTimeRange: { min: 5, max: 20 },
    notes: 'Check compatibility – can reduce cracking resistance in some asphalts. Often used with SBS (synergistic). Handle as a hazardous acid.',
  },
  'Custom': {
    description: 'User-defined modifier',
    mechanism: 'Variable',
    dosageRange: { min: 0, typical: 2.0, max: 10.0 },
    blendTempRange: { min: 300, max: 400 },
    mixTimeRange: { min: 20, max: 60 },
    notes: 'Refer to modifier manufacturer datasheet.',
  },
}

// ---------------------------------------------------------------------------
// Blend grade (grade-on-grade blending) reference
// ---------------------------------------------------------------------------

/**
 * For a target PG high temperature, look up approximate SBS % needed when starting
 * from PG 64-22 base binder.  Values reflect industry practice (AASHTO M332).
 */
export const SBS_UPGRADE_FROM_PG6422: Record<string, { min: number; typical: number; max: number; tempC: number }> = {
  'PG 64-22': { min: 0,   typical: 0,   max: 0,   tempC: 64 },
  'PG 70-22': { min: 1.5, typical: 2.5, max: 3.5, tempC: 70 },
  'PG 76-22': { min: 3.5, typical: 4.5, max: 5.5, tempC: 76 },
  'PG 82-22': { min: 5.5, typical: 7.0, max: 8.5, tempC: 82 },
}

/**
 * Grade blending formula (Rule of Mixtures) for high-temperature PG grade.
 * Returns the estimated high-temperature PG of the blend.
 * @param gradePct1  Fraction (0–1) of grade 1
 * @param tempHigh1  High PG temperature of grade 1 (°C)
 * @param tempHigh2  High PG temperature of grade 2 (°C)
 */
export function blendedHighPG(gradePct1: number, tempHigh1: number, tempHigh2: number): number {
  return gradePct1 * tempHigh1 + (1 - gradePct1) * tempHigh2
}

/**
 * Grade blending formula (Rule of Mixtures) for low-temperature PG grade.
 */
export function blendedLowPG(gradePct1: number, tempLow1: number, tempLow2: number): number {
  return gradePct1 * tempLow1 + (1 - gradePct1) * tempLow2
}

