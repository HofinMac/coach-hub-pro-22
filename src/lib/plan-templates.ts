import type { PlanExercise } from "./demo-data";

export interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  exercises: PlanExercise[];
}

export const planTemplates: PlanTemplate[] = [
  {
    id: 'tpl1',
    name: 'Full Body – Začátečník',
    description: 'Základní celotělový plán pro nováčky. 3× týdně.',
    category: 'Začátečník',
    exercises: [
      { exerciseId: 'e21', exerciseName: 'Goblet dřep', sets: 3, reps: '10', rpe: 6, rest: 90 },
      { exerciseId: 'e35', exerciseName: 'Kliky', sets: 3, reps: '10', rpe: 6, rest: 60 },
      { exerciseId: 'e41', exerciseName: 'Přítahy jednoručkou', sets: 3, reps: '10', rpe: 6, rest: 90 },
      { exerciseId: 'e29', exerciseName: 'Glute Bridge', sets: 3, reps: '12', rpe: 6, rest: 60 },
      { exerciseId: 'e17', exerciseName: 'Plank', sets: 3, reps: '30s', rpe: 5, rest: 60 },
    ],
  },
  {
    id: 'tpl2',
    name: 'Tlakový den',
    description: 'Klasický tlakový den pro pokročilé. Hrudník, ramena, triceps.',
    category: 'Split',
    exercises: [
      { exerciseId: 'e9', exerciseName: 'Bench Press', sets: 4, reps: '8', rpe: 8, rest: 120 },
      { exerciseId: 'e11', exerciseName: 'Šikmý tlak s jednoručkami', sets: 4, reps: '10', rpe: 7, rest: 90 },
      { exerciseId: 'e33', exerciseName: 'Tlak s jednoručkami vsedě', sets: 3, reps: '10', rpe: 7, rest: 90 },
      { exerciseId: 'e34', exerciseName: 'Upažování (Lateral Raise)', sets: 3, reps: '15', rpe: 7, rest: 60 },
      { exerciseId: 'e36', exerciseName: 'Kabelové rozvodky (Cable Fly)', sets: 3, reps: '12', rpe: 7, rest: 60 },
      { exerciseId: 'e37', exerciseName: 'Tricepsové stahování (Pushdown)', sets: 3, reps: '15', rpe: 7, rest: 60 },
    ],
  },
  {
    id: 'tpl3',
    name: 'Tahový den',
    description: 'Tahový den. Záda, biceps, zadní ramena.',
    category: 'Split',
    exercises: [
      { exerciseId: 'e13', exerciseName: 'Přítahy s velkou činkou', sets: 4, reps: '8', rpe: 8, rest: 120 },
      { exerciseId: 'e39', exerciseName: 'Horní kladka (Lat Pulldown)', sets: 4, reps: '10', rpe: 7, rest: 90 },
      { exerciseId: 'e16', exerciseName: 'Kabelové přítahy vsedě', sets: 3, reps: '12', rpe: 7, rest: 90 },
      { exerciseId: 'e15', exerciseName: 'Face Pulls', sets: 3, reps: '15', rpe: 6, rest: 60 },
      { exerciseId: 'e43', exerciseName: 'Bicepsový zdvih s velkou činkou', sets: 3, reps: '10', rpe: 7, rest: 60 },
      { exerciseId: 'e44', exerciseName: 'Kladivový zdvih (Hammer Curl)', sets: 3, reps: '12', rpe: 7, rest: 60 },
    ],
  },
  {
    id: 'tpl4',
    name: 'Den nohou – Síla',
    description: 'Silový trénink nohou se zaměřením na dřep a mrtvý tah.',
    category: 'Split',
    exercises: [
      { exerciseId: 'e1', exerciseName: 'Zadní dřep (Back Squat)', sets: 5, reps: '5', rpe: 8, rest: 180 },
      { exerciseId: 'e5', exerciseName: 'Rumunský mrtvý tah', sets: 4, reps: '8', rpe: 7, rest: 120 },
      { exerciseId: 'e3', exerciseName: 'Bulharský dřep', sets: 3, reps: '10', rpe: 7, rest: 120 },
      { exerciseId: 'e30', exerciseName: 'Zakopávání vleže (Leg Curl)', sets: 3, reps: '12', rpe: 7, rest: 60 },
      { exerciseId: 'e23', exerciseName: 'Předkopávání (Leg Extension)', sets: 3, reps: '12', rpe: 7, rest: 60 },
    ],
  },
  {
    id: 'tpl5',
    name: 'Horní tělo – Hypertrofie',
    description: 'Objem pro horní polovinu těla. 10–15 opakování.',
    category: 'Hypertrofie',
    exercises: [
      { exerciseId: 'e11', exerciseName: 'Šikmý tlak s jednoručkami', sets: 4, reps: '12', rpe: 7, rest: 90 },
      { exerciseId: 'e40', exerciseName: 'T-Bar přítahy', sets: 4, reps: '12', rpe: 7, rest: 90 },
      { exerciseId: 'e10', exerciseName: 'Tlak nad hlavu (OHP)', sets: 3, reps: '10', rpe: 7, rest: 90 },
      { exerciseId: 'e42', exerciseName: 'Shyby nadhmatem (Chin-Up)', sets: 3, reps: '10', rpe: 7, rest: 90 },
      { exerciseId: 'e36', exerciseName: 'Kabelové rozvodky (Cable Fly)', sets: 3, reps: '15', rpe: 7, rest: 60 },
      { exerciseId: 'e45', exerciseName: 'Zadní deltový fly', sets: 3, reps: '15', rpe: 6, rest: 60 },
    ],
  },
  {
    id: 'tpl6',
    name: 'Zaměření na hýždě',
    description: 'Trénink zaměřený na gluteální svaly. Skvělé pro bikini přípravku.',
    category: 'Specializace',
    exercises: [
      { exerciseId: 'e7', exerciseName: 'Hip Thrust', sets: 4, reps: '12', rpe: 8, rest: 120 },
      { exerciseId: 'e3', exerciseName: 'Bulharský dřep', sets: 3, reps: '10', rpe: 7, rest: 120 },
      { exerciseId: 'e5', exerciseName: 'Rumunský mrtvý tah', sets: 3, reps: '12', rpe: 7, rest: 90 },
      { exerciseId: 'e22', exerciseName: 'Výpady v chůzi', sets: 3, reps: '16', rpe: 7, rest: 90 },
      { exerciseId: 'e29', exerciseName: 'Glute Bridge', sets: 3, reps: '15', rpe: 6, rest: 60 },
    ],
  },
  {
    id: 'tpl7',
    name: 'Rehabilitace – Rameno',
    description: 'Rehabilitační program pro zranění ramene. Nízká intenzita.',
    category: 'Rehabilitace',
    exercises: [
      { exerciseId: 'e62', exerciseName: 'Rozpažování s gumou', sets: 3, reps: '20', rpe: 4, rest: 45 },
      { exerciseId: 'e15', exerciseName: 'Face Pulls', sets: 3, reps: '15', rpe: 5, rest: 60 },
      { exerciseId: 'e34', exerciseName: 'Upažování (Lateral Raise)', sets: 3, reps: '12', rpe: 5, rest: 60 },
      { exerciseId: 'e60', exerciseName: 'Kočka–kráva (Cat-Cow)', sets: 2, reps: '10', rpe: 3, rest: 30 },
      { exerciseId: 'e64', exerciseName: 'Extenze hrudní páteře', sets: 2, reps: '10', rpe: 3, rest: 30 },
    ],
  },
  {
    id: 'tpl8',
    name: 'HIIT Kondice',
    description: 'Vysokointenzivní intervalový trénink. 20–30 minut.',
    category: 'Kondice',
    exercises: [
      { exerciseId: 'e19', exerciseName: 'Intervaly na Assault Bike', sets: 6, reps: '30s', rpe: 9, rest: 30 },
      { exerciseId: 'e55', exerciseName: 'Box Jumps', sets: 4, reps: '8', rpe: 7, rest: 60 },
      { exerciseId: 'e56', exerciseName: 'Burpees', sets: 3, reps: '10', rpe: 8, rest: 60 },
      { exerciseId: 'e54', exerciseName: 'Battle Ropes', sets: 4, reps: '30s', rpe: 8, rest: 30 },
      { exerciseId: 'e27', exerciseName: 'Kettlebell Swing', sets: 4, reps: '15', rpe: 7, rest: 45 },
    ],
  },
  {
    id: 'tpl9',
    name: 'Mobilita a zotavení',
    description: 'Aktivní regenerace a práce na mobilitě. Ideální na volný den.',
    category: 'Mobilita',
    exercises: [
      { exerciseId: 'e59', exerciseName: 'World\'s Greatest Stretch', sets: 2, reps: '5 na stranu', rpe: 3, rest: 30 },
      { exerciseId: 'e60', exerciseName: 'Kočka–kráva (Cat-Cow)', sets: 2, reps: '10', rpe: 3, rest: 30 },
      { exerciseId: 'e20', exerciseName: 'Protažení kyčle 90/90', sets: 2, reps: '30s na stranu', rpe: 3, rest: 30 },
      { exerciseId: 'e64', exerciseName: 'Extenze hrudní páteře', sets: 2, reps: '10', rpe: 3, rest: 30 },
      { exerciseId: 'e65', exerciseName: 'Protažení kotníku do dorziflex', sets: 2, reps: '30s na stranu', rpe: 3, rest: 30 },
      { exerciseId: 'e63', exerciseName: 'Foam Roll (IT pásmo)', sets: 1, reps: '60s na stranu', rpe: 4, rest: 0 },
    ],
  },
  {
    id: 'tpl10',
    name: 'Powerlifting – soutěžní příprava',
    description: 'Příprava na soutěž. SBD v nízké objemové fázi.',
    category: 'Síla',
    exercises: [
      { exerciseId: 'e1', exerciseName: 'Zadní dřep (Back Squat)', sets: 5, reps: '3', rpe: 9, rest: 240 },
      { exerciseId: 'e9', exerciseName: 'Bench Press', sets: 5, reps: '3', rpe: 9, rest: 180 },
      { exerciseId: 'e6', exerciseName: 'Klasický mrtvý tah', sets: 3, reps: '2', rpe: 9.5, rest: 300 },
      { exerciseId: 'e18', exerciseName: 'Pallof Press', sets: 3, reps: '10', rpe: 5, rest: 60 },
    ],
  },
];
