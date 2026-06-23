'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Wallet,
  User,
  LogOut,
  Menu,
  X,
  Briefcase,
  Shield,
  Loader2,
  Search,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import Link from 'next/link';

// ─── Dark Mode Context ───────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme');
    if (stored) {
      setDark(stored === 'dark');
    } else {
      setDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark, mounted]);

  return [dark, () => setDark(d => !d), mounted] as const;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dark, toggleDark, themeMounted] = useDarkMode();
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Ctrl+K to focus global search
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-white min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-sky-500 mb-4" />
        <p className="text-zinc-400 text-sm font-semibold">Loading your session...</p>
      </div>
    );
  }

  if (!user) return null;

  const isAdminOrManager = user.roles.some(role => ['admin', 'manager'].includes(role));

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ...(isAdminOrManager ? [{ name: 'Agent Management', href: '/dashboard/agents', icon: Briefcase }] : []),
    { name: 'User Management', href: '/dashboard/users', icon: Users },
    { name: 'Investments List', href: '/dashboard/investments', icon: Wallet },
    ...(user.roles.includes('admin') ? [{ name: 'Roles & Permissions', href: '/dashboard/roles', icon: ShieldAlert }] : []),
    { name: 'My Profile', href: '/dashboard/profile', icon: User },
  ];

  const userInitials = user.name.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white relative transition-colors duration-300">
      {/* Background glows - dark mode only */}
      <div className="hidden dark:block absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-sky-500/5 blur-[100px] pointer-events-none" />
      <div className="hidden dark:block absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 w-64 h-full md:h-screen
          bg-white dark:bg-zinc-900
          border-r border-zinc-200 dark:border-zinc-800
          flex flex-col transition-transform duration-300 md:translate-x-0 shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Sidebar Header / Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/dashboard" className="flex items-center space-x-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <img src="/assets/investnent.png" width={100} height={100} alt="Investment Logo" />
            </div> 
            <span className="font-outfit font-bold text-xl tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              IMS Admin
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] group-hover:scale-110 transition-transform ${isActive ? 'text-sky-600 dark:text-sky-400' : ''}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer - User identity + sign out */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center font-bold text-sm text-white uppercase border border-zinc-200 dark:border-zinc-700">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-zinc-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate capitalize font-medium">
                {user.roles[0] ?? 'Staff'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen relative z-10 overflow-hidden">

        {/* ── Top Header Navbar ──────────────────────────────────────────────── */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center space-x-4 flex-1">

            {/* Mobile Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Welcome message - desktop */}
            <h2 className="text-zinc-700 dark:text-zinc-300 font-semibold text-sm hidden lg:block">
              Welcome back,{' '}
              <span className="text-zinc-900 dark:text-white font-bold">{user.name}</span>
            </h2>

            {/* Global Search */}
            <div className="hidden sm:block relative w-60 lg:w-72 z-50">
              <div className="relative flex items-center w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search anything..."
                  autoComplete="off"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-14 py-2 bg-zinc-100/80 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none transition-all shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                  <kbd className="hidden lg:flex items-center gap-1 px-1.5 py-1 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm leading-none">
                    <span className="font-sans text-[9px] uppercase tracking-wider">Ctrl</span>
                    <span className="font-sans">K</span>
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleDark}
              className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 transition-all"
              title="Toggle theme"
            >
              {themeMounted ? (
                dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative pl-3 border-l border-zinc-200 dark:border-zinc-800 hidden sm:block" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center space-x-3 focus:outline-none group"
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-none">{user.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 capitalize">{user.roles[0] ?? 'Staff'}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center overflow-hidden border border-zinc-300 dark:border-zinc-700 font-bold text-white text-xs uppercase">
                  {userInitials}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-black/5 z-50 overflow-hidden animate-fade-in">
                  <div className="p-2">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 rounded-xl transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </Link>
                  </div>
                  <div className="border-t border-zinc-200 dark:border-zinc-800 p-2">
                    <button
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
