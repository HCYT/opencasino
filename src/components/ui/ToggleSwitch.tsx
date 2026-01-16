import React from 'react';

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  className?: string;
};

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, className = '' }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full transition-all duration-300 relative ${checked ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-slate-700'} ${className}`}
      aria-pressed={checked}
    >
      <div
        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      ></div>
    </button>
  );
};

export default ToggleSwitch;
