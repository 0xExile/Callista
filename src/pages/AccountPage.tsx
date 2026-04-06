import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ShieldCheck, Settings, LogOut, Mail, Calendar, Sparkles, Gem, Trophy, Zap, ListOrdered, X, Camera, Save, LogIn, Heart, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { useGems } from '../contexts/GemsContext';
import { auth, db } from '../lib/firebase';
import { updateProfile, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

const Star4 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 0L13.5 10.5L24 12L13.5 13.5L12 24L10.5 13.5L0 12L10.5 10.5L12 0Z" fill="currentColor" />
  </svg>
);

export const AccountPage = () => {
  const { gems, xp, streakCount, isChampion, weeklyGems, fetchLeaderboard, resetAccount, resetLeaderboard, user, loading } = useGems();
  const [rank, setRank] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const promptCount = parseInt(localStorage.getItem('promptCount') || '0');
  const firstUseDate = localStorage.getItem('firstUseDate');
  const formattedDate = firstUseDate ? new Date(firstUseDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'N/A';

  const [grade, setGrade] = useState(() => localStorage.getItem('userGrade') || 'Grade 10');

  useEffect(() => {
    if (user) {
      setEditName(user.displayName || '');
      setEditPhoto(user.photoURL || '');
    }
  }, [user]);

  useEffect(() => {
    const getRank = async () => {
      if (!user) return;
      const leaderboard = await fetchLeaderboard();
      const userRank = leaderboard.findIndex(u => u.uid === user.uid);
      if (userRank !== -1) {
        setRank(userRank + 1);
      }
    };
    getRank();
  }, [user, fetchLeaderboard]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleSignOut = () => signOut(auth);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user, {
        displayName: editName,
        photoURL: editPhoto
      });

      // Update Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: editName,
        photoURL: editPhoto
      });

      setIsSettingsOpen(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    localStorage.setItem('userGrade', newGrade);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-beige-200 border-t-beige-800 rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-8">
        <div className="w-24 h-24 bg-beige-100 rounded-[32px] flex items-center justify-center mx-auto border border-beige-200">
          <User className="w-12 h-12 text-beige-400" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-serif font-bold text-beige-900">Sign in to Callista</h2>
          <p className="text-beige-600 text-lg">Join our community of learners to track your progress, earn gems, and compete on the leaderboard.</p>
        </div>
        <button 
          onClick={handleSignIn}
          className="w-full py-5 bg-beige-800 text-white rounded-2xl font-bold text-lg uppercase tracking-widest hover:bg-beige-900 transition-all shadow-xl flex items-center justify-center gap-3"
        >
          <LogIn className="w-6 h-6" />
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* Profile Header */}
      <div className="bg-white/60 backdrop-blur-md p-10 rounded-[48px] border border-beige-200 shadow-xl shadow-beige-900/5 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-sheen opacity-10 pointer-events-none" />
        <div className="relative">
          <div className="w-32 h-32 bg-beige-800 rounded-full flex items-center justify-center text-white shadow-2xl border-4 border-white overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-16 h-16" />
            )}
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-3 border-2 border-dashed border-beige-300 rounded-full opacity-50"
          />
          <Star4 className="absolute -top-2 -right-2 w-8 h-8 text-beige-500 animate-soft-fade" />
          
          {isChampion && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-2 -right-2 bg-beige-800 text-white p-2 rounded-full shadow-lg border-2 border-white"
              title="Champion of Callista"
            >
              <Trophy className="w-4 h-4" />
            </motion.div>
          )}
        </div>
        
        <div className="text-center md:text-left space-y-2 flex-1">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <h2 className="text-4xl font-serif font-bold text-beige-900">{user?.displayName || 'Student User'}</h2>
            {isChampion && (
              <span className="px-3 py-1 bg-beige-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-md flex items-center gap-1.5">
                <Star4 className="w-3 h-3" /> Champion of Callista
              </span>
            )}
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className="px-4 py-1.5 bg-beige-100 text-beige-800 rounded-full text-xs font-bold uppercase tracking-widest border border-beige-200">
              {grade}
            </span>
            <span className="px-4 py-1.5 bg-beige-800 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
              Rank: {rank ? `#${rank}` : 'Unranked'}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 bg-beige-100 text-beige-600 rounded-xl hover:bg-beige-200 transition-all shadow-sm"
            title="Profile Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="flex gap-4">
            <div className="bg-white/80 p-4 rounded-3xl border border-beige-200 shadow-sm flex flex-col items-center min-w-[100px] relative overflow-hidden group">
              <div className="absolute inset-0 bg-beige-800/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <Zap className="w-6 h-6 text-beige-500 mb-1 relative z-10" />
              <span className="text-xl font-bold text-beige-900 relative z-10">{streakCount}</span>
              <span className="text-[10px] font-bold text-beige-400 uppercase tracking-widest relative z-10">Day Streak</span>
              <div className="mt-2 pt-2 border-t border-beige-100 w-full flex flex-col items-center relative z-10">
                <div className="flex items-center gap-1">
                  <Gem className="w-3 h-3 text-beige-500" />
                  <span className="text-xs font-bold text-beige-800">{gems}</span>
                </div>
                <span className="text-[8px] font-bold text-beige-300 uppercase tracking-widest">Gems</span>
              </div>
            </div>
            <div className="bg-white/80 p-4 rounded-3xl border border-beige-200 shadow-sm flex flex-col items-center min-w-[100px]">
              <Trophy className="w-6 h-6 text-beige-500 mb-1" />
              <span className="text-xl font-bold text-beige-900">{xp}</span>
              <span className="text-[10px] font-bold text-beige-400 uppercase tracking-widest">XP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Rewards & Progression */}
        <div className="bg-white/60 backdrop-blur-md p-8 rounded-[40px] border border-beige-200 shadow-xl shadow-beige-900/5 space-y-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-beige-100 rounded-xl">
                <Sparkles className="w-5 h-5 text-beige-600" />
              </div>
              <h3 className="text-xl font-serif font-bold text-beige-900 uppercase tracking-widest">Rewards & Progression</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 bg-beige-50 rounded-3xl border border-beige-100 space-y-4">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-beige-500" />
                <h4 className="font-bold text-beige-900 uppercase tracking-widest text-sm">Support Callista</h4>
              </div>
              <p className="text-xs text-beige-600 leading-relaxed">
                Callista is free for everyone. If you find it helpful, consider making a donation to help us keep it running!
              </p>
              <button 
                onClick={() => {
                  const homeSection = document.getElementById('donation-section');
                  if (homeSection) {
                    homeSection.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.href = '/#donation-section';
                  }
                }}
                className="w-full py-3 bg-beige-800 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-beige-900 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Make a Donation
              </button>
            </div>

            <div className="p-6 bg-beige-50 rounded-3xl border border-beige-100 space-y-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-beige-500" />
                <h4 className="font-bold text-beige-900 uppercase tracking-widest text-sm">Level Progress</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-beige-400 uppercase tracking-widest">
                  <span>Level {Math.floor(xp / 100) + 1}</span>
                  <span>{xp % 100} / 100 XP</span>
                </div>
                <div className="h-2 bg-beige-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${xp % 100}%` }}
                    className="h-full bg-beige-800"
                  />
                </div>
              </div>
              <p className="text-[10px] text-beige-500 italic">Complete more challenges and study tasks to level up!</p>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white/60 backdrop-blur-md p-8 rounded-[40px] border border-beige-200 shadow-xl shadow-beige-900/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-beige-100 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-beige-600" />
            </div>
            <h3 className="text-xl font-serif font-bold text-beige-900 uppercase tracking-widest">Account Details</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-beige-50 rounded-2xl border border-beige-100">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-beige-400" />
                <span className="text-sm font-bold text-beige-400 uppercase tracking-widest">Email</span>
              </div>
              <span className="text-sm font-medium text-beige-800">{user.email}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-beige-50 rounded-2xl border border-beige-100">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-beige-400" />
                <span className="text-sm font-bold text-beige-400 uppercase tracking-widest">Joined</span>
              </div>
              <span className="text-sm font-medium text-beige-800">{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Grade Selection */}
        <div className="bg-white/60 backdrop-blur-md p-8 rounded-[40px] border border-beige-200 shadow-xl shadow-beige-900/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-beige-100 rounded-xl">
              <Settings className="w-5 h-5 text-beige-600" />
            </div>
            <h3 className="text-xl font-serif font-bold text-beige-900 uppercase tracking-widest">Grade Level</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-xs text-beige-600 font-medium">Setting your grade level helps us tailor the AI content to your specific needs.</p>
            <div className="grid grid-cols-3 gap-2">
              {['Grade 1', 'Grade 6', 'Grade 10', 'Grade 12', 'University'].map(g => (
                <button
                  key={g}
                  onClick={() => handleGradeChange(g)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                    grade === g
                      ? "bg-beige-800 text-white border-beige-800 shadow-md"
                      : "bg-white text-beige-400 border-beige-200 hover:border-beige-400"
                  )}
                >
                  {g}
                </button>
              ))}
              <select 
                value={['Grade 1', 'Grade 6', 'Grade 10', 'Grade 12', 'University'].includes(grade) ? '' : grade}
                onChange={(e) => handleGradeChange(e.target.value)}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all bg-white text-beige-400 border-beige-200",
                  !['Grade 1', 'Grade 6', 'Grade 10', 'Grade 12', 'University'].includes(grade) && "bg-beige-800 text-white border-beige-800 shadow-md"
                )}
              >
                <option value="" disabled>Other...</option>
                {['Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 11'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white/60 backdrop-blur-md p-8 rounded-[40px] border border-beige-200 shadow-xl shadow-beige-900/5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/leaderboard" className="flex items-center gap-4 p-5 bg-beige-800 rounded-2xl border border-beige-800 hover:bg-beige-900 transition-all group shadow-lg">
            <div className="p-3 bg-white/10 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
              <ListOrdered className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white uppercase tracking-widest text-sm">Leaderboard</span>
          </Link>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-beige-100 hover:border-beige-300 hover:bg-beige-50 transition-all group shadow-sm"
          >
            <div className="p-3 bg-beige-100 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
              <Settings className="w-5 h-5 text-beige-600" />
            </div>
            <span className="font-bold text-beige-900 uppercase tracking-widest text-sm">Settings</span>
          </button>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-4 p-5 bg-beige-50 rounded-2xl border border-beige-100 hover:border-red-200 hover:bg-red-50 transition-all group"
          >
            <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <span className="font-bold text-red-900 uppercase tracking-widest text-sm">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Developer Tools (Only for Creator) */}
      {user?.email === 'reply2kna@gmail.com' && (
        <div className="bg-red-50/50 backdrop-blur-md p-8 rounded-[40px] border border-red-100 shadow-xl shadow-red-900/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-xl font-serif font-bold text-red-900 uppercase tracking-widest">Developer Tools</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={async () => {
                if (confirm("Reset the entire leaderboard for all users? This cannot be undone.")) {
                  setIsResetting(true);
                  try {
                    await resetLeaderboard();
                    alert("Leaderboard has been reset!");
                  } catch (e) {
                    alert("Failed to reset leaderboard.");
                  } finally {
                    setIsResetting(false);
                  }
                }
              }}
              disabled={isResetting}
              className="flex items-center justify-center gap-3 p-4 bg-red-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg disabled:opacity-50"
            >
              <RotateCcw className={cn("w-4 h-4", isResetting && "animate-spin")} />
              Reset Global Leaderboard
            </button>
            <button 
              onClick={async () => {
                if (confirm("Reset your account gems, XP, and streak?")) {
                  setIsResetting(true);
                  try {
                    await resetAccount();
                    alert("Your account has been reset!");
                  } catch (e) {
                    alert("Failed to reset account.");
                  } finally {
                    setIsResetting(false);
                  }
                }
              }}
              disabled={isResetting}
              className="flex items-center justify-center gap-3 p-4 bg-white text-red-600 border border-red-200 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-red-50 transition-all shadow-sm disabled:opacity-50"
            >
              <RotateCcw className={cn("w-4 h-4", isResetting && "animate-spin")} />
              Reset My Account
            </button>
          </div>
          <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest text-center italic">
            Note: These tools are only visible to you (reply2kna@gmail.com)
          </p>
        </div>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-beige-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl border border-beige-200 overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-serif font-bold text-beige-900 uppercase tracking-widest">Profile Settings</h3>
                  <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-beige-50 rounded-full transition-colors">
                    <X className="w-6 h-6 text-beige-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className="w-24 h-24 bg-beige-100 rounded-full overflow-hidden border-2 border-beige-200">
                        {editPhoto ? (
                          <img src={editPhoto} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="w-12 h-12 text-beige-400 m-6" />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-beige-400 uppercase tracking-widest">Profile Picture URL</p>
                    <input 
                      type="text" 
                      value={editPhoto}
                      onChange={(e) => setEditPhoto(e.target.value)}
                      placeholder="Enter photo URL..."
                      className="w-full px-4 py-3 bg-beige-50 border border-beige-200 rounded-xl text-sm focus:border-beige-800 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-beige-400 uppercase tracking-widest">Display Name</p>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter your name..."
                      className="w-full px-4 py-3 bg-beige-50 border border-beige-200 rounded-xl text-sm focus:border-beige-800 outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                  className="w-full py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
