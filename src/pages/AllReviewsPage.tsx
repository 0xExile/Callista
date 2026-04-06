import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Star, Users, ArrowLeft } from 'lucide-react';
import { db } from '@/src/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  rating: number;
  comment: string;
  timestamp: any;
}

export const AllReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(reviewsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reviews:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-20 px-4 space-y-12">
      <div className="flex flex-col items-start space-y-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-beige-500 hover:text-beige-900 font-bold uppercase tracking-widest text-xs transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Return to Home
        </Link>
        
        <Link 
          to="/reviews"
          className="flex items-center gap-2 text-beige-600 hover:text-beige-900 font-bold uppercase tracking-widest text-sm transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Share Review
        </Link>
      </div>

      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-beige-100 rounded-2xl flex items-center justify-center">
          <Users className="w-8 h-8 text-beige-600" />
        </div>
        <h1 className="text-5xl font-serif font-bold text-beige-900">Community Feedback</h1>
        <p className="text-beige-600 font-medium">See what other students are saying about Callista.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-beige-200 border-t-beige-800 rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 bg-white/60 backdrop-blur-md rounded-[40px] border border-beige-200">
          <p className="text-beige-600 text-lg">No reviews yet. Be the first to share your experience!</p>
          <Link 
            to="/reviews"
            className="mt-6 inline-block px-8 py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all"
          >
            Write a Review
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/60 backdrop-blur-md p-8 rounded-[40px] border border-beige-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {review.userPhoto ? (
                    <img 
                      src={review.userPhoto} 
                      alt={review.userName} 
                      className="w-12 h-12 rounded-full border-2 border-beige-100"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-beige-100 rounded-full flex items-center justify-center border-2 border-beige-100">
                      <Users className="w-6 h-6 text-beige-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-beige-900">{review.userName}</h3>
                    <p className="text-xs text-beige-400 uppercase tracking-widest">
                      {review.timestamp?.toDate().toLocaleDateString() || 'Recently'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-beige-200'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-beige-700 text-lg leading-relaxed italic">
                "{review.comment}"
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
