import React, { useState } from 'react';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { GameButton } from '@/components/ui/GameButton';

interface CreateProfileModalProps {
    onClose: () => void;
    onCreate: (name: string) => void;
    existingNames: Set<string>;
}

const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
    onClose,
    onCreate,
    existingNames
}) => {
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = name.trim();

        if (!trimmed) {
            setError('請輸入名稱');
            return;
        }

        if (existingNames.has(trimmed)) {
            setError('此名稱已存在或不可使用');
            return;
        }

        onCreate(trimmed);
        onClose();
    };

    return (
        <ModalOverlay className="fixed z-[200]">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-black text-amber-500 uppercase tracking-widest mb-1">
                        建立新角色
                    </h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        CREATE NEW PROFILE
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                            角色名稱 Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError(null);
                            }}
                            placeholder="例如：賭神高進"
                            className="w-full bg-black/40 border-2 border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-700"
                            autoFocus
                        />
                        {error && (
                            <p className="text-xs text-red-400 font-bold ml-1 animate-pulse">
                                ⚠️ {error}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <GameButton
                            type="button"
                            onClick={onClose}
                            variant="muted"
                            size="pill"
                            className="w-full font-black text-xs"
                        >
                            取消
                        </GameButton>
                        <GameButton
                            type="submit"
                            variant="primary"
                            size="pill"
                            className="w-full font-black text-xs"
                        >
                            建立
                        </GameButton>
                    </div>
                </form>
            </div>
        </ModalOverlay>
    );
};

export default CreateProfileModal;
