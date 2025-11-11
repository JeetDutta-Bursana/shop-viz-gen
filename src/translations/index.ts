import { en } from './en';
import { hi } from './hi';
import { bn } from './bn';

export type TranslationKey = keyof typeof en;

export const translations = {
  English: en,
  Hindi: hi,
  Bengali: bn,
  // Add more languages as needed
  Tamil: en,   // Placeholder - add Tamil translations later
  Telugu: en,  // Placeholder - add Telugu translations later
  Marathi: en, // Placeholder - add Marathi translations later
  Gujarati: en, // Placeholder - add Gujarati translations later
} as const;

export type Language = keyof typeof translations;

export const languages: Language[] = [
  'English',
  'Hindi',
  'Bengali',
  'Tamil',
  'Telugu',
  'Marathi',
  'Gujarati',
];

