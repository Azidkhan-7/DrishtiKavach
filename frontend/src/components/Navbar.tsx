'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTelemetry } from '@/lib/telemetryContext';
import { Sun, Moon, Activity, Play, Zap, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { trust, theme, toggleTheme, isDemoRunning, runDemo, activeFault } = useTelemetry();

  const navLinks = [
    { href: '/', label: 'OVERVIEW' },
    { href: '/system', label: 'SYSTEM' },
    { href: '/live', label: 'LIVE' },
    { href: '/analysis', label: 'ANALYSIS' },
    { href: '/fault-lab', label: 'FAULT LAB' },
    { href: '/architecture', label: 'ARCHITECTURE' },
  ];

  const modeBadgeColor =
    trust.mode === 'LIVE_HARDWARE'
      ? 'text-[var(--state-normal)] border-[var(--state-normal)]/40 bg-[var(--state-normal)]/10'
      : trust.mode === 'STALE_DATA'
      ? 'text-[var(--state-watch)] border-[var(--state-watch)]/40 bg-[var(--state-watch)]/10'
      : 'text-[var(--accent-amber)] border-[var(--accent-amber)]/40 bg-[var(--accent-amber)]/10';

  const trustStatusColor =
    trust.system_status === 'NORMAL'
      ? 'text-[var(--state-normal)]'
      : trust.system_status === 'WATCH'
      ? 'text-[var(--state-watch)]'
      : trust.system_status === 'DEGRADED'
      ? 'text-[var(--state-degraded)]'
      : 'text-[var(--state-untrusted)]';

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-technical">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Masthead */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded border border-technical-strong flex items-center justify-center bg-[var(--bg-secondary)] group-hover:border-[var(--accent-amber)] transition-colors">
            <Activity className="w-4 h-4 text-[var(--accent-amber)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg tracking-tight font-medium text-[var(--text-primary)]">
                SENSOR TRUST
              </span>
              <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.2 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-technical uppercase">
                MVP v1.0
              </span>
            </div>
            <p className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider uppercase">
              PHYSICAL SENSOR INTELLIGENCE
            </p>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-xs font-mono tracking-wider transition-colors rounded ${
                  isActive
                    ? 'text-[var(--accent-amber)] bg-[var(--bg-tertiary)] border border-technical font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Status Controls */}
        <div className="flex items-center gap-3">
          
          {/* Active Fault Indicator if any */}
          {activeFault && (
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--state-untrusted)]/15 border border-[var(--state-untrusted)]/30 text-[10px] font-mono text-[var(--state-untrusted)] animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span>FAULT: {activeFault.toUpperCase()}</span>
            </div>
          )}

          {/* Mode Pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono font-medium ${modeBadgeColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span>{trust.mode}</span>
          </div>

          {/* Trust Score Compact */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-secondary)] border border-technical text-[11px] font-mono">
            <span className="text-[var(--text-muted)]">TRUST:</span>
            <span className={`font-semibold ${trustStatusColor}`}>
              {trust.system_trust_score.toFixed(1)}%
            </span>
          </div>

          {/* 1-Click Run Demo Button */}
          <button
            onClick={runDemo}
            disabled={isDemoRunning}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono border transition-all ${
              isDemoRunning
                ? 'bg-[var(--accent-amber)]/20 border-[var(--accent-amber)] text-[var(--accent-amber)] animate-pulse'
                : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border-technical hover:border-[var(--accent-amber)] text-[var(--text-primary)]'
            }`}
            title="Execute 12-second automated fault and trust recovery sequence"
          >
            <Play className={`w-3 h-3 ${isDemoRunning ? 'animate-spin' : 'text-[var(--accent-amber)]'}`} />
            <span>{isDemoRunning ? 'DEMO RUNNING...' : 'RUN DEMO'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-technical text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Toggle laboratory dark/light theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--accent-amber)]" /> : <Moon className="w-4 h-4 text-[var(--text-secondary)]" />}
          </button>
        </div>

      </div>

      {/* Mobile Nav Subbar */}
      <div className="md:hidden flex items-center justify-around py-2 px-3 border-t border-technical bg-[var(--bg-secondary)] overflow-x-auto text-[11px] font-mono">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-2 py-1 ${
              pathname === link.href ? 'text-[var(--accent-amber)] font-semibold' : 'text-[var(--text-secondary)]'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
