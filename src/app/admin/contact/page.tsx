'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Save, Plus, Trash, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ManageContact() {
    const [contact, setContact] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) router.push('/admin/login');

        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/contact`)
            .then((res) => res.json())
            .then((data) => {
                setContact(data);
                setLoading(false);
            });
    }, [router]);

    const handleSave = async () => {
        if (!contact.email || !contact.phone) {
            alert("Email and Phone are required.");
            return;
        }

        for (const coord of contact.coordinators) {
            if (!coord.name || !coord.role) {
                alert("All coordinators must have a Name and Role.");
                return;
            }
        }

        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contact),
        });
        alert('Contact info saved successfully!');
    };

    const updateField = (field: string, value: string) => {
        setContact({ ...contact, [field]: value });
    };

    const updateSocial = (platform: string, value: string) => {
        setContact({
            ...contact,
            socialMedia: { ...contact.socialMedia, [platform]: value },
        });
    };

    const addCoordinator = () => {
        const name = prompt("Enter Coordinator Name:");
        if (!name) return;

        const role = prompt("Enter Coordinator Role:");
        if (!role) {
            alert("Role is required to add a coordinator.");
            return;
        }

        setContact({
            ...contact,
            coordinators: [{ name, role, phone: '', image: '', imageType: 'url' }, ...contact.coordinators],
        });
    };

    const updateCoordinator = (index: number, field: string, value: string) => {
        const newCoordinators = [...contact.coordinators];
        newCoordinators[index][field] = value;
        setContact({ ...contact, coordinators: newCoordinators });
    };

    const removeCoordinator = (index: number) => {
        const newCoordinators = [...contact.coordinators];
        newCoordinators.splice(index, 1);
        setContact({ ...contact, coordinators: newCoordinators });
    };

    const handleFileUpload = async (index: number, file: File) => {
        if (!file) return;

        setUploading(prev => ({ ...prev, [index]: true }));
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                updateCoordinator(index, 'image', data.url);
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file');
        } finally {
            setUploading(prev => ({ ...prev, [index]: false }));
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Manage Contact Info</h1>
                        <p className="text-slate-400">Update contact details and coordinators</p>
                    </div>
                    <button
                        onClick={handleSave}
                        className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-xl flex items-center transition-all shadow-lg shadow-primary/20"
                    >
                        <Save className="h-5 w-5 mr-2" />
                        Save Changes
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-6">General Info</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Email</label>
                                    <input
                                        value={contact.email}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Phone</label>
                                    <input
                                        value={contact.phone}
                                        onChange={(e) => updateField('phone', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Address</label>
                                    <textarea
                                        value={contact.address}
                                        onChange={(e) => updateField('address', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-6">Social Media</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Instagram</label>
                                    <input
                                        value={contact.socialMedia.instagram}
                                        onChange={(e) => updateSocial('instagram', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Twitter</label>
                                    <input
                                        value={contact.socialMedia.twitter}
                                        onChange={(e) => updateSocial('twitter', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">YouTube</label>
                                    <input
                                        value={contact.socialMedia.youtube}
                                        onChange={(e) => updateSocial('youtube', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 h-fit">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Coordinators</h2>
                            <button
                                onClick={addCoordinator}
                                className="text-primary hover:text-primary/80 text-sm font-bold flex items-center uppercase tracking-wider"
                            >
                                <Plus className="h-4 w-4 mr-1" /> Add
                            </button>
                        </div>
                        <div className="space-y-4">
                            {contact.coordinators && contact.coordinators.length === 0 && (
                                <div className="text-center text-slate-500 py-8 bg-black/20 rounded-xl border border-white/5">
                                    No coordinators added yet. Click "Add" to create one.
                                </div>
                            )}
                            {contact.coordinators && contact.coordinators.map((coord: any, index: number) => (
                                <div key={index} className="p-6 bg-black/20 rounded-xl border border-white/5 relative hover:border-primary/30 transition-all">
                                    <button
                                        onClick={() => removeCoordinator(index)}
                                        className="absolute top-4 right-4 text-red-500 hover:text-red-400 bg-red-500/10 p-1 rounded-lg"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </button>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="w-16 h-16 rounded-full overflow-hidden bg-black/40 border border-white/10 flex-shrink-0">
                                                {coord.image ? (
                                                    <img src={coord.image} alt={coord.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">No Img</div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Photo</label>
                                                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                                                        <button
                                                            onClick={() => updateCoordinator(index, 'imageType', 'url')}
                                                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${coord.imageType !== 'upload' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'}`}
                                                        >
                                                            <LinkIcon className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateCoordinator(index, 'imageType', 'upload')}
                                                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${coord.imageType === 'upload' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'}`}
                                                        >
                                                            <Upload className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {coord.imageType === 'upload' ? (
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => e.target.files && handleFileUpload(index, e.target.files[0])}
                                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                                            disabled={uploading[index]}
                                                        />
                                                        {uploading[index] && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                                                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <input
                                                        placeholder="Image URL"
                                                        value={coord.image || ''}
                                                        onChange={(e) => updateCoordinator(index, 'image', e.target.value)}
                                                        className="w-full bg-transparent border-b border-white/10 focus:border-primary focus:outline-none text-white text-sm pb-1"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Name</label>
                                            <input
                                                placeholder="Name"
                                                value={coord.name}
                                                onChange={(e) => updateCoordinator(index, 'name', e.target.value)}
                                                className="w-full bg-transparent border-b border-white/10 focus:border-primary focus:outline-none text-white pb-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Role</label>
                                            <input
                                                placeholder="Role"
                                                value={coord.role}
                                                onChange={(e) => updateCoordinator(index, 'role', e.target.value)}
                                                className="w-full bg-transparent border-b border-white/10 focus:border-primary focus:outline-none text-white pb-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Phone</label>
                                            <input
                                                placeholder="Phone"
                                                value={coord.phone}
                                                onChange={(e) => updateCoordinator(index, 'phone', e.target.value)}
                                                className="w-full bg-transparent border-b border-white/10 focus:border-primary focus:outline-none text-white pb-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
