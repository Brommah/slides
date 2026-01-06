import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { prompt, detailLevel } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Determine complexity instructions based on slider (0-100)
    let complexityInstruction = '';
    const level = typeof detailLevel === 'number' ? detailLevel : 50;

    if (level < 30) {
      complexityInstruction = "DESIGN LEVEL: EXTREMELY MINIMAL. Use very few elements. Focus on empty space, single bold typography, and abstract primitives. No background noise.";
    } else if (level > 70) {
      complexityInstruction = "DESIGN LEVEL: HIGH FIDELITY / DETAILED. Rich visual data density, intricate UI components, layered depth effects, subtle background textures, and comprehensive diagramming.";
    } else {
      complexityInstruction = "DESIGN LEVEL: BALANCED. Standard professional presentation mix of clarity and visual interest. Clean layout with sufficient data visualization.";
    }

    // Unified Style Guide / System Prompt
    const styleGuide = `
      STYLE GUIDE & DESIGN SYSTEM:
      - Aesthetic: Ultra-clean, modern corporate tech, minimalistic, dark mode.
      - Color Palette: Deep blue/black background, accents in electric blue, light blue, and white. NO purple, NO neon pink.
      - Typography: Sans-serif, bold headers, clean body text.
      - Visuals: Simple geometric forms, clean lines, data visualizations. AVOID clutter, avoid complex 3D renders, avoid noise.
      - Layout: spacious, organized, grid-based.
      - Branding: DO NOT include any specific logos or text like "Cere". Keep it generic and clean.
      - ${complexityInstruction}
      
      INSTRUCTIONS:
      Create a professional presentation slide based on the user's idea. 
      STRICTLY follow the style guide above. 
      The slide must look like a finished, high-fidelity design export, not a draft.
      Ensure text is legible.
      Do NOT add any logos.
    `;

    // Enhance the prompt with the style guide
    const enhancedPrompt = `${styleGuide}\n\nUSER SLIDE IDEA:\n${prompt}`;

    // Use the specific model for image generation
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-image-preview' });

    // Generate content
    // Note: As of latest SDK, image generation might return inline data in parts
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    
    // Check for image data in the response
    // The structure might vary, but typically it's in candidates[0].content.parts[0].inlineData
    // or similar for image generation models if they follow the unified generateContent pattern.
    
    // We need to inspect the response to find the image.
    // Based on Python snippet: response.parts -> part.inline_data
    
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates returned');
    }

    const parts = candidates[0].content.parts;
    let imageBuffer: Buffer | null = null;

    for (const part of parts) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        imageBuffer = Buffer.from(part.inlineData.data, 'base64');
        break;
      }
    }

    if (!imageBuffer) {
      console.error('Full response:', JSON.stringify(response, null, 2));
      throw new Error('No image data found in response');
    }

    // Save image
    // Generate a folder based on today's date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    const publicDir = path.join(process.cwd(), 'public', 'generated-slides', today);
    
    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Try to extract a slide title for the filename, otherwise use UUID
    // Looking for "Slide X: Title" pattern or just take first few words
    let safeTitle = 'slide-' + uuidv4().substring(0, 8);
    const titleMatch = prompt.match(/(?:Slide\s+(\d+)[:.]?\s*)?([^:\n]+)/i);
    if (titleMatch) {
        // titleMatch[1] is the number (if present), titleMatch[2] is the text content
        const slideNum = titleMatch[1] ? titleMatch[1] : 'x';
        const rawTitle = titleMatch[2].trim();
        
        // Sanitize title: remove non-alphanumeric, replace spaces with dashes, limit length
        const sanitizedText = rawTitle
            .replace(/[^a-z0-9\s-]/gi, '')
            .replace(/\s+/g, '-')
            .toLowerCase()
            .substring(0, 40);
        
        // Format: slide-X-title-uuid
        safeTitle = `slide-${slideNum}-${sanitizedText}-${uuidv4().substring(0, 6)}`;
    }

    const fileName = `${safeTitle}.png`;
    const filePath = path.join(publicDir, fileName);
    fs.writeFileSync(filePath, imageBuffer);

    const imageUrl = `/generated-slides/${today}/${fileName}`;

    return NextResponse.json({ url: imageUrl });

  } catch (error: any) {
    console.error('Error generating slide:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate slide' }, 
      { status: 500 }
    );
  }
}

