'use client';

import { useState, useEffect } from 'react';
import { Lock, X } from 'lucide-react';

export default function PasswordModal({
    isOpen,
    onClose,
    onConfirm,
    onExceededAttempts,
    title = "Security Check",
    message = "Please enter the admin password to confirm this action."
}) {
    const [password, setPassword] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Reset state when modal closes (moved to useEffect to fix React anti-pattern)
    useEffect(() => {
        if (!isOpen) {
            setAttempts(0);
            setError('');
            setPassword('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await onConfirm(password);

            if (success) {
                // Success: Close modal and reset state
                setAttempts(0);
                setPassword('');
                onClose();
            } else {
                // Failure: Increment attempts
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                if (newAttempts >= 3) {
                    onExceededAttempts();
                } else {
                    setError(`Incorrect password. ${3 - newAttempts} attempts remaining.`);
                    setPassword('');
                }
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/20 p-2 rounded-lg">
                                <Lock className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{title}</h3>
                                <p className="text-sm text-slate-400 mt-1">{message}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-500 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Admin Password"
                                className={`w-full bg-black/30 border rounded-xl px-4 py-3 text-white focus:ring-2 outline-none transition-all placeholder:text-slate-600 ${error
                                    ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                                    : 'border-white/10 focus:ring-primary/50 focus:border-primary'
                                    }`}
                                autoFocus
                            />
                            {error && (
                                <p className="text-red-500 text-sm mt-2 font-medium animate-in slide-in-from-top-1">
                                    {error}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!password || loading}
                                className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold px-4 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'Confirm'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
