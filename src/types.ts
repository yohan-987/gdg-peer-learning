import type { LucideIcon } from 'lucide-react';
import {
  Brain,
  Code2,
  Smartphone,
  Cloud,
  Binary,
  ShieldCheck,
  Cpu,
  MoreHorizontal,
} from 'lucide-react';

export type Role = 'student' | 'mentor' | 'admin';

export type DomainId =
  | 'ml'
  | 'web'
  | 'app'
  | 'cloud'
  | 'dsa'
  | 'cyber'
  | 'iot'
  | 'others';

export interface Domain {
  id: DomainId;
  name: string;
  icon: LucideIcon;
}

export const DOMAINS: Domain[] = [
  { id: 'ml', name: 'AI/ML', icon: Brain },
  { id: 'web', name: 'Web Development', icon: Code2 },
  { id: 'app', name: 'App Development', icon: Smartphone },
  { id: 'cloud', name: 'Cloud Computing', icon: Cloud },
  { id: 'dsa', name: 'DSA & CP', icon: Binary },
  { id: 'cyber', name: 'Cybersecurity', icon: ShieldCheck },
  { id: 'iot', name: 'IoT', icon: Cpu },
];

export const DOUBT_DOMAINS: Domain[] = [
  ...DOMAINS,
  { id: 'others', name: 'Others', icon: MoreHorizontal },
];

export const DOMAIN_MAP: Record<DomainId, Domain> = DOUBT_DOMAINS.reduce(
  (acc, d) => {
    acc[d.id] = d;
    return acc;
  },
  {} as Record<DomainId, Domain>,
);

export interface PointsBreakdown {
  learn: number;
  doubt: number;
}

export interface DomainPoints {
  domain: string; 
  points: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  semester: number;
  branch: string;
  domains: DomainId[];
  role: Role;
  githubUsername?: string | null;
  totalPoints: number;
  pointsByDomain: DomainPoints[];
  pointsBreakdown: PointsBreakdown;
  createdAt: number;
}

export const EMPTY_BREAKDOWN: PointsBreakdown = {
  learn: 0,
  doubt: 0,
};

export interface ResourceLink {
  label: string;
  url: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Session {
  id: string;
  title: string;
  domain: DomainId;
  date: string;
  resourceLinks: ResourceLink[];
  quizQuestions: QuizQuestion[];
}

export type DoubtStatus = 'open' | 'answered' | 'verified';

export interface Doubt {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  domain: DomainId;
  question: string;
  status: DoubtStatus;
  createdAt: number;
}

export interface Reply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  text: string;
  createdAt: number;
  isMentorVerified?: boolean;
  verifiedBy?: string | null;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  sessionId: string;
  score: number;
  passed: boolean;
  pointsAwarded: number;
  awardedAt?: number | null;
}

export type AwardCategory = 'learn' | 'doubt';

export interface PointAward {
  id: string;
  userId: string;
  sourceType: 'quiz' | 'doubt';
  sourceId: string;
  category: AwardCategory;
  points: number;
  createdAt: number;
}

export type ActivityType = 'quiz_passed' | 'doubt_validated';

export interface ActivityRecord {
  id: string;
  userId: string;
  type: ActivityType;
  domain: DomainId;
  points: number;
  createdAt: number;
}

export const POINTS = {
  learn: 20,
  doubt: 30,
} as const;

export const QUIZ_PASS_THRESHOLD = 0.7;

export function newProfile(
  uid: string,
  email: string,
  data: {
    name: string;
    semester: number;
    branch: string;
    domains: DomainId[];
    githubUsername?: string | null;
  },
): UserProfile {
  return {
    uid,
    email,
    name: data.name,
    semester: data.semester,
    branch: data.branch,
    domains: data.domains,
    role: 'student',
    githubUsername: data.githubUsername || null,
    totalPoints: 0,
    pointsByDomain: [], // Fixed: this is now safely an array!
    pointsBreakdown: { ...EMPTY_BREAKDOWN },
    createdAt: Date.now(),
  };
}