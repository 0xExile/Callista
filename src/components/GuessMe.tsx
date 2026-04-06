import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, CheckCircle2, XCircle, ArrowRight, RefreshCw, Loader2, HelpCircle } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { cn } from '@/src/lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface GuessMeProps {
  topic: string;
  grade?: string;
  limit?: number;
  onPlayAgain?: () => void;
  onExit?: () => void;
  onComplete?: (score: number, total: number) => void;
}

interface PuzzleItem {
  puzzle: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const GuessMe: React.FC<GuessMeProps> = ({ topic, grade = 'Grade 10', limit = 5, onPlayAgain, onExit, onComplete }) => {
  const [puzzles, setPuzzles] = useState<PuzzleItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPuzzles = React.useCallback(async () => {
    setIsGenerating(true);
    setGameState('playing');
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setFeedback(null);
    setError(null);

    try {
      const randomSeed = Math.floor(Math.random() * 1000000);
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate ${limit} unique logic puzzles or riddles for ${grade} level related to "${topic}". 
        Ensure high variety and avoid repeating puzzles from previous sessions. 
        Random seed for variety: ${randomSeed}.
        For each puzzle, provide the puzzle text, 4 multiple-choice options, the index of the correct answer (0-3), and a short explanation. 
        Return as a JSON array of objects with fields: puzzle (string), options (array of 4 strings), correctAnswer (number), explanation (string).`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                puzzle: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ["puzzle", "options", "correctAnswer", "explanation"],
            },
          },
        },
      });
      const data = JSON.parse(response.text);
      setPuzzles(data);
    } catch (err) {
      console.error("Guess Me Error:", err);
      setError("Failed to generate puzzles. Please try again.");
      setGameState('idle');
    } finally {
      setIsGenerating(false);
    }
  }, [topic, grade]);

  useEffect(() => {
    if (topic && gameState === 'idle') {
      fetchPuzzles();
    }
  }, [topic, gameState, fetchPuzzles]);

  const handleOptionClick = React.useCallback((index: number) => {
    if (feedback !== null) return;
    setSelectedOption(index);
    
    const isCorrect = index === puzzles[currentIndex].correctAnswer;
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    // Remove automatic progression
    // setTimeout(() => {
    //   setFeedback(null);
    //   setSelectedOption(null);
    //   if (currentIndex < puzzles.length - 1) {
    //     setCurrentIndex(i => i + 1);
    //   } else {
    //     setGameState('finished');
    //   }
    // }, 2000);
  }, [feedback, puzzles, currentIndex]);

  const handleNext = React.useCallback(() => {
    setFeedback(null);
    setSelectedOption(null);
    if (currentIndex < puzzles.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setGameState('finished');
      if (onComplete) {
        onComplete(score, puzzles.length);
      }
    }
  }, [currentIndex, puzzles.length, score, onComplete]);

  if (gameState === 'idle') {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-12 rounded-[40px] border border-beige-200 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-beige-100 rounded-3xl flex items-center justify-center mx-auto">
          <Brain className="w-10 h-10 text-beige-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-serif font-bold text-beige-900">Guess Me</h3>
          <p className="text-beige-600 max-w-md mx-auto">
            Solve logic puzzles and riddles related to <strong>{topic || 'your topic'}</strong> for <strong>{grade}</strong> level.
          </p>
          {!topic.trim() && (
            <p className="text-xs text-red-500 font-bold uppercase tracking-widest mt-2">Please enter a topic in the generator above first!</p>
          )}
          {error && (
            <p className="text-xs text-red-500 font-bold uppercase tracking-widest mt-2">{error}</p>
          )}
        </div>
        <button
          onClick={fetchPuzzles}
          disabled={!topic.trim() || isGenerating}
          className="px-10 py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
          {isGenerating ? 'Preparing...' : 'Start Guessing'}
        </button>
      </div>
    );
  }

  if (isGenerating || puzzles.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-20 rounded-[40px] border border-beige-200 shadow-xl text-center space-y-6">
        <Loader2 className="w-12 h-12 text-beige-400 animate-spin mx-auto" />
        <div className="text-center space-y-4">
          <p className="text-beige-600 font-medium animate-pulse">
            {isGenerating ? "Preparing your puzzles..." : "Generating puzzles..."}
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

  if (gameState === 'finished' || !puzzles[currentIndex]) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-12 rounded-[40px] border border-beige-200 shadow-xl text-center space-y-8">
        <div className="space-y-4">
          <div className="text-6xl">🧩</div>
          <h3 className="text-3xl font-serif font-bold text-beige-900">Puzzles Solved!</h3>
          <p className="text-beige-600">
            You solved {score} out of {puzzles.length} puzzles correctly.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={onPlayAgain}
            className="px-8 py-3 border-2 border-beige-200 text-beige-600 rounded-xl font-bold uppercase tracking-widest hover:bg-beige-50 transition-all"
          >
            Back to Hub
          </button>
          <button
            onClick={fetchPuzzles}
            className="px-8 py-3 bg-beige-800 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentPuzzle = puzzles[currentIndex];

  return (
    <div className="max-w-3xl mx-auto bg-white/60 backdrop-blur-sm p-10 rounded-[40px] border border-beige-200 shadow-xl space-y-8">
      <div className="flex justify-between items-center">
        <span className="px-4 py-1.5 bg-beige-100 text-beige-600 rounded-full text-xs font-bold uppercase tracking-widest">
          Puzzle {currentIndex + 1} of {puzzles.length}
        </span>
        <span className="text-sm font-bold text-beige-400">Score: {score}</span>
      </div>

      <div className="space-y-8">
        <div className="bg-beige-50 p-8 rounded-3xl border border-beige-100 relative">
          <HelpCircle className="absolute -top-4 -left-4 w-10 h-10 text-beige-200" />
          <p className="text-xl font-serif font-bold text-beige-900 leading-relaxed text-center">
            {currentPuzzle.puzzle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentPuzzle.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionClick(index)}
              disabled={feedback !== null}
              className={cn(
                "p-6 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between group",
                selectedOption === index ? (
                  index === currentPuzzle.correctAnswer 
                    ? "bg-green-50 border-green-500 text-green-700" 
                    : "bg-red-50 border-red-500 text-red-700"
                ) : (
                  feedback !== null && index === currentPuzzle.correctAnswer
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "bg-white border-beige-100 text-beige-600 hover:border-beige-300 hover:bg-beige-50"
                )
              )}
            >
              <span>{option}</span>
              {selectedOption === index && (
                index === currentPuzzle.correctAnswer 
                  ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                  : <XCircle className="w-6 h-6 text-red-500" />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className={cn(
                "p-6 rounded-2xl border text-sm font-medium leading-relaxed",
                feedback === 'correct' ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"
              )}>
                <p className="font-bold mb-1 uppercase tracking-widest text-xs">
                  {feedback === 'correct' ? 'Correct!' : 'Not quite...'}
                </p>
                {currentPuzzle.explanation}
              </div>
              <button
                onClick={handleNext}
                className="w-full py-4 bg-beige-800 text-white rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                {currentIndex === puzzles.length - 1 ? 'Finish' : 'Next Puzzle'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
