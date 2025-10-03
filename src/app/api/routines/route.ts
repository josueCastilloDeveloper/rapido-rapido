import { NextRequest, NextResponse } from 'next/server';
import { getRoutines, saveRoutine } from '../../../../lib/db';

export async function GET() {
  try {
    const routines = await getRoutines();
    return NextResponse.json(routines);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const routine = {
      id: Date.now().toString(),
      name: body.name,
      activities: body.activities,
      emoji: body.emoji,
    };
    
    await saveRoutine(routine);
    return NextResponse.json(routine);
  } catch {
    return NextResponse.json({ error: 'Failed to save routine' }, { status: 500 });
  }
}
