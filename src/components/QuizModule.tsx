import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Trophy, ArrowRight, RotateCcw, Timer, AlertCircle, Loader2, Brain, X } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { cn } from '@/src/lib/utils';

import { useGems } from '../contexts/GemsContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const Star4 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 0L13.5 10.5L24 12L13.5 13.5L12 24L10.5 13.5L0 12L10.5 10.5L12 0Z" fill="currentColor" />
  </svg>
);

interface Question {
  id: number;
  question: string;
  type: 'analytical' | 'theoretical' | 'practical';
  format: 'mcq' | 'fill-in-the-blanks' | 'long-answer' | 'short-answer' | 'one-word' | 'match-the-following';
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  topic_tag: string;
}

const QUESTIONS: Question[] = [];

interface QuizModuleProps {
  customQuestions?: Question[] | null;
  topic?: string;
  limit?: number;
  onComplete?: (score: number, total: number) => void;
  onExit?: () => void;
  onPlayAgain?: () => void;
}

export const QuizModule = ({ customQuestions, topic, limit = 5, onComplete, onExit, onPlayAgain }: QuizModuleProps) => {
  const [questions, setQuestions] = useState<Question[]>(customQuestions || QUESTIONS);
  const [currentStep, setCurrentStep] = useState<'start' | 'quiz' | 'result'>('start');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ id: number; isCorrect: boolean; topic: string }[]>([]);

  const { recordActivity } = useGems();

  const fetchQuestions = React.useCallback(async () => {
    if (!topic) return;
    setIsLoading(true);
    try {
      const randomSeed = Math.floor(Math.random() * 1000000);
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate ${limit} unique and challenging quiz questions for a student about "${topic}". 
        Ensure high variety and avoid repeating concepts from previous sessions. 
        Include a mix of MCQ and short answer formats.
        Random seed for variety: ${randomSeed}.
        For each question, provide: question text, type (analytical/theoretical/practical), format (mcq/short-answer), options (if mcq), correctAnswer (index for mcq, string for short-answer), explanation, and topic_tag.
        Return as a JSON array of objects.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                question: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['analytical', 'theoretical', 'practical'] },
                format: { type: Type.STRING, enum: ['mcq', 'short-answer'] },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                topic_tag: { type: Type.STRING },
              },
              required: ["id", "question", "type", "format", "correctAnswer", "explanation", "topic_tag"],
            },
          },
        },
      });
      const data = JSON.parse(response.text);
      setQuestions(data);
      setCurrentStep('quiz');
    } catch (err) {
      console.error("Quiz Generation Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [topic]);

  useEffect(() => {
    if (customQuestions) {
      setQuestions(customQuestions);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setTextAnswer('');
      setIsAnswered(false);
      setScore(0);
      setResults([]);
      setCurrentStep('quiz');
    }
  }, [customQuestions]);

  const handleStart = React.useCallback(() => {
    if (topic) {
      fetchQuestions();
    } else {
      setCurrentStep('quiz');
    }
  }, [topic, fetchQuestions]);

  const handleOptionSelect = React.useCallback((index: number) => {
    if (isAnswered) return;
    const currentQ = questions[currentQuestionIndex];
    setSelectedOption(index);
    setIsAnswered(true);
    
    const isCorrect = (index === Number(currentQ.correctAnswer)) || 
                     (currentQ.options && String(currentQ.options[index]).toLowerCase().trim() === String(currentQ.correctAnswer).toLowerCase().trim());
    if (isCorrect) setScore(prev => prev + 1);
    
    setResults(prev => [...prev, { id: currentQ.id, isCorrect, topic: currentQ.topic_tag }]);
  }, [isAnswered, questions, currentQuestionIndex]);

  const handleTextSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered) return;
    const currentQ = questions[currentQuestionIndex];
    setIsAnswered(true);

    const isCorrect = textAnswer.toLowerCase().trim() === String(currentQ.correctAnswer).toLowerCase().trim();
    if (isCorrect) setScore(prev => prev + 1);

    setResults(prev => [...prev, { id: currentQ.id, isCorrect, topic: currentQ.topic_tag }]);
  }, [isAnswered, questions, currentQuestionIndex, textAnswer]);

  const handleNext = React.useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setTextAnswer('');
      setIsAnswered(false);
    } else {
      setCurrentStep('result');
      recordActivity();
      if (onComplete) {
        onComplete(score, questions.length);
      }
    }
  }, [currentQuestionIndex, questions.length, onComplete, score]);

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setTextAnswer('');
    setIsAnswered(false);
    setScore(0);
    setResults([]);
    setCurrentStep('start');
  };

  useEffect(() => {
    if (topic && currentStep === 'start') {
      handleStart();
    }
  }, [topic, currentStep, handleStart]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8">
        <motion.div
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8], rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Star4 className="w-20 h-20 text-beige-400" />
        </motion.div>
        <div className="text-center space-y-4">
          <p className="text-beige-600 font-bold uppercase tracking-widest animate-pulse">Preparing your quiz...</p>
          <p className="text-xs text-beige-400 italic">This might take a minute as we craft personalized questions.</p>
          <button 
            onClick={onExit}
            className="px-6 py-2 bg-beige-100 text-beige-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-beige-200 transition-all"
          >
            Cancel & Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto relative">
      {onExit && (
        <button 
          onClick={onExit}
          className="absolute -top-12 right-0 p-2 text-beige-400 hover:text-beige-900 transition-all flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]"
        >
          <X className="w-4 h-4" /> Exit Quiz
        </button>
      )}
      <AnimatePresence mode="wait">
        {currentStep === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8 py-12"
          >
            <div className="w-24 h-24 bg-beige-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-12 h-12 text-beige-800" />
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-serif font-bold text-beige-900">Ready to Master?</h3>
              <p className="text-beige-600 max-w-md mx-auto leading-relaxed">
                We've prepared a personalized quiz based on your {topic ? 'weak spots' : 'selected topic'}. 
                Take your time and focus on the explanations!
              </p>
            </div>
            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <button
                onClick={handleStart}
                className="w-full py-5 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-xl shadow-beige-900/20"
              >
                Start Quiz
              </button>
              <p className="text-[10px] text-beige-400 font-bold uppercase tracking-widest">
                {limit} Questions • No Time Limit
              </p>
            </div>
          </motion.div>
        )}

        {currentStep === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="space-y-10"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-bold text-beige-400 uppercase tracking-widest">Question {currentQuestionIndex + 1} / {questions.length}</span>
                <div className="flex items-center gap-2 text-beige-400">
                  <Timer className="w-4 h-4" />
                  <span className="text-xs font-bold">No Time Limit</span>
                </div>
              </div>
              <div className="h-2 bg-beige-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: questions.length > 0 ? `${((currentQuestionIndex + 1) / questions.length) * 100}%` : '0%' }}
                  className="h-full bg-beige-800"
                />
              </div>
            </div>

            <div className="space-y-8">
              {questions.length > 0 && questions[currentQuestionIndex] ? (
                <>
                  <div className="flex flex-wrap gap-3">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                      questions[currentQuestionIndex].type === 'analytical' ? "bg-blue-50 border-blue-100 text-blue-600" :
                      questions[currentQuestionIndex].type === 'theoretical' ? "bg-amber-50 border-amber-100 text-amber-600" :
                      questions[currentQuestionIndex].type === 'practical' ? "bg-green-50 border-green-100 text-green-600" :
                      "bg-beige-100 border-beige-200 text-beige-600"
                    )}>
                      {questions[currentQuestionIndex].type}
                    </span>
                    <span className="px-4 py-1.5 bg-beige-100 border border-beige-200 text-beige-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {questions[currentQuestionIndex].format?.replace(/-/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-3xl font-serif font-bold text-beige-900 leading-tight">
                    {questions[currentQuestionIndex].question}
                  </h3>

                  {questions[currentQuestionIndex].format === 'mcq' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {questions[currentQuestionIndex].options?.map((option, index) => {
                        const isCorrect = (index === Number(questions[currentQuestionIndex].correctAnswer)) || 
                                         (questions[currentQuestionIndex].options && String(questions[currentQuestionIndex].options[index]).toLowerCase().trim() === String(questions[currentQuestionIndex].correctAnswer).toLowerCase().trim());
                        const isSelected = selectedOption === index;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => handleOptionSelect(index)}
                            disabled={isAnswered}
                            className={cn(
                              "group relative p-6 rounded-3xl border-2 text-left transition-all overflow-hidden",
                              !isAnswered && "bg-white border-beige-100 hover:border-beige-300 hover:shadow-lg",
                              isAnswered && isCorrect && "bg-green-50 border-green-500 text-green-900",
                              isAnswered && isSelected && !isCorrect && "bg-red-50 border-red-500 text-red-900",
                              isAnswered && !isSelected && !isCorrect && "bg-white border-beige-100 opacity-40"
                            )}
                          >
                            <div className="flex items-center justify-between relative z-10">
                              <span className="font-bold text-lg">{option}</span>
                              {isAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                              {isAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-500" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {(questions[currentQuestionIndex].format === 'fill-in-the-blanks' || 
                    questions[currentQuestionIndex].format === 'one-word' || 
                    questions[currentQuestionIndex].format === 'short-answer' ||
                    questions[currentQuestionIndex].format === 'long-answer') && (
                    <form onSubmit={handleTextSubmit} className="space-y-4">
                      <div className="relative">
                        <input
                          type="text"
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                          disabled={isAnswered}
                          placeholder="Type your answer here..."
                          className="w-full px-8 py-6 bg-white border-2 border-beige-100 rounded-3xl text-xl font-medium focus:border-beige-800 outline-none transition-all pr-24"
                        />
                        {!isAnswered && (
                          <button
                            type="submit"
                            className="absolute right-3 top-3 bottom-3 px-6 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-beige-900 transition-all"
                          >
                            Submit
                          </button>
                        )}
                      </div>
                      {isAnswered && (
                        <div className="p-6 bg-beige-50 rounded-3xl border border-beige-100">
                          <p className="text-xs font-bold text-beige-400 uppercase tracking-widest mb-2">Correct Answer:</p>
                          {questions[currentQuestionIndex].format === 'long-answer' ? (
                            <p className="text-beige-900 leading-relaxed italic">The AI will evaluate this based on the explanation below.</p>
                          ) : (
                            <p className="font-bold text-beige-900">{questions[currentQuestionIndex].correctAnswer}</p>
                          )}
                        </div>
                      )}
                    </form>
                  )}

                  {questions[currentQuestionIndex].format === 'match-the-following' && (
                    <div className="space-y-4">
                      <p className="text-sm text-beige-400 font-medium italic">Match the following items correctly:</p>
                      <div className="grid grid-cols-1 gap-3">
                        {questions[currentQuestionIndex].options?.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleOptionSelect(index)}
                            disabled={isAnswered}
                            className={cn(
                              "p-6 rounded-2xl border-2 text-left font-medium transition-all flex items-center justify-between",
                              !isAnswered && "bg-white border-beige-100 hover:border-beige-300",
                              isAnswered && index === Number(questions[currentQuestionIndex].correctAnswer) && "bg-beige-100 border-beige-500 text-beige-900",
                              isAnswered && selectedOption === index && index !== Number(questions[currentQuestionIndex].correctAnswer) && "bg-red-50 border-red-200 text-red-900"
                            )}
                          >
                            <span>{option}</span>
                            {isAnswered && index === Number(questions[currentQuestionIndex].correctAnswer) && <CheckCircle2 className="w-6 h-6 text-beige-800" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {isAnswered && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4"
                      >
                        <div className={cn(
                          "p-4 rounded-2xl text-center font-bold uppercase tracking-widest text-xs border",
                          results[results.length - 1]?.isCorrect ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                        )}>
                          {results[results.length - 1]?.isCorrect ? "Correct! Well done." : "Incorrect. See the explanation below."}
                        </div>
                        <div className="p-6 bg-beige-50 rounded-3xl border border-beige-200">
                          <p className="text-sm text-beige-700 leading-relaxed">
                            <span className="font-bold text-beige-900 block mb-1 uppercase tracking-widest text-xs">Explanation:</span>
                            {questions[currentQuestionIndex].explanation}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="w-8 h-8 text-beige-400 animate-spin" />
                  <p className="text-beige-600 font-bold uppercase tracking-widest">Loading Question...</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                disabled={!isAnswered}
                className="group relative flex items-center gap-3 px-10 py-5 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 disabled:opacity-30 transition-all shadow-xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-sheen opacity-30 pointer-events-none" />
                <span className="relative z-10">{currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next Question'}</span>
                <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 text-center space-y-10 shadow-xl shadow-beige-900/5"
          >
            <div className="relative inline-block">
              <div className="w-40 h-40 bg-beige-100 rounded-full flex items-center justify-center mx-auto border border-beige-200">
                <Trophy className="w-20 h-20 text-beige-400" />
              </div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-6 border-2 border-dashed border-beige-200 rounded-full"
              />
              <Star4 className="absolute -top-4 -right-4 w-12 h-12 text-beige-500 animate-soft-fade" />
            </div>

            <div className="space-y-4">
              <h3 className="text-5xl font-serif font-bold text-beige-900">Quiz Complete!</h3>
              <p className="text-beige-600 text-xl">You scored <span className="text-beige-900 font-bold">{score}</span> out of <span className="text-beige-900 font-bold">{questions.length}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
              <div className="p-8 bg-beige-50 rounded-[32px] border border-beige-200 shadow-sm">
                <div className="text-4xl font-serif font-bold text-beige-900">{Math.round((score / questions.length) * 100)}%</div>
                <div className="text-xs text-beige-400 uppercase font-bold tracking-widest mt-1">Accuracy</div>
              </div>
              <div className="p-8 bg-beige-50 rounded-[32px] border border-beige-200 shadow-sm">
                <div className="text-4xl font-serif font-bold text-beige-900">{questions.length}</div>
                <div className="text-xs text-beige-400 uppercase font-bold tracking-widest mt-1">Questions</div>
              </div>
            </div>

            <div className="flex flex-col gap-4 max-w-md mx-auto">
              <button
                onClick={onPlayAgain || handleReset}
                className="group relative flex items-center justify-center gap-3 px-12 py-5 bg-white border-2 border-beige-200 text-beige-900 rounded-2xl font-bold text-lg uppercase tracking-widest hover:bg-beige-50 transition-all shadow-sm overflow-hidden"
              >
                <RotateCcw className="w-6 h-6" />
                <span>Try Again</span>
              </button>
              <button
                onClick={onExit || (() => window.location.reload())}
                className="group relative flex items-center justify-center gap-3 px-12 py-5 bg-beige-800 text-white rounded-2xl font-bold text-lg uppercase tracking-widest hover:bg-beige-900 transition-all shadow-xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-sheen opacity-30 pointer-events-none" />
                <span>Finish</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
