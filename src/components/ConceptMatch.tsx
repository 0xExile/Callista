import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, CheckCircle2, XCircle, RotateCcw, Brain, Layers } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { cn } from '@/src/lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Pair {
  id: string;
  term: string;
  definition: string;
  explanation: string;
}

interface ConceptMatchProps {
  topic: string;
  grade: string;
  limit?: number;
  onPlayAgain?: () => void;
  onExit?: () => void;
  onComplete?: (score: number, total: number) => void;
}

export const ConceptMatch = ({ topic, grade, limit = 6, onPlayAgain, onExit, onComplete }: ConceptMatchProps) => {
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'finished'>('idle');
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [shuffledTerms, setShuffledTerms] = useState<{id: string, text: string}[]>([]);
  const [shuffledDefs, setShuffledDefs] = useState<{id: string, text: string}[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [wrongMatch, setWrongMatch] = useState<{term: string, definition: string, correctDefinition: string, explanation: string} | null>(null);

  const generateGame = React.useCallback(async () => {
    if (!topic) return;
    setGameState('loading');
    setError(null);
    try {
      const randomSeed = Math.floor(Math.random() * 1000000);
      const prompt = `Generate ${limit} unique concept pairs for a matching game about "${topic}" for ${grade} level. 
      Ensure high variety and avoid repeating terms from previous sessions. 
      Random seed for variety: ${randomSeed}.
      Each pair should have a 'term' (short), a 'definition' (concise), and a brief 'explanation' of the concept.
      Return as a JSON array of objects with fields: term, definition, explanation.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ["term", "definition", "explanation"],
            },
          },
        },
      });

      const data = JSON.parse(response.text);
      const formattedPairs = data.map((p: any, i: number) => ({
        id: i.toString(),
        term: p.term,
        definition: p.definition,
        explanation: p.explanation
      }));

      setPairs(formattedPairs);
      setShuffledTerms([...formattedPairs].map(p => ({ id: p.id, text: p.term })).sort(() => Math.random() - 0.5));
      setShuffledDefs([...formattedPairs].map(p => ({ id: p.id, text: p.definition })).sort(() => Math.random() - 0.5));
      setGameState('playing');
      setMatches([]);
      setErrors([]);
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
    if (selectedTerm && selectedDef) {
      if (selectedTerm === selectedDef) {
        setMatches(prev => [...prev, selectedTerm]);
        setSelectedTerm(null);
        setSelectedDef(null);
        setWrongMatch(null);
      } else {
        const tId = selectedTerm;
        const dId = selectedDef;
        setErrors([tId, dId]);
        
        const termPair = pairs.find(p => p.id === tId);
        const defPair = pairs.find(p => p.id === dId);
        
        if (termPair && defPair) {
          setWrongMatch({
            term: termPair.term,
            definition: defPair.definition,
            correctDefinition: termPair.definition,
            explanation: termPair.explanation
          });
        }

        setTimeout(() => {
          setErrors([]);
          setSelectedTerm(null);
          setSelectedDef(null);
        }, 1500);
      }
    }
  }, [selectedTerm, selectedDef, pairs]);

  useEffect(() => {
    if (pairs.length > 0 && matches.length === pairs.length) {
      setGameState('finished');
      if (onComplete) {
        onComplete(pairs.length, pairs.length);
      }
    }
  }, [matches, pairs, onComplete]);

  if (gameState === 'idle') {
    return (
      <div className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 text-center space-y-8">
        <div className="w-20 h-20 bg-beige-100 rounded-2xl flex items-center justify-center mx-auto">
          <Layers className="w-10 h-10 text-beige-400" />
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-serif font-bold text-beige-900">Concept Match</h3>
          <p className="text-beige-600 max-w-md mx-auto">
            Test your understanding by matching key terms with their correct definitions.
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
          <span className="relative z-10">Start Matching</span>
        </button>
      </div>
    );
  }

  if (gameState === 'loading' || pairs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8">
        <Loader2 className="w-16 h-16 text-beige-400 animate-spin" />
        <div className="text-center space-y-4">
          <p className="text-beige-600 font-bold uppercase tracking-widest animate-pulse">
            {gameState === 'loading' ? "Building your match maze..." : "Generating pairs..."}
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
          <h3 className="text-4xl font-serif font-bold text-beige-900">Perfect Match!</h3>
          <p className="text-beige-600">You've successfully connected all concepts.</p>
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-beige-400 uppercase tracking-widest text-center">Terms</h4>
          <div className="grid grid-cols-1 gap-3">
            {shuffledTerms.map((term) => (
              <button
                key={term.id}
                onClick={() => !matches.includes(term.id) && setSelectedTerm(term.id)}
                disabled={matches.includes(term.id) || errors.includes(term.id)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-sm font-bold text-left",
                  matches.includes(term.id) ? "bg-green-50 border-green-200 text-green-700 opacity-50" :
                  selectedTerm === term.id ? "bg-beige-800 border-beige-800 text-white shadow-lg scale-105" :
                  errors.includes(term.id) ? "bg-red-50 border-red-200 text-red-700 animate-shake" :
                  "bg-white border-beige-100 text-beige-900 hover:border-beige-300"
                )}
              >
                {term.text}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold text-beige-400 uppercase tracking-widest text-center">Definitions</h4>
          <div className="grid grid-cols-1 gap-3">
            {shuffledDefs.map((def) => (
              <button
                key={def.id}
                onClick={() => !matches.includes(def.id) && setSelectedDef(def.id)}
                disabled={matches.includes(def.id) || errors.includes(def.id)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-xs font-medium text-left min-h-[80px] flex items-center",
                  matches.includes(def.id) ? "bg-green-50 border-green-200 text-green-700 opacity-50" :
                  selectedDef === def.id ? "bg-beige-800 border-beige-800 text-white shadow-lg scale-105" :
                  errors.includes(def.id) ? "bg-red-50 border-red-200 text-red-700 animate-shake" :
                  "bg-white border-beige-100 text-beige-600 hover:border-beige-300"
                )}
              >
                {def.text}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center flex-col items-center gap-4">
        <AnimatePresence>
          {wrongMatch && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-md w-full p-6 bg-red-50 border border-red-100 rounded-3xl space-y-3"
            >
              <div className="flex items-center gap-2 text-red-600 font-bold uppercase tracking-widest text-[10px]">
                <XCircle className="w-4 h-4" />
                Incorrect Match
              </div>
              <p className="text-xs text-red-700">
                <span className="font-bold">"{wrongMatch.term}"</span> does not match <span className="italic">"{wrongMatch.definition}"</span>.
              </p>
              <div className="p-3 bg-white/50 rounded-xl text-[10px] text-beige-700 leading-relaxed">
                <span className="font-bold text-beige-900 block mb-1 uppercase tracking-widest text-[8px]">Correct Definition:</span>
                {wrongMatch.correctDefinition}
                <span className="font-bold text-beige-900 block mt-2 mb-1 uppercase tracking-widest text-[8px]">Explanation:</span>
                {wrongMatch.explanation}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-6 py-3 bg-beige-100 rounded-full text-[10px] font-bold text-beige-600 uppercase tracking-widest">
          Matches: {matches.length} / {pairs.length}
        </div>
      </div>
    </div>
  );
};
