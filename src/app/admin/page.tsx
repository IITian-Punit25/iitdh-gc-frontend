'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Users, Calendar, Medal, Image, Mail, LogOut, Play, Trophy } from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin/login');
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
    };

    if (!isAuthenticated) return null;

    const adminLinks = [
        { href: '/admin/teams', label: 'Manage Teams', icon: Users },
        { href: '/admin/schedule', label: 'Manage Schedule', icon: Calendar },
        { href: '/admin/results', label: 'Manage Results', icon: Medal },
        { href: '/admin/standings', label: 'Manage Standings', icon: Trophy },
        { href: '/admin/streams', label: 'Manage Streams', icon: Play },
        { href: '/admin/gallery', label: 'Manage Gallery', icon: Image },
        { href: '/admin/contact', label: 'Manage Contact', icon: Mail },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
                        <p className="text-slate-400">Manage all aspects of the General Championship</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg transition-colors border border-red-500/20"
                    >
                        <LogOut className="h-5 w-5 mr-2" />
                        Logout
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all group"
                        >
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br from-primary/80 to-primary shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <link.icon className="h-7 w-7 text-black" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{link.label}</h2>
                            <p className="text-slate-400 text-sm">Edit and update content</p>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
