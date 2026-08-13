import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { type ActivityRecord, type DomainId } from '@/types';

/**
 * Fetch activity records for a user, ordered by date.
 * Used to populate the contribution heatmap.
 */
export async function fetchActivities(userId: string): Promise<ActivityRecord[]> {
  const q = query(
    collection(db, 'activities'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      type: data.type,
      domain: data.domain as DomainId,
      points: data.points,
      createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? 0,
    } as ActivityRecord;
  });
}

/**
 * Convert activity records to heatmap data format.
 * Returns a map of 'YYYY-MM-DD' → count.
 */
export function activitiesToHeatmap(
  activities: ActivityRecord[],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const a of activities) {
    const date = new Date(a.createdAt);
    const key = date.toISOString().slice(0, 10);
    map[key] = (map[key] ?? 0) + 1;
  }
  return map;
}
