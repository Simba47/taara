export interface Actor {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Non-Binary";
  type: "Lead" | "Character" | "Emerging" | "Supporting";
  status: "Available" | "Booked" | "On Hold";
  location: string;
  height: string;
  hair: string;
  eyes: string;
  bio: string;
  reelUrl: string;
  headshotUrl: string;
  slug: string;
  profileVisible: boolean;
  profilePassword?: string;
  profileExpiresAt?: string;
  languages: string[];
  skills: string[];
  accents: string[];
  filmography: FilmographyEntry[];
  portfolio: PortfolioItem[];
  works: WorkEntry[];
  managerNotes?: string;
  createdAt: string;
  updatedAt: string;
  profileCompleteness: number;
  color: string; // unique calendar color
}

export interface FilmographyEntry {
  id: string;
  title: string;
  role: string;
  year: number;
  type: "Film" | "TV Series" | "Short" | "Theatre";
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: "Headshot" | "Behind the Scenes" | "Editorial" | "Character Look";
  imageUrl: string;
}

export interface WorkEntry {
  id: string;
  projectName: string;
  role: string;
  director: string;
  year: number;
  type: "Film" | "TV Series" | "Short" | "Theatre" | "Web Series" | "Commercial";
  status: "Released" | "Post-Production" | "In Production" | "Upcoming";
  description: string;
  posterUrl?: string;
}

export interface CalendarEvent {
  id: string;
  actorId: string;
  actorName: string;
  title: string;
  type: "Audition" | "Callback" | "Booking" | "Meeting";
  date: string;
  time: string;
  endTime?: string;
  location: string;
  notes: string;
}

export interface Shortlist {
  id: string;
  name: string;
  description: string;
  actorIds: string[];
  createdAt: string;
  updatedAt: string;
  slug: string;
  views: ShortlistView[];
}

export interface ShortlistView {
  id: string;
  viewedAt: string;
  referrer: string;
  ip: string;
}

export interface CastingOpportunity {
  id: string;
  projectName: string;
  role: string;
  director: string;
  castingDirector: string;
  submissions: CastingSubmission[];
  deadline: string;
  notes: string;
  createdAt: string;
}

export interface CastingSubmission {
  id: string;
  actorId: string;
  actorName: string;
  status: "Submitted" | "Viewed" | "Shortlisted" | "Callback" | "Booked" | "Rejected";
  submittedAt: string;
  notes: string;
}

export interface Agency {
  name: string;
  slug: string;
  about: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  location: string;
  logoUrl: string;
  foundedYear: number;
}

