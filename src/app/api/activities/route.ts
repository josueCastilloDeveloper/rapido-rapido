import { NextRequest, NextResponse } from 'next/server';
import { getActivities, saveActivity } from '../../../../lib/db';

export async function GET() {
  try {
    const activities = await getActivities();
    return NextResponse.json(activities);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const activity = {
      id: Date.now().toString(),
      name: body.name,
      emoji: body.emoji,
    };
    
    await saveActivity(activity);
    return NextResponse.json(activity);
  } catch {
    return NextResponse.json({ error: 'Failed to save activity' }, { status: 500 });
  }
}
