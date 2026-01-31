'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Loader from '@/components/ui/Loader';
import { Save, Play, Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import PasswordModal from '@/components/ui/PasswordModal';

// URL validation helper
const isValidUrl = (url) => {
    if (!url || url.trim() === '') return true; // Empty is valid (optional field)
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

const SPORTS = [
    'Athletics',
    'Badminton',
    'Basketball',
    'Chess',
    'Cricket',
    'Football',
    'Squash',
    'Table Tennis',
    'Volleyball',
    'Weightlifting',
    'Powerlifting',
    'Tug of War'
];

export default function ManageStreams() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedSport, setSelectedSport] = useState(SPORTS[0]);
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
                // Using api helper which handles auth headers
                const [scheduleData, resultsData] = await Promise.all([
                    api.get('/api/schedule'),
                    api.get('/api/results')
                ]);

                const safeSchedule = Array.isArray(scheduleData) ? scheduleData : (scheduleData ? [scheduleData] : []);
                const safeResults = Array.isArray(resultsData) ? resultsData : (resultsData ? [resultsData] : []);

                // Merge both datasets - use a Map to avoid duplicates by id
                // Results data takes priority (may have updated stream info)
                const matchMap = new Map();

                // Add schedule matches first
                safeSchedule.forEach((match) => {
                    matchMap.set(match.id, { ...match, source: 'schedule' });
                });

                // Add/override with results matches (they may have stream info already)
                safeResults.forEach((match) => {
                    matchMap.set(match.id, { ...match, source: 'result' });
                });

                setResults(Array.from(matchMap.values()));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                // Auth errors are handled by api helper throwing or we can catch here
                // api helper in this project re-throws 401/403, so we can catch it.
                if (error.status === 401 || error.status === 403) {
                    handleLogout();
                }
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleSaveClick = async () => {
        setConfirmCallback(() => executeSave);
        setIsPasswordModalOpen(true);
    };

    const executeSave = async (password) => {
        setSaving(true);
        try {
            const scheduleUpdates = results.filter(r => r.source === 'schedule');
            const resultUpdates = results.filter(r => r.source === 'result');

            // Using fetch to pass password header
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'x-admin-password': password
            };

            await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule`, { method: 'POST', headers, body: JSON.stringify(scheduleUpdates) }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results`, { method: 'POST', headers, body: JSON.stringify(resultUpdates) })
            ]);

            alert('Streams saved successfully!');
            return true;
        } catch (error) {
            console.error('Error saving streams:', error);
            if (error.status === 401 || error.status === 403) {
                // Assuming api behavior or simple catch
                return false;
            }
            alert('Failed to save streams.');
            return true;
        } finally {
            setSaving(false);
        }
    };

    const updateLiveLink = (id, field, value) => {
        const newResults = results.map(match => {
            if (match.id === id) {
                return { ...match, [field]: value };
            }
            return match;
        });
        setResults(newResults);
    };

    if (loading) return <Loader />;

    const filteredResults = results.filter(match => match.sport === selectedSport);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">Manage Streams</h1>
                        <p className="text-muted-foreground">Add or update live stream links for matches</p>
                    </div>
                    <button
                        onClick={handleSaveClick}
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl flex items-center transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="h-5 w-5 mr-2 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5 mr-2" />
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

                {/* Sport Selection Dropdown */}
                <div className="mb-8">
                    <label className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2 block">Filter by Sport</label>
                    <CustomSelect
                        value={selectedSport}
                        onValueChange={setSelectedSport}
                        options={SPORTS.map(sport => ({ value: sport, label: sport }))}
                        className="w-full md:w-1/3"
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {filteredResults.map((match) => (
                        <div key={match.id} className="bg-card backdrop-blur-sm p-6 rounded-2xl border border-border hover:border-primary/50 transition-all flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded uppercase">{match.sport}</span>
                                    <span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded">
                                        {match.category === 'Women' ? 'W' : match.category === 'Men' ? 'M' : 'X'}
                                    </span>
                                    <span className="text-muted-foreground text-sm">{match.date}</span>
                                </div>
                                <div className="text-xl font-bold text-foreground">
                                    {match.teamA} <span className="text-muted-foreground mx-2">vs</span> {match.teamB}
                                </div>
                            </div>

                            <div className="w-full md:w-1/2 space-y-4">
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2 block flex items-center">
                                        <Play className="h-3 w-3 mr-1" /> Live Stream URL
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <input
                                            value={match.liveLink || ''}
                                            onChange={(e) => updateLiveLink(match.id, 'liveLink', e.target.value)}
                                            className={`w-full bg-input border rounded-lg pl-10 pr-10 p-3 text-foreground focus:outline-none transition-colors ${match.liveLink && !isValidUrl(match.liveLink)
                                                ? 'border-destructive focus:border-destructive'
                                                : match.liveLink && isValidUrl(match.liveLink)
                                                    ? 'border-chart-3/50 focus:border-chart-3'
                                                    : 'border-border focus:border-primary'
                                                }`}
                                            placeholder="https://youtube.com/..."
                                        />
                                        {/* Validation indicator */}
                                        {match.liveLink && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                {isValidUrl(match.liveLink) ? (
                                                    <CheckCircle className="h-4 w-4 text-chart-3" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {match.liveLink && !isValidUrl(match.liveLink) && (
                                        <p className="text-destructive text-xs mt-1">Please enter a valid URL (e.g., https://youtube.com/...)</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2 block">
                                        Stream Status
                                    </label>
                                    <CustomSelect
                                        value={match.streamStatus || 'Ended'}
                                        onValueChange={(val) => updateLiveLink(match.id, 'streamStatus', val)}
                                        options={[
                                            { value: 'Ended', label: 'Ended / Not Live' },
                                            { value: 'Live', label: 'Live Now' },
                                            { value: 'Upcoming', label: 'Starting Soon' }
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredResults.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border">
                            No matches found for {selectedSport}.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
