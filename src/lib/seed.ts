import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

/**
 * Seeds three realistic sample doubts, each with a reply — attributed to
 * whoever clicks the seed button (no fake "demo user"). Project
 * submissions were removed from the app entirely (see MentorPanel/
 * PerformTab), so this only seeds doubts now. Sessions already self-seed
 * per domain on first visit via lib/sessions.ts.
 */
export async function seedDemoData(authorId: string, authorName: string): Promise<void> {
  const doubts: { domain: string; question: string; reply: string }[] = [
    {
      domain: 'web',
      question: 'When should I use useEffect vs useMemo in React? I keep mixing them up.',
      reply: 'useEffect is for side effects (fetching data, subscriptions) that run after render. useMemo is for caching an expensive computed value so it isn\u2019t recalculated every render. If you\u2019re not returning a value from it, it\u2019s useEffect.',
    },
    {
      domain: 'ml',
      question: 'How do I decide between logistic regression and a decision tree for a small labeled dataset?',
      reply: 'For a small, mostly linearly separable dataset, logistic regression is a strong simple baseline and less prone to overfitting. Try it first, then compare against a decision tree \u2014 if the tree adds meaningful accuracy, the relationship probably isn\u2019t linear.',
    },
    {
      domain: 'cyber',
      question: 'Is it actually necessary to hash passwords if the database itself is already encrypted?',
      reply: 'Yes \u2014 database encryption protects against someone stealing the disk/backup, but if the database is breached through the app itself (SQL injection, a compromised admin account), encryption at rest doesn\u2019t help. Hashing (with a strong algorithm like bcrypt/argon2) protects the passwords specifically, even if the attacker gets read access.',
    },
  ];

  for (const d of doubts) {
    const doubtRef = await addDoc(collection(db, 'doubts'), {
      authorId,
      authorName,
      authorRole: 'student',
      domain: d.domain,
      question: d.question,
      status: 'open',
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'doubts', doubtRef.id, 'replies'), {
      authorId,
      authorName,
      authorRole: 'student',
      text: d.reply,
      isMentorVerified: false,
      verifiedBy: null,
      createdAt: serverTimestamp(),
    });
  }
}
