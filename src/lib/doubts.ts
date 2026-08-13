import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';
import type { Doubt, Reply, DomainId, UserProfile } from '@/types';

/**
 * Fetch all doubts for the main feed (optionally filtered by domain).
 */
export async function fetchAllDoubts(domain?: DomainId): Promise<Doubt[]> {
  return fetchDoubts(domain);
}

/**
 * Fetch all open or answered doubts for the main feed.
 */
export async function fetchDoubts(domain?: DomainId): Promise<Doubt[]> {
  const doubtsRef = collection(db, 'doubts');
  let q = query(doubtsRef, orderBy('createdAt', 'desc'));
  
  if (domain && domain !== 'others') {
    q = query(doubtsRef, where('domain', '==', domain), orderBy('createdAt', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Doubt[];
}

/**
 * Fetch a single doubt by ID.
 */
export async function fetchDoubtById(doubtId: string): Promise<Doubt | null> {
  const docRef = doc(db, 'doubts', doubtId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Doubt;
}

/**
 * Post a new doubt question.
 */
export async function postDoubt(data: {
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'mentor' | 'admin';
  domain: DomainId;
  question: string;
}): Promise<string> {
  const doubtsRef = collection(db, 'doubts');
  const docRef = await addDoc(doubtsRef, {
    ...data,
    status: 'open',
    createdAt: Date.now(),
  });
  return docRef.id;
}

/**
 * Real-time subscription to replies for a specific doubt.
 */
export function subscribeToReplies(doubtId: string, callback: (replies: Reply[]) => void) {
  const repliesRef = collection(db, 'doubts', doubtId, 'replies');
  const q = query(repliesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Reply[];
    callback(list);
  });
}

/**
 * Post a reply to a doubt and update doubt status to 'answered'.
 */
export async function postReply(data: {
  doubtId: string;
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'mentor' | 'admin';
  text: string;
}): Promise<string> {
  const { doubtId, ...replyData } = data;
  const repliesRef = collection(db, 'doubts', doubtId, 'replies');

  const replyRef = await addDoc(repliesRef, {
    ...replyData,
    createdAt: Date.now(),
    isMentorVerified: false,
    verifiedBy: null,
  });

  // Update doubt status to 'answered' if it was 'open'
  const doubtRef = doc(db, 'doubts', doubtId);
  const doubtSnap = await getDoc(doubtRef);
  if (doubtSnap.exists() && doubtSnap.data().status === 'open') {
    await updateDoc(doubtRef, { status: 'answered' });
  }

  return replyRef.id;
}

/**
 * Fetch doubts awaiting mentor review (have replies, not yet fully verified).
 */
export async function fetchDoubtsAwaitingReview(): Promise<Doubt[]> {
  const doubtsRef = collection(db, 'doubts');
  const q = query(doubtsRef, where('status', 'in', ['open', 'answered']), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Doubt[];
}

/**
 * SECURE MENTOR VERIFICATION & POINT AWARD (Checklist #16 Anti-Abuse Rules)
 * - Prevents mentor from verifying their own reply.
 * - Ensures idempotent verification (reward given only once).
 * - Atomically updates user's total points, breakdown, domain points, and activity ledger.
 */
export async function verifyReply(params: {
  doubtId: string;
  replyId: string;
  mentorId: string;
  domain: DomainId;
}): Promise<{ pointsAwarded: boolean }> {
  const { doubtId, replyId, mentorId, domain } = params;

  const doubtRef = doc(db, 'doubts', doubtId);
  const replyRef = doc(db, 'doubts', doubtId, 'replies', replyId);

  return await runTransaction(db, async (transaction) => {
    const replySnap = await transaction.get(replyRef);
    if (!replySnap.exists()) {
      throw new Error('Reply not found.');
    }

    const replyData = replySnap.data() as Reply;

    // ANTI-ABUSE RULE: Student/Mentor cannot verify their own reply
    if (replyData.authorId === mentorId) {
      throw new Error('Security Violation: You cannot verify your own reply.');
    }

    // ANTI-ABUSE RULE: Already verified check (Idempotent)
    if (replyData.isMentorVerified) {
      return { pointsAwarded: false };
    }

    const authorId = replyData.authorId;
    const authorRef = doc(db, 'users', authorId);
    const authorSnap = await transaction.get(authorRef);

    if (!authorSnap.exists()) {
      throw new Error('Reply author profile not found.');
    }

    const authorProfile = authorSnap.data() as UserProfile;
    const pointsToAdd = 30; // +30 points for verified answer

    // 1. Mark reply as verified
    transaction.update(replyRef, {
      isMentorVerified: true,
      verifiedBy: mentorId,
    });

    // 2. Mark doubt as verified
    transaction.update(doubtRef, {
      status: 'verified',
    });

    // 3. Update author's reputation points & domain breakdown
    const currentTotal = authorProfile.totalPoints || 0;
    const currentDoubtPoints = authorProfile.pointsBreakdown?.doubt || 0;
    
    // Update or insert domain points array
    let pointsByDomain = [...(authorProfile.pointsByDomain || [])];
    const domainIndex = pointsByDomain.findIndex((d) => d.domain === domain || d.domain === DOMAIN_MAP[domain]?.name);
    
    const domainName = DOMAIN_MAP[domain]?.name || domain;
    if (domainIndex >= 0) {
      pointsByDomain[domainIndex] = {
        ...pointsByDomain[domainIndex],
        points: pointsByDomain[domainIndex].points + pointsToAdd,
      };
    } else {
      pointsByDomain.push({ domain: domainName, points: pointsToAdd });
    }

    transaction.update(authorRef, {
      totalPoints: currentTotal + pointsToAdd,
      'pointsBreakdown.doubt': currentDoubtPoints + pointsToAdd,
      pointsByDomain: pointsByDomain,
    });

    // 4. Log transaction in the Activity Ledger collection
    const activityRef = doc(collection(db, 'activities'));
    transaction.set(activityRef, {
      userId: authorId,
      type: 'doubt_validated',
      domain: domain,
      description: `Mentor verified your answer in ${domainName}`,
      pointsAwarded: pointsToAdd,
      createdAt: serverTimestamp(),
    });

    return { pointsAwarded: true };
  });
}