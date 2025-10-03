import { kv } from '@vercel/kv';

export interface Activity {
  id: string;
  name: string;
  emoji: string;
}

export interface Routine {
  id: string;
  name: string;
  activities: string[];
  emoji: string;
}

export interface CompletedRoutine {
  id: string;
  routineId: string;
  completedAt: number;
  totalTime: number;
  stageTimes: { [activityId: string]: number };
}

// In-memory storage for development when KV is not configured
let memoryStorage: {
  activities: Activity[];
  routines: Routine[];
  completedRoutines: CompletedRoutine[];
} = {
  activities: [],
  routines: [],
  completedRoutines: []
};

// Check if KV is properly configured
const isKVConfigured = () => {
  return process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
};

// Activities
export async function getActivities(): Promise<Activity[]> {
  if (!isKVConfigured()) {
    return memoryStorage.activities;
  }
  
  try {
    const activities = await kv.get<Activity[]>('activities') || [];
    return activities;
  } catch (error) {
    console.error('Error getting activities:', error);
    return memoryStorage.activities;
  }
}

export async function saveActivity(activity: Activity): Promise<void> {
  if (!isKVConfigured()) {
    memoryStorage.activities.push(activity);
    return;
  }
  
  try {
    const activities = await getActivities();
    activities.push(activity);
    await kv.set('activities', activities);
  } catch (error) {
    console.error('Error saving activity:', error);
    memoryStorage.activities.push(activity);
  }
}

// Routines
export async function getRoutines(): Promise<Routine[]> {
  if (!isKVConfigured()) {
    return memoryStorage.routines;
  }
  
  try {
    const routines = await kv.get<Routine[]>('routines') || [];
    return routines;
  } catch (error) {
    console.error('Error getting routines:', error);
    return memoryStorage.routines;
  }
}

export async function saveRoutine(routine: Routine): Promise<void> {
  if (!isKVConfigured()) {
    memoryStorage.routines.push(routine);
    return;
  }
  
  try {
    const routines = await getRoutines();
    routines.push(routine);
    await kv.set('routines', routines);
  } catch (error) {
    console.error('Error saving routine:', error);
    memoryStorage.routines.push(routine);
  }
}

// Completed Routines
export async function getCompletedRoutines(): Promise<CompletedRoutine[]> {
  if (!isKVConfigured()) {
    return memoryStorage.completedRoutines;
  }
  
  try {
    const completedRoutines = await kv.get<CompletedRoutine[]>('completedRoutines') || [];
    return completedRoutines;
  } catch (error) {
    console.error('Error getting completed routines:', error);
    return memoryStorage.completedRoutines;
  }
}

export async function saveCompletedRoutine(completedRoutine: CompletedRoutine): Promise<void> {
  if (!isKVConfigured()) {
    memoryStorage.completedRoutines.push(completedRoutine);
    return;
  }
  
  try {
    const completedRoutines = await getCompletedRoutines();
    completedRoutines.push(completedRoutine);
    await kv.set('completedRoutines', completedRoutines);
  } catch (error) {
    console.error('Error saving completed routine:', error);
    memoryStorage.completedRoutines.push(completedRoutine);
  }
}

// Get completed routines for a specific routine
export async function getCompletedRoutinesForRoutine(routineId: string): Promise<CompletedRoutine[]> {
  try {
    const completedRoutines = await getCompletedRoutines();
    return completedRoutines.filter(cr => cr.routineId === routineId);
  } catch (error) {
    console.error('Error getting completed routines for routine:', error);
    return [];
  }
}
