import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, CheckCircle2, XCircle, RotateCcw, Brain, Layers, Gamepad2, Play } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { cn } from '@/src/lib/utils';
import { useGems } from '../contexts/GemsContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Fact {
  id: string;
  text: string;
  category: string;
  explanation: string;
}

interface FactSortProps {
  topic: string;
  grade: string;
  limit?: number;
  onPlayAgain?: () => void;
  onExit?: () => void;
  onComplete?: (score: number, total: number) => void;
}

export const FactSort = ({ topic, grade, limit = 9, onPlayAgain, onExit, onComplete }: FactSortProps) => {
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [categories, setCategories] = useState<string[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFactId, setSelectedFactId] = useState<string | null>(null);
  const [sortedFacts, setSortedFacts] = useState<Record<string, string>>({}); // factId -> category
  const [showResults, setShowResults] = useState(false);
  
  const generateGame = React.useCallback(async () => {
    if (!topic) return;
    setGameState('loading');
    setError(null);
    try {
      const randomSeed = Math.floor(Math.random() * 1000000);
      const prompt = `Generate a unique sorting game about "${topic}" for ${grade} level. 
      Ensure high variety and avoid repeating facts from previous sessions. 
      Random seed for variety: ${randomSeed}.
      Create 2-3 distinct THEMATIC subheadings directly related to the topic.
      Create ${limit} facts (distributed across the subheadings).
      For each fact, provide a brief explanation of why it belongs to that category.
      Return as a JSON object with:
      - categories (array of 2-3 strings)
      - facts (array of ${limit} objects with fields: text, category, explanation)
      Make sure the facts are clearly distinguishable.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              categories: { type: Type.ARRAY, items: { type: Type.STRING } },
              facts: { 
                type: Type.ARRAY, 
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    category: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ["text", "category", "explanation"],
                }
              },
            },
            required: ["categories", "facts"],
          },
        },
      });

      const data = JSON.parse(response.text);
      setCategories(data.categories);
      const factsWithIds = data.facts.map((f: any, i: number) => ({ ...f, id: i.toString() }));
      setFacts(factsWithIds.sort(() => Math.random() - 0.5));
      setGameState('playing');
      setSortedFacts({});
      setSelectedFactId(null);
      setShowResults(false);
      setScore(0);
    } catch (err) {
      console.error(err);
      setError("Failed to generate game. Please try again.");
      setGameState('idle');
    }
  }, [topic, grade]);

  useEffect(() => {
    if (topic && gameState === 'idle') {
      generateGame();
    }
  }, [topic, gameState, generateGame]);

  const handleFactClick = (id: string) => {
    if (showResults) return;
    setSelectedFactId(id);
  };

  const handleCategoryClick = (category: string) => {
    if (!selectedFactId || showResults) return;
    setSortedFacts(prev => ({ ...prev, [selectedFactId]: category }));
    setSelectedFactId(null);
  };

  const checkResults = () => {
    let correctCount = 0;
    facts.forEach(fact => {
      if (sortedFacts[fact.id] === fact.category) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setShowResults(true);
    if (onComplete) {
      onComplete(correctCount, facts.length);
    }
  };

  if (gameState === 'idle') {
    return (
      <div className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 text-center space-y-8">
        <div className="w-20 h-20 bg-beige-100 rounded-2xl flex items-center justify-center mx-auto">
          <Gamepad2 className="w-10 h-10 text-beige-400" />
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-serif font-bold text-beige-900">Fact Sort</h3>
          <p className="text-beige-600 max-w-md mx-auto">
            Organize the facts into their correct subheadings. Select a fact, then choose its category!
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1 bg-beige-100 text-beige-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Topic: {topic || 'Not set'}
            </span>
            <span className="px-3 py-1 bg-beige-800 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
              Grade: {grade}
            </span>
          </div>
        </div>
        {!topic && (
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest bg-red-50 py-2 px-4 rounded-xl inline-block">
            Please enter a topic in the generator above first!
          </p>
        )}
        {error && (
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest bg-red-50 py-2 px-4 rounded-xl inline-block">
            {error}
          </p>
        )}
        <button
          onClick={generateGame}
          disabled={!topic}
          className="group relative px-12 py-5 bg-beige-800 text-white rounded-2xl font-bold text-lg uppercase tracking-widest hover:bg-beige-900 transition-all shadow-xl disabled:opacity-50"
        >
          <span className="relative z-10">Start Sorting</span>
        </button>
      </div>
    );
  }

  if (gameState === 'loading' || facts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8">
        <Loader2 className="w-16 h-16 text-beige-400 animate-spin" />
        <div className="text-center space-y-4">
          <p className="text-beige-600 font-bold uppercase tracking-widest animate-pulse">
            {gameState === 'loading' ? "Organizing your facts..." : "Generating facts..."}
          </p>
          {onExit && (
            <button 
              onClick={onExit}
              className="px-6 py-2 bg-beige-100 text-beige-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-beige-200 transition-all"
            >
              Cancel & Exit
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex justify-between items-center px-4">
        <h3 className="text-xl font-serif font-bold text-beige-900 uppercase tracking-widest">Fact Sort: {topic}</h3>
        {showResults && (
          <div className="px-4 py-2 bg-beige-800 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
            Score: {score} / {facts.length}
          </div>
        )}
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-beige-400 uppercase tracking-[0.2em] ml-2">Facts to Sort</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {facts.map((fact) => {
              const isSorted = !!sortedFacts[fact.id];
              const isSelected = selectedFactId === fact.id;
              const isCorrect = showResults && sortedFacts[fact.id] === fact.category;
              const isWrong = showResults && sortedFacts[fact.id] !== fact.category;

              return (
                <button
                  key={fact.id}
                  onClick={() => handleFactClick(fact.id)}
                  disabled={showResults}
                  className={cn(
                    "p-6 rounded-2xl border-2 text-left text-sm font-medium transition-all relative group",
                    isSelected ? "border-beige-800 bg-beige-50 shadow-lg scale-105 z-10" :
                    isCorrect ? "border-green-500 bg-green-50 text-green-700" :
                    isWrong ? "border-red-500 bg-red-50 text-red-700" :
                    isSorted ? "border-beige-100 bg-beige-50/50 opacity-50" :
                    "border-beige-100 bg-white hover:border-beige-400 shadow-sm"
                  )}
                >
                  {fact.text}
                  {isSorted && !showResults && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-beige-800 text-white text-[8px] rounded uppercase">
                      {sortedFacts[fact.id]}
                    </div>
                  )}
                  {showResults && (
                    <div className="mt-4 space-y-2 text-left">
                      <div className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isCorrect ? "text-green-600" : "text-red-600"
                      )}>
                        {isCorrect ? '✓ Correct' : `✗ Should be: ${fact.category}`}
                      </div>
                      <p className="text-[10px] text-beige-600 leading-relaxed border-t border-beige-100 pt-2">
                        {fact.explanation}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold text-beige-400 uppercase tracking-[0.2em] ml-2 text-center">Select a fact above, then click its subheading below</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                disabled={!selectedFactId || showResults}
                className={cn(
                  "p-8 rounded-[32px] border-2 font-bold uppercase tracking-widest transition-all text-center",
                  selectedFactId ? "border-beige-800 bg-beige-800 text-white shadow-xl animate-pulse" :
                  "border-beige-100 bg-white text-beige-400"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {!showResults ? (
          <button
            onClick={checkResults}
            disabled={Object.keys(sortedFacts).length < facts.length}
            className="w-full py-6 bg-beige-800 text-white rounded-[32px] font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-xl disabled:opacity-50"
          >
            Check Results
          </button>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={onPlayAgain}
              className="flex-1 py-6 bg-beige-100 text-beige-800 rounded-[32px] font-bold uppercase tracking-widest hover:bg-beige-200 transition-all flex items-center justify-center gap-3"
            >
              <RotateCcw className="w-5 h-5" />
              Back to Start
            </button>
            <button
              onClick={generateGame}
              className="flex-1 py-6 bg-beige-800 text-white rounded-[32px] font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-xl flex items-center justify-center gap-3"
            >
              <Play className="w-5 h-5" />
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
