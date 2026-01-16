import React from 'react';
import { useSoundSettings } from '../../services/sound';

export const VolumeControl: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { volume, muted, setVolume, setMuted } = useSoundSettings();

    return (
        <div className={`flex items-center gap-3 bg-[#052c16]/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg hover:bg-[#052c16] transition-all z-50 ${className}`}>
            <button
                onClick={() => setMuted(!muted)}
                className="text-white/60 hover:text-yellow-400 transition-colors flex items-center justify-center w-6 h-6"
                title={muted ? '開啟音效' : '靜音'}
            >
                {muted || volume === 0 ? <IconMute /> : <IconVolumeLow />}
            </button>
            <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    if (muted && val > 0) setMuted(false);
                }}
                className="w-24 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400 transition-all [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
            />
        </div>
    );
};

const IconVolumeLow = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
);

const IconMute = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
);

export default VolumeControl;
