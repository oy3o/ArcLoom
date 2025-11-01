import React, { useState } from 'react';
import { GameState, GameSetupOptions, AvailableModel } from '@/domain';
import { StatusPanel } from './dashboard/StatusPanel';
import { CompanionsPanel } from './dashboard/CompanionsPanel';
import { WorldPanel } from './dashboard/WorldPanel';
import { SystemPanel } from './dashboard/SystemPanel';
import { TabButton } from './ui/TabButton';
import { User, Heart, FileText, Settings, X } from 'lucide-react';

interface PlayerDashboardProps {
  gameState: GameState;
  onQuicksave: () => void;
  onQuickload: () => void;
  onRollback: () => void;
  onReturnToTitle: () => void;
  onExport: () => void;
  isRollbackAvailable: boolean;
  onGenerateImageUrl: (itemType: 'companion', itemId: string, prompt: string) => void;
  onClose: () => void;
  onUpdateSetup: (updates: Partial<GameSetupOptions>) => void;
  availableTextModels: AvailableModel[];
  availableImageModels: AvailableModel[];
  isImageGenerationEnabled: boolean;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
  gameState,
  onQuicksave,
  onQuickload,
  onRollback,
  onReturnToTitle,
  onExport,
  isRollbackAvailable,
  onGenerateImageUrl,
  onClose,
  onUpdateSetup,
  availableTextModels,
  availableImageModels,
  isImageGenerationEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'companions' | 'intelligence' | 'system'>('status');

  const renderContent = () => {
    switch (activeTab) {
      case 'status':
        return <StatusPanel player={gameState.player} />;
      case 'companions':
        return <CompanionsPanel
          companions={gameState.companions}
          onGenerateImageUrl={onGenerateImageUrl}
          isImageGenerationEnabled={isImageGenerationEnabled}
        />;
      case 'intelligence':
        return <WorldPanel gameState={gameState} />;
      case 'system':
        return <SystemPanel
          gameState={gameState}
          onQuicksave={onQuicksave}
          onQuickload={onQuickload}
          onRollback={onRollback}
          isRollbackAvailable={isRollbackAvailable}
          onExport={onExport}
          onReturnToTitle={onReturnToTitle}
          onUpdateSetup={onUpdateSetup}
          availableTextModels={availableTextModels}
          availableImageModels={availableImageModels}
        />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col text-white">
      <div className="flex justify-between items-center mb-4 border-b-2 border-purple-500/30">
        <div className="flex space-x-1">
          <TabButton label="状态" icon={<User size={16} />} isActive={activeTab === 'status'} onClick={() => setActiveTab('status')} />
          <TabButton label="羁绊" icon={<Heart size={16} />} isActive={activeTab === 'companions'} onClick={() => setActiveTab('companions')} />
          <TabButton label="情报" icon={<FileText size={16} />} isActive={activeTab === 'intelligence'} onClick={() => setActiveTab('intelligence')} />
          <TabButton label="系统" icon={<Settings size={16} />} isActive={activeTab === 'system'} onClick={() => setActiveTab('system')} />
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-white md:hidden"><X size={20} /></button>
      </div>
      <div className="flex-grow overflow-y-auto pr-1">{renderContent()}</div>
    </div>
  );
};
