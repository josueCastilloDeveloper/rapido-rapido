import { NextRequest, NextResponse } from 'next/server';
import { getCompletedActivitiesForActivity, getActivities } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');
    
    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }
    
    const completedActivities = await getCompletedActivitiesForActivity(activityId);
    const activities = await getActivities();
    const activity = activities.find(a => a.id === activityId);
    
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }
    
    if (completedActivities.length === 0) {
      return NextResponse.json({
        activity,
        stats: null,
        message: 'No completed activities found'
      });
    }
    
    // Calculate statistics
    const times = completedActivities.map(ca => ca.stageTimes[activityId]).filter(time => time > 0);
    
    const stats = {
      totalRuns: times.length,
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      bestTime: Math.min(...times),
      worstTime: Math.max(...times),
      times: times,
      recentTimes: times.slice(-10) // Last 10 times
    };
    
    return NextResponse.json({
      activity,
      stats
    });
  } catch (error) {
    console.error('Error getting activity stats:', error);
    return NextResponse.json({ error: 'Failed to get activity stats' }, { status: 500 });
  }
}
