import { NextRequest, NextResponse } from 'next/server';
import { getCompletedRoutines, saveCompletedRoutine } from '@/lib/db';

export async function GET() {
  try {
    const completedRoutines = await getCompletedRoutines();
    return NextResponse.json(completedRoutines);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch completed routines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const completedRoutine = {
      id: Date.now().toString(),
      routineId: body.routineId,
      completedAt: body.completedAt,
      totalTime: body.totalTime,
      stageTimes: body.stageTimes,
    };
    
    await saveCompletedRoutine(completedRoutine);
    return NextResponse.json(completedRoutine);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save completed routine' }, { status: 500 });
  }
}
