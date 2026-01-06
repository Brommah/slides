'use client';

import { useState, useMemo } from 'react';

// Helper to smart-parse slides
const parseSlides = (input: string): string[] => {
  const lines = input.split('\n');
  
  // Robust regex to match "Slide X" handling various markdown formats
  // Matches:
  // Slide 1:
  // #### Slide 1:
  // * **Slide 1:**
  // **Slide 1**:
  const slideHeaderRegex = /^(?:[#\s*>-]*)Slide\s+\d+/i;
  
  const smartSlides: string[] = [];
  let buffer = '';
  let foundFirstHeader = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if this line looks like a slide header
    if (slideHeaderRegex.test(trimmedLine)) {
      foundFirstHeader = true;
      
      // If we have content in the buffer, push it as a slide
      if (buffer.trim()) {
        smartSlides.push(buffer.trim());
      }
      
      // Start new buffer with this header line
      buffer = line + '\n';
    } else {
      // If we have found the first header, append content to the current slide
      if (foundFirstHeader) {
         buffer += line + '\n';
      }
    }
  }
  
  // Push the final buffer
  if (buffer.trim()) {
    smartSlides.push(buffer.trim());
  }

  // If we found headers, return those blocks.
  if (smartSlides.length > 0) {
    return smartSlides;
  }

  // Fallback: If no "Slide X" headers found, split by double newlines
  if (input.includes('\n\n')) {
     return input.split('\n\n').filter(s => s.trim());
  }
  
  // Final fallback: line by line
  return input.split('\n').filter(s => s.trim());
};

export default function Home() {
  const [slideIdeas, setSlideIdeas] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [detailLevel, setDetailLevel] = useState<number>(50); // 0 to 100

  // Memoize the parsed slides to avoid recalculating on every render, 
  // though text editing updates state anyway.
  const parsedSlides = useMemo(() => parseSlides(slideIdeas), [slideIdeas]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const handleGenerate = async () => {
    if (!slideIdeas.trim()) return;

    const ideas = parseSlides(slideIdeas);
    if (ideas.length === 0) return;

    setIsGenerating(true);
    setGeneratedSlides([]);
    setLogs([]);
    
    setProgress({ current: 0, total: ideas.length });
    addLog(`Found ${ideas.length} slide ideas.`);

    const newSlides: string[] = [];

    for (let i = 0; i < ideas.length; i++) {
      const idea = ideas[i];
      setProgress({ current: i + 1, total: ideas.length });
      addLog(`Generating slide ${i + 1}/${ideas.length}: "${idea.substring(0, 30).replace(/\n/g, ' ')}..."`);
      
      try {
        const response = await fetch('/api/generate-slide', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prompt: idea,
            detailLevel: detailLevel 
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate');
        }

        const data = await response.json();
        newSlides.push(data.url);
        
        // Update state progressively to show slides as they arrive
        setGeneratedSlides(prev => [...prev, data.url]);
        
        addLog(`Slide ${i + 1} generated successfully.`);
      } catch (error: any) {
        console.error(error);
        addLog(`Error generating slide ${i + 1}: ${error.message}`);
      }
    }

    setIsGenerating(false);
    setProgress({ current: 0, total: 0 });
    addLog('Generation complete!');
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Gemini Slide Builder</h1>
          <p className="text-gray-600">Enter your slide ideas below. We support "Slide X:" format or simple lists.</p>
          <div className="pt-4">
            <a href="/narrative" className="inline-flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition shadow-sm text-sm font-medium">
              View Narrative & Selection →
            </a>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Slide Ideas</h2>
            
            <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
               <div className="flex justify-between mb-2">
                 <label className="text-sm font-medium text-slate-700">Level of Detail / Complexity</label>
                 <span className="text-sm text-slate-500 font-mono">{detailLevel}%</span>
               </div>
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 value={detailLevel} 
                 onChange={(e) => setDetailLevel(parseInt(e.target.value))}
                 className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
               />
               <div className="flex justify-between mt-1 text-xs text-slate-400">
                 <span>Minimal / Abstract</span>
                 <span>Hyper-Detailed</span>
               </div>
            </div>

            <textarea
              className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-700 font-mono text-sm"
              placeholder="#### Slide 1: Title&#10;Visual: ...&#10;&#10;#### Slide 2: Problem&#10;Visual: ..."
              value={slideIdeas}
              onChange={(e) => setSlideIdeas(e.target.value)}
              disabled={isGenerating}
            />
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {parsedSlides.length} slides identified
              </span>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || parsedSlides.length === 0}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isGenerating || parsedSlides.length === 0
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isGenerating ? 'Generating...' : 'Generate Slides'}
              </button>
            </div>

            {/* Progress Bar */}
            {isGenerating && progress.total > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Processing slide {progress.current} of {progress.total}
                </p>
              </div>
            )}

            {/* Logs */}
            {logs.length > 0 && (
              <div className="mt-6 bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 h-48 overflow-y-auto">
                {logs.map((log, idx) => (
                  <div key={idx} className="mb-1">
                    <span className="opacity-50 mr-2">{new Date().toLocaleTimeString()}</span>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Generated Slides</h2>
            {generatedSlides.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-400">
                Generated slides will appear here
              </div>
            ) : (
              <div className="space-y-6">
                {generatedSlides.map((url, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <div className="aspect-video relative overflow-hidden rounded-lg bg-gray-100">
                      <img 
                        src={url} 
                        alt={`Generated slide ${idx + 1}`}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="mt-2 text-sm text-center text-gray-500">
                      Slide {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
