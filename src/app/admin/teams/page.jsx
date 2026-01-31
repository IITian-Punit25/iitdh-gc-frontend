'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Loader from '@/components/ui/Loader';
import { Save, Plus, Trash, Crown } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import PasswordModal from '@/components/ui/PasswordModal';

export default function ManageTeams() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState({});
    const [selectedTeamId, setSelectedTeamId] = useState("");
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [confirmCallback, setConfirmCallback] = useState(null);
    const router = useRouter();

    const handleLogout = async () => {
        await api.logout();
        router.push('/admin/login');
    };

    const fetchTeams = async () => {
        try {
            const data = await api.get('/api/teams');
            // Ensure all teams have a category (migration for existing data)
            const teamsWithCategory = data.map((t) => ({
                ...t,
                category: t.category || 'Men'
            }));
            setTeams(teamsWithCategory);
            if (teamsWithCategory.length > 0 && !selectedTeamId) {
                setSelectedTeamId(teamsWithCategory[0].id);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching teams:', err);
            // If unauthorized, redirect to login
            if (err.status === 401 || err.status === 403) {
                router.push('/admin/login');
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        // Quick check for token existence on mount
        const token = localStorage.getItem('adminToken');
        if (!token) router.push('/admin/login');
        else fetchTeams();
    }, [router]);

    const handleSaveClick = async () => {
        for (const team of teams) {
            if (!team.name) {
                alert("All teams must have a name.");
                return;
            }
            if (team.members.length === 0) {
                alert(`Team "${team.name}" must have at least one member.`);
                return;
            }
            for (const member of team.members) {
                if (!member.name) {
                    alert(`All members in team "${team.name}" must have a name.`);
                    return;
                }
            }
        }
        setConfirmCallback(() => executeSave);
        setIsPasswordModalOpen(true);
    };

    const executeSave = async (password) => {
        setSaving(true);
        try {
            // Using fetch directly for password header
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'x-admin-password': password
                },
                body: JSON.stringify(teams)
            });

            if (res.ok) {
                alert('Teams saved successfully!');
                return true;
            } else {
                if (res.status === 401 || res.status === 403) return false;
                const data = await res.json().catch(() => ({}));
                alert(data.message || 'Failed to save teams.');
                return true;
            }
        } catch (error) {
            console.error('Error saving teams:', error);
            alert('Failed to save teams.');
            return true;
        } finally {
            setSaving(false);
        }
    };

    const updateTeamName = (index, name) => {
        setTeams(prevTeams => {
            const newTeams = [...prevTeams];
            newTeams[index] = { ...newTeams[index], name };
            return newTeams;
        });
    };

    const updateTeamCategory = (index, category) => {
        setTeams(prevTeams => {
            const newTeams = [...prevTeams];
            newTeams[index] = { ...newTeams[index], category };
            return newTeams;
        });
    };

    const addTeamClick = () => {
        const teamName = prompt("Enter Team Name:");
        if (!teamName) return;

        const memberName = prompt("Enter First Member Name:");
        if (!memberName) return;

        setConfirmCallback(() => (password) => executeAddTeam(teamName, memberName, password));
        setIsPasswordModalOpen(true);
    };

    const executeAddTeam = async (teamName, memberName, password) => {
        const newTeamId = Date.now().toString();
        const newTeam = {
            id: newTeamId,
            name: teamName,
            category: 'Men',
            members: [{ name: memberName, year: '1st Year', branch: 'CSE', isCaptain: true, image: '' }]
        };

        const newTeams = [newTeam, ...teams];
        setSaving(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'x-admin-password': password
                },
                body: JSON.stringify(newTeams)
            });

            if (res.ok) {
                setTeams(newTeams);
                setSelectedTeamId(newTeamId);
                alert('Team added successfully!');
                return true;
            } else {
                if (res.status === 401 || res.status === 403) return false;
                alert('Failed to add team.');
                return true;
            }
        } catch (error) {
            console.error('Error adding team:', error);
            alert('Failed to add team.');
            return true;
        } finally {
            setSaving(false);
        }
    };

    const removeTeamClick = (index) => {
        const teamToDelete = teams[index];
        if (!confirm(`Are you sure you want to delete team "${teamToDelete.name}" (${teamToDelete.category})? This will IMMEDIATELY remove all associated data (matches, results, standings) and cannot be undone.`)) {
            return;
        }
        setConfirmCallback(() => (password) => executeRemoveTeam(index, password));
        setIsPasswordModalOpen(true);
    };

    const executeRemoveTeam = async (index, password) => {
        const teamToDelete = teams[index];
        setSaving(true);
        try {
            // 1. Fetch all related data
            const [scheduleData, resultsData, standingsData] = await Promise.all([
                api.get('/api/schedule'),
                api.get('/api/results'),
                api.get('/api/standings')
            ]);

            // Handle array checks
            const schedule = Array.isArray(scheduleData) ? scheduleData : [];
            const results = Array.isArray(resultsData) ? resultsData : [];
            const standings = Array.isArray(standingsData) ? standingsData : [];

            // 2. Filter out matches/results involving the team
            const updatedSchedule = schedule.filter((m) => m.teamA !== teamToDelete.name && m.teamB !== teamToDelete.name);
            const updatedResults = results.filter((r) => r.teamA !== teamToDelete.name && r.teamB !== teamToDelete.name);

            // 3. Update standings (clear team name if present)
            const updatedStandings = standings.map((s) => {
                const newResults = { ...s.results };
                if (newResults.first === teamToDelete.name) newResults.first = '';
                if (newResults.second === teamToDelete.name) newResults.second = '';
                if (newResults.third === teamToDelete.name) newResults.third = '';
                if (newResults.fourth === teamToDelete.name) newResults.fourth = '';
                return { ...s, results: newResults };
            });

            // 4. Save updated data (we need to send password for these too if they are being protected now)
            // But we can assume the main team deletion is the gatekeeper. Ideally backend should handle cascading deletes transactionally.
            // Since we are doing it client-side (as per existing logic), we'll just try to save them.
            // If the other endpoints are also password protected, we need to pass the password header to them too!

            // To allow this to work seamlessly, we will use the same password for all requests.
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'x-admin-password': password
            };

            await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule`, { method: 'POST', headers, body: JSON.stringify(updatedSchedule) }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results`, { method: 'POST', headers, body: JSON.stringify(updatedResults) }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/standings`, { method: 'POST', headers, body: JSON.stringify(updatedStandings) })
            ]);

            // 5. Remove team locally and save
            const newTeams = [...teams];
            newTeams.splice(index, 1);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newTeams)
            });

            if (res.ok) {
                setTeams(newTeams);
                if (newTeams.length > 0) {
                    setSelectedTeamId(newTeams[0].id);
                } else {
                    setSelectedTeamId("");
                }
                alert('Team and associated data deleted successfully!');
                return true;
            } else {
                if (res.status === 401 || res.status === 403) return false;
                alert('Failed to delete team.');
                return true;
            }
        } catch (error) {
            console.error("Error deleting team:", error);
            alert("Failed to delete team and associated data.");
            return true;
        } finally {
            setSaving(false);
        }
    };

    const addMember = (teamIndex) => {
        setTeams(prevTeams => {
            const newTeams = [...prevTeams];
            const newMembers = [{ name: '', year: '', branch: '', isCaptain: false, image: '' }, ...newTeams[teamIndex].members];
            newTeams[teamIndex] = { ...newTeams[teamIndex], members: newMembers };
            return newTeams;
        });
    };

    const updateMember = (teamIndex, memberIndex, field, value) => {
        setTeams(prevTeams => {
            const newTeams = [...prevTeams];
            const newTeam = { ...newTeams[teamIndex] };
            const newMembers = [...newTeam.members];
            newMembers[memberIndex] = { ...newMembers[memberIndex], [field]: value };
            newTeam.members = newMembers;
            newTeams[teamIndex] = newTeam;
            return newTeams;
        });
    };

    const toggleCaptain = (teamIndex, memberIndex) => {
        setTeams(prevTeams => {
            const newTeams = [...prevTeams];
            const newTeam = { ...newTeams[teamIndex] };
            const newMembers = newTeam.members.map((member, idx) => ({
                ...member,
                isCaptain: idx === memberIndex
            }));
            newTeam.members = newMembers;
            newTeams[teamIndex] = newTeam;
            return newTeams;
        });
    };

    const removeMember = (teamIndex, memberIndex) => {
        if (teams[teamIndex].members.length <= 1) {
            alert("A team must have at least one member.");
            return;
        }
        setTeams(prevTeams => {
            const newTeams = [...prevTeams];
            const newTeam = { ...newTeams[teamIndex] };
            const newMembers = [...newTeam.members];
            newMembers.splice(memberIndex, 1);

            // If we removed the captain, make the first member captain
            if (newMembers.length > 0 && !newMembers.some(m => m.isCaptain)) {
                newMembers[0] = { ...newMembers[0], isCaptain: true };
            }

            newTeam.members = newMembers;
            newTeams[teamIndex] = newTeam;
            return newTeams;
        });
    };


    const handleFileUploadChange = async (teamIndex, memberIndex, file) => {
        if (!file) return;

        const uploadKey = `${teamIndex}-${memberIndex}`;
        setUploading(prev => ({ ...prev, [uploadKey]: true }));
        const formData = new FormData();
        formData.append('image', file);

        try {
            const data = await api.upload('/api/upload', formData);
            if (data.success) {
                updateMember(teamIndex, memberIndex, 'image', data.url);
            } else {
                alert('Upload failed: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file');
        } finally {
            setUploading(prev => ({ ...prev, [uploadKey]: false }));
        }
    };

    if (loading) return <Loader />;

    const selectedTeamIndex = teams.findIndex(t => t.id === selectedTeamId);
    const selectedTeam = teams[selectedTeamIndex];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Manage Teams</h1>
                        <p className="text-slate-400">Add or edit hostel teams and members</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={addTeamClick}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl flex items-center transition-all border border-white/10"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add Team
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
                                    <Save className="h-5 w-5 mr-2" />
                                    Save Changes
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

                {/* Team Selection Dropdown */}
                <div className="mb-8">
                    <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">Select Team to Edit</label>
                    <CustomSelect
                        value={selectedTeamId}
                        onValueChange={setSelectedTeamId}
                        placeholder="Select a Team"
                        options={teams.map((team) => ({ value: team.id, label: `${team.name} (${team.category})` }))}
                        className="w-full md:w-1/3"
                    />
                </div>

                {selectedTeam ? (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                        {/* Header */}
                        <div className="bg-black/30 p-6 border-b border-white/10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                                        {selectedTeam.name?.charAt(0) || 'T'}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            value={selectedTeam.name}
                                            onChange={(e) => updateTeamName(selectedTeamIndex, e.target.value)}
                                            className="bg-transparent text-2xl font-bold text-white focus:outline-none border-b border-transparent focus:border-primary transition-colors w-full mb-2"
                                            placeholder="Enter Team Name"
                                        />
                                        <div className="flex items-center gap-4">
                                            <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                                                <button
                                                    type="button"
                                                    onClick={() => updateTeamCategory(selectedTeamIndex, 'Men')}
                                                    className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${selectedTeam.category === 'Men' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'}`}
                                                >
                                                    Men
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateTeamCategory(selectedTeamIndex, 'Women')}
                                                    className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${selectedTeam.category === 'Women' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'}`}
                                                >
                                                    Women
                                                </button>
                                            </div>
                                            <p className="text-slate-400 text-sm">{selectedTeam.members.length} members</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeTeamClick(selectedTeamIndex)}
                                    className="text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                    title="Delete Team"
                                >
                                    <Trash className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Members Section */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm text-slate-400 font-bold uppercase tracking-wider">Team Members</h3>
                                <button
                                    onClick={() => addMember(selectedTeamIndex)}
                                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all font-bold"
                                >
                                    <Plus className="h-3 w-3" />
                                    Add Member
                                </button>
                            </div>

                            <div className="space-y-3">
                                {selectedTeam.members.map((member, memberIndex) => (
                                    <div
                                        key={memberIndex}
                                        className={`bg-gradient-to-r ${member.isCaptain ? 'from-yellow-500/10 to-transparent border-yellow-500/20' : 'from-white/5 to-transparent border-white/5'} p-4 rounded-xl border transition-all hover:border-white/20`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-black/40 border-2 border-white/10 cursor-pointer shrink-0 group/img">
                                                {member.image ? (
                                                    <img src={member.image} alt="Member" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-lg font-bold">
                                                        {member.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => e.target.files && handleFileUploadChange(selectedTeamIndex, memberIndex, e.target.files[0])}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    title="Upload Image"
                                                />
                                                {uploading[`${selectedTeamIndex}-${memberIndex}`] && (
                                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                                {member.isCaptain && (
                                                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                                                        <Crown className="h-3 w-3 text-black" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Member Info */}
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <input
                                                    placeholder="Member Name"
                                                    value={member.name}
                                                    onChange={(e) => updateMember(selectedTeamIndex, memberIndex, 'name', e.target.value)}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:border-primary focus:outline-none text-white text-sm transition-colors"
                                                />
                                                <CustomSelect
                                                    value={member.year}
                                                    onValueChange={(val) => updateMember(selectedTeamIndex, memberIndex, 'year', val)}
                                                    placeholder="Year"
                                                    options={[
                                                        { value: '1st Year', label: '1st Year' },
                                                        { value: '2nd Year', label: '2nd Year' },
                                                        { value: '3rd Year', label: '3rd Year' },
                                                        { value: '4th Year', label: '4th Year' },
                                                        { value: '5th Year', label: '5th Year' }
                                                    ]}
                                                />
                                                <CustomSelect
                                                    value={member.branch}
                                                    onValueChange={(val) => updateMember(selectedTeamIndex, memberIndex, 'branch', val)}
                                                    placeholder="Branch"
                                                    options={[
                                                        { value: 'CSE', label: 'CSE' },
                                                        { value: 'EE', label: 'EE' },
                                                        { value: 'ME', label: 'ME' },
                                                        { value: 'ECE', label: 'ECE' },
                                                        { value: 'EEE', label: 'EEE' },
                                                        { value: 'M&C', label: 'M&C' },
                                                        { value: 'EP', label: 'EP' },
                                                        { value: 'C&IE', label: 'C&IE' },
                                                        { value: 'C&BE', label: 'C&BE' },
                                                        { value: 'BS-MS', label: 'BS-MS' }
                                                    ]}
                                                />
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => toggleCaptain(selectedTeamIndex, memberIndex)}
                                                    className={`p-2 rounded-lg transition-all ${member.isCaptain ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-500 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
                                                    title={member.isCaptain ? "Team Captain" : "Set as Captain"}
                                                >
                                                    <Crown className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => removeMember(selectedTeamIndex, memberIndex)}
                                                    className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                        <Crown className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg">
                            {teams.length === 0 ? "No teams found. Click 'Add Team' to start." : "Select a team from the dropdown to edit."}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
