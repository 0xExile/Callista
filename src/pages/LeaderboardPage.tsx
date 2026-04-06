import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Star, User, Crown } from 'lucide-react';
import { useGems } from '../contexts/GemsContext';
import { cn } from '@/src/lib/utils';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export const LeaderboardPage = () => {
  const { fetchLeaderboard, user, weeklyGems, gems, isChampion } = useGems();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const day = new Date().getDay();
    const isSunday = day === 0;
    
    // On Sunday, we show the frozen results from 'previousWeeklyGems'
    // On Mon-Sat, we show the current 'weeklyGems'
    const sortField = isSunday ? 'previousWeeklyGems' : 'weeklyGems';
    const q = query(usersRef, orderBy(sortField, 'desc'), limit(10));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setLeaderboard(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leaderboard:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1: return <Medal className="w-6 h-6 text-slate-400" />;
      case 2: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <span className="text-lg font-bold text-beige-400">#{index + 1}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex p-4 bg-beige-800 rounded-full text-white shadow-2xl mb-4"
        >
          <Trophy className="w-12 h-12" />
        </motion.div>
        <h1 className="text-5xl font-serif font-bold text-beige-900">
          {new Date().getDay() === 0 ? "Last Week's Results" : "Weekly Leaderboard"}
        </h1>
        <p className="text-beige-600 font-medium max-w-xl mx-auto">
          {new Date().getDay() === 0 
            ? "The week has ended! Here are the final standings. New week starts Monday."
            : "Compete with fellow students. The top learner each week earns 10 bonus gems and the title of Champion of Callista!"
          }
        </p>
      </div>

      {/* User's Current Rank Card */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-beige-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex items-center justify-between"
        >
          <div className="absolute inset-0 bg-sheen opacity-10 pointer-events-none" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">{user.displayName || 'You'}</h3>
                {isChampion && (
                  <span className="px-3 py-1 bg-yellow-500 text-black text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Champion
                  </span>
                )}
              </div>
              <p className="text-beige-400 text-sm font-medium uppercase tracking-widest">Your Weekly Progress</p>
            </div>
          </div>
          <div className="flex gap-8 relative z-10">
            <div className="text-right">
              <div className="text-4xl font-serif font-bold">{weeklyGems}</div>
              <div className="text-[10px] font-bold text-beige-400 uppercase tracking-widest">Gems this week</div>
            </div>
            <div className="text-right opacity-60">
              <div className="text-4xl font-serif font-bold">{gems}</div>
              <div className="text-[10px] font-bold text-beige-400 uppercase tracking-widest">Total Gems</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Champion Spotlight - Only shown on Sunday/Monday or when a champion is active */}
      {leaderboard.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-yellow-50 to-amber-50 p-8 rounded-[40px] border border-yellow-200 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Crown className="w-24 h-24 text-yellow-600" />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-yellow-400 shadow-lg overflow-hidden">
                {leaderboard[0].photoURL ? (
                  <img src={leaderboard[0].photoURL} alt="Champion" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-12 h-12 text-yellow-600" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 rounded-full shadow-md">
                <Trophy className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h3 className="text-2xl font-serif font-bold text-yellow-900">Champion of Callista</h3>
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
              <p className="text-yellow-800 font-medium">
                {new Date().getDay() === 0 
                  ? (leaderboard[0].uid === user?.uid ? "Congratulations! You are the Champion of the week!" : `${leaderboard[0].displayName || 'Anonymous Student'} is the Champion of the week!`)
                  : (leaderboard[0].uid === user?.uid ? "Congratulations! You are currently leading the board." : `${leaderboard[0].displayName || 'Anonymous Student'} is currently leading the week!`)
                }
              </p>
              <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                <div className="px-4 py-1.5 bg-yellow-400 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                  Current Rank #1
                </div>
                <div className="text-yellow-700 text-xs font-bold uppercase tracking-widest">
                  {leaderboard[0].weeklyGems} Gems this week
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard List */}
      <div className="bg-white/60 backdrop-blur-md rounded-[48px] border border-beige-200 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-beige-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-beige-600 font-bold uppercase tracking-widest text-xs">Loading Rankings...</p>
          </div>
        ) : (
          <div className="divide-y divide-beige-100">
            {leaderboard.map((entry, i) => (
              <motion.div
                key={entry.uid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "flex items-center justify-between p-6 hover:bg-beige-50 transition-all",
                  user?.uid === entry.uid && "bg-beige-100/50"
                )}
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 flex justify-center">
                    {getRankIcon(i)}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-beige-200 rounded-full flex items-center justify-center overflow-hidden border border-beige-300">
                      {entry.photoURL ? (
                        <img src={entry.photoURL} alt={entry.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-6 h-6 text-beige-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-beige-900">{entry.displayName || 'Anonymous Student'}</span>
                        {i === 0 && (
                          <span className="px-2 py-0.5 bg-yellow-500 text-black text-[8px] font-bold rounded-full uppercase tracking-widest flex items-center gap-1">
                            <Crown className="w-2 h-2" /> Current Leader
                          </span>
                        )}
                        {entry.isChampion && (
                          <span className="px-2 py-0.5 bg-beige-800 text-white text-[8px] font-bold rounded-full uppercase tracking-widest flex items-center gap-1">
                            <Star className="w-2 h-2" /> Champion
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-beige-400 uppercase tracking-widest">Rank #{i + 1}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-serif font-bold text-beige-900">{entry.weeklyGems}</div>
                  <div className="text-[10px] font-bold text-beige-400 uppercase tracking-widest">Gems</div>
                </div>
              </motion.div>
            ))}
            {leaderboard.length === 0 && (
              <div className="p-20 text-center text-beige-400 font-medium">
                No rankings available yet. Be the first to earn gems!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
