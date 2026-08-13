import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/firebase';
import {
  newProfile,
  type UserProfile,
  type DomainId,
} from '@/types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  completeProfileSetup: (data: {
    name: string;
    semester: number;
    branch: string;
    domains: DomainId[];
    githubUsername?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const nullifyUndefined = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj };
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined) {
      sanitized[key as keyof T] = null as any;
    }
  });
  return sanitized;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    
    const data = snap.data();
    
    // --- RUNTIME SAFEGUARD: SILENT MIGRATION ---
    // If the database has the old object format, convert it to the new array format on the fly
    let safePointsByDomain = data.pointsByDomain || [];
    if (typeof safePointsByDomain === 'object' && !Array.isArray(safePointsByDomain)) {
      safePointsByDomain = Object.entries(safePointsByDomain).map(([domain, points]) => ({
        domain,
        points: points as number
      }));
    }

    return {
      ...data,
      pointsByDomain: safePointsByDomain,
      pointsBreakdown: data.pointsBreakdown || { learn: 0, doubt: 0 }
    } as UserProfile;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const p = await fetchProfile(firebaseUser.uid);
          setProfile(p);
        } catch (e) {
          console.error('Failed to load profile', e);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await fetchProfile(user.uid);
    setProfile(p);
  };

  const completeProfileSetup = async (data: {
    name: string;
    semester: number;
    branch: string;
    domains: DomainId[];
    githubUsername?: string | null;
  }) => {
    if (!user) throw new Error('Not authenticated');
    const p = newProfile(user.uid, user.email ?? '', data);
    
    const safeData = nullifyUndefined(p); 
    
    await setDoc(doc(db, 'users', user.uid), {
      ...safeData,
      createdAt: serverTimestamp(),
    });
    setProfile(p);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) throw new Error('Not authenticated');
    const { uid, role, email, createdAt, ...rest } = data as UserProfile;
    void uid; void role; void email; void createdAt;
    
    const safeRest = nullifyUndefined(rest);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(doc(db, 'users', user.uid), safeRest as any);
    setProfile({ ...profile, ...rest } as UserProfile);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      login,
      signup,
      logout,
      refreshProfile,
      updateProfile,
      completeProfileSetup,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}