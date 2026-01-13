'use client';

import Link from 'next/link';
import { Trophy, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/teams', label: 'Teams' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/results', label: 'Results' },
    { href: '/live', label: 'Live' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/contact', label: 'Contact' },
    { href: '/admin', label: 'Admin' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasActiveStream, setHasActiveStream] = useState(false);
    const [isLiveNow, setIsLiveNow] = useState(false);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/results`)
            .then((res) => res.json())
            .then((data) => {
                const active = data.some((r: any) => r.streamStatus === 'Live' || r.streamStatus === 'Upcoming');
                const live = data.some((r: any) => r.streamStatus === 'Live');
                setHasActiveStream(active);
                setIsLiveNow(live);
            })
            .catch((err) => console.error('Error checking streams:', err));
    }, []);

    const filteredLinks = navLinks.filter(link => {
        if (link.label === 'Live') return hasActiveStream;
        return true;
    }).map(link => {
        if (link.label === 'Live') {
            return { ...link, label: 'Stream', isLive: isLiveNow };
        }
        return link;
    });

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center space-x-3 group">
                                <div className="relative w-10 h-10 transition-transform group-hover:scale-110 duration-300">
                                    <Image src="/logo.png" alt="GC Logo" fill className="object-contain" />
                                </div>
                                <span className="font-bold text-xl tracking-tight text-white group-hover:text-primary transition-colors">
                                    IIT Dh Sports GC
                                </span>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-1">
                                {filteredLinks.map((link: any) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${link.isLive
                                            ? 'text-white bg-red-600/20 border border-red-500/50 hover:bg-red-600/40 animate-pulse-slow'
                                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {link.label}
                                        {link.isLive && (
                                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isOpen && (
                        <div className="md:hidden pb-4 bg-black/90 backdrop-blur-xl border-t border-white/10 absolute left-0 right-0 px-4 shadow-2xl">
                            <div className="flex flex-col space-y-2 pt-4">
                                {filteredLinks.map((link: any) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${link.isLive
                                            ? 'text-red-400 bg-red-900/20 border border-red-900/50'
                                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </nav>
            {/* Spacer to prevent content overlap */}
            <div className="h-20" />
        </>
    );
}
