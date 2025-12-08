import React, { useState } from 'react';
import { User, School, GraduationCap, Mail, Save, CheckCircle, AlertCircle } from 'lucide-react';
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
      // Simulate network delay
      await new Promise(r => setTimeout(r, 800));
      
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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Profile & Settings</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Edit Profile Form */}
        <GlassCard title="Personal Information" icon={<User size={18} />}>
            <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 text-slate-800 text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">College Name</label>
                    <div className="relative">
                        <School className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            required
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 text-slate-800 text-sm"
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

        <div className="space-y-6">
            {/* Account Status */}
            <GlassCard title="Account Details" className="h-fit">
                <div className="p-6">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-sm text-slate-500">Email</span>
                        <span className="text-sm font-medium text-slate-800">{user.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-sm text-slate-500">Plan</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${user.isPremium ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                            {user.isPremium ? 'Premium' : 'Free'}
                        </span>
                    </div>
                    {user.isPremium && (
                         <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-slate-500">Expires</span>
                            <span className="text-sm font-medium text-slate-800">{new Date(user.premiumExpiry || '').toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Contact Support */}
            <GlassCard title="Contact Support" icon={<Mail size={18} />} className="bg-gradient-to-br from-primary-600 to-indigo-700 text-white border-none">
                <div className="p-6">
                    <p className="text-primary-100 text-sm mb-4">
                        Need help with your account or have feedback? Contact our support team directly.
                    </p>
                    <a 
                      href="mailto:foysalahmedsagor2362@gmail.com"
                      className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20 flex items-center gap-3 hover:bg-white/20 transition-colors group cursor-pointer block"
                    >
                        <div className="bg-white p-2 rounded-lg text-primary-600 shadow-sm group-hover:scale-105 transition-transform">
                            <Mail size={20} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[10px] text-primary-200 uppercase font-bold tracking-wider">Email Us At</p>
                            <p className="text-sm font-bold truncate select-all">foysalahmedsagor2362@gmail.com</p>
                        </div>
                    </a>
                </div>
            </GlassCard>
        </div>
      </div>
    </div>
  );
};