'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Image as ImageIcon, X, ZoomIn, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';

export default function GalleryPage() {
    const [gallery, setGallery] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<any | null>(null);

    const fetchGallery = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/gallery`);
            const data = await res.json();
            setGallery(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching gallery:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGallery();

        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

        socket.on('dataUpdate', (data: { type: string }) => {
            if (data.type === 'gallery') {
                console.log('Gallery update received, refreshing data...');
                fetchGallery();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const openLightbox = (item: any) => {
        setSelectedImage(item);
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setSelectedImage(null);
        document.body.style.overflow = 'unset';
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-primary mr-4" />
                        Gallery
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">Capturing the spirit of GC 25-26</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden h-64 animate-pulse">
                                <div className="h-full w-full bg-white/5 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 text-white/20 animate-spin" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {gallery.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => openLightbox(item)}
                                className="group relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden cursor-pointer hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10"
                            >
                                <div className="aspect-[4/3] overflow-hidden relative">
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                                        <ZoomIn className="h-10 w-10 text-white drop-shadow-lg transform scale-50 group-hover:scale-100 transition-transform" />
                                    </div>
                                    <img
                                        src={item.url}
                                        alt={item.title}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                    />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                                    <h3 className="font-bold text-lg text-white">{item.title}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <button
                        onClick={closeLightbox}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                    >
                        <X className="h-8 w-8" />
                    </button>

                    <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
                        <img
                            src={selectedImage.url}
                            alt={selectedImage.title}
                            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl shadow-black/50"
                        />
                        <h3 className="mt-6 text-2xl font-bold text-white text-center">{selectedImage.title}</h3>
                    </div>

                    <div className="absolute inset-0 -z-10" onClick={closeLightbox} />
                </div>
            )}

            <footer className="border-t border-white/10 bg-black/50 py-12 mt-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-slate-500">© 2025-26 IIT Dharwad Sports Council</p>
                </div>
            </footer>
        </div>
    );
}