const talentColors = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export const mockActors: Actor[] = [
  {
    id: "1",
    name: "Anya Kapoor",
    age: 28,
    gender: "Female",
    type: "Lead",
    status: "Available",
    location: "Mumbai, India",
    height: "5'7\"",
    hair: "Black",
    eyes: "Brown",
    bio: "Trained at FTII Pune with 6 years of experience across independent cinema and commercial productions. Known for nuanced dramatic performances and physical versatility.",
    reelUrl: "https://vimeo.com/example",
    headshotUrl: "",
    slug: "anya-kapoor",
    profileVisible: true,
    languages: ["Hindi", "English", "Marathi"],
    skills: ["Classical Dance", "Yoga", "Horse Riding", "Swimming"],
    accents: ["Standard Hindi", "British RP"],
    filmography: [
      { id: "f1", title: "The Last Monsoon", role: "Priya", year: 2024, type: "Film" },
      { id: "f2", title: "Echoes", role: "Meera", year: 2023, type: "TV Series" },
      { id: "f3", title: "Dust & Gold", role: "Ananya", year: 2022, type: "Film" },
    ],
    portfolio: [
      { id: "p1", title: "Dramatic Portrait", category: "Headshot", imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop" },
      { id: "p2", title: "On Set — The Last Monsoon", category: "Behind the Scenes", imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop" },
      { id: "p3", title: "Vogue India Feature", category: "Editorial", imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop" },
      { id: "p4", title: "Priya — Dust & Gold", category: "Character Look", imageUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop" },
    ],
    works: [
      { id: "w1", projectName: "The Last Monsoon", role: "Priya (Lead)", director: "Vikramaditya Motwane", year: 2024, type: "Film", status: "Released", description: "A haunting drama set during Mumbai's monsoon season." },
      { id: "w2", projectName: "Echoes", role: "Meera (Recurring)", director: "Reema Kagti", year: 2023, type: "TV Series", status: "Released", description: "A psychological thriller exploring memory and identity." },
      { id: "w3", projectName: "Untitled Dharma Project", role: "Female Lead", director: "Karan Johar", year: 2026, type: "Film", status: "Upcoming", description: "An upcoming romantic drama in pre-production." },
    ],
    managerNotes: "Strong for Dharma callback. Available from March onwards.",
    createdAt: "2024-01-15",
    updatedAt: "2026-03-01",
    profileCompleteness: 92,
    color: talentColors[0],
  },
  {
    id: "2",
    name: "Rohan Mehta",
    age: 34,
    gender: "Male",
    type: "Character",
    status: "Booked",
    location: "Delhi, India",
    height: "5'11\"",
    hair: "Dark Brown",
    eyes: "Hazel",
    bio: "Versatile character actor with NSD training. Excels in intense dramatic roles and dark comedy. 10+ years of theatre and screen experience.",
    reelUrl: "https://vimeo.com/example2",
    headshotUrl: "",
    slug: "rohan-mehta",
    profileVisible: true,
    languages: ["Hindi", "English", "Punjabi"],
    skills: ["Stage Combat", "Dialects", "Improv", "Guitar"],
    accents: ["Delhi Hindi", "General American"],
    filmography: [
      { id: "f4", title: "Crossfire", role: "Inspector Sharma", year: 2024, type: "Film" },
      { id: "f5", title: "The Wire Room", role: "Vikram", year: 2023, type: "TV Series" },
    ],
    portfolio: [
      { id: "p5", title: "Intense Close-up", category: "Headshot", imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop" },
      { id: "p6", title: "Action Sequence BTS", category: "Behind the Scenes", imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop" },
    ],
    works: [
      { id: "w4", projectName: "Crossfire", role: "Inspector Sharma (Lead)", director: "Neeraj Pandey", year: 2024, type: "Film", status: "Released", description: "An edge-of-seat action thriller following a rogue cop." },
      { id: "w5", projectName: "The Wire Room S2", role: "Inspector Vikram", director: "Neeraj Pandey", year: 2026, type: "TV Series", status: "In Production", description: "Season 2 of the acclaimed crime thriller." },
    ],
    managerNotes: "Currently on YRF shoot until April. Do not schedule.",
    createdAt: "2023-11-20",
    updatedAt: "2026-02-28",
    profileCompleteness: 78,
    color: talentColors[1],
  },
  {
    id: "3",
    name: "Zara Sheikh",
    age: 23,
    gender: "Female",
    type: "Emerging",
    status: "Available",
    location: "Mumbai, India",
    height: "5'5\"",
    hair: "Auburn",
    eyes: "Green",
    bio: "Fresh talent with a background in contemporary dance and short films. Recently graduated from Whistling Woods. Natural screen presence with strong comedic timing.",
    reelUrl: "https://vimeo.com/example3",
    headshotUrl: "",
    slug: "zara-sheikh",
    profileVisible: true,
    languages: ["Hindi", "English", "Urdu"],
    skills: ["Contemporary Dance", "Singing", "Photography"],
    accents: ["Mumbai Hindi", "Neutral American"],
    filmography: [
      { id: "f6", title: "First Light", role: "Sia", year: 2024, type: "Short" },
      { id: "f7", title: "Open Mic", role: "Nisha", year: 2023, type: "Theatre" },
    ],
    portfolio: [
      { id: "p7", title: "Natural Light Portrait", category: "Headshot", imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop" },
      { id: "p8", title: "Comedy Rehearsal", category: "Behind the Scenes", imageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop" },
    ],
    works: [
      { id: "w6", projectName: "First Light", role: "Sia (Lead)", director: "Aditya Nimbalkar", year: 2024, type: "Short", status: "Released", description: "A poignant short about a dancer finding her voice. Won Best Short at MAMI." },
    ],
    managerNotes: "Top pick for Excel audition next week. Prep her for comedy angle.",
    createdAt: "2024-06-10",
    updatedAt: "2026-03-02",
    profileCompleteness: 65,
    color: talentColors[2],
  },
  {
    id: "4",
    name: "Kabir Verma",
    age: 41,
    gender: "Male",
    type: "Supporting",
    status: "On Hold",
    location: "Bangalore, India",
    height: "5'9\"",
    hair: "Salt & Pepper",
    eyes: "Dark Brown",
    bio: "Seasoned supporting actor with credits across Bollywood and South Indian cinema. Known for commanding screen presence in authority figure roles.",
    reelUrl: "https://vimeo.com/example4",
    headshotUrl: "",
    slug: "kabir-verma",
    profileVisible: false,
    languages: ["Hindi", "English", "Kannada", "Tamil"],
    skills: ["Martial Arts", "Public Speaking", "Driving"],
    accents: ["South Indian English", "BBC English"],
    filmography: [
      { id: "f8", title: "Bangalore Days", role: "Commissioner", year: 2024, type: "Film" },
      { id: "f9", title: "The Verdict", role: "Judge Rao", year: 2023, type: "TV Series" },
      { id: "f10", title: "Night Court", role: "Advocate Nair", year: 2022, type: "Theatre" },
    ],
    portfolio: [
      { id: "p9", title: "Authority Portrait", category: "Headshot", imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop" },
    ],
    works: [
      { id: "w7", projectName: "Bangalore Days", role: "Commissioner", director: "Gautham Menon", year: 2024, type: "Film", status: "Released", description: "A crime drama set in Bangalore's tech corridors." },
      { id: "w8", projectName: "Mani Ratnam Period Drama", role: "Judge Narayan", director: "Mani Ratnam", year: 2026, type: "Film", status: "Upcoming", description: "A sweeping period drama currently in pre-production." },
    ],
    managerNotes: "Wants to transition to more lead roles. Consider for Mani Ratnam project.",
    createdAt: "2023-08-05",
    updatedAt: "2026-02-15",
    profileCompleteness: 85,
    color: talentColors[3],
  },
  {
    id: "5",
    name: "Priya Desai",
    age: 30,
    gender: "Female",
    type: "Lead",
    status: "Available",
    location: "Mumbai, India",
    height: "5'6\"",
    hair: "Black",
    eyes: "Brown",
    bio: "Award-winning actress with a strong indie filmography. Trained in Kathak and method acting. Excellent range from comedy to intense drama.",
    reelUrl: "https://vimeo.com/example5",
    headshotUrl: "",
    slug: "priya-desai",
    profileVisible: true,
    languages: ["Hindi", "English", "Gujarati"],
    skills: ["Kathak", "Method Acting", "Yoga", "Archery"],
    accents: ["Standard Hindi", "RP English"],
    filmography: [
      { id: "f11", title: "River Song", role: "Kavya", year: 2025, type: "Film" },
      { id: "f12", title: "Midnight Tales", role: "Ritu", year: 2024, type: "TV Series" },
    ],
    portfolio: [
      { id: "p10", title: "Award Show Look", category: "Editorial", imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop" },
      { id: "p11", title: "Kavya Character Still", category: "Character Look", imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop" },
      { id: "p12", title: "Studio Headshot", category: "Headshot", imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop" },
    ],
    works: [
      { id: "w9", projectName: "River Song", role: "Kavya (Lead)", director: "Zoya Akhtar", year: 2025, type: "Film", status: "Post-Production", description: "A musical drama about a classical singer's journey." },
      { id: "w10", projectName: "Midnight Tales", role: "Ritu (Lead)", director: "Anurag Basu", year: 2024, type: "TV Series", status: "Released", description: "An anthology horror series. Highest-rated episode of the season." },
    ],
    managerNotes: "Filmfare nominee. Push for Zoya Akhtar next.",
    createdAt: "2024-02-20",
    updatedAt: "2026-03-03",
    profileCompleteness: 95,
    color: talentColors[4],
  },
  {
    id: "6",
    name: "Arjun Nair",
    age: 27,
    gender: "Male",
    type: "Emerging",
    status: "Available",
    location: "Chennai, India",
    height: "6'0\"",
    hair: "Black",
    eyes: "Brown",
    bio: "Former model turned actor. Strong physical presence and natural charisma. Breaking into Tamil and Hindi commercial cinema.",
    reelUrl: "",
    headshotUrl: "",
    slug: "arjun-nair",
    profileVisible: true,
    languages: ["Tamil", "English", "Hindi", "Malayalam"],
    skills: ["Martial Arts", "Swimming", "Basketball"],
    accents: ["South Indian English", "General American"],
    filmography: [
      { id: "f13", title: "Storm Chasers", role: "Dev", year: 2025, type: "Film" },
    ],
    portfolio: [
      { id: "p13", title: "Fitness Portrait", category: "Headshot", imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop" },
      { id: "p14", title: "Action Still", category: "Character Look", imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop" },
    ],
    works: [
      { id: "w11", projectName: "Storm Chasers", role: "Dev (Lead)", director: "S.S. Rajamouli", year: 2025, type: "Film", status: "Post-Production", description: "A high-octane action adventure film." },
    ],
    managerNotes: "New signing. Needs portfolio shoot ASAP.",
    createdAt: "2025-12-01",
    updatedAt: "2026-02-20",
    profileCompleteness: 52,
    color: talentColors[5],
  },
];

export const mockEvents: CalendarEvent[] = [
  { id: "e1", actorId: "1", actorName: "Anya Kapoor", title: "Dharma Productions Callback", type: "Callback", date: "2026-03-05", time: "10:00", endTime: "12:00", location: "Dharma Office, Khar", notes: "Bring contemporary monologue" },
  { id: "e2", actorId: "3", actorName: "Zara Sheikh", title: "Excel Entertainment Audition", type: "Audition", date: "2026-03-06", time: "14:00", endTime: "15:30", location: "Andheri Studio 4", notes: "Comedy scene — improv portion" },
  { id: "e3", actorId: "1", actorName: "Anya Kapoor", title: "Brand Shoot — Tanishq", type: "Booking", date: "2026-03-08", time: "09:00", endTime: "18:00", location: "Film City, Goregaon", notes: "Full day shoot. Wardrobe provided." },
  { id: "e4", actorId: "4", actorName: "Kabir Verma", title: "Portfolio Review Meeting", type: "Meeting", date: "2026-03-07", time: "16:00", endTime: "17:00", location: "Office", notes: "Discuss new positioning strategy" },
  { id: "e5", actorId: "3", actorName: "Zara Sheikh", title: "Netflix Screen Test", type: "Audition", date: "2026-03-10", time: "11:00", endTime: "13:00", location: "Netflix India Office, BKC", notes: "Self-tape backup ready" },
  { id: "e6", actorId: "2", actorName: "Rohan Mehta", title: "YRF Reshoot", type: "Booking", date: "2026-03-04", time: "07:00", endTime: "19:00", location: "YRF Studios", notes: "Action sequence reshoot" },
  { id: "e7", actorId: "5", actorName: "Priya Desai", title: "Zoya Akhtar Meeting", type: "Meeting", date: "2026-03-09", time: "15:00", endTime: "16:00", location: "Excel Office, Andheri", notes: "Discuss upcoming project" },
  { id: "e8", actorId: "6", actorName: "Arjun Nair", title: "Portfolio Photoshoot", type: "Booking", date: "2026-03-11", time: "10:00", endTime: "16:00", location: "Studio 5, Bandra", notes: "Full portfolio shoot — casual + formal" },
  { id: "e9", actorId: "1", actorName: "Anya Kapoor", title: "Script Reading — Untitled", type: "Meeting", date: "2026-03-12", time: "14:00", endTime: "16:00", location: "Home Studio", notes: "New project script reading" },
  { id: "e10", actorId: "5", actorName: "Priya Desai", title: "YRF Casting Call", type: "Audition", date: "2026-03-13", time: "11:00", endTime: "13:00", location: "YRF Studios", notes: "Romantic lead audition" },
];

export const mockShortlists: Shortlist[] = [
  {
    id: "s1",
    name: "Hero options for Project X",
    description: "Top picks for the lead role in upcoming Dharma project",
    actorIds: ["1", "5"],
    createdAt: "2026-02-20",
    updatedAt: "2026-03-01",
    slug: "hero-options-project-x",
    views: [
      { id: "v1", viewedAt: "2026-03-02T10:30:00Z", referrer: "WhatsApp", ip: "103.x.x.x" },
      { id: "v2", viewedAt: "2026-03-02T14:15:00Z", referrer: "Direct", ip: "49.x.x.x" },
      { id: "v3", viewedAt: "2026-03-03T09:00:00Z", referrer: "WhatsApp", ip: "103.x.x.x" },
    ],
  },
  {
    id: "s2",
    name: "Character actors for Director Y",
    description: "Strong character options for the upcoming Netflix series",
    actorIds: ["2", "4"],
    createdAt: "2026-02-25",
    updatedAt: "2026-02-28",
    slug: "character-actors-director-y",
    views: [
      { id: "v4", viewedAt: "2026-03-01T11:00:00Z", referrer: "Email", ip: "122.x.x.x" },
    ],
  },
  {
    id: "s3",
    name: "Fresh faces — Comedy",
    description: "Emerging talent with strong comedic chops",
    actorIds: ["3", "6"],
    createdAt: "2026-03-01",
    updatedAt: "2026-03-03",
    slug: "fresh-faces-comedy",
    views: [],
  },
];

export const mockCastingOpportunities: CastingOpportunity[] = [
  {
    id: "c1",
    projectName: "Untitled Dharma Project",
    role: "Female Lead — Priya",
    director: "Karan Johar",
    castingDirector: "Shanoo Sharma",
    deadline: "2026-03-15",
    notes: "Looking for 25-30, trained dancer preferred",
    createdAt: "2026-02-15",
    submissions: [
      { id: "cs1", actorId: "1", actorName: "Anya Kapoor", status: "Callback", submittedAt: "2026-02-16", notes: "Strong callback performance" },
      { id: "cs2", actorId: "5", actorName: "Priya Desai", status: "Submitted", submittedAt: "2026-02-20", notes: "Submitted tape and portfolio" },
    ],
  },
  {
    id: "c2",
    projectName: "The Wire Room S2",
    role: "Inspector Vikram (recurring)",
    director: "Neeraj Pandey",
    castingDirector: "Mukesh Chhabra",
    deadline: "2026-03-20",
    notes: "Continuation of existing character",
    createdAt: "2026-02-20",
    submissions: [
      { id: "cs3", actorId: "2", actorName: "Rohan Mehta", status: "Booked", submittedAt: "2026-02-21", notes: "Confirmed for Season 2" },
    ],
  },
  {
    id: "c3",
    projectName: "Netflix Comedy Special",
    role: "Ensemble Cast — Multiple roles",
    director: "Zoya Akhtar",
    castingDirector: "Nandini Shrikent",
    deadline: "2026-04-01",
    notes: "Strong improv skills needed. Fresh faces preferred.",
    createdAt: "2026-03-01",
    submissions: [
      { id: "cs4", actorId: "3", actorName: "Zara Sheikh", status: "Shortlisted", submittedAt: "2026-03-02", notes: "Loved her improv reel" },
      { id: "cs5", actorId: "6", actorName: "Arjun Nair", status: "Viewed", submittedAt: "2026-03-03", notes: "Profile viewed by CD" },
      { id: "cs6", actorId: "1", actorName: "Anya Kapoor", status: "Submitted", submittedAt: "2026-03-03", notes: "" },
    ],
  },
  {
    id: "c4",
    projectName: "Mani Ratnam Period Drama",
    role: "Supporting — Judge Narayan",
    director: "Mani Ratnam",
    castingDirector: "Independent",
    deadline: "2026-03-25",
    notes: "40+ male, authoritative presence, fluent in Tamil",
    createdAt: "2026-02-28",
    submissions: [
      { id: "cs7", actorId: "4", actorName: "Kabir Verma", status: "Shortlisted", submittedAt: "2026-03-01", notes: "Perfect fit — director interested" },
    ],
  },
];

export const mockAgency: Agency = {
  name: "TAARA Talent Management",
  slug: "taara-talent",
  about: "TAARA is a boutique talent management agency representing India's finest actors across film, television, and theatre. We focus on building meaningful careers through strategic positioning and personalized representation.",
  contactEmail: "hello@taara.agency",
  contactPhone: "+91 98765 43210",
  website: "https://taara.agency",
  location: "Mumbai, India",
  logoUrl: "",
  foundedYear: 2020,
};

export function getStatusVariant(status: Actor["status"]) {
  switch (status) {
    case "Available": return "available" as const;
    case "Booked": return "booked" as const;
    case "On Hold": return "on-hold" as const;
  }
}

export function getEventVariant(type: CalendarEvent["type"]) {
  switch (type) {
    case "Audition": return "audition" as const;
    case "Callback": return "callback" as const;
    case "Booking": return "booking" as const;
    case "Meeting": return "meeting" as const;
  }
}

export function getSubmissionStatusColor(status: CastingSubmission["status"]) {
  switch (status) {
    case "Submitted": return "text-muted-foreground";
    case "Viewed": return "text-event-audition";
    case "Shortlisted": return "text-event-callback";
    case "Callback": return "text-event-callback";
    case "Booked": return "text-status-available";
    case "Rejected": return "text-destructive";
  }
}
