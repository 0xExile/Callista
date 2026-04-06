import React, { useState, useEffect, useRef } from 'react';
import { Calendar, BookOpen, Target, Layout, Plus, Trash2, CheckCircle2, Circle, Brain, X, Image as ImageIcon, Link as LinkIcon, Pencil, Eraser, Download, Type, Square, Minus, MessageSquare, Undo2, Redo2, Bell, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { cn } from '@/src/lib/utils';
import { useGems } from '../contexts/GemsContext';
import { QuizModule } from './QuizModule';

interface Note {
  id: string;
  title: string;
  subheading?: string;
  content: string;
  media?: { type: 'image' | 'link' | 'drawing', url: string }[];
  lastModified: number;
}

interface DrawingPath {
  id: string;
  tool: 'pencil' | 'eraser' | 'rect' | 'circle' | 'line';
  eraserType?: 'pixel' | 'object';
  points: { x: number, y: number }[];
  color: string;
  width: number;
}

const DrawingCanvas = ({ onSave, onCancel }: { onSave: (url: string) => void, onCancel: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1a1a1a');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'rect' | 'circle' | 'line' | 'text'>('pencil');
  const [eraserType, setEraserType] = useState<'pixel' | 'object'>('pixel');
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [redoStack, setRedoStack] = useState<DrawingPath[][]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [text, setText] = useState('');
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });

  const drawAll = (ctx: CanvasRenderingContext2D, pathsToDraw: DrawingPath[]) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    pathsToDraw.forEach(path => {
      ctx.beginPath();
      ctx.globalCompositeOperation = path.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (path.tool === 'pencil' || path.tool === 'eraser') {
        if (path.points.length < 2) return;
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
      } else if (path.tool === 'rect') {
        if (path.points.length < 2) return;
        const start = path.points[0];
        const end = path.points[path.points.length - 1];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (path.tool === 'circle') {
        if (path.points.length < 2) return;
        const start = path.points[0];
        const end = path.points[path.points.length - 1];
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (path.tool === 'line') {
        if (path.points.length < 2) return;
        const start = path.points[0];
        const end = path.points[path.points.length - 1];
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawAll(ctx, paths);
  }, [paths]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPos(e);
    if (tool === 'text') {
      setTextPos(pos);
      setIsTextModalOpen(true);
      return;
    }

    if (tool === 'eraser' && eraserType === 'object') {
      const newPaths = paths.filter(path => {
        return !path.points.some(p => 
          Math.sqrt(Math.pow(p.x - pos.x, 2) + Math.pow(p.y - pos.y, 2)) < brushSize * 2
        );
      });
      if (newPaths.length !== paths.length) {
        setRedoStack([]);
        setPaths(newPaths);
      }
      return;
    }

    setIsDrawing(true);
    setCurrentPath({
      id: Date.now().toString(),
      tool: tool as any,
      eraserType: tool === 'eraser' ? eraserType : undefined,
      points: [pos],
      color: tool === 'eraser' ? 'rgba(0,0,0,1)' : color,
      width: brushSize
    });
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentPath) return;
    const pos = getPos(e);
    
    const updatedPath = {
      ...currentPath,
      points: tool === 'pencil' || tool === 'eraser' 
        ? [...currentPath.points, pos]
        : [currentPath.points[0], pos]
    };
    setCurrentPath(updatedPath);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawAll(ctx, [...paths, updatedPath]);
  };

  const stopDrawing = () => {
    if (isDrawing && currentPath) {
      setPaths([...paths, currentPath]);
      setRedoStack([]);
    }
    setIsDrawing(false);
    setCurrentPath(null);
  };

  const undo = () => {
    if (paths.length === 0) return;
    const last = paths[paths.length - 1];
    setRedoStack([[last], ...redoStack]);
    setPaths(paths.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setPaths([...paths, ...next]);
    setRedoStack(redoStack.slice(1));
  };

  const handleAddText = () => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.font = `${brushSize * 4}px Inter, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(text, textPos.x, textPos.y);
    setText('');
    setIsTextModalOpen(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL());
  };

  const clear = () => {
    setPaths([]);
    setRedoStack([]);
  };

  return (
    <div className="space-y-4 bg-beige-50 p-6 rounded-3xl border border-beige-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setTool('pencil')}
            className={cn("p-2 rounded-lg transition-all", tool === 'pencil' ? "bg-beige-800 text-white" : "bg-white text-beige-400")}
            title="Pencil"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <div className="flex items-center bg-white rounded-lg border border-beige-100 overflow-hidden">
            <button 
              onClick={() => { setTool('eraser'); setEraserType('pixel'); }}
              className={cn("p-2 transition-all", tool === 'eraser' && eraserType === 'pixel' ? "bg-beige-800 text-white" : "text-beige-400 hover:bg-beige-50")}
              title="Pixel Eraser (Bit by bit)"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { setTool('eraser'); setEraserType('object'); }}
              className={cn("p-2 transition-all border-l border-beige-100", tool === 'eraser' && eraserType === 'object' ? "bg-beige-800 text-white" : "text-beige-400 hover:bg-beige-50")}
              title="Object Eraser (Whole figure)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="w-px h-6 bg-beige-200 mx-1" />
          <button 
            onClick={() => setTool('rect')}
            className={cn("p-2 rounded-lg transition-all", tool === 'rect' ? "bg-beige-800 text-white" : "bg-white text-beige-400")}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setTool('circle')}
            className={cn("p-2 rounded-lg transition-all", tool === 'circle' ? "bg-beige-800 text-white" : "bg-white text-beige-400")}
            title="Circle"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setTool('line')}
            className={cn("p-2 rounded-lg transition-all", tool === 'line' ? "bg-beige-800 text-white" : "bg-white text-beige-400")}
            title="Line"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setTool('text')}
            className={cn("p-2 rounded-lg transition-all", tool === 'text' ? "bg-beige-800 text-white" : "bg-white text-beige-400")}
            title="Text"
          >
            <Type className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-beige-200 mx-1" />
          <button onClick={undo} disabled={paths.length === 0} className="p-2 bg-white text-beige-400 rounded-lg hover:text-beige-900 disabled:opacity-30">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={redo} disabled={redoStack.length === 0} className="p-2 bg-white text-beige-400 rounded-lg hover:text-beige-900 disabled:opacity-30">
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-beige-200 mx-1" />
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded-lg border-none cursor-pointer"
          />
          <input 
            type="range" 
            min="1" 
            max="20" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24 accent-beige-800"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clear} className="px-3 py-1 text-[10px] font-bold uppercase text-beige-400 hover:text-beige-900">Clear</button>
          <button onClick={handleSave} className="px-4 py-2 bg-beige-800 text-white text-[10px] font-bold uppercase rounded-lg shadow-md">Save Drawing</button>
          <button onClick={onCancel} className="px-4 py-2 bg-beige-200 text-beige-600 text-[10px] font-bold uppercase rounded-lg">Cancel</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className={cn(
          "w-full bg-white rounded-2xl border border-beige-100 touch-none shadow-inner select-none",
          tool === 'text' ? "cursor-text" : "cursor-crosshair"
        )}
        style={{ touchAction: 'none' }}
      />

      <AnimatePresence>
        {isTextModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-beige-900/20 backdrop-blur-sm"
              onClick={() => setIsTextModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white p-8 rounded-3xl shadow-2xl space-y-4 w-full max-w-sm"
            >
              <h4 className="font-bold text-beige-900 uppercase tracking-widest text-xs">Add Text</h4>
              <input 
                autoFocus
                type="text" 
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
                placeholder="Type something..."
                className="w-full px-4 py-3 bg-beige-50 border border-beige-200 rounded-xl focus:outline-none focus:border-beige-400"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleAddText}
                  className="flex-1 py-3 bg-beige-800 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]"
                >
                  Add
                </button>
                <button 
                  onClick={() => setIsTextModalOpen(false)}
                  className="flex-1 py-3 bg-beige-100 text-beige-600 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <p className="text-[10px] text-beige-400 italic text-center">Tip: Use shapes to create flowcharts and diagrams!</p>
    </div>
  );
};

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

const Star4 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 0L13.5 10.5L24 12L13.5 13.5L12 24L10.5 13.5L0 12L10.5 10.5L12 0Z" fill="currentColor" />
  </svg>
);

export const StudySpace = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('studyNotes');
    return saved ? JSON.parse(saved) : [];
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('studyTasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [weakSpots, setWeakSpots] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteSubheading, setNewNoteSubheading] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteMedia, setNewNoteMedia] = useState<{ type: 'image' | 'link' | 'drawing', url: string }[]>([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [alarms, setAlarms] = useState<{ id: string, title: string, time: string, active: boolean }[]>(() => {
    const saved = localStorage.getItem('studyAlarms');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAddingAlarm, setIsAddingAlarm] = useState(false);
  const [newAlarmTitle, setNewAlarmTitle] = useState('');
  const [newAlarmTime, setNewAlarmTime] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addGems, addXP, recordActivity } = useGems();
  const navigate = useNavigate();

  const [activeNotification, setActiveNotification] = useState<{ title: string, time: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('studyAlarms', JSON.stringify(alarms));
    
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      alarms.forEach(alarm => {
        if (alarm.active && alarm.time === currentTime) {
          setActiveNotification({ title: alarm.title, time: alarm.time });
          // Deactivate alarm after it goes off to prevent repeated alerts in the same minute
          setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, active: false } : a));
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [alarms]);

  useEffect(() => {
    recordActivity(); // Count visit as activity
    
    // One-time cleanup for release "freshening"
    const isFreshened = localStorage.getItem('callista_freshened_v1');
    if (!isFreshened) {
      localStorage.removeItem('weakSpots');
      localStorage.removeItem('studyNotes');
      localStorage.setItem('callista_freshened_v1', 'true');
      setWeakSpots([]);
      setNotes([]);
    } else {
      const savedWeakSpots = JSON.parse(localStorage.getItem('weakSpots') || '[]');
      setWeakSpots(savedWeakSpots);
    }

    const savedChats = JSON.parse(localStorage.getItem('callistaChatHistory') || '[]');
    setChatHistory(savedChats);
  }, []);

  useEffect(() => {
    localStorage.setItem('studyNotes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('studyTasks', JSON.stringify(tasks));
    
    // Auto-delete tasks older than a week
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const filteredTasks = tasks.filter(t => t.createdAt > oneWeekAgo);
    if (filteredTasks.length !== tasks.length) {
      setTasks(filteredTasks);
    }
  }, [tasks]);

  const [isAddingWeakSpot, setIsAddingWeakSpot] = useState(false);
  const [showClearWeakSpotsConfirm, setShowClearWeakSpotsConfirm] = useState(false);
  const [showClearNotesConfirm, setShowClearNotesConfirm] = useState(false);
  const [newWeakSpot, setNewWeakSpot] = useState('');

  const addWeakSpot = () => {
    if (!newWeakSpot.trim()) return;
    const updated = Array.from(new Set([...weakSpots, newWeakSpot.trim()]));
    setWeakSpots(updated);
    localStorage.setItem('weakSpots', JSON.stringify(updated));
    setNewWeakSpot('');
    setIsAddingWeakSpot(false);
  };
  const addTask = () => {
    if (!newTaskText.trim()) return;
    setTasks([...tasks, { 
      id: Date.now().toString(), 
      text: newTaskText, 
      completed: false,
      createdAt: Date.now()
    }]);
    setNewTaskText('');
    setIsAddingTask(false);
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const newCompleted = !t.completed;
        if (newCompleted) {
          addGems(3);
          addXP(3);
          recordActivity();
        } else {
          // Subtract gems/XP if unticked to prevent exploit
          addGems(-3);
          // We subtract base XP, the multiplier will handle the rest consistently
          addXP(-3);
        }
        return { ...t, completed: newCompleted };
      }
      return t;
    }));
  };

  const addNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    setNotes([...notes, { 
      id: Date.now().toString(), 
      title: newNoteTitle, 
      subheading: newNoteSubheading,
      content: newNoteContent, 
      media: newNoteMedia,
      lastModified: Date.now()
    }]);
    recordActivity(); // Mark activity for streak
    setNewNoteTitle('');
    setNewNoteSubheading('');
    setNewNoteContent('');
    setNewNoteMedia([]);
    setIsAddingNote(false);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const addAlarm = () => {
    if (!newAlarmTitle.trim() || !newAlarmTime.trim()) return;
    setAlarms([...alarms, { 
      id: Date.now().toString(), 
      title: newAlarmTitle, 
      time: newAlarmTime, 
      active: true 
    }]);
    setNewAlarmTitle('');
    setNewAlarmTime('');
    setIsAddingAlarm(false);
  };

  const deleteAlarm = (id: string) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  const toggleAlarm = (id: string) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewNoteMedia([...newNoteMedia, { type: 'image', url: reader.result as string }]);
    };
    reader.readAsDataURL(file);
  };

  const addMedia = (type: 'image' | 'link' | 'drawing', url?: string) => {
    if (type === 'drawing' && url) {
      setNewNoteMedia([...newNoteMedia, { type, url }]);
      setIsDrawing(false);
      return;
    }
    if (type === 'image') {
      fileInputRef.current?.click();
      return;
    }
    if (!mediaUrl.trim()) return;
    setNewNoteMedia([...newNoteMedia, { type: 'link', url: mediaUrl }]);
    setMediaUrl('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Alarm Notification */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
          >
            <div className="bg-beige-800 text-white p-6 rounded-[32px] shadow-2xl border-4 border-white flex items-center gap-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-sheen opacity-20 pointer-events-none" />
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Bell className="w-8 h-8 animate-bounce" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Study Reminder</p>
                <h4 className="text-xl font-serif font-bold leading-tight">{activeNotification.title}</h4>
                <p className="text-sm font-medium opacity-80">Scheduled for {activeNotification.time}</p>
              </div>
              <button 
                onClick={() => setActiveNotification(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Left Column: Schedule & Weak Spots */}
      <div className="space-y-8">
        <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[40px] border border-beige-200 shadow-xl shadow-beige-900/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-beige-50" />
              <h3 className="font-serif font-bold text-beige-900 uppercase tracking-widest">Study Schedule</h3>
            </div>
            <button 
              onClick={() => setIsAddingAlarm(true)}
              className="p-2 bg-beige-100 text-beige-600 rounded-xl hover:bg-beige-200 transition-all"
              title="Add Alarm"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Alarms Section */}
            {alarms.length > 0 && (
              <div className="space-y-2 pb-4 border-b border-beige-100">
                <p className="text-[10px] font-bold text-beige-400 uppercase tracking-widest mb-2">Active Reminders</p>
                {alarms.map(alarm => (
                  <div key={alarm.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-beige-100">
                    <div className="flex items-center gap-3">
                      <Clock className={cn("w-4 h-4", alarm.active ? "text-beige-800" : "text-beige-300")} />
                      <div>
                        <p className={cn("text-xs font-bold", !alarm.active && "text-beige-300")}>{alarm.title}</p>
                        <p className="text-[10px] text-beige-400">{alarm.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleAlarm(alarm.id)} className={cn("w-8 h-4 rounded-full transition-all relative", alarm.active ? "bg-beige-800" : "bg-beige-200")}>
                        <div className={cn("absolute top-1 w-2 h-2 bg-white rounded-full transition-all", alarm.active ? "right-1" : "left-1")} />
                      </button>
                      <button onClick={() => deleteAlarm(alarm.id)} className="text-beige-200 hover:text-red-400 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isAddingAlarm && (
              <div className="space-y-3 p-4 bg-beige-50 rounded-2xl border border-beige-200">
                <input 
                  type="text" 
                  value={newAlarmTitle}
                  onChange={(e) => setNewAlarmTitle(e.target.value)}
                  placeholder="Alarm Title"
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold placeholder:text-beige-300"
                />
                <input 
                  type="time" 
                  value={newAlarmTime}
                  onChange={(e) => setNewAlarmTime(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-beige-800"
                />
                <div className="flex gap-2">
                  <button onClick={addAlarm} className="px-3 py-1 bg-beige-800 text-white text-[10px] font-bold uppercase rounded-lg">Set</button>
                  <button onClick={() => setIsAddingAlarm(false)} className="px-3 py-1 bg-beige-200 text-beige-600 text-[10px] font-bold uppercase rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            {tasks.map(task => (
              <div 
                key={task.id} 
                className="flex items-center justify-between p-4 bg-beige-50 rounded-2xl hover:bg-beige-100 transition-all border border-transparent hover:border-beige-200 group"
              >
                <div 
                  onClick={() => toggleTask(task.id)}
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                >
                  {task.completed ? <CheckCircle2 className="w-6 h-6 text-beige-600" /> : <Circle className="w-6 h-6 text-beige-300" />}
                  <span className={cn("text-sm font-medium", task.completed && "line-through text-beige-400")}>{task.text}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-beige-300 hover:text-red-400 transition-all"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {isAddingTask ? (
              <div className="space-y-3 p-4 bg-beige-50 rounded-2xl border border-beige-200">
                <input 
                  autoFocus
                  type="text" 
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="What needs to be done?"
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-beige-300"
                />
                <div className="flex gap-2">
                  <button onClick={addTask} className="px-3 py-1 bg-beige-800 text-white text-[10px] font-bold uppercase rounded-lg">Add</button>
                  <button onClick={() => setIsAddingTask(false)} className="px-3 py-1 bg-beige-200 text-beige-600 text-[10px] font-bold uppercase rounded-lg">Cancel</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingTask(true)}
                className="w-full py-3 border-2 border-dashed border-beige-200 rounded-2xl text-beige-400 text-sm font-bold hover:border-beige-400 hover:text-beige-600 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Add Task
              </button>
            )}
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[40px] border border-beige-200 shadow-xl shadow-beige-900/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-beige-500" />
              <h3 className="font-serif font-bold text-beige-900 uppercase tracking-widest">Weak Spots</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsAddingWeakSpot(true)}
                className="p-2 bg-beige-100 text-beige-600 rounded-xl hover:bg-beige-200 transition-all"
                title="Add Weak Spot Manually"
              >
                <Plus className="w-4 h-4" />
              </button>
              {weakSpots.length > 0 && (
                <div className="flex items-center gap-1">
                  {showClearWeakSpotsConfirm ? (
                    <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-100">
                      <button 
                        onClick={() => {
                          setWeakSpots([]);
                          localStorage.removeItem('weakSpots');
                          setShowClearWeakSpotsConfirm(false);
                        }}
                        className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-md hover:bg-red-600"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => setShowClearWeakSpotsConfirm(false)}
                        className="px-2 py-1 bg-beige-200 text-beige-600 text-[10px] font-bold rounded-md"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowClearWeakSpotsConfirm(true)}
                      className="p-2 text-beige-300 hover:text-red-400 transition-all"
                      title="Clear All Weak Spots"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <button 
                onClick={() => setIsQuizActive(true)}
                className="px-4 py-2 bg-beige-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-beige-900 transition-all shadow-md flex items-center gap-2"
              >
                <Brain className="w-3 h-3" /> Take a Quiz
              </button>
            </div>
          </div>

          {isAddingWeakSpot && (
            <div className="mb-6 space-y-3 p-4 bg-beige-50 rounded-2xl border border-beige-200">
              <input 
                autoFocus
                type="text" 
                value={newWeakSpot}
                onChange={(e) => setNewWeakSpot(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addWeakSpot()}
                placeholder="Enter topic to focus on..."
                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold placeholder:text-beige-300"
              />
              <div className="flex gap-2">
                <button onClick={addWeakSpot} className="px-3 py-1 bg-beige-800 text-white text-[10px] font-bold uppercase rounded-lg">Add</button>
                <button onClick={() => setIsAddingWeakSpot(false)} className="px-3 py-1 bg-beige-200 text-beige-600 text-[10px] font-bold uppercase rounded-lg">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {weakSpots.length > 0 ? weakSpots.map(spot => (
              <div key={spot} className="group relative">
                <span className="px-4 py-2 bg-beige-100 text-beige-800 rounded-xl text-xs font-bold border border-beige-200 tracking-wide block">
                  {spot}
                </span>
                <button 
                  onClick={() => {
                    const updated = weakSpots.filter(s => s !== spot);
                    setWeakSpots(updated);
                    localStorage.setItem('weakSpots', JSON.stringify(updated));
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-beige-200 rounded-full flex items-center justify-center text-beige-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )) : (
              <p className="text-xs text-beige-400 italic">No weak spots identified yet. Add one manually or take a quiz!</p>
            )}
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[40px] border border-beige-200 shadow-xl shadow-beige-900/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-beige-500" />
              <h3 className="font-serif font-bold text-beige-900 uppercase tracking-widest">AI Chat History</h3>
            </div>
            {chatHistory.length > 0 && (
              <button 
                onClick={() => {
                  setChatHistory([]);
                  localStorage.removeItem('callistaChatHistory');
                }}
                className="p-2 text-beige-300 hover:text-red-400 transition-all"
                title="Clear All History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {chatHistory.length > 0 ? chatHistory.map((chat, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedChat(chat)}
                className="p-4 bg-beige-50 rounded-2xl border border-beige-100 space-y-2 cursor-pointer hover:bg-beige-100 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-bold text-beige-400 uppercase tracking-widest">
                    {new Date(chat.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const newHistory = chatHistory.filter((_, i) => i !== idx);
                      setChatHistory(newHistory);
                      localStorage.setItem('callistaChatHistory', JSON.stringify(newHistory));
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-beige-300 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs font-bold text-beige-900 line-clamp-1">{chat.topic}</p>
                <p className="text-[10px] text-beige-600 line-clamp-1 italic">
                  {chat.lastMessage?.replace(/['"]/g, '')}
                </p>
              </div>
            )) : (
              <p className="text-xs text-beige-400 italic text-center py-4">No chats recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Middle Column: Notes */}
      <div className="md:col-span-2 space-y-8">
        <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[40px] border border-beige-200 shadow-xl shadow-beige-900/5 h-full min-h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-beige-500" />
              <h3 className="font-serif font-bold text-beige-900 uppercase tracking-widest">Notes & Concept Boards</h3>
            </div>
            <div className="flex items-center gap-3">
              {notes.length > 0 && (
                <div className="flex items-center gap-2">
                  {showClearNotesConfirm ? (
                    <div className="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100">
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">Delete all?</span>
                      <button 
                        onClick={() => {
                          setNotes([]);
                          localStorage.removeItem('studyNotes');
                          setShowClearNotesConfirm(false);
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600"
                      >
                        Yes
                      </button>
                      <button 
                        onClick={() => setShowClearNotesConfirm(false)}
                        className="px-3 py-1 bg-beige-200 text-beige-600 text-[10px] font-bold rounded-lg"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowClearNotesConfirm(true)}
                      className="p-2.5 text-beige-300 hover:text-red-400 transition-all"
                      title="Clear All Concept Boards"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  )}
                </div>
              )}
              <button 
                onClick={() => setIsAddingNote(true)}
                className="p-2.5 bg-beige-800 text-white rounded-xl hover:bg-beige-900 transition-all shadow-lg"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {isAddingNote && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-white rounded-3xl border-2 border-beige-800 space-y-4 shadow-xl col-span-full"
              >
                <input 
                  autoFocus
                  type="text" 
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Note Title"
                  className="w-full bg-transparent border-none focus:ring-0 font-serif font-bold text-beige-900 text-lg p-0"
                />
                <input 
                  type="text" 
                  value={newNoteSubheading}
                  onChange={(e) => setNewNoteSubheading(e.target.value)}
                  placeholder="Subheading (Optional)"
                  className="w-full bg-transparent border-none focus:ring-0 font-serif text-beige-400 text-sm p-0 italic"
                />
                <textarea 
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Start typing your concept board..."
                  className="w-full bg-transparent border-none focus:ring-0 text-sm text-beige-700 p-0 min-h-[150px] resize-none"
                />
                
                {/* Media Input */}
                <div className="space-y-3 pt-4 border-t border-beige-100">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="Add or Link URL..."
                      className="flex-1 bg-beige-50 border border-beige-200 rounded-xl px-3 py-2 text-xs focus:ring-beige-500 focus:border-beige-500"
                    />
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button onClick={() => addMedia('image')} className="p-2 bg-beige-100 text-beige-600 rounded-xl hover:bg-beige-200 transition-all" title="Upload Image">
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => addMedia('link')} className="p-2 bg-beige-100 text-beige-600 rounded-xl hover:bg-beige-200 transition-all" title="Add Link">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsDrawing(true)} className="p-2 bg-beige-100 text-beige-600 rounded-xl hover:bg-beige-200 transition-all" title="Draw/Flowchart">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  {isDrawing && (
                    <div className="col-span-full">
                      <DrawingCanvas 
                        onSave={(url) => addMedia('drawing', url)} 
                        onCancel={() => setIsDrawing(false)} 
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {newNoteMedia.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1 bg-beige-50 border border-beige-200 rounded-full text-[10px] font-bold text-beige-600">
                        {m.type === 'image' ? <ImageIcon className="w-3 h-3" /> : m.type === 'link' ? <LinkIcon className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                        <span className="max-w-[100px] truncate">{m.type === 'drawing' ? 'Drawing' : m.url}</span>
                        <button onClick={() => setNewNoteMedia(newNoteMedia.filter((_, idx) => idx !== i))} className="text-beige-400 hover:text-beige-900">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={addNote} className="flex-1 py-3 bg-beige-800 text-white text-xs font-bold uppercase rounded-xl tracking-widest shadow-lg shadow-beige-900/20">Save Concept Board</button>
                  <button onClick={() => setIsAddingNote(false)} className="px-6 py-3 bg-beige-100 text-beige-600 text-xs font-bold uppercase rounded-xl tracking-widest">Cancel</button>
                </div>
              </motion.div>
            )}

            {notes.map(note => (
              <motion.div 
                key={note.id}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedNote(note)}
                className="p-6 bg-beige-50 rounded-3xl border border-beige-200 relative group hover:shadow-xl hover:shadow-beige-900/5 transition-all cursor-pointer"
              >
                <h4 className="font-serif font-bold text-beige-900 mb-1 text-lg">{note.title}</h4>
                {note.subheading && <p className="text-[10px] font-bold text-beige-400 uppercase tracking-widest mb-3">{note.subheading}</p>}
                <p className="text-sm text-beige-700 leading-relaxed line-clamp-4">{note.content}</p>
                {note.media && note.media.length > 0 && (
                  <div className="mt-4 flex gap-2">
                    {note.media.slice(0, 3).map((m, i) => (
                      <div key={i} className="w-8 h-8 bg-white rounded-lg border border-beige-200 flex items-center justify-center text-beige-400">
                        {m.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                      </div>
                    ))}
                    {note.media.length > 3 && <div className="w-8 h-8 bg-white rounded-lg border border-beige-200 flex items-center justify-center text-[10px] font-bold text-beige-400">+{note.media.length - 3}</div>}
                  </div>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-beige-400 hover:text-beige-900 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
            
            {!isAddingNote && (
              <div 
                onClick={() => setIsAddingNote(true)}
                className="p-6 border-2 border-dashed border-beige-200 rounded-3xl flex flex-col items-center justify-center text-beige-300 space-y-4 hover:border-beige-400 hover:text-beige-500 cursor-pointer transition-all group"
              >
                <div className="p-4 bg-beige-50 rounded-full group-hover:bg-beige-100 transition-all">
                  <Layout className="w-10 h-10" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Create Concept Board</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note Detail Modal */}
      <AnimatePresence>
        {selectedNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNote(null)}
              className="absolute inset-0 bg-beige-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[40px] p-12 shadow-2xl overflow-y-auto max-h-[85vh] space-y-8"
            >
              <button 
                onClick={() => setSelectedNote(null)}
                className="absolute top-8 right-8 p-2 text-beige-400 hover:text-beige-900 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-beige-100 rounded-2xl">
                      <BookOpen className="w-6 h-6 text-beige-800" />
                    </div>
                    <h2 className="text-4xl font-serif font-bold text-beige-900">{selectedNote.title}</h2>
                  </div>
                  {selectedNote.subheading && (
                    <p className="text-lg font-bold text-beige-400 uppercase tracking-[0.2em] ml-16">
                      {selectedNote.subheading}
                    </p>
                  )}
                </div>
                <div className="h-0.5 w-full bg-beige-100 rounded-full" />
                <div className="prose prose-beige max-w-none">
                  <p className="text-beige-800 leading-relaxed whitespace-pre-wrap text-xl font-medium">
                    {selectedNote.content || "No content yet. Start typing to add some notes!"}
                  </p>
                </div>
                
                {/* Rich Media */}
                {selectedNote.media && selectedNote.media.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
                    {selectedNote.media.map((m, i) => (
                      <div key={i} className="space-y-2">
                        {m.type === 'image' ? (
                          <div className="rounded-3xl overflow-hidden border border-beige-200 shadow-lg">
                            <img src={m.url} alt="Concept" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ) : m.type === 'drawing' ? (
                          <div className="rounded-3xl overflow-hidden border border-beige-200 shadow-lg bg-white">
                            <img src={m.url} alt="Drawing" className="w-full h-auto object-contain" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <a 
                            href={m.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 bg-beige-50 rounded-2xl border border-beige-200 hover:bg-beige-100 transition-all group"
                          >
                            <LinkIcon className="w-5 h-5 text-beige-500 group-hover:text-beige-800" />
                            <span className="text-sm font-bold text-beige-700 truncate">{m.url}</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Detail Modal */}
      <AnimatePresence>
        {selectedChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedChat(null)}
              className="absolute inset-0 bg-beige-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] p-10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-beige-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-beige-800 rounded-xl">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-beige-900">{selectedChat.topic}</h3>
                    <p className="text-[10px] font-bold text-beige-400 uppercase tracking-widest">{new Date(selectedChat.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedChat(null)} className="p-2 text-beige-400 hover:text-beige-900 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {selectedChat.messages?.map((msg: any, i: number) => (
                  <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed",
                      msg.role === 'user' ? "bg-beige-800 text-white rounded-tr-none" : "bg-beige-50 text-beige-900 rounded-tl-none border border-beige-100"
                    )}>
                      <div className="markdown-body">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-beige-100">
                <button 
                  onClick={() => {
                    navigate('/ai', { 
                      state: { 
                        initialMessages: selectedChat.messages,
                        initialSessionId: selectedChat.id || selectedChat.timestamp.toString()
                      } 
                    });
                  }}
                  className="w-full py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-beige-900 transition-all shadow-lg"
                >
                  <MessageSquare className="w-4 h-4" />
                  Continue this Chat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Weak Spot Quiz Modal */}
      <AnimatePresence>
        {isQuizActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-beige-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[48px] p-1 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-8 right-8 z-10">
                <button onClick={() => setIsQuizActive(false)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="max-h-[90vh] overflow-y-auto custom-scrollbar p-8">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-serif font-bold text-beige-900">Weak Spot Mastery Quiz</h2>
                  <p className="text-beige-600 font-medium">Focusing on: {weakSpots.join(', ')}</p>
                </div>
                <div className="bg-beige-50 rounded-[40px] p-8 border border-beige-200">
                  <QuizModule 
                    topic={`Mastery Quiz: ${weakSpots.join(', ')}`} 
                    onComplete={(score) => {
                      // Award bonus for mastering weak spots
                      addGems(score);
                      addXP(score * 10);
                    }}
                    onExit={() => setIsQuizActive(false)}
                    onPlayAgain={() => {
                      setIsQuizActive(false);
                      setIsQuizActive(true);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
