"use client";

import React, { useEffect, useState, useRef } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type AccentColor = 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' | 'cyan';

const accentColors: { id: AccentColor; name: string; color: string }[] = [
  { id: 'emerald', name: 'Emerald', color: '#10b981' },
  { id: 'blue', name: 'Blue', color: '#3b82f6' },
  { id: 'purple', name: 'Purple', color: '#8b5cf6' },
  { id: 'rose', name: 'Rose', color: '#f43f5e' },
  { id: 'amber', name: 'Amber', color: '#f59e0b' },
  { id: 'cyan', name: 'Cyan', color: '#06b6d4' },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [accent, setAccent] = useState<AccentColor>('emerald');
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'mode' | 'accent'>('mode');
  const dropdownRef = useRef<HTMLDivElement>(null);

  function applyTheme(mode: ThemeMode) {
    if (typeof document === 'undefined') return;
    if (mode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (mode === 'light') {
      // Remove the dark theme attribute to revert to light mode
      document.documentElement.removeAttribute('data-theme');
      // Also explicitly set light mode
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      // System preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
    try { localStorage.setItem('sv-theme', mode); } catch (e) {}
  }

  function applyAccent(accentId: AccentColor) {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-accent', accentId);
    try { localStorage.setItem('sv-accent', accentId); } catch (e) {}
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = localStorage.getItem('sv-theme') as ThemeMode | null;
    const savedAccent = localStorage.getItem('sv-accent') as AccentColor | null;
    
    const initialTheme = savedTheme || 'system';
    const initialAccent = savedAccent || 'emerald';
    
    setTheme(initialTheme);
    setAccent(initialAccent);
    
    // Apply theme with proper initialization
    applyTheme(initialTheme);
    applyAccent(initialAccent);

    const m = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (initialTheme === 'system') applyTheme('system'); };
    if (m && m.addEventListener) m.addEventListener('change', handler);
    return () => { if (m && m.removeEventListener) m.removeEventListener('change', handler); };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeSelect = (mode: ThemeMode) => {
    setTheme(mode);
    applyTheme(mode);
  };

  const handleAccentSelect = (accentId: AccentColor) => {
    setAccent(accentId);
    applyAccent(accentId);
  };

  const getIcon = () => {
    if (theme === 'light') return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    );
    if (theme === 'dark') return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    );
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    );
  };

  const currentAccent = accentColors.find(a => a.id === accent);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          borderRadius: '50px',
          border: `1px solid ${currentAccent?.color}33`,
          background: `${currentAccent?.color}0d`,
          cursor: 'pointer',
          color: 'var(--text, #0f172a)',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'all 0.2s ease',
        }}
      >
        {getIcon()}
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          Theme
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: currentAccent?.color,
            }}
          />
        </span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: '220px',
            background: 'var(--card-bg, #fff)',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--border-color, #e2e8f0)',
            overflow: 'hidden',
            zIndex: 1000,
            animation: 'dropdownFade 0.2s ease',
          }}
        >
          <style>{`
            @keyframes dropdownFade {
              from { opacity: 0; transform: translateY(-8px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            <button
              onClick={() => setActiveSection('mode')}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: activeSection === 'mode' ? `${currentAccent?.color}15` : 'transparent',
                cursor: 'pointer',
                color: 'var(--text, #0f172a)',
                fontSize: '13px',
                fontWeight: activeSection === 'mode' ? 600 : 400,
                borderBottom: activeSection === 'mode' ? `2px solid ${currentAccent?.color}` : '2px solid transparent',
              }}
            >
              Mode
            </button>
            <button
              onClick={() => setActiveSection('accent')}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: activeSection === 'accent' ? `${currentAccent?.color}15` : 'transparent',
                cursor: 'pointer',
                color: 'var(--text, #0f172a)',
                fontSize: '13px',
                fontWeight: activeSection === 'accent' ? 600 : 400,
                borderBottom: activeSection === 'accent' ? `2px solid ${currentAccent?.color}` : '2px solid transparent',
              }}
            >
              Color
            </button>
          </div>

          {/* Mode Options */}
          {activeSection === 'mode' && (
            <div style={{ padding: '8px' }}>
              {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleThemeSelect(mode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    borderRadius: '8px',
                    background: theme === mode ? `${currentAccent?.color}15` : 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text, #0f172a)',
                    fontSize: '14px',
                    textAlign: 'left',
                    marginBottom: '4px',
                  }}
                >
                  {mode === 'light' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                    </svg>
                  )}
                  {mode === 'dark' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  )}
                  {mode === 'system' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  )}
                  <span style={{ textTransform: 'capitalize' }}>{mode}</span>
                  {theme === mode && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={currentAccent?.color} strokeWidth="3" style={{ marginLeft: 'auto' }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Accent Color Options */}
          {activeSection === 'accent' && (
            <div style={{ padding: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {accentColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleAccentSelect(color.id)}
                    title={color.name}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: '12px',
                      border: accent === color.id ? `3px solid ${color.color}` : '2px solid transparent',
                      background: `${color.color}20`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: color.color,
                        boxShadow: accent === color.id ? `0 0 0 3px ${color.color}40` : 'none',
                      }}
                    />
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '12px' }}>
                {currentAccent?.name}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
