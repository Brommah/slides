import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  // Try to find the latest folder first, or use a specific one
  const baseDir = path.join(process.cwd(), 'public/generated-slides');
  
  if (!fs.existsSync(baseDir)) {
      return NextResponse.json({ files: [], basePath: '' });
  }

  // Get all date folders and sort descending (latest first)
  const folders = fs.readdirSync(baseDir)
      .filter(f => fs.statSync(path.join(baseDir, f)).isDirectory())
      .sort()
      .reverse();

  // Prefer 2026-01-06 if it exists, otherwise 2026-01-05
  // Or just pick the latest: folders[0]
  const date = folders.includes('2026-01-06') ? '2026-01-06' : folders[0];
  
  const directory = path.join(baseDir, date);

  if (!fs.existsSync(directory)) {
    return NextResponse.json({ files: [], basePath: '' });
  }

  // Get all PNG files
  const files = fs.readdirSync(directory)
    .filter(file => file.endsWith('.png'));

  return NextResponse.json({ 
    files, 
    basePath: `/generated-slides/${date}` 
  });
}

