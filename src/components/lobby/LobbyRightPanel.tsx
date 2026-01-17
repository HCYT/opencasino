import React from 'react';
import BalancePanel from './BalancePanel';
import ProfileList from './ProfileList';

interface LobbyRightPanelProps {
    displayedChips: number;
    displayedDebt: number;
    repayAmount: number;
    leaderboard: Array<{
        name: string;
        chips: number;
        wins: number;
        losses: number;
        games: number;
        debt: number;
    }>;
    playerName: string;
    npcNames: Set<string>;
    setRepayAmount: (amount: number) => void;
    setPlayerName: (name: string) => void;
    handleLoan: () => void;
    handleRepay: () => void;
    resolveChips: (name: string) => number;
    handleDeleteProfile: (name: string) => void;
    handleCreateProfile: () => void;
    handleResetNpcProfiles: () => void;
    handleResetAllProfiles: () => void;
    handleRenameProfile: (oldName: string, newName: string) => void;
    handleUpdateAvatar: (name: string, avatar: string) => void;
    onOpenCreateModal: () => void;
}

const LobbyRightPanel: React.FC<LobbyRightPanelProps> = ({
    displayedChips,
    displayedDebt,
    repayAmount,
    leaderboard,
    playerName,
    npcNames,
    setRepayAmount,
    setPlayerName,
    handleLoan,
    handleRepay,
    resolveChips,
    handleDeleteProfile,
    handleCreateProfile,
    handleResetNpcProfiles,
    handleResetAllProfiles,
    handleRenameProfile,
    handleUpdateAvatar,
    onOpenCreateModal
}) => {
    return (
        <div className="space-y-8">
            {/* Asset Management */}
            <div className="bg-black/30 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-amber-500 rounded-full" />
                    <h2 className="text-lg font-black text-white/90 tracking-widest uppercase">資產管理</h2>
                </div>
                <BalancePanel
                    displayedChips={displayedChips}
                    displayedDebt={displayedDebt}
                    repayAmount={repayAmount}
                    setRepayAmount={setRepayAmount}
                    handleLoan={handleLoan}
                    handleRepay={handleRepay}
                    resolveChips={resolveChips}
                />
            </div>

            {/* Player Profiles */}
            <div className="bg-black/30 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-xl max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-transparent z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-amber-500 rounded-full" />
                        <h2 className="text-lg font-black text-white/90 tracking-widest uppercase">玩家檔案</h2>
                    </div>
                    <span className="text-xs font-bold text-white/30 uppercase">
                        {leaderboard.filter(p => !npcNames.has(p.name)).length} PROFILES
                    </span>
                </div>

                <ProfileList
                    leaderboard={leaderboard}
                    playerName={playerName}
                    setPlayerName={setPlayerName}
                    npcNames={npcNames}
                    handleDeleteProfile={handleDeleteProfile}
                    handleCreateProfile={handleCreateProfile}
                    handleResetNpcProfiles={handleResetNpcProfiles}
                    handleResetAllProfiles={handleResetAllProfiles}
                    handleRenameProfile={handleRenameProfile}
                    handleUpdateAvatar={handleUpdateAvatar}
                    onOpenCreateModal={onOpenCreateModal}
                />
            </div>
        </div>
    );
};

export default LobbyRightPanel;
