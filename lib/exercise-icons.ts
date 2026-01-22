/**
 * Maps exercise types to their icon paths
 * Handles plural exercise types (e.g., "pushups") to singular icon names (e.g., "pushup-icon.svg")
 */
export function getExerciseIconPath(exerciseType: string): string | null {
  // Normalize exercise type to lowercase
  const normalized = exerciseType.toLowerCase().trim()
  
  // Map exercise types to icon file names
  const iconMap: Record<string, string> = {
    'pushups': 'pushup-icon.svg',
    'pushup': 'pushup-icon.svg',
    'situps': 'situp-icon.svg',
    'situp': 'situp-icon.svg',
    'squats': 'squat-icon.svg',
    'squat': 'squat-icon.svg',
    'pullups': 'pullup-icon.svg',
    'pullup': 'pullup-icon.svg',
  }
  
  const iconName = iconMap[normalized]
  if (!iconName) {
    return null // No icon available for this exercise type
  }
  
  return `/exercises/${iconName}`
}
