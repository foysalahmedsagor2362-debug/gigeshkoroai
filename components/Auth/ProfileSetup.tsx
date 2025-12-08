import React, { useState } from 'react';
import { User, GraduationCap, School } from 'lucide-react';
import { Button } from '../UIComponents';
import { updateUserProfile } from '../../services/backend';
import { User as UserType } from '../../types';

interface ProfileSetupProps {
  user: UserType;
  onComplete: (user: UserType) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ user, onComplete }) => {
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [classYear, setClassYear] = useState<'11' | '12'>('11');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !college) return;
    
    setIsLoading(true);
    try {
      const updated = updateUserProfile(user.id, {
        name,
        collegeName: college,
        class: classYear
      });
      onComplete(updated);
    } catch (e) {
      alert("Failed to update profile");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Complete Profile</h1>
        <p className="text-slate-500 mb-6 text-sm">Please provide your academic details to continue.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Student Name"
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
                placeholder="e.g. Dhaka College"
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

          <Button 
            className="w-full h-11 mt-4" 
            isLoading={isLoading}
          >
            Save & Continue
          </Button>
        </form>
      </div>
    </div>
  );
};
