import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, CheckCircle2, XCircle, RotateCcw, Brain, Layers, Gamepad2, Timer, Eye } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { cn } from '@/src/lib/utils';
import { useGems } from '../contexts/GemsContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Card {
  id: string;
  text: string;
  pairId: string;
  imageUrl?: string;
}

interface MemoryMatrixProps {
  topic: string;
  grade: string;
  limit?: number;
  onPlayAgain?: () => void;
  onExit?: () => void;
  onComplete?: (score: number, total: number) => void;
}

export const MemoryMatrix = ({ topic, grade, limit = 6, onPlayAgain, onExit, onComplete }: MemoryMatrixProps) => {
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'memorizing' | 'playing' | 'finished'>('idle');
  const [cards, setCards] = useState<Card[]>([]);
  const [shuffledCards, setShuffledCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const generateGame = React.useCallback(async () => {
    if (!topic) return;
    setGameState('loading');
    setError(null);
    try {
      const randomSeed = Math.floor(Math.random() * 1000000);
      const prompt = `Generate a unique memory matching game about "${topic}" for ${grade} level. 
      Ensure high variety and avoid repeating concepts from previous sessions. 
      Random seed for variety: ${randomSeed}.
      Create ${limit} pairs of related items. Each pair should consist of a "Concept" and an "Example" or "Definition" (e.g., "Subcontinent" and "India").
      Return as a JSON object with:
      - pairs (array of ${limit} objects with fields: concept, example)
      Make sure the relationships are clear.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pairs: { 
                type: Type.ARRAY, 
                items: {
                  type: Type.OBJECT,
                  properties: {
                    concept: { type: Type.STRING },
                    example: { type: Type.STRING },
                  },
                  required: ["concept", "example"],
                }
              },
            },
            required: ["pairs"],
          },
        },
      });

      const data = JSON.parse(response.text);
      const gameCards: Card[] = [];
      data.pairs.forEach((pair: any, index: number) => {
        const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(pair.concept)}/200/200`;
        gameCards.push({ id: `p${index}-a`, text: pair.concept, pairId: index.toString(), imageUrl });
        gameCards.push({ id: `p${index}-b`, text: pair.example, pairId: index.toString() });
      });

      setShuffledCards(gameCards.sort(() => Math.random() - 0.5));
      setGameState('memorizing');
      setTimeLeft(10);
      setFlipped([]);
      setSolved([]);
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

  useEffect(() => {
    if (gameState === 'memorizing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (gameState === 'memorizing' && timeLeft === 0) {
      setGameState('playing');
    }
  }, [gameState, timeLeft]);

  const handleCardClick = React.useCallback((index: number) => {
    if (disabled || flipped.includes(index) || solved.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setDisabled(true);
      const [first, second] = newFlipped;
      if (shuffledCards[first].pairId === shuffledCards[second].pairId) {
        setSolved(prev => [...prev, first, second]);
        setFlipped([]);
        setDisabled(false);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 500);
      }
    }
  }, [disabled, flipped, solved, shuffledCards]);

  useEffect(() => {
    if (shuffledCards.length > 0 && solved.length === shuffledCards.length) {
      setGameState('finished');
      if (onComplete) {
        onComplete(limit, limit);
      }
    }
  }, [solved, shuffledCards, limit, onComplete]);

  if (gameState === 'idle') {
    return (
      <div className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 text-center space-y-8">
        <div className="w-20 h-20 bg-beige-100 rounded-2xl flex items-center justify-center mx-auto">
          <Eye className="w-10 h-10 text-beige-400" />
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-serif font-bold text-beige-900">Memory Matrix</h3>
          <p className="text-beige-600 max-w-md mx-auto">
            Memorize the positions of key terms and find their pairs. Sharpens focus and recall!
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
          <span className="relative z-10">Start Memory Test</span>
        </button>
      </div>
    );
  }

  if (gameState === 'loading' || shuffledCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8">
        <Loader2 className="w-16 h-16 text-beige-400 animate-spin" />
        <div className="text-center space-y-4">
          <p className="text-beige-600 font-bold uppercase tracking-widest animate-pulse">
            {gameState === 'loading' ? "Shuffling the matrix..." : "Generating cards..."}
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

  if (gameState === 'finished') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 text-center space-y-8"
      >
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-4xl font-serif font-bold text-beige-900">Matrix Solved!</h3>
          <p className="text-beige-600">Your memory is impressive. All pairs found!</p>
        </div>
        <button
          onClick={onPlayAgain}
          className="flex items-center gap-2 px-8 py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 mx-auto transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center gap-2 text-beige-800 font-bold">
          {gameState === 'memorizing' ? (
            <>
              <Eye className="w-5 h-5 text-beige-400" />
              <span className="text-xl tabular-nums">Memorize: {timeLeft}s</span>
            </>
          ) : (
            <>
              <Brain className="w-5 h-5 text-beige-400" />
              <span className="text-xl tabular-nums">Find Pairs!</span>
            </>
          )}
        </div>
        <div className="px-4 py-2 bg-beige-800 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
          Pairs: {solved.length / 2} / {shuffledCards.length / 2}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {shuffledCards.map((card, index) => {
          const isFlipped = flipped.includes(index) || solved.includes(index) || gameState === 'memorizing';
          return (
            <button
              key={index}
              onClick={() => handleCardClick(index)}
              disabled={gameState === 'memorizing' || solved.includes(index)}
              className={cn(
                "aspect-square rounded-2xl transition-all duration-500 transform-gpu preserve-3d relative",
                isFlipped ? "rotate-y-180" : ""
              )}
            >
              <div className={cn(
                "absolute inset-0 rounded-2xl border-2 backface-hidden flex items-center justify-center p-4 text-center",
                "bg-white border-beige-200 text-beige-300",
                !isFlipped && "hover:border-beige-400"
              )}>
                <Brain className="w-8 h-8 opacity-20" />
              </div>
              <div className={cn(
                "absolute inset-0 rounded-2xl border-2 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-2 text-center overflow-hidden",
                solved.includes(index) ? "bg-green-50 border-green-200 text-green-700" : "bg-beige-800 border-beige-800 text-white"
              )}>
                {card.imageUrl && (
                  <img 
                    src={card.imageUrl} 
                    alt={card.text} 
                    className="w-full h-1/2 object-cover rounded-lg mb-2"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className={cn(
                  "font-bold uppercase tracking-tight leading-tight",
                  card.imageUrl ? "text-[8px] sm:text-[10px]" : "text-[10px] sm:text-xs"
                )}>
                  {card.text}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
