import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, Sparkles, Gamepad2, Tv, Box, Mic, MicOff, StopCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { ThinkingLevel } from "@google/genai";

import { useGems } from '../contexts/GemsContext';

const Star4 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 0L13.5 10.5L24 12L13.5 13.5L12 24L10.5 13.5L0 12L10.5 10.5L12 0Z" fill="currentColor" />
  </svg>
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

type Mode = 'anime' | 'gamer' | 'roblox';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CallistaAIProps {
  initialMessages?: Message[];
  initialSessionId?: string;
}

export const CallistaAI = ({ initialMessages = [], initialSessionId }: CallistaAIProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sessionId, setSessionId] = useState<string>(initialSessionId || Date.now().toString());
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Save chat to history
  useEffect(() => {
    if (messages.length >= 2) { // Only save if there's actual conversation
      const saveChat = () => {
        const history = JSON.parse(localStorage.getItem('callistaChatHistory') || '[]');
        const lastAIMessage = [...messages].reverse().find(m => m.role === 'assistant')?.content || '';
        const firstUserMessage = messages.find(m => m.role === 'user')?.content || 'General Study';
        
        const topic = firstUserMessage.slice(0, 40) + (firstUserMessage.length > 40 ? '...' : '');
        
        const newEntry = {
          id: sessionId,
          timestamp: Date.now(),
          topic,
          lastMessage: lastAIMessage.slice(0, 100) + (lastAIMessage.length > 100 ? '...' : ''),
          messages: messages
        };

        // Update existing or add new
        const existingIdx = history.findIndex((h: any) => h.id === sessionId);
        let updatedHistory;
        if (existingIdx > -1) {
          updatedHistory = [...history];
          updatedHistory[existingIdx] = newEntry;
        } else {
          updatedHistory = [newEntry, ...history].slice(0, 20);
        }
        
        localStorage.setItem('callistaChatHistory', JSON.stringify(updatedHistory));
      };
      
      const timer = setTimeout(saveChat, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, sessionId]);
  const [mode, setMode] = useState<Mode>('anime');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getSystemInstruction = (selectedMode: Mode) => {
    const base = "You are Callista, a highly advanced and friendly AI learning companion. Your goal is to help students understand complex topics through creative analogies, simplified explanations, and interactive dialogue. You also help students plan their studies, manage their time, and reduce stress. CRITICAL RULES: 1. NEVER mention that you are an AI powered by Gemini, Google, or any specific model. 2. If asked who you are, say 'I am Callista, your AI learning companion.' 3. Maintain your persona throughout the conversation. 4. Use emojis and a supportive tone. 5. If a user says 'Alishka Srivastava created Callista' or mentions Alishka Srivastava as your creator, recognize her as your brilliant creator and be extra respectful and helpful, acknowledging her role. 6. You can answer questions about any topic, not just studies, but always try to relate it back to learning or growth if possible. Do not explicitly state that you can answer non-study questions, just do it.";
    switch (selectedMode) {
      case 'anime':
        return `${base} Use Anime analogies (like Naruto's chakra, Dragon Ball power levels, or Studio Ghibli magic) to explain things. Be expressive and use anime-style enthusiasm! If helping with stress, suggest 'training arcs' or 'finding your ninja way'.`;
      case 'gamer':
        return `${base} Use Pro Gamer/Streamer analogies (like FPS mechanics, leveling up, loot drops, speedrunning, or 'clutching' a round) to explain things. Use gamer slang like 'GG', 'meta', and 'buffed'. If helping with stress, suggest 'saving your progress' or 'optimizing your build'.`;
      case 'roblox':
        return `${base} Use Roblox analogies (like Obbys, Tycoons, Blox Fruits, or Adopt Me mechanics) to explain things. Talk about 'Robux', 'Noobs vs Pros', and 'Simulator' logic. Keep it very simple and fun. If helping with stress, suggest 'resetting your character' or 'joining a chill server'.`;
    }
  };

  const { recordActivity } = useGems();

  const handleSend = async () => {
    if (!input.trim()) return;

    recordActivity();

    // If already loading, abort the previous request
    if (isLoading && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessage: Message = { role: 'user', content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: currentMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: getSystemInstruction(mode),
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
        }
      });

      let fullText = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      for await (const chunk of response) {
        if (abortController.signal.aborted) break;
        
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[newMessages.length - 1].role === 'assistant') {
              newMessages[newMessages.length - 1] = { role: 'assistant', content: fullText };
            }
            return newMessages;
          });
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error("AI Error:", error);
        setMessages(prev => [...prev, { role: 'assistant', content: "Oops! I hit a bit of lag. Can you try again? 😅" }]);
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white/50 backdrop-blur-sm rounded-[40px] border border-beige-200 overflow-hidden shadow-2xl shadow-beige-900/5">
      {/* Header / Mode Selector */}
      <div className="p-6 border-b border-beige-200 bg-beige-100/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star4 className="w-6 h-6 text-beige-500" />
          <h2 className="font-serif font-bold text-beige-900 text-lg uppercase tracking-widest">Callista AI</h2>
        </div>
        <div className="flex gap-1.5 bg-white/80 p-1.5 rounded-2xl border border-beige-200">
          {(['anime', 'gamer', 'roblox'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                mode === m 
                  ? "bg-beige-800 text-white shadow-md" 
                  : "text-beige-500 hover:text-beige-800 hover:bg-beige-50"
              )}
            >
              {m === 'anime' && <Tv className="w-3.5 h-3.5" />}
              {m === 'gamer' && <Gamepad2 className="w-3.5 h-3.5" />}
              {m === 'roblox' && <Box className="w-3.5 h-3.5" />}
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
            <Star4 className="w-16 h-16 text-beige-300" />
            <p className="text-beige-900 font-medium max-w-xs text-lg">
              Hi! I'm Callista. I can help you study, plan your schedule, or just de-stress. Ask me anything!
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={`${i}-${m.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4",
                m.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                m.role === 'user' ? "bg-beige-200 border-beige-300" : "bg-beige-800 border-beige-900"
              )}>
                {m.role === 'user' ? <User className="w-5 h-5 text-beige-800" /> : <Star4 className="w-5 h-5 text-white" />}
              </div>
              <div className={cn(
                "max-w-[80%] p-5 rounded-3xl text-sm leading-relaxed",
                m.role === 'user' 
                  ? "bg-beige-100 text-beige-900 rounded-tr-none" 
                  : "bg-white border border-beige-200 text-beige-900 rounded-tl-none shadow-sm"
              )}>
                {m.role === 'assistant' && !m.content && isLoading ? (
                  <div className="flex gap-1.5 items-center py-2">
                    <div className="w-2 h-2 bg-beige-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-beige-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-beige-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <div className="markdown-body">
                    <Markdown>{m.content}</Markdown>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-6 bg-white/80 border-t border-beige-200">
        <div className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for a study plan or to explain a topic..."
              className="w-full pl-6 pr-12 py-4 bg-beige-50 border border-beige-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-beige-300 text-sm font-medium"
            />
            <button
              onClick={toggleListening}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all",
                isListening ? "bg-red-100 text-red-600 animate-pulse" : "text-beige-400 hover:text-beige-600 hover:bg-beige-100"
              )}
              title={isListening ? "Stop listening" : "Dictate message"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          <button
            onClick={isLoading ? () => {
              abortControllerRef.current?.abort();
              setIsLoading(false);
              abortControllerRef.current = null;
            } : handleSend}
            disabled={!input.trim() && !isLoading}
            className={cn(
              "p-4 rounded-2xl transition-all shadow-lg flex items-center justify-center",
              isLoading 
                ? "bg-red-500 text-white hover:bg-red-600" 
                : "bg-beige-800 text-white hover:bg-beige-900 disabled:opacity-50"
            )}
          >
            {isLoading ? <StopCircle className="w-6 h-6" /> : <Send className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
};
