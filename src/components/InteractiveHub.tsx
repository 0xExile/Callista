import React, { useState, useEffect } from 'react';
import { Brain, Gamepad2, Layers, Sparkles, Wand2, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useGems } from '../contexts/GemsContext';
import { QuizModule } from './QuizModule';
import { FlashcardModule } from './FlashcardModule';
import { WordQuest } from './WordQuest';
import { LogicMaze } from './LogicMaze';
import { ConceptMatch } from './ConceptMatch';
import { FactSort } from './FactSort';
import { TrueFalseSprint } from './TrueFalseSprint';
import { MemoryMatrix } from './MemoryMatrix';
import { CodeCracker } from './CodeCracker';
import { GuessMe } from './GuessMe';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const Star4 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 0L13.5 10.5L24 12L13.5 13.5L12 24L10.5 13.5L0 12L10.5 10.5L12 0Z" fill="currentColor" />
  </svg>
);

type Tab = 'quizzes' | 'games' | 'flashcards';
type GameType = 
  | 'word-quest' 
  | 'logic-maze' 
  | 'concept-match' 
  | 'fact-sort' 
  | 'true-false-sprint' 
  | 'memory-matrix' 
  | 'code-cracker' 
  | 'guess-me' 
  | null;

interface InteractiveHubProps {
  defaultTab?: 'quizzes' | 'games' | 'flashcards';
}

