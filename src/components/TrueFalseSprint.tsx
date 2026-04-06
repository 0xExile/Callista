import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, CheckCircle2, XCircle, RotateCcw, Brain, Layers, Gamepad2, Timer, Play } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { cn } from '@/src/lib/utils';
import { useGems } from '../contexts/GemsContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Statement {
  text: string;
  isTrue: boolean;
  explanation: string;
}

interface TrueFalseSprintProps {
  topic: string;
  grade: string;
  limit?: number;
  onPlayAgain?: () => void;
  onExit?: () => void;
  onComplete?: (score: number, total: number) => void;
}

export const TrueFalseSprint = ({ topic, grade, limit = 10, onPlayAgain, onExit, onComplete }: TrueFalseSprintProps) => {
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'finished'>('idle');
  const [statements, setStatements] = useState<Statement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateGame = React.useCallback(async () => {
    if (!topic) return;
    setGameState('loading');
    setError(null);
    try {
      const randomSeed = Math.floor(Math.random() * 1000000);
      const prompt = `Generate ${limit} unique true or false statements about "${topic}" for ${grade} level. 
      Ensure high variety and avoid repeating statements from previous sessions. 
      Random seed for variety: ${randomSeed}.
      Return as a JSON array of objects with fields: text, isTrue (boolean), explanation.`;

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
                text: { type: Type.STRING },
                isTrue: { type: Type.BOOLEAN },
                explanation: { type: Type.STRING },
              },
              required: ["text", "isTrue", "explanation"],
            },
          },
        },
      });

      const data = JSON.parse(response.text);
      setStatements(data.sort(() => Math.random() - 0.5));
      setGameState('playing');
      setCurrentIndex(0);
      setScore(0);
      setTimeLeft(30);
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
    if (gameState === 'playing' && timeLeft > 0 && !feedback) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      setGameState('finished');
      if (onComplete) {
        onComplete(score, statements.length);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft, feedback]);

  const handleAnswer = React.useCallback((answer: boolean) => {
    if (feedback) return;
    const current = statements[currentIndex];
    if (current.isTrue === answer) {
      setScore(prev => prev + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
  }, [feedback, statements, currentIndex]);

  const handleNext = React.useCallback(() => {
    setFeedback(null);
    if (currentIndex < statements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setGameState('finished');
      if (onComplete) {
        onComplete(score, statements.length);
      }
    }
  }, [currentIndex, statements.length, score, onComplete]);

  const playAgain = () => {
    setTimeLeft(30);
    setGameState('idle');
  };

  if (gameState === 'idle') {
    return (
      <div className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 text-center space-y-8">
        <div className="w-20 h-20 bg-beige-100 rounded-2xl flex items-center justify-center mx-auto">
          <Timer className="w-10 h-10 text-beige-400" />
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-serif font-bold text-beige-900">True/False Sprint</h3>
          <p className="text-beige-600 max-w-md mx-auto">
            Race against the clock! Decipher if the statements are true or false as fast as you can.
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
          <span className="relative z-10">Start Sprint</span>
        </button>
      </div>
    );
  }

  if (gameState === 'loading' || statements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8">
        <Loader2 className="w-16 h-16 text-beige-400 animate-spin" />
        <div className="text-center space-y-4">
          <p className="text-beige-600 font-bold uppercase tracking-widest animate-pulse">
            {gameState === 'loading' ? "Preparing the sprint..." : "Generating statements..."}
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
          <h3 className="text-4xl font-serif font-bold text-beige-900">Sprint Finished!</h3>
          <p className="text-beige-600 text-xl">You scored <span className="text-beige-900 font-bold">{score}</span> points!</p>
          <div className="flex items-center justify-center gap-2 text-beige-500 font-bold uppercase tracking-widest text-xs">
            <Sparkles className="w-4 h-4 text-beige-400" />
            +5 Gems & +10 XP
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

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center gap-2 text-beige-800 font-bold">
          <Timer className={cn("w-5 h-5", timeLeft < 10 ? "text-red-500 animate-pulse" : "text-beige-400")} />
          <span className={cn("text-xl tabular-nums", timeLeft < 10 && "text-red-500")}>{timeLeft}s</span>
        </div>
        <div className="px-4 py-2 bg-beige-800 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
          Score: {score}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            "bg-white/80 backdrop-blur-md p-12 rounded-[40px] border-2 text-center shadow-xl transition-all duration-300 min-h-[250px] flex flex-col justify-center",
            feedback === 'correct' ? "border-green-500 bg-green-50" :
            feedback === 'wrong' ? "border-red-500 bg-red-50" :
            "border-beige-200"
          )}
        >
          <h4 className="text-2xl font-serif font-bold text-beige-900 leading-tight">
            {statements[currentIndex].text}
          </h4>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4"
            >
              <div className={cn(
                "font-bold uppercase tracking-widest text-sm",
                feedback === 'correct' ? "text-green-600" : "text-red-600"
              )}>
                {feedback === 'correct' ? 'Correct!' : `Incorrect! The correct answer was ${statements[currentIndex].isTrue ? 'True' : 'False'}.`}
              </div>
              <p className="text-beige-600 text-sm italic leading-relaxed">
                {statements[currentIndex].explanation}
              </p>
              <button
                onClick={handleNext}
                className="w-full py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all flex items-center justify-center gap-2"
              >
                Next Statement
                <Play className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {!feedback && (
        <div className="grid grid-cols-2 gap-6">
          <button
            onClick={() => handleAnswer(true)}
            className="p-8 bg-green-600 text-white rounded-[32px] font-bold uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl hover:scale-105 active:scale-95"
          >
            True
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="p-8 bg-red-600 text-white rounded-[32px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl hover:scale-105 active:scale-95"
          >
            False
          </button>
        </div>
      )}
    </div>
  );
};
