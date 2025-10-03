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

// Activities
export async function getActivities(): Promise<Activity[]> {
  try {
    const activities = await kv.get<Activity[]>('activities') || [];
    return activities;
  } catch (error) {
    console.error('Error getting activities:', error);
    return [];
  }
}

export async function saveActivity(activity: Activity): Promise<void> {
  try {
    const activities = await getActivities();
    activities.push(activity);
    await kv.set('activities', activities);
  } catch (error) {
    console.error('Error saving activity:', error);
  }
}

// Routines
export async function getRoutines(): Promise<Routine[]> {
  try {
    const routines = await kv.get<Routine[]>('routines') || [];
    return routines;
  } catch (error) {
    console.error('Error getting routines:', error);
    return [];
  }
}

export async function saveRoutine(routine: Routine): Promise<void> {
  try {
    const routines = await getRoutines();
    routines.push(routine);
    await kv.set('routines', routines);
  } catch (error) {
    console.error('Error saving routine:', error);
  }
}

// Completed Routines
export async function getCompletedRoutines(): Promise<CompletedRoutine[]> {
  try {
    const completedRoutines = await kv.get<CompletedRoutine[]>('completedRoutines') || [];
    return completedRoutines;
  } catch (error) {
    console.error('Error getting completed routines:', error);
    return [];
  }
}

export async function saveCompletedRoutine(completedRoutine: CompletedRoutine): Promise<void> {
  try {
    const completedRoutines = await getCompletedRoutines();
    completedRoutines.push(completedRoutine);
    await kv.set('completedRoutines', completedRoutines);
  } catch (error) {
    console.error('Error saving completed routine:', error);
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