export const InteractiveHub = ({ defaultTab }: InteractiveHubProps) => {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab || 'flashcards');

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState(() => localStorage.getItem('userGrade') || 'Grade 10');
  const [limit, setLimit] = useState<number | string>(5);
  const safeLimit = Math.min(Number(limit) || 1, 10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any[] | null>(null);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<any[] | null>(null);
  const { addGems, addXP } = useGems();

  const handleStartGame = () => {
    if (!topic.trim()) return;
    setIsGameStarted(true);
    // Scroll to top of content area to ensure game is visible
    window.scrollTo(0, 0);
  };

  const handlePlayAgain = () => {
    setIsGameStarted(false);
    setGeneratedQuiz(null);
    setGeneratedFlashcards(null);
    setTopic('');
  };

  const [quizConfig, setQuizConfig] = useState({
    types: ['analytical', 'theoretical', 'practical'],
    formats: ['mcq'],
  });

  const [flashcardConfig, setFlashcardConfig] = useState({
    types: ['analytical', 'theoretical', 'practical'],
  });

  const gameDetails = {
    'word-quest': {
      title: 'Word Quest',
      description: 'An immersive vocabulary adventure where you discover and master key terms related to your topic. Perfect for building a strong foundation in any subject.',
      icon: Sparkles,
      features: ['Context-aware definitions', 'Usage examples', 'Interactive recall']
    },
    'logic-maze': {
      title: 'Logic Maze',
      description: 'A 3D first-person challenge where you navigate a complex maze by solving logic puzzles and answering topic-specific questions. Test your spatial and intellectual skills.',
      icon: Brain,
      features: ['3D Environment', 'Logic puzzles', 'Spatial reasoning']
    },
    'guess-me': {
      title: 'Guess Me',
      description: 'A game of riddles and deduction. Can you identify the hidden concepts based on cryptic clues and logical hints? Great for deep conceptual understanding.',
      icon: Brain,
      features: ['Riddle-based learning', 'Deductive reasoning', 'Conceptual depth']
    },
    'concept-match': {
      title: 'Concept Match',
      description: 'Master the relationships between ideas. Match terms with their definitions, causes with effects, or problems with solutions in this fast-paced pairing game.',
      icon: Layers,
      features: ['Relationship mapping', 'Speed challenges', 'Visual pairing']
    },
    'fact-sort': {
      title: 'Fact Sort',
      description: 'Organize your knowledge. Categorize facts, dates, and concepts into their correct groups to build a structured mental map of your study material.',
      icon: Gamepad2,
      features: ['Categorization skills', 'Structural learning', 'Quick sorting']
    },
    'true-false-sprint': {
      title: 'True/False Sprint',
      description: 'A rapid-fire test of your instincts. Quickly decide if statements are true or false as they come at you. Excellent for identifying common misconceptions.',
      icon: Sparkles,
      features: ['Rapid fire response', 'Misconception clearing', 'High-energy review']
    },
    'memory-matrix': {
      title: 'Memory Matrix',
      description: 'Enhance your recall abilities. Observe patterns and information layouts, then recreate them from memory. Strengthens visual and short-term memory.',
      icon: Brain,
      features: ['Pattern recognition', 'Visual memory', 'Focus training']
    },
    'code-cracker': {
      title: 'Code Cracker',
      description: 'Become a digital detective. Decipher encrypted clues and solve topic-related mysteries using your knowledge and analytical skills.',
      icon: Wand2,
      features: ['Analytical thinking', 'Problem solving', 'Mystery elements']
    }
  };

  const tabs = [
    { id: 'quizzes', label: 'Quizzes', icon: Brain },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
  ] as const;

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);

    // Increment prompt count
    const currentCount = parseInt(localStorage.getItem('promptCount') || '0');
    localStorage.setItem('promptCount', (currentCount + 1).toString());
    localStorage.setItem('userGrade', grade);

    try {
      const finalLimit = Number(limit) || 1;
      if (activeTab === 'quizzes') {
        const prompt = `Generate a quiz for ${grade} level about "${topic}" with exactly ${finalLimit} questions. 
        Question Types to include: ${quizConfig.types.join(', ')}.
        Question Formats to include: ${quizConfig.formats.join(', ')}.
        
        For each question, return a JSON object with:
        - question (string)
        - type (string: analytical, theoretical, or practical)
        - format (string: mcq, fill-in-the-blanks, long-answer, short-answer, one-word, match-the-following)
        - options (array of strings, only for mcq and match-the-following)
        - correctAnswer (string or number index)
        - explanation (string)
        - topic_tag (string: the specific sub-topic this question tests, e.g. "Cell Membrane" if topic is "Biology")
        
        Return as a JSON array of these objects.`;

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
        setGeneratedQuiz(data.map((q: any, i: number) => ({ ...q, id: i + 1 })));
      } else if (activeTab === 'flashcards') {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Generate a set of flashcards for ${grade} level about "${topic}" with exactly ${finalLimit} cards. 
          Focus on these types of content: ${flashcardConfig.types.join(', ')}.
          Return as a JSON array of objects with fields: front (string), back (string), explanation (string). 
          The explanation should provide more context about the answer on the back.`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["front", "back", "explanation"],
              },
            },
          },
        });
        const data = JSON.parse(response.text);
        setGeneratedFlashcards(data.map((c: any, i: number) => ({ ...c, id: i.toString() })));
      }
    } catch (error) {
      console.error("Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* AI Generation Form */}
      <AnimatePresence mode="wait">
        {((activeTab === 'games' && activeGame !== null && !isGameStarted) || 
          (activeTab === 'quizzes' && !generatedQuiz && !isGenerating) || 
          (activeTab === 'flashcards' && !generatedFlashcards && !isGenerating)) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="max-w-3xl mx-auto bg-white/60 backdrop-blur-md p-8 rounded-[40px] border border-beige-200 shadow-xl shadow-beige-900/5 space-y-6 overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-beige-800 rounded-xl">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-serif font-bold text-beige-900 uppercase tracking-widest">
                AI {activeTab === 'quizzes' ? 'Quiz' : activeTab === 'games' ? 'Game' : 'Flashcard'} Generator
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter Subject or Topic (e.g., Biology, World War II)..."
                  className="w-full pl-6 pr-4 py-4 bg-beige-50 border border-beige-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-beige-300 text-sm font-medium"
                />
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setLimit('');
                    } else {
                      const num = parseInt(val);
                      setLimit(isNaN(num) ? '' : Math.min(20, num));
                    }
                  }}
                  onBlur={() => {
                    if (!limit || Number(limit) < 1) setLimit(1);
                  }}
                  placeholder="Limit (1-20)"
                  className="w-full px-6 py-4 bg-beige-50 border border-beige-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-beige-300 text-sm font-medium"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-beige-400 uppercase tracking-widest">Items</span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between px-2">
                <label className="text-[10px] font-bold text-beige-400 uppercase tracking-widest">Select Grade Level</label>
                <span className="text-[10px] font-bold text-beige-800 uppercase tracking-widest bg-beige-100 px-2 py-0.5 rounded">Current: {grade}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'].map(g => (
                  <button
                    key={g}
                    onClick={() => {
                      setGrade(g);
                      localStorage.setItem('userGrade', g);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                      grade === g
                        ? "bg-beige-800 text-white border-beige-800 shadow-md"
                        : "bg-white text-beige-400 border-beige-200 hover:border-beige-400"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'quizzes' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-beige-400 uppercase tracking-widest ml-2">Question Types</label>
                  <div className="flex flex-wrap gap-2">
                    {['analytical', 'theoretical', 'practical'].map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          setQuizConfig(prev => ({
                            ...prev,
                            types: prev.types.includes(type) 
                              ? prev.types.filter(t => t !== type)
                              : [...prev.types, type]
                          }));
                        }}
                        className={cn(
                          "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
                          quizConfig.types.includes(type)
                            ? "bg-beige-800 text-white border-beige-800"
                            : "bg-white text-beige-400 border-beige-200 hover:border-beige-400"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-beige-400 uppercase tracking-widest ml-2">Question Formats</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'mcq', label: 'MCQ' },
                      { id: 'fill-in-the-blanks', label: 'Fill Blanks' },
                      { id: 'long-answer', label: 'Long' },
                      { id: 'short-answer', label: 'Short' },
                      { id: 'one-word', label: 'One Word' },
                      { id: 'match-the-following', label: 'Match' }
                    ].map(format => (
                      <button
                        key={format.id}
                        onClick={() => {
                          setQuizConfig(prev => {
                            const newFormats = prev.formats.includes(format.id)
                              ? prev.formats.filter(f => f !== format.id)
                              : [...prev.formats, format.id];
                            
                            // Ensure at least one format is selected
                            if (newFormats.length === 0) return prev;
                            
                            // Ensure number of formats <= limit
                            if (newFormats.length > (Number(limit) || 1)) return prev;

                            return { ...prev, formats: newFormats };
                          });
                        }}
                        className={cn(
                          "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
                          quizConfig.formats.includes(format.id)
                            ? "bg-beige-800 text-white border-beige-800"
                            : "bg-white text-beige-400 border-beige-200 hover:border-beige-400"
                        )}
                      >
                        {format.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'flashcards' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-beige-400 uppercase tracking-widest ml-2">Content Types</label>
                  <div className="flex flex-wrap gap-2">
                    {['analytical', 'theoretical', 'practical'].map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          setFlashcardConfig(prev => ({
                            ...prev,
                            types: prev.types.includes(type) 
                              ? prev.types.filter(t => t !== type)
                              : [...prev.types, type]
                          }));
                        }}
                        className={cn(
                          "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
                          flashcardConfig.types.includes(type)
                            ? "bg-beige-800 text-white border-beige-800"
                            : "bg-white text-beige-400 border-beige-200 hover:border-beige-400"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'games' ? (
              <button
                onClick={handleStartGame}
                disabled={!topic.trim()}
                className="w-full group relative flex items-center justify-center gap-3 px-10 py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 disabled:opacity-50 transition-all shadow-xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-sheen opacity-30 pointer-events-none" />
                <Gamepad2 className="w-5 h-5" />
                <span>Start {activeGame?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || isGenerating || (activeTab === 'quizzes' && (quizConfig.types.length === 0 || quizConfig.formats.length === 0))}
                className="w-full group relative flex items-center justify-center gap-3 px-10 py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 disabled:opacity-50 transition-all shadow-xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-sheen opacity-30 pointer-events-none" />
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                <span>
                  {isGenerating ? 'Generating...' : 
                   `Generate ${activeTab === 'quizzes' ? 'Quiz' : 'Flashcards'}`}
                </span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-white/40 backdrop-blur-md p-2 rounded-[32px] border border-beige-200 flex gap-2 shadow-xl shadow-beige-900/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setActiveGame(null);
              }}
              className={cn(
                "relative flex items-center gap-3 px-8 py-4 rounded-[24px] text-sm font-bold uppercase tracking-widest transition-all duration-500 overflow-hidden group",
                activeTab === tab.id 
                  ? "text-white" 
                  : "text-beige-500 hover:text-beige-800"
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-beige-800 shadow-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              {/* Sheen effect for active tab */}
              {activeTab === tab.id && (
                <div className="absolute inset-0 bg-sheen opacity-30 pointer-events-none" />
              )}

              <tab.icon className={cn("w-5 h-5 relative z-10 transition-transform duration-500 group-hover:scale-110", activeTab === tab.id ? "text-white" : "text-beige-400")} />
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (activeGame || '') + isGameStarted}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {activeTab === 'quizzes' && (
              generatedQuiz ? (
                <QuizModule 
                  customQuestions={generatedQuiz} 
                  onPlayAgain={handlePlayAgain} 
                  onExit={() => setGeneratedQuiz(null)} 
                  onComplete={(score) => {
                    addGems(score);
                    addXP(score * 10);
                  }}
                />
              ) : (
                <div className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 text-center space-y-8 shadow-xl shadow-beige-900/5">
                  <div className="relative inline-block">
                    <Brain className="w-24 h-24 text-beige-200 mx-auto" />
                    <Star4 className="absolute -top-4 -right-4 w-10 h-10 text-beige-400 animate-soft-fade" />
                  </div>
                  <div className="max-w-md mx-auto space-y-4">
                    <h3 className="text-3xl font-serif font-bold text-beige-900 leading-tight">AI Quiz Generator</h3>
                    <p className="text-beige-600 leading-relaxed">
                      Enter a topic and select your preferences in the generator above to create a custom quiz tailored to your grade level.
                    </p>
                  </div>
                </div>
              )
            )}
            {activeTab === 'flashcards' && (
              generatedFlashcards ? (
                <FlashcardModule 
                  customFlashcards={generatedFlashcards} 
                  onPlayAgain={handlePlayAgain}
                  onExit={() => setGeneratedFlashcards(null)}
                />
              ) : (
                <div className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 text-center space-y-8 shadow-xl shadow-beige-900/5">
                  <div className="relative inline-block">
                    <Layers className="w-24 h-24 text-beige-200 mx-auto" />
                    <Star4 className="absolute -top-4 -right-4 w-10 h-10 text-beige-400 animate-soft-fade" />
                  </div>
                  <div className="max-w-md mx-auto space-y-4">
                    <h3 className="text-3xl font-serif font-bold text-beige-900 leading-tight">AI Flashcard Generator</h3>
                    <p className="text-beige-600 leading-relaxed">
                      Transform any topic into a set of interactive flashcards. Perfect for quick review and memorization!
                    </p>
                  </div>
                </div>
              )
            )}
            {activeTab === 'games' && (
              <div className="space-y-8">
                {activeGame && !isGameStarted && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 shadow-xl shadow-beige-900/5 space-y-10"
                  >
                    <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
                      <div className="w-32 h-32 bg-beige-100 rounded-[32px] flex items-center justify-center shadow-inner border border-beige-200 flex-shrink-0">
                        {activeGame && React.createElement(gameDetails[activeGame as keyof typeof gameDetails].icon, { className: "w-16 h-16 text-beige-800" })}
                      </div>
                      <div className="space-y-6 text-center md:text-left flex-1">
                        <div>
                          <h3 className="text-4xl font-serif font-bold text-beige-900 mb-2">{activeGame && gameDetails[activeGame as keyof typeof gameDetails].title}</h3>
                          <p className="text-beige-600 text-lg leading-relaxed max-w-2xl">
                            {activeGame && gameDetails[activeGame as keyof typeof gameDetails].description}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                          {activeGame && gameDetails[activeGame as keyof typeof gameDetails].features.map((feature, i) => (
                            <span key={i} className="px-4 py-2 bg-white border border-beige-200 text-beige-800 rounded-xl text-xs font-bold tracking-wide">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-beige-100 flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={handleStartGame}
                        disabled={!topic.trim()}
                        className="flex-1 group relative flex items-center justify-center gap-3 px-10 py-5 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 disabled:opacity-50 transition-all shadow-xl overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-sheen opacity-30 pointer-events-none" />
                        <Gamepad2 className="w-6 h-6" />
                        <span>Start Game</span>
                      </button>
                      <button
                        onClick={() => setActiveGame(null)}
                        className="px-10 py-5 bg-white border-2 border-beige-200 text-beige-900 rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-50 transition-all"
                      >
                        Choose Another
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeGame && isGameStarted && (
                  <button 
                    onClick={() => {
                      setActiveGame(null);
                      setIsGameStarted(false);
                    }}
                    className="flex items-center gap-2 text-beige-500 hover:text-beige-800 font-bold uppercase tracking-widest text-xs transition-colors mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Games
                  </button>
                )}
                
                {isGameStarted && activeGame === 'word-quest' && (
                  <WordQuest 
                    topic={topic} 
                    grade={grade} 
                    limit={Number(limit) || 1}
                    onPlayAgain={handlePlayAgain} 
                    onExit={() => {
                      setActiveGame(null);
                      setIsGameStarted(false);
                    }}
                    onComplete={(score) => {
                      addGems(score);
                      addXP(score * 10);
                    }}
                  />
                )}
                {isGameStarted && activeGame === 'logic-maze' && (
                  <LogicMaze 
                    topic={topic} 
                    grade={grade} 
                    limit={Number(limit) || 1} 
                    onExit={() => {
                      setActiveGame(null);
                      setIsGameStarted(false);
                    }} 
                    onPlayAgain={handlePlayAgain}
                    onComplete={(score) => {
                      addGems(score);
                      addXP(score * 10);
                    }}
                  />
                )}
                {isGameStarted && activeGame === 'concept-match' && (
                  <ConceptMatch 
                    topic={topic} 
                    grade={grade} 
                    limit={Number(limit) || 1}
                    onPlayAgain={handlePlayAgain} 
                    onExit={() => {
                      setActiveGame(null);
                      setIsGameStarted(false);
                    }}
                    onComplete={(score) => {
                      addGems(score);
                      addXP(score * 10);
                    }}
                  />
                )}
                {isGameStarted && activeGame === 'fact-sort' && (
                  <FactSort 
                    topic={topic} 
                    grade={grade} 
                    limit={Number(limit) || 1}
                    onPlayAgain={handlePlayAgain} 
                    onExit={() => {
                      setActiveGame(null);
                      setIsGameStarted(false);
                    }}
                    onComplete={(score) => {
                      addGems(score);
                      addXP(score * 10);
                    }}
                  />
                )}
                {isGameStarted && activeGame === 'true-false-sprint' && (
                  <TrueFalseSprint 
                    topic={topic} 
                    grade={grade} 
                    limit={Number(limit) || 1}
                    onPlayAgain={handlePlayAgain} 
                    onExit={() => {
                      setActiveGame(null);
                      setIsGameStarted(false);
                    }}
                    onComplete={(score) => {
                      addGems(score);
                      addXP(score * 10);
                    }}
                  />
                )}
                {isGameStarted && activeGame === 'memory-matrix' && (
                  <MemoryMatrix 
                    topic={topic} 
                    grade={grade} 
                    limit={Number(limit) || 1}
                    onPlayAgain={handlePlayAgain} 
                    onExit={() => {
                      setActiveGame(null);
                      setIsGameStarted(false);
                    }}
                    onComplete={(score) => {
                      addGems(score);
                      addXP(score * 10);
                    }}
                  />
                )}
                {isGameStarted && activeGame === 'code-cracker' && (
                  <CodeCracker 
                    topic={topic} 
                    grade={grade} 
                    limit={Number(limit) || 1}
                    onPlayAgain={handlePlayAgain} 
                    onExit={() => {
                      setActiveGame(null);
                      setIsGameStarted(false);
                    }}
                    onComplete={(score) => {
                      addGems(score);
                      addXP(score * 10);
                    }}
                  />
                )}
                {isGameStarted && activeGame === 'guess-me' && (
                  <GuessMe 
                    topic={topic} 
                    grade={grade} 
                    limit={Number(limit) || 1}
                    onPlayAgain={handlePlayAgain} 
                    onExit={() => {
                      setActiveGame(null);
                      setIsGameStarted(false);
                    }}
                    onComplete={(score) => {
                      addGems(score);
                      addXP(score * 10);
                    }}
                  />
                )}
                
                {!activeGame && (
                  <div className="bg-white/60 backdrop-blur-sm p-12 rounded-[40px] border border-beige-200 shadow-xl shadow-beige-900/5 text-center space-y-8">
                    <div className="relative inline-block">
                      <Gamepad2 className="w-24 h-24 text-beige-200 mx-auto" />
                      <Star4 className="absolute -top-4 -right-4 w-10 h-10 text-beige-400 animate-soft-fade" />
                    </div>
                    <div className="max-w-md mx-auto space-y-4">
                      <h3 className="text-3xl font-serif font-bold text-beige-900">Educational Games</h3>
                      <p className="text-beige-600 leading-relaxed">
                        Level up your learning with our collection of interactive games designed to make complex concepts unforgettable.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                      {[
                        { id: 'word-quest', label: 'Word Quest', icon: Sparkles, desc: 'Vocabulary adventure' },
                        { id: 'logic-maze', label: 'Logic Maze', icon: Brain, desc: '3D First-Person Maze' },
                        { id: 'guess-me', label: 'Guess Me', icon: Brain, desc: 'Riddles & Logic' },
                        { id: 'concept-match', label: 'Concept Match', icon: Layers, desc: 'Pairing terms' },
                        { id: 'fact-sort', label: 'Fact Sort', icon: Gamepad2, desc: 'Categorization' },
                        { id: 'true-false-sprint', label: 'TF Sprint', icon: Sparkles, desc: 'Rapid fire' },
                        { id: 'memory-matrix', label: 'Memory Matrix', icon: Brain, desc: 'Pattern recall' },
                        { id: 'code-cracker', label: 'Code Cracker', icon: Wand2, desc: 'Decipher clues' }
                      ].map((game) => (
                        <button 
                          key={game.id}
                          onClick={() => setActiveGame(game.id as GameType)}
                          className="p-6 bg-beige-50 rounded-[32px] border border-beige-200 hover:border-beige-400 hover:bg-beige-100 transition-all group text-left"
                        >
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                            <game.icon className="w-6 h-6 text-beige-500" />
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-beige-900 uppercase tracking-widest text-xs block">{game.label}</span>
                            <span className="text-[10px] text-beige-400 font-medium">{game.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
