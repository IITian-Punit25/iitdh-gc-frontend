'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Save, Plus, Trash, Crown } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { useRouter } from 'next/navigation';

export default function ManageTeams() {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
    const [selectedTeamId, setSelectedTeamId] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) router.push('/admin/login');

        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/teams`)
            .then((res) => res.json())
            .then((data) => {
                setTeams(data);
                if (data.length > 0) {
                    setSelectedTeamId(data[0].id);
                }
                setLoading(false);
            });
    }, [router]);

    const handleSave = async () => {
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

        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teams),
        });
        alert('Teams saved successfully!');
    };

    const updateTeamName = (index: number, name: string) => {
        const newTeams = [...teams];
        newTeams[index].name = name;
        setTeams(newTeams);
    };

    const addTeam = () => {
        const teamName = prompt("Enter Team Name:");
        if (!teamName) return;

        const memberName = prompt("Enter First Member Name:");
        if (!memberName) return;

        const newTeamId = Date.now().toString();
        const newTeam = {
            id: newTeamId,
            name: teamName,
            members: [{ name: memberName, year: '1st Year', branch: 'CSE', isCaptain: true, image: '' }]
        };

        setTeams([newTeam, ...teams]);
        setSelectedTeamId(newTeamId);
    };

    const removeTeam = (index: number) => {
        if (confirm('Are you sure you want to delete this team?')) {
            const newTeams = [...teams];
            newTeams.splice(index, 1);
            setTeams(newTeams);
            if (newTeams.length > 0) {
                setSelectedTeamId(newTeams[0].id);
            } else {
                setSelectedTeamId("");
            }
        }
    };

    const addMember = (teamIndex: number) => {
        const newTeams = [...teams];
        newTeams[teamIndex].members.unshift({ name: '', year: '', branch: '', isCaptain: false, image: '' });
        setTeams(newTeams);
    };

    const updateMember = (teamIndex: number, memberIndex: number, field: string, value: string) => {
        const newTeams = [...teams];
        newTeams[teamIndex].members[memberIndex][field] = value;
        setTeams(newTeams);
    };

    const toggleCaptain = (teamIndex: number, memberIndex: number) => {
        const newTeams = [...teams];
        // Unset captain for all other members in the team
        newTeams[teamIndex].members.forEach((member: any, idx: number) => {
            member.isCaptain = idx === memberIndex;
        });
        setTeams(newTeams);
    };

    const removeMember = (teamIndex: number, memberIndex: number) => {
        if (teams[teamIndex].members.length <= 1) {
            alert("A team must have at least one member.");
            return;
        }
        const newTeams = [...teams];
        newTeams[teamIndex].members.splice(memberIndex, 1);
        // If we removed the captain, make the first member captain
        if (newTeams[teamIndex].members.length > 0 && !newTeams[teamIndex].members.some((m: any) => m.isCaptain)) {
            newTeams[teamIndex].members[0].isCaptain = true;
        }
        setTeams(newTeams);
    };

    const handleFileUpload = async (teamIndex: number, memberIndex: number, file: File) => {
        if (!file) return;

        const uploadKey = `${teamIndex}-${memberIndex}`;
        setUploading(prev => ({ ...prev, [uploadKey]: true }));
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                updateMember(teamIndex, memberIndex, 'image', data.url);
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file');
        } finally {
            setUploading(prev => ({ ...prev, [uploadKey]: false }));
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

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
                            onClick={addTeam}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl flex items-center transition-all border border-white/10"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add Team
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-xl flex items-center transition-all shadow-lg shadow-primary/20"
                        >
                            <Save className="h-5 w-5 mr-2" />
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Team Selection Dropdown */}
                <div className="mb-8">
                    <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">Select Team to Edit</label>
                    <CustomSelect
                        value={selectedTeamId}
                        onValueChange={setSelectedTeamId}
                        placeholder="Select a Team"
                        options={teams.map(team => ({ value: team.id, label: team.name }))}
                        className="w-full md:w-1/3"
                    />
                </div>

                {selectedTeam ? (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                        {/* Header */}
                        <div className="bg-black/30 p-6 border-b border-white/10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                                        {selectedTeam.name?.charAt(0) || 'T'}
                                    </div>
                                    <div>
                                        <input
                                            value={selectedTeam.name}
                                            onChange={(e) => updateTeamName(selectedTeamIndex, e.target.value)}
                                            className="bg-transparent text-2xl font-bold text-white focus:outline-none border-b border-transparent focus:border-primary transition-colors w-full"
                                            placeholder="Enter Team Name"
                                        />
                                        <p className="text-slate-400 text-sm mt-1">{selectedTeam.members.length} members</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeTeam(selectedTeamIndex)}
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
                                {selectedTeam.members.map((member: any, memberIndex: number) => (
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
                                                    onChange={(e) => e.target.files && handleFileUpload(selectedTeamIndex, memberIndex, e.target.files[0])}
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
