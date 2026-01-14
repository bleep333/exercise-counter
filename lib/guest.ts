'use client'

const GUEST_STORAGE_KEY = 'exercise_counter_guest_data'
const GUEST_ID_KEY = 'exercise_counter_guest_id'

export interface GuestExercise {
  id: string
  exerciseType: string
  count: number
  duration: number
  completedAt: string
  createdAt: string
}

export function getGuestId(): string {
  if (typeof window === 'undefined') return ''
  
  let guestId = localStorage.getItem(GUEST_ID_KEY)
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(GUEST_ID_KEY, guestId)
  }
  return guestId
}

export function getGuestExercises(): GuestExercise[] {
  if (typeof window === 'undefined') return []
  
  const data = localStorage.getItem(GUEST_STORAGE_KEY)
  if (!data) return []
  
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveGuestExercise(exercise: Omit<GuestExercise, 'id' | 'createdAt'>): void {
  if (typeof window === 'undefined') return
  
  const exercises = getGuestExercises()
  const newExercise: GuestExercise = {
    ...exercise,
    id: `guest_ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  
  exercises.push(newExercise)
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(exercises))
}

export function clearGuestExercises(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GUEST_STORAGE_KEY)
  localStorage.removeItem(GUEST_ID_KEY)
}

export function hasGuestExercises(): boolean {
  if (typeof window === 'undefined') return false
  const exercises = getGuestExercises()
  return exercises.length > 0
}
