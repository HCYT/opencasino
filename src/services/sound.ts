import { useState, useEffect } from 'react';

const sounds: Record<string, string> = {
  'slot-win': '/sounds/mixkit-slot-machine-win-siren.wav',
  'slot-jackpot': '/sounds/mixkit-slot-machine-win-siren.wav',
  'card-deal': '/sounds/card-slide-1.ogg',
  'card-place': '/sounds/card-place-1.ogg',
  'card-shuffle': '/sounds/card-shuffle.ogg',
  'chip-place': '/sounds/chip-lay-1.ogg',
  'chip-stack': '/sounds/chips-stack-1.ogg',
  'chip-allin': '/sounds/chips-stack-1.ogg',
  'chip-fold': '/sounds/chips-collide-1.ogg',
  'dice-shake': '/sounds/dice-shake-1.ogg',
  'dice-throw': '/sounds/dice-throw-1.ogg',
};

const variantSounds: Record<string, string[]> = {
  'card-deal': [
    '/sounds/card-slide-1.ogg',
    '/sounds/card-slide-2.ogg',
    '/sounds/card-slide-3.ogg',
    '/sounds/card-slide-4.ogg',
  ],
  'card-place': [
    '/sounds/card-place-1.ogg',
    '/sounds/card-place-2.ogg',
    '/sounds/card-place-3.ogg',
    '/sounds/card-place-4.ogg',
  ],
  'card-shuffle': ['/sounds/card-shuffle.ogg'],
  'chip-place': [
    '/sounds/chip-lay-1.ogg',
    '/sounds/chip-lay-2.ogg',
    '/sounds/chip-lay-3.ogg',
  ],
  'chip-stack': [
    '/sounds/chips-stack-1.ogg',
    '/sounds/chips-stack-2.ogg',
    '/sounds/chips-stack-3.ogg',
    '/sounds/chips-stack-4.ogg',
    '/sounds/chips-stack-5.ogg',
  ],
  'chip-allin': [
    '/sounds/chips-stack-1.ogg',
    '/sounds/chips-stack-2.ogg',
    '/sounds/chips-stack-3.ogg',
  ],
  'chip-fold': [
    '/sounds/chips-collide-1.ogg',
    '/sounds/chips-collide-2.ogg',
    '/sounds/chips-collide-3.ogg',
    '/sounds/chips-collide-4.ogg',
  ],
  'dice-shake': [
    '/sounds/dice-shake-1.ogg',
    '/sounds/dice-shake-2.ogg',
    '/sounds/dice-shake-3.ogg',
  ],
  'dice-throw': [
    '/sounds/dice-throw-1.ogg',
    '/sounds/dice-throw-2.ogg',
    '/sounds/dice-throw-3.ogg',
  ],
};

const volumes: Record<string, number> = {
  'slot-win': 0.7,
  'slot-jackpot': 0.9,
  'card-deal': 0.3,
  'card-place': 0.4,
  'card-shuffle': 0.5,
  'chip-place': 0.5,
  'chip-stack': 0.4,
  'chip-allin': 0.7,
  'chip-fold': 0.3,
  'dice-shake': 0.5,
  'dice-throw': 0.4,
};

let volume = 0.4;
let muted = false;
const listeners = new Set<(v: number, m: boolean) => void>();

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

const getSoundUrl = (type: string): string => {
  const variants = variantSounds[type];
  if (variants && variants.length > 0) {
    return variants[Math.floor(Math.random() * variants.length)];
  }
  return sounds[type] || '';
};

export const playSound = (type: string) => {
  if (muted) return;
  try {
    const src = getSoundUrl(type);
    if (!src) return;
    const audio = new Audio(src);
    const soundVolume = volumes[type] || 0.5;
    audio.volume = volume * soundVolume;
    audio.play().catch(e => console.warn('Sound Error:', e));
  } catch {
    console.warn('Audio not supported');
  }
};

export const playSoundLoop = (type: string): HTMLAudioElement | null => {
  if (muted) return null;
  try {
    const src = getSoundUrl(type);
    if (!src) return null;
    const audio = new Audio(src);
    const soundVolume = volumes[type] || 0.5;
    audio.volume = volume * soundVolume;
    audio.loop = true;
    audio.play().catch(e => console.warn('Sound Loop Error:', e));
    return audio;
  } catch {
    console.warn('Audio not supported');
    return null;
  }
};
