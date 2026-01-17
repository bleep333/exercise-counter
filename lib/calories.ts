/**
 * MET (Metabolic Equivalent of Task) values for different exercises
 * These are approximate values based on standard exercise intensity
 */
const EXERCISE_METS: Record<string, number> = {
  pushups: 8.0,
  situps: 8.0,
  crunches: 8.0,
  squats: 5.5,
  'jumping jacks': 8.0,
  'burpees': 10.0,
  'mountain climbers': 8.0,
  'plank': 3.0,
  'pull-ups': 8.0,
  'chin-ups': 8.0,
}

/**
 * Estimated duration per rep (in seconds) for different exercises
 * These estimates account for the actual exercise time, excluding rest periods
 */
const DURATION_PER_REP: Record<string, number> = {
  pushups: 2.5,        // ~2-3 seconds per pushup
  situps: 2.5,        // ~2-3 seconds per situp
  crunches: 2.5,       // ~2-3 seconds per crunch
  squats: 3.5,         // ~3-4 seconds per squat
  'jumping jacks': 1.5, // ~1-2 seconds per jumping jack
  'burpees': 6.5,      // ~5-8 seconds per burpee
  'mountain climbers': 1.5, // ~1-2 seconds per rep
  'plank': 1.0,       // For plank, if recorded as reps, estimate 1 second per rep
  'pull-ups': 4.0,    // ~3-5 seconds per pull-up
  'chin-ups': 4.0,    // ~3-5 seconds per chin-up
}

/**
 * Calculate calories burned for an exercise session
 * Formula: Calories = MET × weight (kg) × duration (hours)
 * 
 * Uses estimated duration based on rep count instead of actual duration
 * to exclude rest periods from the calculation.
 * 
 * @param exerciseType - Type of exercise (e.g., 'pushups', 'situps')
 * @param repCount - Number of repetitions
 * @param weightKg - Weight in kilograms
 * @returns Calories burned, or null if calculation cannot be performed
 */
export function calculateCalories(
  exerciseType: string,
  repCount: number,
  weightKg: number | null | undefined
): number | null {
  // Return null if weight is not provided
  if (!weightKg || weightKg <= 0) {
    return null
  }

  // Return null if rep count is invalid
  if (!repCount || repCount <= 0) {
    return null
  }

  // Get MET value for the exercise type (default to 8.0 if unknown)
  const met = EXERCISE_METS[exerciseType.toLowerCase()] || 8.0

  // Get estimated duration per rep (default to 2.5 seconds if unknown)
  const secondsPerRep = DURATION_PER_REP[exerciseType.toLowerCase()] || 2.5

  // Calculate estimated duration in seconds (excluding rest time)
  const estimatedDurationSeconds = repCount * secondsPerRep

  // Convert estimated duration from seconds to hours
  const estimatedDurationHours = estimatedDurationSeconds / (60 * 60)

  // Calculate calories: MET × weight (kg) × duration (hours)
  const calories = met * weightKg * estimatedDurationHours

  // Round to 1 decimal place
  return Math.round(calories * 10) / 10
}

/**
 * Get the MET value for an exercise type
 */
export function getExerciseMET(exerciseType: string): number {
  return EXERCISE_METS[exerciseType.toLowerCase()] || 8.0
}
