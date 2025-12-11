import React, { useState } from 'react';
import { User, School, GraduationCap, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { GlassCard, Button } from './UIComponents';
import { User as UserType } from '../types';
import { updateUserProfile } from '../services/backend';

interface ProfilePanelProps {
  user: UserType;
  updateUser: (u: UserType) => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ user, updateUser }) => {
  const [name, setName] = useState(user.name || '');
  const [college, setCollege] = useState(user.collegeName || '');
  const [classYear, setClassYear] = useState(user.class || '11');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const updatedUser = updateUserProfile(user.id, {
        name,
        collegeName: college,
        class: classYear as '11' | '12'
      });
      
      updateUser(updatedUser);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to update profile.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full p-4 md:p-8 overflow-y-auto space-y-6">
       <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Profile Settings</h2>
      </div>

      <div className="max-w-2xl">
        <GlassCard title="Personal Information" icon={<User size={18} />}>
            <form onSubmit={handleSave} className="p-6 space-y-4">
                <p className="text-sm text-slate-500 mb-2">These details help the AI tutor customize explanations for you.</p>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Your Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 text-slate-800 text-sm"
                            placeholder="Student Name"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">College / School</label>
                    <div className="relative">
                        <School className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            required
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 text-slate-800 text-sm"
                            placeholder="College Name"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Class / Year</label>
                    <div className="relative">
                        <GraduationCap className="absolute left-3 top-3 text-slate-400" size={18} />
                        <select
                            value={classYear}
                            onChange={(e) => setClassYear(e.target.value as '11' | '12')}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 text-slate-800 text-sm appearance-none"
                        >
                            <option value="11">Class 11</option>
                            <option value="12">Class 12</option>
                        </select>
                    </div>
                </div>

                {message && (
                    <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {message.text}
                    </div>
                )}

                <Button isLoading={isLoading} icon={<Save size={16} />} className="w-full">Save Changes</Button>
            </form>
        </GlassCard>
      </div>
    </div>
  );
};