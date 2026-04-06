import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, Trophy, ArrowRight, CheckCircle2, XCircle, AlertCircle, Check, X } from 'lucide-react';
import { useGems } from '../contexts/GemsContext';

const Star4 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 0L13.5 10.5L24 12L13.5 13.5L12 24L10.5 13.5L0 12L10.5 10.5L12 0Z" fill="currentColor" />
  </svg>
);
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { cn } from '../lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Question {
  question: string;
  type: string;
  format: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  topic_tag: string;
}

export const SurpriseQuiz = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [step, setStep] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [showAnswer, setShowAnswer] = useState(false);
  const { addGems, addXP } = useGems();

  useEffect(() => {
    const weakSpots = JSON.parse(localStorage.getItem('weakSpots') || '[]');
    const hasSeenSurprise = sessionStorage.getItem('hasSeenSurprise');
    
    if (weakSpots.length > 0 && !hasSeenSurprise) {
      setIsOpen(true);
      sessionStorage.setItem('hasSeenSurprise', 'true');
    }
  }, []);

  const generateSurpriseQuiz = async () => {
    setIsLoading(true);
    const weakSpots = JSON.parse(localStorage.getItem('weakSpots') || '[]');
    const grade = localStorage.getItem('userGrade') || 'Grade 10';
    const topics = weakSpots.join(', ');

    try {
      const randomSeed = Math.floor(Math.random() * 1000000);
      const prompt = `Generate a 5-question surprise quiz for ${grade} level focusing on these weak spots: ${topics}.
      Ensure high variety and avoid repeating concepts/statements/puzzles/clues from previous sessions.
      Random seed for variety: ${randomSeed}.
      Include a mix of analytical, theoretical, and practical questions.
      Use various formats: mcq, fill-in-the-blanks, one-word, short-answer, flashcard.
      
      For each question, return a JSON object with:
      - question (string)
      - type (analytical, theoretical, practical)
      - format (mcq, fill-in-the-blanks, one-word, short-answer, flashcard)
      - options (array of strings, only for mcq)
      - correctAnswer (string or number index)
      - explanation (string)
      - topic_tag (string: the specific weak spot this addresses)
      
      Return as a JSON array.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                type: { type: Type.STRING },
                format: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                topic_tag: { type: Type.STRING },
              },
              required: ["question", "type", "format", "correctAnswer", "explanation", "topic_tag"],
            },
          },
        },
      });

      const data = JSON.parse(response.text);
      setQuestions(data);
      setStep('quiz');
    } catch (error) {
      console.error("Error generating surprise quiz:", error);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    const currentQ = questions[currentIndex];
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === Number(currentQ.correctAnswer)) setScore(s => s + 1);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered) return;
    const currentQ = questions[currentIndex];
    setIsAnswered(true);
    if (textAnswer.toLowerCase().trim() === String(currentQ.correctAnswer).toLowerCase().trim()) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setTextAnswer('');
      setIsAnswered(false);
      setShowAnswer(false);
    } else {
      setStep('result');
      addGems(score);
      addXP(score * 10);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-beige-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl border border-beige-200 overflow-hidden relative"
      >
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 p-2 hover:bg-beige-50 rounded-full transition-colors z-10"
        >
          <X className="w-6 h-6 text-beige-400" />
        </button>

        <div className="p-10">
          <AnimatePresence mode="wait">
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-8"
              >
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-beige-100 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="w-12 h-12 text-beige-500 animate-pulse" />
                  </div>
                  <Star4 className="absolute -top-2 -right-2 w-8 h-8 text-beige-400" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl font-serif font-bold text-beige-900">Surprise Quiz!</h2>
                  <p className="text-beige-600 font-medium">We noticed some areas where you could improve. Ready to tackle them?</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {JSON.parse(localStorage.getItem('weakSpots') || '[]').map((spot: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-beige-50 border border-beige-100 text-beige-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {spot}
                    </span>
                  ))}
                </div>
                <button
                  onClick={generateSurpriseQuiz}
                  disabled={isLoading}
                  className="w-full py-5 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-xl disabled:opacity-50"
                >
                  {isLoading ? 'Generating...' : 'Accept Challenge'}
                </button>
              </motion.div>
            )}

            {step === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-beige-400 uppercase tracking-widest">Question {currentIndex + 1} / {questions.length}</span>
                  <div className="h-2 w-32 bg-beige-100 rounded-full overflow-hidden">
                    <div className="h-full bg-beige-800 transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 bg-beige-50 border border-beige-100 text-beige-500 rounded text-[10px] font-bold uppercase tracking-widest">
                      {questions[currentIndex].type} • {questions[currentIndex].format.replace(/-/g, ' ')}
                    </span>
                    <h3 className="text-2xl font-serif font-bold text-beige-900 leading-tight">
                      {questions[currentIndex].question}
                    </h3>
                  </div>

                  {questions[currentIndex].format === 'mcq' ? (
                    <div className="grid gap-3">
                      {questions[currentIndex].options?.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleOptionSelect(i)}
                          disabled={isAnswered}
                          className={cn(
                            "p-4 rounded-2xl border-2 text-left transition-all",
                            !isAnswered && "border-beige-100 hover:border-beige-400 bg-beige-50",
                            isAnswered && i === Number(questions[currentIndex].correctAnswer) && "border-beige-500 bg-beige-100",
                            isAnswered && selectedOption === i && i !== Number(questions[currentIndex].correctAnswer) && "border-red-200 bg-red-50"
                          )}
                        >
                          <span className="font-bold">{opt}</span>
                        </button>
                      ))}
                    </div>
                  ) : questions[currentIndex].format === 'flashcard' ? (
                    <div className="space-y-6">
                      <AnimatePresence mode="wait">
                        {!showAnswer ? (
                          <motion.div
                            key="question"
                            initial={{ opacity: 0, rotateY: -90 }}
                            animate={{ opacity: 1, rotateY: 0 }}
                            exit={{ opacity: 0, rotateY: 90 }}
                            className="p-12 bg-beige-50 rounded-[32px] border-2 border-beige-100 flex items-center justify-center text-center min-h-[200px]"
                          >
                            <p className="text-xl font-serif font-bold text-beige-900">{questions[currentIndex].question}</p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="answer"
                            initial={{ opacity: 0, rotateY: 90 }}
                            animate={{ opacity: 1, rotateY: 0 }}
                            exit={{ opacity: 0, rotateY: -90 }}
                            className="p-12 bg-beige-800 rounded-[32px] border-2 border-beige-900 flex items-center justify-center text-center min-h-[200px]"
                          >
                            <p className="text-xl font-serif font-bold text-white">{questions[currentIndex].correctAnswer}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {!showAnswer ? (
                        <button
                          onClick={() => setShowAnswer(true)}
                          className="w-full py-4 bg-beige-800 text-white rounded-xl font-bold uppercase tracking-widest"
                        >
                          Show Answer
                        </button>
                      ) : !isAnswered ? (
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => {
                              setIsAnswered(true);
                              setScore(s => s + 1);
                            }}
                            className="py-4 bg-green-500 text-white rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <Check className="w-5 h-5" /> Correct
                          </button>
                          <button
                            onClick={() => setIsAnswered(true)}
                            className="py-4 bg-red-500 text-white rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <X className="w-5 h-5" /> Wrong
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <form onSubmit={handleTextSubmit} className="space-y-4">
                      <input
                        type="text"
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        disabled={isAnswered}
                        placeholder="Your answer..."
                        className="w-full p-4 bg-beige-50 border-2 border-beige-100 rounded-2xl focus:border-beige-400 outline-none font-bold"
                      />
                      {!isAnswered && (
                        <button type="submit" className="w-full py-4 bg-beige-800 text-white rounded-xl font-bold uppercase tracking-widest">Submit</button>
                      )}
                    </form>
                  )}

                  {isAnswered && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-beige-50 rounded-2xl border border-beige-100">
                      <p className="text-xs text-beige-700 leading-relaxed">
                        <span className="font-bold text-beige-900 block mb-1 uppercase tracking-widest text-[10px]">Explanation:</span>
                        {questions[currentIndex].explanation}
                      </p>
                    </motion.div>
                  )}

                  {isAnswered && (
                    <button
                      onClick={handleNext}
                      className="w-full py-4 bg-beige-800 text-white rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'result' && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-8"
              >
                <Trophy className="w-20 h-20 text-beige-400 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-3xl font-serif font-bold text-beige-900">Well Done!</h3>
                  <p className="text-beige-600">You scored {score} out of {questions.length} on your weak spots.</p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setStep('intro');
                      setCurrentIndex(0);
                      setScore(0);
                      setQuestions([]);
                      setSelectedOption(null);
                      setTextAnswer('');
                      setIsAnswered(false);
                      setShowAnswer(false);
                    }}
                    className="w-full py-5 bg-beige-100 text-beige-800 rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-200 transition-all"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-5 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-xl"
                  >
                    Continue Learning
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
