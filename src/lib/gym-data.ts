import type { Coach } from "./demo-data";

export interface Gym {
  id: string;
  name: string;
  address: string;
  city: string;
  description: string;
  amenities: string[];
  openingHours: string;
  coachIds: string[];
  rating: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  targetType: "gym" | "coach";
  targetId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const gyms: Gym[] = [
  {
    id: "g1",
    name: "FitZone Praha – Vinohrady",
    address: "Vinohradská 42, Praha 2",
    city: "Praha",
    description: "Moderní posilovna s kompletním vybavením pro silový trénink. Olympijské plošiny, rack station, kardio zóna.",
    amenities: ["Olympijské plošiny", "Squat racky", "Kardio zóna", "Sprchy", "Šatny", "Sauna", "Parkování"],
    openingHours: "Po–Pá 6:00–22:00, So–Ne 8:00–20:00",
    coachIds: ["c1", "c2"],
    rating: 4.7,
    reviewCount: 23,
  },
  {
    id: "g2",
    name: "Apex Fitness Praha – Smíchov",
    address: "Plzeňská 115, Praha 5",
    city: "Praha",
    description: "Menší pobočka zaměřená na funkční trénink a skupinové lekce. Skvělé pro HIIT a kondici.",
    amenities: ["Funkční zóna", "TRX", "Assault bikes", "Battle ropes", "Sprchy", "Šatny"],
    openingHours: "Po–Pá 7:00–21:00, So 8:00–18:00",
    coachIds: ["c1"],
    rating: 4.4,
    reviewCount: 15,
  },
  {
    id: "g3",
    name: "Iron Temple Brno",
    address: "Masarykova 28, Brno",
    city: "Brno",
    description: "Hardcorová posilovna pro powerlifting a bodybuilding. Specializované vybavení, chalková zóna.",
    amenities: ["Deadlift plošiny", "Mono lift", "Belt squat", "Chalk zóna", "Sprchy", "Obchod s doplňky"],
    openingHours: "Po–Pá 6:00–22:00, So–Ne 7:00–20:00",
    coachIds: ["c3"],
    rating: 4.8,
    reviewCount: 31,
  },
  {
    id: "g4",
    name: "RehabFit Centrum",
    address: "Na Příkopě 12, Praha 1",
    city: "Praha",
    description: "Rehabilitační a fyzioterapeutické centrum. Ideální pro klienty po operacích a se zraněními.",
    amenities: ["Rehabilitační pomůcky", "Bazén", "Vířivka", "Soukromé místnosti", "Bezbariérový přístup"],
    openingHours: "Po–Pá 7:00–20:00",
    coachIds: ["c2"],
    rating: 4.9,
    reviewCount: 18,
  },
  {
    id: "g5",
    name: "PowerHouse Ostrava",
    address: "Stodolní 8, Ostrava",
    city: "Ostrava",
    description: "Největší posilovna v Ostravě. Široký výběr strojů, volné váhy i kardio.",
    amenities: ["Volné váhy", "Stroje", "Kardio zóna", "Skupinový sál", "Sprchy", "Bar"],
    openingHours: "Po–Pá 5:30–23:00, So–Ne 7:00–21:00",
    coachIds: ["c3"],
    rating: 4.3,
    reviewCount: 42,
  },
];

export const reviews: Review[] = [
  // Gym reviews
  { id: "r1", targetType: "gym", targetId: "g1", clientId: "cl2", clientName: "Elena Voss", rating: 5, comment: "Skvělé vybavení, čisto a personál je milý. Doporučuji!", createdAt: "2026-03-10" },
  { id: "r2", targetType: "gym", targetId: "g1", clientId: "cl3", clientName: "James Park", rating: 4, comment: "Solidní gym, jen bych ocenil víc squat racků ve špičce.", createdAt: "2026-03-05" },
  { id: "r3", targetType: "gym", targetId: "g3", clientId: "cl9", clientName: "Ryan Brooks", rating: 5, comment: "Nejlepší gym pro seriózní trénink. Atmosféra je fantastická.", createdAt: "2026-02-28" },
  { id: "r4", targetType: "gym", targetId: "g4", clientId: "cl6", clientName: "Lily Thompson", rating: 5, comment: "Perfektní pro rehabilitaci. Vybavení na špičkové úrovni.", createdAt: "2026-03-12" },
  { id: "r5", targetType: "gym", targetId: "g2", clientId: "cl4", clientName: "Sofia Reyes", rating: 4, comment: "Menší, ale útulné. Skupinové lekce jsou super.", createdAt: "2026-03-08" },
  // Coach reviews
  { id: "r6", targetType: "coach", targetId: "c1", clientId: "cl2", clientName: "Elena Voss", rating: 5, comment: "Alex je naprosto profesionální. Skvělý přístup a výsledky.", createdAt: "2026-03-15" },
  { id: "r7", targetType: "coach", targetId: "c1", clientId: "cl3", clientName: "James Park", rating: 5, comment: "Díky Alexovi jsem se zbavil problémů s ramenem. Doporučuji.", createdAt: "2026-03-01" },
  { id: "r8", targetType: "coach", targetId: "c1", clientId: "cl4", clientName: "Sofia Reyes", rating: 4, comment: "Výborný trenér, jen by mohl být trochu flexibilnější s časy.", createdAt: "2026-02-20" },
  { id: "r9", targetType: "coach", targetId: "c2", clientId: "cl6", clientName: "Lily Thompson", rating: 5, comment: "Sarah je úžasná. Po operaci kolene mě dala dohromady.", createdAt: "2026-03-14" },
  { id: "r10", targetType: "coach", targetId: "c3", clientId: "cl9", clientName: "Ryan Brooks", rating: 5, comment: "Mike ví přesně co dělá. Moje příprava na soutěž je na 100%.", createdAt: "2026-03-11" },
  { id: "r11", targetType: "coach", targetId: "c3", clientId: "cl10", clientName: "Jessica Lane", rating: 4, comment: "Skvělý plán, vidím pokroky každý týden.", createdAt: "2026-03-06" },
];

export function getGymsByCoach(coachId: string) {
  return gyms.filter(g => g.coachIds.includes(coachId));
}

export function getReviewsForTarget(targetType: "gym" | "coach", targetId: string) {
  return reviews.filter(r => r.targetType === targetType && r.targetId === targetId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAverageRating(targetType: "gym" | "coach", targetId: string) {
  const targetReviews = reviews.filter(r => r.targetType === targetType && r.targetId === targetId);
  if (targetReviews.length === 0) return 0;
  return targetReviews.reduce((sum, r) => sum + r.rating, 0) / targetReviews.length;
}
