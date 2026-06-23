'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/apiClient';
import {
  User,
  Shield,
  FileText,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Lock
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setDob(user.dob ? user.dob.substring(0, 10) : '');
      setPanNumber(user.pan_number || '');
      setAadhaarNumber(user.aadhaar_number || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setState(user.state || '');
      setPincode(user.pincode || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          phone,
          dob: dob || undefined,
          pan_number: panNumber || undefined,
          aadhaar_number: aadhaarNumber || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          pincode: pincode || undefined,
        }),
      });

      if (data.success) {
        setSuccess('Profile updated successfully!');
        await refreshUser();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div>
        <h1 className="font-outfit font-extrabold text-3xl bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
          My Profile
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Manage your personal credentials and system preferences.</p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Profile Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account Summary Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 text-center shadow-sm dark:shadow-none">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-purple-500 mx-auto flex items-center justify-center font-bold text-white text-3xl uppercase shadow-lg shadow-sky-500/10 mb-4">
              {user.name.substring(0, 2)}
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{user.name}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mt-1">{user.email}</p>
            <div className="flex justify-center flex-wrap gap-1.5 mt-3">
              {user.roles.map((role, idx) => (
                <span key={idx} className="text-[10px] font-bold px-2.5 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-full capitalize border border-sky-500/10">
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm dark:shadow-none">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-3 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              <span>Assigned Permissions</span>
            </h3>
            <div className="flex flex-wrap gap-1">
              {user.permissions.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400 text-xs italic">No specific permissions assigned.</p>
              ) : (
                user.permissions.map((perm, idx) => (
                  <span key={idx} className="text-[9.5px] font-mono px-2 py-0.5 bg-zinc-100 dark:bg-zinc-950/40 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-900 capitalize">
                    {perm}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Update Details Form */}
        <div className="lg:col-span-2">
          <div className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm dark:shadow-none">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <User className="w-4.5 h-4.5 text-sky-500 dark:text-sky-400" />
                  <span>Personal Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-800 dark:text-white focus:outline-none focus:border-sky-500 placeholder-zinc-400 dark:placeholder-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-800 dark:text-white focus:outline-none focus:border-sky-500 placeholder-zinc-400 dark:placeholder-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Date of Birth</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-zinc-700 dark:text-zinc-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={user.email}
                        className="w-full px-4 py-2.5 bg-zinc-100/50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-900 rounded-xl text-sm text-zinc-500 dark:text-zinc-500 focus:outline-none cursor-not-allowed"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 dark:text-zinc-600">
                        <Lock className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Credentials */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <FileText className="w-4.5 h-4.5 text-sky-500 dark:text-sky-400" />
                  <span>Regulatory Credentials</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">PAN Number</label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-800 dark:text-white focus:outline-none focus:border-sky-500 placeholder-zinc-400 dark:placeholder-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Aadhaar Number</label>
                    <input
                      type="text"
                      placeholder="123456789012"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-800 dark:text-white focus:outline-none focus:border-sky-500 placeholder-zinc-400 dark:placeholder-zinc-500"
                    />
                  </div>
                </div>
              </div>

              {/* Address details */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <MapPin className="w-4.5 h-4.5 text-sky-500 dark:text-sky-400" />
                  <span>Postal / Address details</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Street Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-800 dark:text-white focus:outline-none focus:border-sky-500 placeholder-zinc-400 dark:placeholder-zinc-500"
                      placeholder="Flat No, Block, Street Name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-800 dark:text-white focus:outline-none focus:border-sky-500 placeholder-zinc-400 dark:placeholder-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-800 dark:text-white focus:outline-none focus:border-sky-500 placeholder-zinc-400 dark:placeholder-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-800 dark:text-white focus:outline-none focus:border-sky-500 placeholder-zinc-400 dark:placeholder-zinc-500"
                        placeholder="110001"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-500/10 cursor-pointer flex items-center space-x-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Profile</span>
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
