'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Mail, Phone, MapPin, Instagram, Twitter, Youtube } from 'lucide-react';
import { io } from 'socket.io-client';

export default function ContactPage() {
    const [contact, setContact] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchContact = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/contact`);
            const data = await res.json();
            setContact(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching contact:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContact();

        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

        socket.on('dataUpdate', (data: { type: string }) => {
            if (data.type === 'contact') {
                console.log('Contact update received, refreshing data...');
                fetchContact();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 flex items-center justify-center">
                        <Mail className="h-10 w-10 text-primary mr-4" />
                        Contact Us
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">Get in touch with the Sports Council</p>
                </div>

                {loading || !contact ? (
                    <div className="text-center text-slate-400 py-12">Loading contact info...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Contact Info */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                            <h2 className="text-2xl font-bold text-white mb-8">Contact Information</h2>

                            <div className="space-y-6">
                                <div className="flex items-center group">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-6 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                        <Mail className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Email</div>
                                        <div className="font-bold text-white text-lg">{contact.email}</div>
                                    </div>
                                </div>

                                <div className="flex items-center group">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-6 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                        <Phone className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Phone</div>
                                        <div className="font-bold text-white text-lg">{contact.phone}</div>
                                    </div>
                                </div>

                                <div className="flex items-center group">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-6 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                        <MapPin className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Address</div>
                                        <div className="font-bold text-white text-lg">{contact.address}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Social Media */}
                            <div className="mt-10 pt-8 border-t border-white/10">
                                <h3 className="font-bold text-white mb-6">Follow Us</h3>
                                <div className="flex space-x-4">
                                    <a href="#" className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-pink-600 hover:text-white text-slate-400 transition-all border border-white/10">
                                        <Instagram className="h-6 w-6" />
                                    </a>
                                    <a href="#" className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-blue-500 hover:text-white text-slate-400 transition-all border border-white/10">
                                        <Twitter className="h-6 w-6" />
                                    </a>
                                    <a href="#" className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white text-slate-400 transition-all border border-white/10">
                                        <Youtube className="h-6 w-6" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Coordinators */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                            <h2 className="text-2xl font-bold text-white mb-8">Coordinators</h2>

                            <div className="space-y-4">
                                {contact.coordinators && contact.coordinators.map((coord: any, idx: number) => (
                                    <div key={idx} className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-primary/30 transition-colors flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 bg-white/5 flex-shrink-0">
                                            <img
                                                src={coord.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${coord.name}`}
                                                alt={coord.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-bold text-xl text-white mb-1">{coord.name}</div>
                                            <div className="text-sm text-primary font-bold uppercase tracking-wider mb-2">{coord.role}</div>
                                            <div className="flex items-center text-slate-400">
                                                <Phone className="h-4 w-4 mr-2" />
                                                {coord.phone}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="border-t border-white/10 bg-black/50 py-12 mt-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-slate-500">© 2025-26 IIT Dharwad Sports Council</p>
                </div>
            </footer>
        </div>
    );
}
