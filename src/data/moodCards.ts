/**
 * Mood Cards Data
 * 
 * Predefined cards for the Card Draw input experience.
 * Users tap to select up to 5 cards representing their mood/preferences.
 * 
 * @created 2025-12-11
 */

export interface MoodCard {
  id: string;
  emoji: string;
  label: string;
  gradient: string;
  category: 'mood' | 'activity' | 'budget';
}

export const MOOD_CARDS: MoodCard[] = [
  // Mood cards
  { id: 'adventure', emoji: '🏔️', label: 'Craving adventure', gradient: 'from-orange-400 to-red-500', category: 'mood' },
  { id: 'cozy', emoji: '🛋️', label: 'Need cozy time', gradient: 'from-amber-300 to-orange-400', category: 'mood' },
  { id: 'deep-talk', emoji: '💭', label: 'Want deep talks', gradient: 'from-purple-400 to-indigo-500', category: 'mood' },
  { id: 'playful', emoji: '🎮', label: 'Feeling playful', gradient: 'from-pink-400 to-rose-500', category: 'mood' },
  { id: 'romantic', emoji: '💕', label: 'Craving romance', gradient: 'from-red-400 to-pink-500', category: 'mood' },
  { id: 'tired', emoji: '😴', label: 'Exhausted', gradient: 'from-slate-400 to-gray-500', category: 'mood' },
  
  // Activity cards
  { id: 'spontaneous', emoji: '✨', label: 'Ready for anything', gradient: 'from-yellow-400 to-amber-500', category: 'activity' },
  { id: 'outdoors', emoji: '🌳', label: 'Want fresh air', gradient: 'from-green-400 to-emerald-500', category: 'activity' },
  { id: 'creative', emoji: '🎨', label: 'Feeling creative', gradient: 'from-violet-400 to-purple-500', category: 'activity' },
  { id: 'foodie', emoji: '🍽️', label: 'Food-focused', gradient: 'from-orange-400 to-amber-500', category: 'activity' },
  
  // Budget cards
  { id: 'budget', emoji: '💰', label: 'Keeping it free', gradient: 'from-green-400 to-teal-500', category: 'budget' },
  { id: 'splurge', emoji: '💎', label: 'Ready to splurge', gradient: 'from-blue-400 to-indigo-500', category: 'budget' },
];

// Maximum cards a user can select
export const MAX_CARD_SELECTIONS = 5;
