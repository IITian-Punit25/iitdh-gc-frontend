'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Loader from '@/components/ui/Loader';
import { Save, Plus, Trash, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import PasswordModal from '@/components/ui/PasswordModal';

export default function ManageContact() {
    const [contact, setContact] = useState(null);
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

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        const fetchData = async () => {
            try {
                const data = await api.get('/api/contact');
                // Ensure proper default structure
                const defaultContact = {
                    email: '',
                    phone: '',
                    address: '',
                    coordinators: [],
                    ...data,
                    socialMedia: { instagram: '', youtube: '', ...(data?.socialMedia || {}) }
                };
                setContact(defaultContact);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching contact:', err);
                if (err.status === 401 || err.status === 403) {
                    handleLogout();
                }
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleSaveClick = async () => {
        if (!contact) return;
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

        setConfirmCallback(() => executeSave);
        setIsPasswordModalOpen(true);
    };

    const executeSave = async (password) => {
        setSaving(true);
        try {
            // Using fetch directly to include password header
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'x-admin-password': password
                },
                body: JSON.stringify(contact)
            });

            if (res.ok) {
                alert('Contact info saved successfully!');
                return true;
            } else {
                if (res.status === 401 || res.status === 403) return false;
                const data = await res.json().catch(() => ({}));
                alert(data.message || 'Failed to save contact info.');
                return true;
            }
        } catch (error) {
            console.error('Error saving contact info:', error);
            alert('Failed to save contact info.');
            return true;
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field, value) => {
        if (!contact) return;
        setContact({ ...contact, [field]: value });
    };

    const updateSocial = (platform, value) => {
        if (!contact) return;
        setContact({
            ...contact,
            socialMedia: { ...contact.socialMedia, [platform]: value },
        });
    };

    const addCoordinator = () => {
        if (!contact) return;
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

    const updateCoordinator = (index, field, value) => {
        if (!contact) return;
        const newCoordinators = [...contact.coordinators];
        newCoordinators[index][field] = value;
        setContact({ ...contact, coordinators: newCoordinators });
    };

    const removeCoordinator = (index) => {
        if (!contact) return;
        // Optional: Require password for removing coordinator? 
        // User asked for "changes in admin panel" generally. 
        // Adding it here for consistency with other delete actions.
        setConfirmCallback(() => (password) => executeRemoveCoordinator(index, password));
        setIsPasswordModalOpen(true);
    };

    const executeRemoveCoordinator = async (index, password) => {
        const newCoordinators = [...contact.coordinators];
        newCoordinators.splice(index, 1);
        const newContact = { ...contact, coordinators: newCoordinators };

        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'x-admin-password': password
                },
                body: JSON.stringify(newContact)
            });

            if (res.ok) {
                setContact(newContact);
                alert('Coordinator removed successfully!');
                return true;
            } else {
                if (res.status === 401 || res.status === 403) return false;
                alert('Failed to remove coordinator.');
                return true;
            }
        } catch (error) {
            console.error("Error removing coordinator:", error);
            alert('Failed to remove coordinator.');
            return true;
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (index, file) => {
        if (!file) return;

        setUploading((prev) => ({ ...prev, [index]: true }));
        const formData = new FormData();
        formData.append('image', file);

        try {
            // Use api.upload which handles token and errors
            const data = await api.upload('/api/upload', formData);

            if (data.success) {
                updateCoordinator(index, 'image', data.url);
            } else {
                alert('Upload failed: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            if (error.status === 401 || error.status === 403) {
                handleLogout();
            } else {
                alert('Error uploading file');
            }
        } finally {
            setUploading((prev) => ({ ...prev, [index]: false }));
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
                            Manage Contact Info
                        </h1>
                        <p className="text-slate-400">Update contact details and coordinators</p>
                    </div>
                    <button
                        onClick={handleSaveClick}
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>

                <PasswordModal
                    isOpen={isPasswordModalOpen}
                    onClose={() => setIsPasswordModalOpen(false)}
                    onConfirm={(password) => confirmCallback ? confirmCallback(password) : Promise.resolve(false)}
                    onExceededAttempts={handleLogout}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
                            <h2 className="text-2xl font-bold text-primary mb-6">General Info</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Email</label>
                                    <input
                                        type="email"
                                        value={contact?.email || ''}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Phone</label>
                                    <input
                                        type="text"
                                        value={contact?.phone || ''}
                                        onChange={(e) => updateField('phone', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Address</label>
                                    <textarea
                                        value={contact?.address || ''}
                                        onChange={(e) => updateField('address', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors h-24 resize-none"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
                            <h2 className="text-2xl font-bold text-primary mb-6">Social Media</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Instagram</label>
                                    <input
                                        type="text"
                                        value={contact?.socialMedia?.instagram || ''}
                                        onChange={(e) => updateSocial('instagram', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">YouTube</label>
                                    <input
                                        type="text"
                                        value={contact?.socialMedia?.youtube || ''}
                                        onChange={(e) => updateSocial('youtube', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 h-fit">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-primary">Coordinators</h2>
                            <button
                                onClick={addCoordinator}
                                className="text-primary hover:text-primary/80 text-sm font-bold flex items-center uppercase tracking-wider"
                            >
                                <Plus className="h-4 w-4 mr-1" /> Add
                            </button>
                        </div>
                        <div className="space-y-4">
                            {(!contact?.coordinators || contact.coordinators.length === 0) && (
                                <div className="col-span-full text-center py-8 text-slate-500 bg-black/20 rounded-xl border border-white/5 border-dashed">
                                    No coordinators added yet. Click "Add" to create one.
                                </div>
                            )}
                            {contact?.coordinators && contact.coordinators.map((coord, index) => (
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
