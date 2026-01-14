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

    const filteredLinks = navLinks.map(link => {
        if (link.label === 'Live') {
            return { ...link, label: 'Stream', isLive: isLiveNow };
        }
        return link;
    });

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/60 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center space-x-3 group">
                                <div className="relative w-20 h-20 transition-transform group-hover:scale-110 duration-300">
                                    <Image src="/images/image-1-removebg-preview.png" alt="GC Logo" fill className="object-contain" />
                                </div>
                                <span className="font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
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
                                            ? 'text-primary-foreground bg-primary/80 border border-primary hover:bg-primary animate-pulse-slow'
                                            : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                                            }`}
                                    >
                                        {link.label}
                                        {link.isLive && (
                                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-ping" />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
                            >
                                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isOpen && (
                        <div className="md:hidden pb-4 bg-background/95 backdrop-blur-xl border-t border-border absolute left-0 right-0 px-4 shadow-2xl">
                            <div className="flex flex-col space-y-2 pt-4">
                                {filteredLinks.map((link: any) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${link.isLive
                                            ? 'text-primary bg-primary/20 border border-primary/50'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
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
