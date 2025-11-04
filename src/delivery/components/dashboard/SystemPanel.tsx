import React from 'react';
import { GameState, GameSetupOptions, AnyBackendConfig } from '@/domain';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Download, Save, Upload, Rewind, Home, Bot, Image } from 'lucide-react';

interface SystemPanelProps {
  gameState: GameState;
  onQuicksave: () => void;
  onQuickload: () => void;
  onRollback: () => void;
  onReturnToTitle: () => void;
  onExport: () => void;
  isRollbackAvailable: boolean;
  onUpdateSetup: (updates: Partial<GameSetupOptions>) => void;
  availableTextModels: AnyBackendConfig[];
  availableImageModels: AnyBackendConfig[];
}

const ToggleSwitch: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-300">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
    </label>
  </div>
);

export const SystemPanel: React.FC<SystemPanelProps> = ({
  gameState,
  onQuicksave,
  onQuickload,
  onRollback,
  onReturnToTitle,
  onExport,
  isRollbackAvailable,
  onUpdateSetup,
  availableTextModels,
  availableImageModels
}) => {

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">快速操作</h3>
          <div className="space-y-2">
            <button onClick={onQuicksave} className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-600/30 transition-all duration-300 ease-in-out transform hover:scale-105">
              <Save size={18} className="mr-2" />
              快速记忆
            </button>
            <button onClick={onQuickload} className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg shadow-green-600/30 transition-all duration-300 ease-in-out transform hover:scale-105">
              <Upload size={18} className="mr-2" />
              快速恢复
            </button>
            <button onClick={onRollback} disabled={!isRollbackAvailable} className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-50">
              <Rewind size={18} className="mr-2" />
              时光回溯
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-purple-500/20">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">推理目标</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 flex items-center"><Bot size={14} className="mr-1.5" />叙述者</label>
              <select
                value={gameState.setup.modelId}
                onChange={(e) => onUpdateSetup({ modelId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-700 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-400"
              >
                <option value="" disabled>-- 选择叙述者 --</option>
                {availableTextModels.map(model => (
                  <option key={model.id} value={model.id}>{model.name} {model.configType === 'pool' && ' (Pool)'}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 flex items-center"><Image size={14} className="mr-1.5" />回想者</label>
              <select
                value={gameState.setup.imageModelId}
                onChange={(e) => onUpdateSetup({ imageModelId: e.target.value })}
                disabled={!gameState.setup.isImageGenerationEnabled}
                className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-700 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>-- 选择回想者 --</option>
                {availableImageModels.map(model => (
                  <option key={model.id} value={model.id}>{model.name} {model.configType === 'pool' && ' (Pool)'}</option>
                ))}
              </select>
            </div>
            <ToggleSwitch
              label="开启场景回想"
              checked={gameState.setup.isImageGenerationEnabled}
              onChange={(checked) => onUpdateSetup({ isImageGenerationEnabled: checked })}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-purple-500/20">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">坐标管理</h3>
          <div className="space-y-2">
            <button onClick={onExport} className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg shadow-purple-600/30 transition-all duration-300 ease-in-out transform hover:scale-105">
              <Download size={18} className="mr-2" />
              导出当前时空坐标
            </button>
            <button onClick={onReturnToTitle} className="w-full flex items-center justify-center px-4 py-2 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-red-800/30 transition-all duration-300 ease-in-out transform hover:scale-105">
              <Home size={18} className="mr-2" />
              返回以太空间
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
