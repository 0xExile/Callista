import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

interface GemsContextType {
  gems: number;
  xp: number;
  streakCount: number;
  isChampion: boolean;
  weeklyGems: number;
  addGems: (amount: number) => void;
  addXP: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  user: User | null;
  loading: boolean;
  recordActivity: () => void;
  fetchLeaderboard: () => Promise<any[]>;
  resetAccount: () => Promise<void>;
  resetLeaderboard: () => Promise<void>;
}

const GemsContext = createContext<GemsContextType | undefined>(undefined);

export const GemsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [gems, setGems] = useState<number>(0);
  const [weeklyGems, setWeeklyGems] = useState<number>(0);
  const [xp, setXP] = useState<number>(0);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [isChampion, setIsChampion] = useState<boolean>(false);
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null);
  const [lastResetDate, setLastResetDate] = useState<string | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    const minTime = 800; // Reduced loading time slightly

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        const elapsed = Date.now() - startTime;
        setTimeout(() => setLoading(false), Math.max(0, minTime - elapsed));
        
        // Load from localStorage as fallback
        const savedGems = parseInt(localStorage.getItem('gems') || '0');
        const savedXP = parseInt(localStorage.getItem('xp') || '0');
        const savedStreak = parseInt(localStorage.getItem('streakCount') || '0');
        const savedLastActiveDate = localStorage.getItem('lastActiveDate');
        
        // One-time reset check for non-logged in users
        const isReset = localStorage.getItem('callista_reset_v1');
        if (!isReset) {
          localStorage.setItem('gems', '10');
          localStorage.setItem('xp', '0');
          localStorage.setItem('weeklyGems', '0');
          localStorage.setItem('streakCount', '0');
          localStorage.setItem('callista_reset_v1', 'true');
          setGems(10);
          setXP(0);
          setWeeklyGems(0);
          setStreakCount(0);
        } else {
          if (savedGems > 0) setGems(savedGems);
          if (savedXP > 0) setXP(savedXP);
          if (savedStreak > 0) setStreakCount(savedStreak);
          if (savedLastActiveDate) setLastActiveDate(savedLastActiveDate);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const startTime = Date.now();
    const minTime = 800;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // One-time reset check for logged in users
        const isReset = localStorage.getItem(`callista_reset_v1_${user.uid}`);
        if (!isReset) {
          const resetData = {
            gems: 10,
            xp: 0,
            weeklyGems: 0,
            streakCount: 0,
            isChampion: false
          };
          setDoc(userDocRef, resetData, { merge: true });
          localStorage.setItem(`callista_reset_v1_${user.uid}`, 'true');
          setGems(10);
          setXP(0);
          setWeeklyGems(0);
          setStreakCount(0);
          setIsChampion(false);
          
          localStorage.setItem(`gems_${user.uid}`, '10');
          localStorage.setItem(`xp_${user.uid}`, '0');
          localStorage.setItem(`streakCount_${user.uid}`, '0');
        } else {
          // Only update if the value is actually different to avoid unnecessary re-renders
          setGems(prev => data.gems !== undefined && data.gems !== prev ? data.gems : prev);
          setXP(prev => data.xp !== undefined && data.xp !== prev ? data.xp : prev);
          setStreakCount(prev => data.streakCount !== undefined && data.streakCount !== prev ? data.streakCount : prev);
          setWeeklyGems(prev => data.weeklyGems !== undefined && data.weeklyGems !== prev ? data.weeklyGems : prev);
          setIsChampion(prev => data.isChampion !== undefined && data.isChampion !== prev ? data.isChampion : prev);
          setLastActiveDate(prev => data.lastActiveDate !== undefined && data.lastActiveDate !== prev ? data.lastActiveDate : prev);
          
          // Update cache with UID-specific keys
          localStorage.setItem(`gems_${user.uid}`, (data.gems || 0).toString());
          localStorage.setItem(`xp_${user.uid}`, (data.xp || 0).toString());
          localStorage.setItem(`streakCount_${user.uid}`, (data.streakCount || 0).toString());
        }
      } else {
        // Initialize user in Firestore if they don't exist
        const now = new Date();
        const initialData = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          gems: parseInt(localStorage.getItem('gems') || '10'),
          weeklyGems: 0,
          xp: parseInt(localStorage.getItem('xp') || '0'),
          streakCount: parseInt(localStorage.getItem('streakCount') || '0'),
          lastActiveDate: now.toISOString().split('T')[0],
          lastResetDate: now.toISOString(),
          isChampion: false
        };
        setDoc(userDocRef, initialData);
      }
      
      const elapsed = Date.now() - startTime;
      setTimeout(() => setLoading(false), Math.max(0, minTime - elapsed));
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const syncToFirebase = useCallback(async (updates: any) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, updates, { merge: true });
    }
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('weeklyGems', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }, []);

  const recordActivity = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    
    if (lastActiveDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (lastActiveDate === yesterdayStr) {
      newStreak = streakCount + 1;
    }
    
    setStreakCount(newStreak);
    setLastActiveDate(today);

    if (user) {
      localStorage.setItem(`streakCount_${user.uid}`, newStreak.toString());
      syncToFirebase({ streakCount: newStreak, lastActiveDate: today });
    } else {
      localStorage.setItem('streakCount', newStreak.toString());
      localStorage.setItem('lastActiveDate', today);
    }
  }, [user, syncToFirebase, lastActiveDate, streakCount]);

  const getStreakMultiplier = useCallback(() => {
    if (streakCount >= 7) return 2.0;
    if (streakCount >= 3) return 1.5;
    return 1.0;
  }, [streakCount]);

  const addGems = useCallback((amount: number) => {
    setGems(prevGems => {
      const newGems = prevGems + amount;
      localStorage.setItem('gems', newGems.toString());
      if (user) {
        localStorage.setItem(`gems_${user.uid}`, newGems.toString());
        syncToFirebase({ gems: newGems });
      }
      return newGems;
    });

    setWeeklyGems(prevWeekly => {
      const newWeekly = prevWeekly + amount;
      localStorage.setItem('weeklyGems', newWeekly.toString());
      if (user) {
        syncToFirebase({ weeklyGems: newWeekly });
      }
      return newWeekly;
    });
  }, [user, syncToFirebase]);

  const addXP = useCallback((amount: number) => {
    const multiplier = getStreakMultiplier();
    const finalAmount = Math.floor(amount * multiplier);
    
    setXP(prevXP => {
      const newXP = prevXP + finalAmount;
      localStorage.setItem('xp', newXP.toString());
      if (user) {
        localStorage.setItem(`xp_${user.uid}`, newXP.toString());
        syncToFirebase({ xp: newXP });
      }
      return newXP;
    });
  }, [user, syncToFirebase, getStreakMultiplier]);

  const spendGems = useCallback((amount: number) => {
    let success = false;
    setGems(prevGems => {
      if (prevGems >= amount) {
        const newGems = prevGems - amount;
        localStorage.setItem('gems', newGems.toString());
        if (user) {
          localStorage.setItem(`gems_${user.uid}`, newGems.toString());
          syncToFirebase({ gems: newGems });
        }
        success = true;
        return newGems;
      }
      return prevGems;
    });
    return success;
  }, [user, syncToFirebase]);

  const resetAccount = useCallback(async () => {
    setGems(10);
    setXP(0);
    setWeeklyGems(0);
    setStreakCount(0);
    setIsChampion(false);
    
    if (user) {
      localStorage.setItem(`gems_${user.uid}`, '10');
      localStorage.setItem(`xp_${user.uid}`, '0');
      localStorage.setItem(`streakCount_${user.uid}`, '0');
      await syncToFirebase({
        gems: 10,
        xp: 0,
        weeklyGems: 0,
        streakCount: 0,
        isChampion: false
      });
    } else {
      localStorage.setItem('gems', '10');
      localStorage.setItem('xp', '0');
      localStorage.setItem('streakCount', '0');
    }
  }, [user, syncToFirebase]);

  const resetLeaderboard = useCallback(async () => {
    if (!user || user.email !== 'reply2kna@gmail.com') {
      console.error("Unauthorized: Only the creator can reset the leaderboard.");
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const promises = querySnapshot.docs.map(docSnap => {
        const docRef = doc(db, 'users', docSnap.id);
        return setDoc(docRef, { weeklyGems: 0 }, { merge: true });
      });
      
      await Promise.all(promises);
      setWeeklyGems(0);
      console.log("Leaderboard reset successfully.");
    } catch (error) {
      console.error("Error resetting leaderboard:", error);
      throw error;
    }
  }, [user]);

  const value = React.useMemo(() => ({ 
    gems, 
    xp, 
    streakCount, 
    isChampion, 
    weeklyGems,
    addGems, 
    addXP, 
    spendGems, 
    user, 
    loading,
    recordActivity,
    fetchLeaderboard,
    resetAccount,
    resetLeaderboard
  }), [
    gems, 
    xp, 
    streakCount, 
    isChampion, 
    weeklyGems,
    addGems, 
    addXP, 
    spendGems, 
    user, 
    loading,
    recordActivity,
    fetchLeaderboard,
    resetAccount,
    resetLeaderboard
  ]);

  return (
    <GemsContext.Provider value={value}>
      {children}
    </GemsContext.Provider>
  );
};

export const useGems = () => {
  const context = useContext(GemsContext);
  if (context === undefined) {
    throw new Error('useGems must be used within a GemsProvider');
  }
  return context;
};
