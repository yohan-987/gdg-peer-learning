import {
  runTransaction,
  doc,
  collection,
  serverTimestamp,
  type Transaction,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { POINTS, type AwardCategory, type DomainId } from '@/types';

/**
 * Idempotent point award using a Firestore transaction.
 *
 * Reads the user's current totals, checks the pointAwards ledger for an
 * existing entry with the same sourceId, and — if none exists — writes the
 * ledger entry, updates user totals, and creates an activity record, all
 * atomically.
 *
 * Returns true if points were awarded, false if they had already been awarded
 * for this source.
 */
export async function awardPoints(args: {
  userId: string;
  sourceType: 'quiz' | 'doubt';
  sourceId: string;
  category: AwardCategory;
  domain: DomainId;
}): Promise<boolean> {
  const { userId, sourceType, sourceId, category, domain } = args;
  const points = POINTS[category];
  const awardRef = doc(db, 'pointAwards', `${userId}_${sourceType}_${sourceId}`);

  return runTransaction(db, async (tx: Transaction) => {
    const [awardSnap, userSnap] = await Promise.all([
      tx.get(awardRef),
      tx.get(doc(db, 'users', userId)),
    ]);

    if (awardSnap.exists()) {
      return false;
    }

    const userData = userSnap.data() ?? {};
    const totalPoints = userData.totalPoints ?? 0;
    const pointsByDomain = userData.pointsByDomain ?? {};
    const pointsBreakdown = userData.pointsBreakdown ?? {
      learn: 0,
      doubt: 0,
    };

    tx.set(awardRef, {
      userId,
      sourceType,
      sourceId,
      category,
      points,
      createdAt: serverTimestamp(),
    });

    tx.update(doc(db, 'users', userId), {
      totalPoints: totalPoints + points,
      pointsByDomain: {
        ...pointsByDomain,
        [domain]: (pointsByDomain[domain] ?? 0) + points,
      },
      pointsBreakdown: {
        ...pointsBreakdown,
        [category]: (pointsBreakdown[category] ?? 0) + points,
      },
    });

    const activityRef = doc(collection(db, 'activities'));
    tx.set(activityRef, {
      userId,
      type: category === 'learn' ? 'quiz_passed' : 'doubt_validated',
      domain,
      points,
      createdAt: serverTimestamp(),
    });

    return true;
  });
}
