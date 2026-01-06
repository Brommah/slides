import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { slideId, feedback, filename } = await req.json();

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback is required' }, { status: 400 });
    }

    const feedbackDir = path.join(process.cwd(), 'feedback');
    if (!fs.existsSync(feedbackDir)) {
      fs.mkdirSync(feedbackDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] Slide: ${filename} (ID: ${slideId})\nFeedback: ${feedback}\n-----------------------------------\n`;

    const filePath = path.join(feedbackDir, 'feedback_log.txt');
    
    fs.appendFileSync(filePath, logEntry);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save feedback' }, 
      { status: 500 }
    );
  }
}

