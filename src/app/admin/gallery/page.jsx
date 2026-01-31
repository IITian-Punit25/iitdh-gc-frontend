'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Loader from '@/components/ui/Loader';
import { Save, Plus, Trash, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import PasswordModal from '@/components/ui/PasswordModal';

export default function ManageGallery() {
    const [gallery, setGallery] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState({});
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [confirmCallback, setConfirmCallback] = useState(null);
    const router = useRouter();

    const handleLogout = () => {
        if (typeof window !== 'undefined') localStorage.removeItem('adminToken');
        router.push('/admin/login');
    };

    const fetchData = async () => {
        try {
            const data = await api.get('/api/gallery');
            setGallery(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching gallery:', err);
            // If unauthorized, redirect to login
            if (err.status === 401 || err.status === 403) {
                router.push('/admin/login');
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) router.push('/admin/login');
        else fetchData();
    }, [router]);

    const handleSaveClick = async () => {
        const validGallery = gallery.filter(item => item.title && item.url);

        if (validGallery.length < gallery.length) {
            if (!confirm(`Some images have missing Title or URL and will be removed. Continue?`)) {
                return;
            }
            setGallery(validGallery);
        }

        setConfirmCallback(() => (password) => executeSave(validGallery, password));
        setIsPasswordModalOpen(true);
    };

    const executeSave = async (validGallery, password) => {
        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gallery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'x-admin-password': password
                },
                body: JSON.stringify(validGallery)
            });

            if (res.ok) {
                alert('Gallery saved successfully!');
                return true;
            } else {
                if (res.status === 401 || res.status === 403) return false;

                const data = await res.json().catch(() => ({}));
                alert(data.message || 'Failed to save gallery.');
                return true;
            }
        } catch (error) {
            console.error('Error saving gallery:', error);
            alert('Failed to save gallery.');
            return true;
        } finally {
            setSaving(false);
        }
    };

    const addImage = () => {
        setGallery(prevGallery => [
            { id: Date.now().toString(), title: '', url: '', type: 'url' },
            ...prevGallery,
        ]);
    };

    const updateImage = (index, field, value) => {
        setGallery(prevGallery => {
            const newGallery = [...prevGallery];
            newGallery[index] = { ...newGallery[index], [field]: value };
            return newGallery;
        });
    };

    const removeImage = (index) => {
        // Option 1: Just remove from local state (requires save to persist)
        // Option 2: Require password to remove immediately?
        // Since the pattern here is "Save Changes" at the top, local removal is fine.
        // Password is challenged only on Save.
        setGallery(prevGallery => {
            const newGallery = [...prevGallery];
            newGallery.splice(index, 1);
            return newGallery;
        });
    };

    const handleFileUploadClick = async (index, file) => {
        if (!file) return;

        setUploading(prev => ({ ...prev, [index]: true }));
        const formData = new FormData();
        formData.append('image', file);

        try {
            const data = await api.upload('/api/upload', formData);
            if (data.success) {
                updateImage(index, 'url', data.url);
            } else {
                alert('Upload failed: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            if (error.status === 401 || error.status === 403) {
                router.push('/admin/login');
            } else {
                alert('Error uploading file');
            }
        } finally {
            setUploading(prev => ({ ...prev, [index]: false }));
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Manage Gallery</h1>
                        <p className="text-slate-400">Add photos and highlights</p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={addImage}
                            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl flex items-center transition-all border border-white/10"
                        >
                            <Plus className="h-5 w-5 mr-2" /> Add Image
                        </button>
                        <button
                            onClick={handleSaveClick}
                            disabled={saving}
                            className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-xl flex items-center transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="h-5 w-5 mr-2 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5 mr-2" /> Save
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <PasswordModal
                    isOpen={isPasswordModalOpen}
                    onClose={() => setIsPasswordModalOpen(false)}
                    onConfirm={(password) => confirmCallback ? confirmCallback(password) : Promise.resolve(false)}
                    onExceededAttempts={handleLogout}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {gallery.length === 0 && (
                        <div className="col-span-full text-center text-slate-500 py-12 bg-white/5 rounded-2xl border border-white/10">
                            No images in gallery. Click "Add Image" to upload or link one.
                        </div>
                    )}
                    {gallery.map((item, index) => (
                        <div key={item.id} className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-primary/30 transition-all">
                            <div className="aspect-video bg-black/30 rounded-xl mb-6 overflow-hidden border border-white/5 relative group">
                                {item.url ? (
                                    <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                                        {uploading[index] ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : 'No Image Preview'}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Title</label>
                                    <input
                                        value={item.title}
                                        onChange={(e) => updateImage(index, 'title', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                        placeholder="Image Title"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Image Source</label>
                                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                                            <button
                                                onClick={() => updateImage(index, 'type', 'url')}
                                                className={`px-2 py-1 rounded text-xs font-bold transition-all ${item.type !== 'upload' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                <LinkIcon className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={() => updateImage(index, 'type', 'upload')}
                                                className={`px-2 py-1 rounded text-xs font-bold transition-all ${item.type === 'upload' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                <Upload className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {item.type === 'upload' ? (
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => e.target.files && handleFileUploadClick(index, e.target.files[0])}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                                disabled={uploading[index]}
                                            />
                                            {uploading[index] && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <input
                                            value={item.url}
                                            onChange={(e) => updateImage(index, 'url', e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                            placeholder="https://..."
                                        />
                                    )}
                                </div>

                                <button
                                    onClick={() => removeImage(index)}
                                    className="w-full bg-red-500/10 text-red-500 p-3 rounded-xl hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center justify-center font-bold"
                                >
                                    <Trash className="h-4 w-4 mr-2" /> Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
