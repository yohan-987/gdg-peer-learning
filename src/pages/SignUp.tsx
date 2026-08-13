import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Input } from '@/components/ui';

export default function SignUp() {
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signup(email.trim(), password);
      toast.success('Account created');
      navigate('/profile-setup', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10">
            <BrainCircuit className="h-6 w-6 text-teal-400" />
          </div>
          <h1 className="text-lg font-semibold text-slate-100">Create your account</h1>
          <p className="mt-1 text-xs text-slate-400">Join the GDG Peer Learning community</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@college.edu"
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
          <Input
            label="Confirm password"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            autoComplete="new-password"
          />
          <Button type="submit" loading={loading} className="w-full">
            Create account
          </Button>
          <p className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-teal-400 hover:text-teal-300">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
