import { createClient } from 'redis';

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
const memoryStorage: {
  activities: Activity[];
  routines: Routine[];
  completedRoutines: CompletedRoutine[];
} = {
  activities: [],
  routines: [],
  completedRoutines: []
};

// Redis client setup
let redisClient: ReturnType<typeof createClient> | null = null;

const getRedisClient = async () => {
  if (!redisClient) {
    if (process.env.REDIS_URL) {
      redisClient = createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();
    } else {
      throw new Error('Redis URL not configured');
    }
  }
  return redisClient;
};

// Check if Redis is properly configured
const isRedisConfigured = () => {
  return !!process.env.REDIS_URL;
};

// Activities
export async function getActivities(): Promise<Activity[]> {
  if (!isRedisConfigured()) {
    return memoryStorage.activities;
  }
  
  try {
    const client = await getRedisClient();
    const activitiesJson = await client.get('activities');
    return activitiesJson ? JSON.parse(activitiesJson) : [];
  } catch (error) {
    console.error('Error getting activities:', error);
    return memoryStorage.activities;
  }
}

export async function saveActivity(activity: Activity): Promise<void> {
  if (!isRedisConfigured()) {
    memoryStorage.activities.push(activity);
    return;
  }
  
  try {
    const activities = await getActivities();
    activities.push(activity);
    const client = await getRedisClient();
    await client.set('activities', JSON.stringify(activities));
  } catch (error) {
    console.error('Error saving activity:', error);
    memoryStorage.activities.push(activity);
  }
}

// Routines
export async function getRoutines(): Promise<Routine[]> {
  if (!isRedisConfigured()) {
    return memoryStorage.routines;
  }
  
  try {
    const client = await getRedisClient();
    const routinesJson = await client.get('routines');
    return routinesJson ? JSON.parse(routinesJson) : [];
  } catch (error) {
    console.error('Error getting routines:', error);
    return memoryStorage.routines;
  }
}

export async function saveRoutine(routine: Routine): Promise<void> {
  if (!isRedisConfigured()) {
    memoryStorage.routines.push(routine);
    return;
  }
  
  try {
    const routines = await getRoutines();
    routines.push(routine);
    const client = await getRedisClient();
    await client.set('routines', JSON.stringify(routines));
  } catch (error) {
    console.error('Error saving routine:', error);
    memoryStorage.routines.push(routine);
  }
}

// Completed Routines
export async function getCompletedRoutines(): Promise<CompletedRoutine[]> {
  if (!isRedisConfigured()) {
    return memoryStorage.completedRoutines;
  }
  
  try {
    const client = await getRedisClient();
    const completedRoutinesJson = await client.get('completedRoutines');
    return completedRoutinesJson ? JSON.parse(completedRoutinesJson) : [];
  } catch (error) {
    console.error('Error getting completed routines:', error);
    return memoryStorage.completedRoutines;
  }
}

export async function saveCompletedRoutine(completedRoutine: CompletedRoutine): Promise<void> {
  if (!isRedisConfigured()) {
    memoryStorage.completedRoutines.push(completedRoutine);
    return;
  }
  
  try {
    const completedRoutines = await getCompletedRoutines();
    completedRoutines.push(completedRoutine);
    const client = await getRedisClient();
    await client.set('completedRoutines', JSON.stringify(completedRoutines));
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
