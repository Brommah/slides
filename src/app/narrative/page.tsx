'use client';

import { useEffect, useState } from 'react';

// Mapping transcript excerpts to Slide Numbers
const TRANSCRIPT_MAPPING: Record<number, string> = {
  1: "So, these are all the things that I'm hoping to make clear... create the wedge that's needed for the enterprise side.",
  2: "Everyone is trying to ape into this converging area... but they're trying to bring a few pieces of utility and make that work with their existing infrastructure. It's retrofitting legacy.",
  3: "Most of this infrastructure doesn't fit the need of agentic future. Why? Because everything is 'after the fact'. It's optimized for dashboards, not agents.",
  4: "Tell me how your stuff works better than Databricks? Data sovereignty. Real-time access. Zero-copy sovereignty.",
  5: "We have an opportunity to position ourselves as created from a 'clean slate', with a vertically integrated stack that clearly is more efficient.",
  6: "Everyone's data is individually segmented, individually encrypted. Your Key is Your Data. Fully automated, only permitted access.",
  7: "This is the horses before the cars. Or like saying, 'Hey, propeller planes before jets.' It's a shift from Centralized to Personal Compute.",
  8: "Agents coexist with your consciousness. They eventually form some version of your digital twin... Powered by your Sovereign Data.",
  9: "Data interoperability... cross-application access. Understanding there's a bigger picture behind this: Trustless Data Interoperability.",
  10: "Sovereignty in Action: Real-time agent reaction to in-game events. Long-term memory stored in the user's vault, not the game server.",
  11: "The Dawn of Personal Sovereign Compute. Infrastructure for the Agentic Future."
};

interface Slide {
  filename: string;
  url: string;
  number: number;
}

