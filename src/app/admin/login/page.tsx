'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function AdminLogin() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('adminToken', data.token);
                router.push('/admin');
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Login failed. Is the backend running?');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl relative z-10">
                    <div className="flex justify-center mb-8">
                        <div className="bg-primary/20 p-4 rounded-full ring-1 ring-primary/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                            <Lock className="h-8 w-8 text-primary" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center text-white mb-2">Admin Access</h1>
                    <p className="text-slate-400 text-center mb-8">Enter your credentials to continue</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-slate-600"
                                placeholder="Enter admin password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center group"
                        >
                            Login
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
