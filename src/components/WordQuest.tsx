import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, XCircle, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { cn } from '@/src/lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface WordQuestProps {
  topic: string;
  grade?: string;
  limit?: number;
  onPlayAgain?: () => void;
  onExit?: () => void;
  onComplete?: (score: number, total: number) => void;
}

interface WordItem {
  scrambled: string;
  original: string;
  hint: string;
  explanation: string;
}

export const WordQuest: React.FC<WordQuestProps> = ({ topic, grade = 'Grade 10', limit = 5, onPlayAgain, onExit, onComplete }) => {
  const [words, setWords] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWords = React.useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGameState('playing');
    setCurrentIndex(0);
    setScore(0);
    setFeedback(null);
    setError(null);

    try {
      const randomSeed = Math.floor(Math.random() * 1000000);
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate ${limit} unique and creative key terms for ${grade} level related to "${topic}" for a word unscramble game. 
        Ensure high variety and avoid repeating terms from previous sessions. 
        Random seed for variety: ${randomSeed}.
        For each term, provide the original word, a scrambled version, a short hint, and a brief explanation of the term. 
        Return as a JSON array of objects with fields: original (string), scrambled (string), hint (string), explanation (string).`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING },
                scrambled: { type: Type.STRING },
                hint: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ["original", "scrambled", "hint", "explanation"],
            },
          },
        },
      });
      const data = JSON.parse(response.text);
      setWords(data);
    } catch (err) {
      console.error("Word Quest Error:", err);
      setError("Failed to generate words. Please try again.");
      setGameState('idle');
    } finally {
      setIsGenerating(false);
    }
  }, [topic, grade]);

  useEffect(() => {
    if (topic.trim() && gameState === 'idle' && !isGenerating && !error) {
      fetchWords();
    }
  }, [topic, gameState, isGenerating, error, fetchWords]);

  const handleSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (feedback) return;

    const isCorrect = userInput.toLowerCase().trim() === words[currentIndex].original.toLowerCase().trim();
    
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
  }, [userInput, feedback, words, currentIndex]);

  const handleNext = React.useCallback(() => {
    setFeedback(null);
    setUserInput('');
    if (currentIndex < words.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setGameState('finished');
      if (onComplete) {
        onComplete(score, words.length);
      }
    }
  }, [currentIndex, words.length, score, onComplete]);


  if (isGenerating || words.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-20 rounded-[40px] border border-beige-200 shadow-xl text-center space-y-6">
        <Loader2 className="w-12 h-12 text-beige-400 animate-spin mx-auto" />
        <p className="text-beige-600 font-medium animate-pulse">
          {isGenerating ? "Preparing your word quest..." : "Generating words..."}
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
    );
  }

  if (gameState === 'finished' || !words[currentIndex]) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-12 rounded-[40px] border border-beige-200 shadow-xl text-center space-y-8">
        <div className="space-y-4">
          <div className="text-6xl">🏆</div>
          <h3 className="text-3xl font-serif font-bold text-beige-900">Quest Complete!</h3>
          <p className="text-beige-600">
            You unscrambled {score} out of {words.length} words correctly.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={onPlayAgain}
            className="px-8 py-3 border-2 border-beige-200 text-beige-600 rounded-xl font-bold uppercase tracking-widest hover:bg-beige-50 transition-all"
          >
            Change Topic
          </button>
          <button
            onClick={fetchWords}
            className="px-8 py-3 bg-beige-800 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-md"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  if (!currentWord) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-20 rounded-[40px] border border-beige-200 shadow-xl text-center space-y-6">
        <Loader2 className="w-12 h-12 text-beige-400 animate-spin mx-auto" />
        <p className="text-beige-600 font-medium animate-pulse">Loading next word...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white/60 backdrop-blur-sm p-10 rounded-[40px] border border-beige-200 shadow-xl space-y-8">
      <div className="flex justify-between items-center">
        <span className="px-4 py-1.5 bg-beige-100 text-beige-600 rounded-full text-xs font-bold uppercase tracking-widest">
          Word {currentIndex + 1} of {words.length}
        </span>
        <span className="text-sm font-bold text-beige-400">Score: {score}</span>
      </div>

      <div className="text-center space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-bold text-beige-400 uppercase tracking-[0.2em]">Unscramble this:</p>
          <h2 className="text-5xl font-serif font-bold text-beige-900 tracking-widest uppercase">
            {currentWord.scrambled}
          </h2>
        </div>

        <div className="p-4 bg-beige-50 rounded-2xl border border-beige-100 italic text-beige-600 text-sm">
          " {currentWord.hint} "
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              autoFocus
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your answer..."
              disabled={!!feedback}
              className={cn(
                "w-full px-6 py-4 bg-white border-2 rounded-2xl text-center text-xl font-bold focus:outline-none transition-all",
                feedback === 'correct' ? "border-green-500 bg-green-50 text-green-700" :
                feedback === 'wrong' ? "border-red-500 bg-red-50 text-red-700" :
                "border-beige-200 focus:border-beige-400"
              )}
            />
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {feedback === 'correct' ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div className={cn(
                  "p-4 rounded-2xl text-center font-bold uppercase tracking-widest text-xs border",
                  feedback === 'correct' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                )}>
                  {feedback === 'correct' ? "Correct! Well done." : `Incorrect. The correct word is: ${currentWord.original}`}
                </div>
                <div className="p-6 bg-beige-50 rounded-3xl border border-beige-200 text-left">
                  <p className="text-sm text-beige-700 leading-relaxed">
                    <span className="font-bold text-beige-900 block mb-1 uppercase tracking-widest text-xs">Explanation:</span>
                    {currentWord.explanation}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {currentIndex === words.length - 1 ? 'Finish Quest' : 'Next Word'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!feedback && (
            <button
              type="submit"
              disabled={!userInput.trim()}
              className="w-full py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-lg disabled:opacity-50"
            >
              Submit Answer
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
