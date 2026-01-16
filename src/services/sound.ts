import { useState, useEffect } from 'react';

const sounds: Record<string, string> = {
  deal: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  fold: 'https://assets.mixkit.co/active_storage/sfx/2056/2056-preview.mp3',
  allin: 'https://assets.mixkit.co/active_storage/sfx/1118/1118-preview.mp3',
  mortgage: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  replace: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3'
};

// Internal state
let volume = 0.4;
let muted = false;
const listeners = new Set<(v: number, m: boolean) => void>();

// Initialize from localStorage
try {
  const stored = localStorage.getItem('sound_settings');
  if (stored) {
    const data = JSON.parse(stored);
    if (typeof data.volume === 'number') volume = Math.max(0, Math.min(1, data.volume));
    if (typeof data.muted === 'boolean') muted = data.muted;
  }
} catch (e) {
  console.warn('Failed to load sound settings', e);
}

const notify = () => {
  localStorage.setItem('sound_settings', JSON.stringify({ volume, muted }));
  listeners.forEach(l => l(volume, muted));
};

export const setVolume = (v: number) => {
  volume = Math.max(0, Math.min(1, v));
  notify();
};

export const setMuted = (m: boolean) => {
  muted = m;
  notify();
};

export const getSoundState = () => ({ volume, muted });

export const subscribe = (cb: (v: number, m: boolean) => void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};

export const useSoundSettings = () => {
  const [state, setState] = useState(getSoundState());
  useEffect(() => subscribe((v, m) => setState({ volume: v, muted: m })), []);
  return {
    volume: state.volume,
    muted: state.muted,
    setVolume,
    setMuted
  };
};

export const playSound = (type: string) => {
  if (muted) return;
  try {
    const src = sounds[type];
    if (!src) return;
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(e => console.warn('Sound Error:', e));
  } catch {
    console.warn('Audio not supported');
  }
};
