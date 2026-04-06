import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, CheckCircle2, XCircle, RotateCcw, Brain, Layers, Gamepad2, Timer, Eye, Wand2, Lock, Unlock, Play, Key } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { cn } from '@/src/lib/utils';
import { useGems } from '../contexts/GemsContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Clue {
  id: string;
  clue: string;
  answer: string;
  explanation: string;
}

interface CodeCrackerProps {
  topic: string;
  grade: string;
  limit?: number;
  onPlayAgain?: () => void;
  onExit?: () => void;
  onComplete?: (score: number, total: number) => void;
}

export const CodeCracker = ({ topic, grade, limit = 4, onPlayAgain, onExit, onComplete }: CodeCrackerProps) => {
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'safe' | 'finished'>('idle');
  const [clues, setClues] = useState<Clue[]>([]);
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<('correct' | 'wrong' | null)[]>([]);
  const [safeCode, setSafeCode] = useState<string>('');
  const [userInputCode, setUserInputCode] = useState('');
  const [safeError, setSafeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateGame = React.useCallback(async () => {
    if (!topic) return;
    setGameState('loading');
    setError(null);
    try {
      const randomSeed = Math.floor(Math.random() * 1000000);
      const prompt = `Generate a unique code cracker game about "${topic}" for ${grade} level. 
      Ensure high variety and avoid repeating clues from previous sessions. 
      Random seed for variety: ${randomSeed}.
      Create ${limit} challenging clues where each answer is a SINGLE WORD.
      For each clue, provide the clue text, the single-word answer, and a brief explanation of the concept.
      Return as a JSON array of objects with fields: clue, answer, explanation.
      Make sure the answers are clear and unambiguous.`;

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
                clue: { type: Type.STRING },
                answer: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ["clue", "answer", "explanation"],
            },
          },
        },
      });

      const data = JSON.parse(response.text);
      const gameClues = data.map((c: any, i: number) => ({ ...c, id: i.toString() }));
      setClues(gameClues);
      setUserAnswers(new Array(gameClues.length).fill(''));
      setFeedback(new Array(gameClues.length).fill(null));
      
      // Generate safe code based on answer lengths
      const code = gameClues.map((c: any) => c.answer.length.toString()).join('');
      setSafeCode(code);

      setGameState('playing');
      setCurrentClueIndex(0);
      setUserInputCode('');
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

  const handleSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (feedback[currentClueIndex] !== null || !userInputCode.trim()) return;

    const currentClue = clues[currentClueIndex];
    const isCorrect = userInputCode.toLowerCase().trim() === currentClue.answer.toLowerCase().trim();
    
    const newAnswers = [...userAnswers];
    newAnswers[currentClueIndex] = userInputCode;
    setUserAnswers(newAnswers);

    const newFeedback = [...feedback];
    newFeedback[currentClueIndex] = isCorrect ? 'correct' : 'wrong';
    setFeedback(newFeedback);
  }, [feedback, currentClueIndex, userInputCode, clues, userAnswers]);

  const handleNext = React.useCallback(() => {
    if (currentClueIndex < clues.length - 1) {
      setCurrentClueIndex(prev => prev + 1);
      setUserInputCode('');
    } else {
      setGameState('safe');
      setUserInputCode('');
    }
  }, [currentClueIndex, clues.length]);

  const handleUnlockSafe = () => {
    if (userInputCode === safeCode) {
      setGameState('finished');
      if (onComplete) {
        onComplete(clues.length, clues.length);
      }
    } else {
      setSafeError("Incorrect code! Check your answers' lengths.");
      setTimeout(() => setSafeError(null), 3000);
    }
  };

  if (gameState === 'idle') {
    return (
      <div className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 text-center space-y-8">
        <div className="w-20 h-20 bg-beige-100 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10 text-beige-400" />
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-serif font-bold text-beige-900">Code Cracker</h3>
          <p className="text-beige-600 max-w-md mx-auto">
            Decipher the clues to unlock the secrets of the topic. Each answer is a key to the next level.
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
          <span className="relative z-10">Start Cracking</span>
        </button>
      </div>
    );
  }

  if (gameState === 'loading' || clues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8">
        <Loader2 className="w-16 h-16 text-beige-400 animate-spin" />
        <div className="text-center space-y-4">
          <p className="text-beige-600 font-bold uppercase tracking-widest animate-pulse">
            {gameState === 'loading' ? "Encrypting the clues..." : "Generating clues..."}
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

  if (gameState === 'safe') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 text-center space-y-8"
      >
        <div className="w-24 h-24 bg-beige-800 rounded-full flex items-center justify-center mx-auto shadow-2xl text-white">
          <Lock className="w-12 h-12" />
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-serif font-bold text-beige-900">The Safe</h3>
          <p className="text-beige-600 text-sm">
            Enter the {clues.length}-digit code to unlock the rewards. 
            <br />
            <span className="italic font-medium">Hint: Each digit is the number of letters in your correct answers.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 text-left mb-8">
          {clues.map((clue, idx) => (
            <div key={idx} className="p-3 bg-white/50 rounded-xl border border-beige-100 flex justify-between items-center">
              <span className="text-xs font-bold text-beige-400 uppercase">Q{idx + 1} Answer</span>
              <span className={cn(
                "font-mono font-bold",
                feedback[idx] === 'correct' ? "text-green-600" : "text-red-600"
              )}>
                {feedback[idx] === 'correct' ? userAnswers[idx] : '???'}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {safeError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest"
              >
                {safeError}
              </motion.div>
            )}
          </AnimatePresence>
          <input
            type="text"
            value={userInputCode}
            onChange={(e) => setUserInputCode(e.target.value.replace(/\D/g, '').slice(0, clues.length))}
            placeholder="Enter Code"
            className="w-full py-4 px-6 bg-white border-2 border-beige-200 rounded-2xl text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:border-beige-800 transition-all"
          />
          <button
            onClick={handleUnlockSafe}
            className="w-full py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-xl"
          >
            Unlock Safe
          </button>
        </div>
      </motion.div>
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
          <Unlock className="w-12 h-12 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-4xl font-serif font-bold text-beige-900">Safe Unlocked!</h3>
          <p className="text-beige-600 text-xl">You've cracked the code and mastered the topic.</p>
          <div className="flex items-center justify-center gap-2 text-beige-500 font-bold uppercase tracking-widest text-xs">
            <Sparkles className="w-4 h-4 text-beige-400" />
            +20 Gems & +100 XP
          </div>
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

  const currentClue = clues[currentClueIndex];
  const currentFeedback = feedback[currentClueIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="flex justify-between items-center px-4">
        <span className="text-xs font-bold text-beige-400 uppercase tracking-widest">Clue {currentClueIndex + 1} / {clues.length}</span>
        <div className="flex gap-2">
          {feedback.map((f, i) => (
            <div key={i} className={cn(
              "w-3 h-3 rounded-full border",
              f === 'correct' ? "bg-green-500 border-green-600" :
              f === 'wrong' ? "bg-red-500 border-red-600" :
              "bg-beige-100 border-beige-200"
            )} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentClueIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className={cn(
            "bg-white/80 backdrop-blur-md p-12 rounded-[40px] border-2 text-center shadow-xl transition-all duration-300 min-h-[400px] flex flex-col justify-center space-y-8",
            currentFeedback === 'correct' ? "border-green-500 bg-green-50" :
            currentFeedback === 'wrong' ? "border-red-500 bg-red-50" :
            "border-beige-200"
          )}
        >
          <div className="relative w-32 h-32 mx-auto mb-4">
            <motion.div
              animate={{ rotate: currentFeedback === 'correct' ? 360 : 0 }}
              className="absolute inset-0 bg-beige-100 rounded-full border-4 border-beige-200 flex items-center justify-center"
            >
              <div className="w-24 h-24 bg-white rounded-full border-2 border-beige-200 flex items-center justify-center">
                {currentFeedback === 'correct' ? <Unlock className="w-10 h-10 text-green-600" /> : <Lock className="w-10 h-10 text-beige-300" />}
              </div>
            </motion.div>
          </div>

          <div className="space-y-4">
            <h4 className="text-2xl font-serif font-bold text-beige-900 leading-tight">
              {currentClue.clue}
            </h4>
            <div className="flex items-center justify-center gap-2 text-beige-400 font-bold uppercase tracking-widest text-[10px]">
              <Key className="w-3 h-3" />
              The answer has {currentClue.answer.length} letters
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {Array.from({ length: currentClue.answer.length }).map((_, i) => (
                <div 
                  key={i}
                  className={cn(
                    "w-10 h-12 rounded-lg border-2 flex items-center justify-center font-bold text-xl uppercase",
                    userInputCode[i] ? "bg-beige-800 text-white border-beige-800" : "bg-beige-50 border-beige-200 text-beige-300"
                  )}
                >
                  {userInputCode[i] || ''}
                </div>
              ))}
            </div>

            <input
              type="text"
              value={userInputCode}
              onChange={(e) => setUserInputCode(e.target.value.slice(0, currentClue.answer.length))}
              disabled={currentFeedback !== null}
              placeholder="Type to crack..."
              className="sr-only"
              autoFocus
            />
            
            <input 
              type="text"
              className="w-full p-4 bg-beige-50 border-2 border-beige-100 rounded-2xl focus:outline-none focus:border-beige-400 transition-all text-center font-bold text-lg uppercase tracking-widest"
              value={userInputCode}
              onChange={(e) => setUserInputCode(e.target.value.slice(0, currentClue.answer.length))}
              disabled={currentFeedback !== null}
              placeholder="ENTER CODE HERE"
            />

            {currentFeedback === null ? (
              <button
                type="submit"
                className="w-full py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-lg"
              >
                Crack Code
              </button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div className={cn(
                  "p-4 rounded-2xl border font-bold uppercase tracking-widest text-sm",
                  currentFeedback === 'correct' ? "bg-green-100 border-green-200 text-green-700" : "bg-red-100 border-red-200 text-red-700"
                )}>
                  {currentFeedback === 'correct' ? 'Access Granted!' : `Access Denied! The correct word was: ${currentClue.answer}`}
                </div>
                <div className="p-6 bg-beige-50 rounded-3xl border border-beige-200 text-left">
                  <p className="text-sm text-beige-700 leading-relaxed">
                    <span className="font-bold text-beige-900 block mb-1 uppercase tracking-widest text-xs">Explanation:</span>
                    {currentClue.explanation}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {currentClueIndex === clues.length - 1 ? 'Go to Safe' : 'Next Clue'}
                  <Play className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
