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
 * Calculate calories burned for an exercise session
 * Formula: Calories = MET × weight (kg) × duration (hours)
 * 
 * @param exerciseType - Type of exercise (e.g., 'pushups', 'situps')
 * @param durationMs - Duration in milliseconds
 * @param weightKg - Weight in kilograms
 * @returns Calories burned, or null if calculation cannot be performed
 */
export function calculateCalories(
  exerciseType: string,
  durationMs: number,
  weightKg: number | null | undefined
): number | null {
  // Return null if weight is not provided
  if (!weightKg || weightKg <= 0) {
    return null
  }

  // Get MET value for the exercise type (default to 8.0 if unknown)
  const met = EXERCISE_METS[exerciseType.toLowerCase()] || 8.0

  // Convert duration from milliseconds to hours
  const durationHours = durationMs / (1000 * 60 * 60)

  // Calculate calories: MET × weight (kg) × duration (hours)
  const calories = met * weightKg * durationHours

  // Round to 1 decimal place
  return Math.round(calories * 10) / 10
}

/**
 * Get the MET value for an exercise type
 */
export function getExerciseMET(exerciseType: string): number {
  return EXERCISE_METS[exerciseType.toLowerCase()] || 8.0
}
