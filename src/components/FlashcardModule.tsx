import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Layout, Save, X, Rotate3d, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const Star4 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 0L13.5 10.5L24 12L13.5 13.5L12 24L10.5 13.5L0 12L10.5 10.5L12 0Z" fill="currentColor" />
  </svg>
);

interface Flashcard {
  id: string;
  front: string;
  back: string;
  explanation?: string;
}

interface FlashcardModuleProps {
  customFlashcards?: Flashcard[] | null;
  onPlayAgain?: () => void;
  onExit?: () => void;
}

export const FlashcardModule = ({ customFlashcards, onPlayAgain, onExit }: FlashcardModuleProps) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  // Update flashcards when customFlashcards change
  React.useEffect(() => {
    if (customFlashcards && customFlashcards.length > 0) {
      setFlashcards(customFlashcards);
      setCurrentCard(0);
      setIsFlipped(false);
    }
  }, [customFlashcards]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userSelection, setUserSelection] = useState<'correct' | 'incorrect' | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  const handleCreate = React.useCallback(() => {
    if (!newFront.trim() || !newBack.trim()) return;
    const newCard: Flashcard = {
      id: Date.now().toString(),
      front: newFront,
      back: newBack,
    };
    setFlashcards([...flashcards, newCard]);
    setNewFront('');
    setNewBack('');
    setIsCreating(false);
  }, [newFront, newBack, flashcards]);

  const handleDelete = React.useCallback((id: string) => {
    const updated = flashcards.filter(c => c.id !== id);
    setFlashcards(updated);
    if (currentCard >= updated.length) {
      setCurrentCard(Math.max(0, updated.length - 1));
    }
  }, [flashcards, currentCard]);

  const handleSelect = React.useCallback((isCorrect: boolean) => {
    setIsAnswered(true);
    setUserSelection(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) setCorrectCount(prev => prev + 1);
    else setIncorrectCount(prev => prev + 1);
  }, []);

  const handleNext = React.useCallback(() => {
    if (!isAnswered) return;

    if (currentCard < flashcards.length - 1) {
      setIsFlipped(false);
      setIsAnswered(false);
      setUserSelection(null);
      // Wait for the flip animation to be halfway (card is vertical) before changing content
      setTimeout(() => {
        setCurrentCard(prev => prev + 1);
      }, 200);
    } else {
      setIsFinished(true);
    }
  }, [isAnswered, currentCard, flashcards.length]);

  const handleManualNext = React.useCallback(() => {
    if (isAnswered) {
      handleNext();
    }
  }, [isAnswered, handleNext]);

  const handleManualPrev = React.useCallback(() => {
    if (currentCard > 0) {
      setIsFlipped(false);
      setIsAnswered(false);
      setUserSelection(null);
      // Wait for the flip animation to be halfway (card is vertical) before changing content
      setTimeout(() => {
        setCurrentCard(prev => prev - 1);
      }, 200);
    }
  }, [currentCard]);

  const resetQuiz = React.useCallback(() => {
    setCurrentCard(0);
    setIsFlipped(false);
    setIsFinished(false);
    setCorrectCount(0);
    setIncorrectCount(0);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8">
        <motion.div
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8], rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Star4 className="w-20 h-20 text-beige-400" />
        </motion.div>
        <p className="text-beige-600 font-bold uppercase tracking-widest animate-pulse">Creating your card...</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto bg-white/60 backdrop-blur-md p-12 rounded-[48px] border border-beige-200 text-center space-y-8 shadow-2xl"
      >
        <div className="w-24 h-24 bg-beige-100 rounded-full flex items-center justify-center mx-auto">
          <Star4 className="w-12 h-12 text-beige-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-serif font-bold text-beige-900 uppercase tracking-widest">Set Complete!</h3>
          <p className="text-beige-600">Great job reviewing your concepts.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
            <span className="block text-2xl font-bold text-green-600">{correctCount}</span>
            <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Correct</span>
          </div>
          <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
            <span className="block text-2xl font-bold text-red-600">{incorrectCount}</span>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Incorrect</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={onPlayAgain || resetQuiz}
            className="w-full py-5 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-xl"
          >
            Play Again
          </button>
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="w-full py-5 bg-beige-100 text-beige-800 rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-200 transition-all"
            >
              Exit to Topic Selection
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-beige-200 shadow-xl shadow-beige-900/5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-beige-100 rounded-2xl">
            <Layout className="w-6 h-6 text-beige-600" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-beige-900">My Flashcards</h3>
            <p className="text-xs text-beige-400 font-bold uppercase tracking-widest">{flashcards.length} Concepts Mastered</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onExit && (
            <button 
              onClick={onExit}
              className="px-6 py-4 bg-white border border-beige-200 text-beige-600 rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-50 transition-all flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Exit
            </button>
          )}
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-8 py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" /> Create New
          </button>
        </div>
      </div>

      {/* Creation Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/80 backdrop-blur-md p-10 rounded-[40px] border border-beige-200 shadow-2xl space-y-8">
              <div className="flex justify-between items-center">
                <h4 className="text-2xl font-serif font-bold text-beige-900">New Flashcard</h4>
                <button onClick={() => setIsCreating(false)} className="text-beige-300 hover:text-beige-900 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-beige-400 uppercase tracking-widest ml-2">Front Side (Question)</label>
                  <textarea
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                    placeholder="Enter question or term..."
                    className="w-full p-6 bg-beige-50 border border-beige-100 rounded-3xl focus:outline-none focus:border-beige-400 transition-all text-sm min-h-[150px] resize-none font-medium"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-beige-400 uppercase tracking-widest ml-2">Back Side (Answer)</label>
                  <textarea
                    value={newBack}
                    onChange={(e) => setNewBack(e.target.value)}
                    placeholder="Enter answer or definition..."
                    className="w-full p-6 bg-beige-50 border border-beige-100 rounded-3xl focus:outline-none focus:border-beige-400 transition-all text-sm min-h-[150px] resize-none font-medium"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleCreate}
                  disabled={!newFront.trim() || !newBack.trim()}
                  className="group relative flex items-center gap-3 px-10 py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 disabled:opacity-30 transition-all shadow-xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-sheen opacity-30 pointer-events-none" />
                  <Save className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Save Card</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Viewer */}
      {flashcards.length > 0 ? (
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="relative h-[450px] perspective-1000">
            <div 
              onClick={() => !isAnswered && setIsFlipped(!isFlipped)}
              className={cn(
                "w-full h-full relative transition-all duration-700 preserve-3d",
                !isAnswered && "cursor-pointer"
              )}
              style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              {/* Front Side */}
              <div className={cn(
                "absolute inset-0 w-full h-full rounded-[48px] border-2 border-beige-200 flex flex-col items-center justify-center p-12 text-center shadow-2xl backface-hidden bg-white"
              )}>
                <div className="absolute inset-0 bg-sheen opacity-20 pointer-events-none" />
                <Star4 className="absolute top-8 right-8 w-12 h-12 text-beige-100 animate-soft-fade" />
                <Star4 className="absolute bottom-8 left-8 w-8 h-8 text-beige-100 animate-soft-fade delay-300" />
                
                <span className="text-xs font-bold text-beige-400 uppercase tracking-[0.3em] mb-8">
                  The Question
                </span>
                
                <h2 className="text-4xl font-serif font-bold text-beige-900 leading-tight">
                  {flashcards[currentCard].front}
                </h2>
                
                <div className="absolute bottom-12 flex items-center gap-2 text-beige-300 font-bold uppercase tracking-widest text-xs">
                  <Rotate3d className="w-4 h-4" /> Click to flip
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(flashcards[currentCard].id);
                  }}
                  className="absolute top-8 right-8 p-3 text-beige-200 hover:text-red-400 transition-all group-hover:opacity-100"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>

              {/* Back Side */}
              <div className={cn(
                "absolute inset-0 w-full h-full rounded-[48px] border-2 border-beige-200 flex flex-col items-center justify-center p-12 text-center shadow-2xl backface-hidden bg-beige-50 overflow-y-auto"
              )} style={{ transform: 'rotateY(180deg)' }}>
                <div className="absolute inset-0 bg-sheen opacity-20 pointer-events-none" />
                <Star4 className="absolute top-8 right-8 w-12 h-12 text-beige-100 animate-soft-fade" />
                
                <span className="text-xs font-bold text-beige-400 uppercase tracking-[0.3em] mb-4">
                  The Answer
                </span>
                
                <h2 className={cn(
                  "font-serif font-bold text-beige-900 leading-tight transition-all duration-500",
                  isAnswered && userSelection === 'incorrect' ? "text-2xl mb-4" : "text-4xl mb-8"
                )}>
                  {flashcards[currentCard].back}
                </h2>

                <AnimatePresence>
                  {isAnswered && userSelection === 'incorrect' && flashcards[currentCard].explanation && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/80 p-6 rounded-3xl border border-beige-200 space-y-2 max-w-md"
                    >
                      <span className="text-[10px] font-bold text-beige-400 uppercase tracking-widest block">Explanation</span>
                      <p className="text-sm text-beige-600 leading-relaxed italic">
                        {flashcards[currentCard].explanation}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {!isAnswered && (
                  <div className="absolute bottom-6 flex items-center gap-2 text-beige-300 font-bold uppercase tracking-widest text-[10px]">
                    <Rotate3d className="w-3 h-3" /> Click to flip back
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-8">
            <AnimatePresence mode="wait">
              {isFlipped && !isAnswered && (
                <motion.div 
                  key="grading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="grid grid-cols-2 gap-4 w-full max-w-sm"
                >
                  <button
                    onClick={() => handleSelect(true)}
                    className="py-5 bg-green-500 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" /> Correct
                  </button>
                  <button
                    onClick={() => handleSelect(false)}
                    className="py-5 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" /> Incorrect
                  </button>
                </motion.div>
              )}

              {isAnswered && (
                <motion.div
                  key="next-action"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-sm space-y-4"
                >
                  <div className={cn(
                    "p-4 rounded-2xl text-center font-bold uppercase tracking-widest text-xs border",
                    userSelection === 'correct' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                  )}>
                    {userSelection === 'correct' ? "Excellent! You got it right." : "Keep learning! Check the explanation above."}
                  </div>
                  <button
                    onClick={handleNext}
                    className="w-full py-5 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    <span>{currentCard < flashcards.length - 1 ? 'Next Flashcard' : 'Finish Set'}</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between w-full max-w-md mx-auto">
              <button 
                onClick={handleManualPrev}
                disabled={currentCard === 0}
                className="p-5 bg-white rounded-full border border-beige-200 text-beige-400 hover:text-beige-900 hover:border-beige-400 transition-all shadow-lg disabled:opacity-30"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <div className="bg-white/60 backdrop-blur-sm px-8 py-4 rounded-full border border-beige-200 font-serif font-bold text-beige-900 shadow-lg flex flex-col items-center">
                <div className="text-xl">
                  {currentCard + 1} <span className="text-beige-300 mx-1">/</span> {flashcards.length}
                </div>
              </div>
              <button 
                onClick={handleManualNext}
                disabled={!isAnswered || currentCard === flashcards.length - 1}
                className="p-5 bg-white rounded-full border border-beige-200 text-beige-400 hover:text-beige-900 hover:border-beige-400 transition-all shadow-lg disabled:opacity-30"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-32 bg-white/40 rounded-[48px] border-2 border-dashed border-beige-200 shadow-xl shadow-beige-900/5 space-y-6">
          <Layout className="w-20 h-20 text-beige-200 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold text-beige-900">No flashcards yet</h3>
            <p className="text-beige-500">Create your first card to start mastering new concepts!</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-10 py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all"
          >
            Create First Card
          </button>
        </div>
      )}
    </div>
  );
};