export default function NarrativePage() {
  // Map of slide number to array of available slide variations
  const [slideGroups, setSlideGroups] = useState<Map<number, Slide[]>>(new Map());
  // Map of slide number to the index of the currently selected variation
  const [selectedVariations, setSelectedVariations] = useState<Map<number, number>>(new Map());
  // Set of selected "Best" slides (filenames)
  const [ceoPicks, setCeoPicks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/slides')
      .then(res => res.json())
      .then(data => {
        const allSlides = data.files.map((file: string) => {
          const match = file.match(/(?:-|^)slide-(\d+)/i);
          return {
            filename: file,
            url: `${data.basePath}/${file}`,
            number: match ? parseInt(match[1]) : 999
          };
        });

        const groups = new Map<number, Slide[]>();
        allSlides.forEach((slide: Slide) => {
           if (slide.number !== 999) {
             const existing = groups.get(slide.number) || [];
             existing.push(slide);
             groups.set(slide.number, existing);
           }
        });
        
        setSlideGroups(groups);
        
        // Initialize selections to 0 (first item) for each group
        const initialSelections = new Map<number, number>();
        groups.forEach((_, key) => initialSelections.set(key, 0));
        setSelectedVariations(initialSelections);
      });
  }, []);

  const handleNextVariation = (slideNumber: number) => {
    const group = slideGroups.get(slideNumber) || [];
    if (group.length <= 1) return;
    
    const currentIndex = selectedVariations.get(slideNumber) || 0;
    const nextIndex = (currentIndex + 1) % group.length;
    
    setSelectedVariations(new Map(selectedVariations).set(slideNumber, nextIndex));
  };

  const handlePrevVariation = (slideNumber: number) => {
    const group = slideGroups.get(slideNumber) || [];
    if (group.length <= 1) return;
    
    const currentIndex = selectedVariations.get(slideNumber) || 0;
    const prevIndex = (currentIndex - 1 + group.length) % group.length;
    
    setSelectedVariations(new Map(selectedVariations).set(slideNumber, prevIndex));
  };

  const toggleCeoPick = (filename: string) => {
    const newPicks = new Set(ceoPicks);
    if (newPicks.has(filename)) {
      newPicks.delete(filename);
    } else {
      // Optional: Logic to enforce only one pick per slide number?
      // For now, let's allow toggling freely. 
      // If we want unique pick per number, we'd need to clear others.
      newPicks.add(filename);
    }
    setCeoPicks(newPicks);
  };

  // Sort groups by slide number 1-11
  const sortedSlideNumbers = Array.from(slideGroups.keys()).sort((a, b) => a - b);

  return (
    <main className="min-h-screen bg-[#0f172a] text-white p-12 font-sans">
      <header className="max-w-7xl mx-auto mb-16 text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
          The Sovereign Agentic Era
        </h1>
        <p className="text-slate-400 text-xl">Narrative & Visual Selection</p>
        <div className="mt-4 text-sm text-slate-500 font-mono">
           {ceoPicks.size} slides selected for final deck
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-32">
        {sortedSlideNumbers.map((slideNumber) => {
          const group = slideGroups.get(slideNumber) || [];
          const currentIndex = selectedVariations.get(slideNumber) || 0;
          const currentSlide = group[currentIndex];

          if (!currentSlide) return null;

          return (
            <div key={slideNumber} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start border-b border-slate-800 pb-16 last:border-0">
              
              {/* Visual Side (Carousel) */}
              <div className="space-y-4">
                <div className="relative group">
                  <div className={`absolute -inset-1 bg-gradient-to-r ${ceoPicks.has(currentSlide.filename) ? 'from-green-400 to-emerald-600 opacity-100' : 'from-cyan-500 to-purple-600 opacity-25 group-hover:opacity-75'} rounded-2xl blur transition duration-500`}></div>
                  
                  <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl aspect-video">
                    <img 
                      src={currentSlide.url} 
                      alt={`Slide ${slideNumber} Variation ${currentIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Navigation Overlays */}
                    {group.length > 1 && (
                      <>
                        <button 
                          onClick={() => handlePrevVariation(slideNumber)}
                          className="absolute left-0 top-0 bottom-0 px-4 bg-black/20 hover:bg-black/50 transition flex items-center text-white/50 hover:text-white"
                        >
                          ←
                        </button>
                        <button 
                          onClick={() => handleNextVariation(slideNumber)}
                          className="absolute right-0 top-0 bottom-0 px-4 bg-black/20 hover:bg-black/50 transition flex items-center text-white/50 hover:text-white"
                        >
                          →
                        </button>
                      </>
                    )}

                    <div className="absolute top-4 left-4 flex gap-2">
                       <span className="bg-black/80 backdrop-blur px-3 py-1 rounded text-xs font-mono border border-white/10 text-cyan-400">
                        SLIDE {slideNumber}
                      </span>
                      <span className="bg-black/80 backdrop-blur px-3 py-1 rounded text-xs font-mono border border-white/10 text-slate-400">
                        VAR {currentIndex + 1}/{group.length}
                      </span>
                    </div>

                    {/* CEO Pick Indicator/Toggle on Image */}
                    <button 
                      onClick={() => toggleCeoPick(currentSlide.filename)}
                      className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur border transition-all ${
                        ceoPicks.has(currentSlide.filename) 
                          ? 'bg-green-500/20 border-green-500 text-green-400 scale-110' 
                          : 'bg-black/50 border-white/10 text-slate-500 hover:text-white hover:border-white'
                      }`}
                    >
                      {ceoPicks.has(currentSlide.filename) ? '★ SELECTED' : '☆ Select'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center px-2">
                  <div className="flex gap-1">
                    {group.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-8 bg-cyan-500' : 'w-2 bg-slate-700'}`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {currentSlide.filename}
                  </div>
                </div>
              </div>

              {/* Narrative Side */}
              <div className="space-y-6 lg:pt-8">
                <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-4">
                  {slideNumber === 1 ? "The Hook" : 
                   slideNumber === 7 ? "The Paradigm Shift" : 
                   slideNumber === 11 ? "The Vision" : 
                   `Scene ${slideNumber}`}
                   
                   {ceoPicks.has(currentSlide.filename) && (
                     <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/50 px-2 py-1 rounded font-mono uppercase tracking-wider">
                       Approved
                     </span>
                   )}
                </h2>
                
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-transparent"></div>
                  <blockquote className="pl-6 text-lg text-slate-300 leading-relaxed italic">
                    "{TRANSCRIPT_MAPPING[slideNumber] || "Narrative excerpt not found."}"
                  </blockquote>
                </div>
                
                <div className="pt-8 border-t border-slate-800/50">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">CEO Actions</h3>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => toggleCeoPick(currentSlide.filename)}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all border ${
                        ceoPicks.has(currentSlide.filename)
                        ? 'bg-green-600 hover:bg-green-700 border-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {ceoPicks.has(currentSlide.filename) ? '✓ Confirm Selection' : 'Select This Version'}
                    </button>
                    <button 
                      onClick={async () => {
                        const feedback = prompt("Enter feedback for this slide (e.g., 'Make the blue darker', 'Remove the orb'):");
                        if (feedback) {
                           try {
                             const res = await fetch('/api/feedback', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({
                                 slideId: slideNumber,
                                 filename: currentSlide.filename,
                                 feedback: feedback
                               })
                             });
                             
                             if (res.ok) {
                               alert("Feedback saved successfully!");
                             } else {
                               const errData = await res.json();
                               alert(`Failed to save feedback: ${errData.error || res.statusText}`);
                             }
                           } catch (err: any) {
                             console.error(err);
                             alert(`Error saving feedback: ${err.message}`);
                           }
                        }
                      }}
                      className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition"
                    >
                       Feedback
                    </button>
                  </div>
                </div>
              </div>
              
            </div>
          );
        })}
      </div>
    </main>
  );
}

