
import React from 'react';
import { GameSetupOptions, GameGenre, GameEra, ProtagonistGender, RomanceType, AnyBackendConfig } from '@/domain';
import { OptionSelector } from './ui/OptionSelector';

interface SetupScreenProps {
    setup: GameSetupOptions;
    onSetupChange: (options: Partial<GameSetupOptions>) => void;
    onGenerate: () => void;
    onImportWorld: () => void;
    textBackends: AnyBackendConfig[];
    imageBackends: AnyBackendConfig[];
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ setup, onSetupChange, onGenerate, onImportWorld, textBackends, imageBackends }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0f0f1b] to-[#1a1a2e] text-white p-4">
            <div className="w-full max-w-2xl mx-auto">
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold text-purple-300">锚定时空</h1>
                    <p className="mt-3 text-gray-400">在命运的织机上，编织属于你自己的史诗篇章。</p>
                </div>
                <div className="bg-black/20 border border-purple-500/20 rounded-lg p-6">
                    <div className="mb-6">
                        <label className="block text-lg font-semibold text-purple-300 mb-2">叙述者</label>
                        <select value={setup.modelId} onChange={e => onSetupChange({ modelId: e.target.value })} className="w-full p-2 bg-gray-800 rounded">
                            <option value="" disabled>-- 选择一个叙述者 --</option>
                            <optgroup label="密钥池">
                                {textBackends.filter(b => b.configType === 'pool').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </optgroup>
                            <optgroup label="独立密钥">
                                {textBackends.filter(b => b.configType === 'single').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </optgroup>
                        </select>
                    </div>
                    <div className="mb-6">
                        <label className="block text-lg font-semibold text-purple-300 mb-2">回想者</label>
                        <select value={setup.imageModelId} onChange={e => onSetupChange({ imageModelId: e.target.value })} className="w-full p-2 bg-gray-800 rounded">
                             <option value="" disabled>-- 选择一个回想者 --</option>
                             <optgroup label="密钥池">
                                {imageBackends.filter(b => b.configType === 'pool').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </optgroup>
                            <optgroup label="独立密钥">
                                {imageBackends.filter(b => b.configType === 'single').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </optgroup>
                        </select>
                    </div>

                    <OptionSelector label="故事类型" options={['随机', '玄幻', '奇幻', '修仙', '游戏', '悬疑']} selectedValue={setup.genre} onSelect={genre => onSetupChange({ genre: genre as GameGenre })} />
                    <OptionSelector label="时代背景" options={['随机', '古代', '近现代', '现代', '近未来']} selectedValue={setup.era} onSelect={era => onSetupChange({ era: era as GameEra })} />
                    <OptionSelector label="主角性别" options={['随机', '男性', '女性', '无性别生物']} selectedValue={setup.gender} onSelect={gender => onSetupChange({ gender: gender as ProtagonistGender })} />
                    <OptionSelector label="情感风格" options={['随机', '无女主', '单女主', '多女主']} selectedValue={setup.romance} onSelect={romance => onSetupChange({ romance: romance as RomanceType })} />
                </div>
                <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={onImportWorld} className="px-4 py-2 bg-transparent border-2 border-purple-400 rounded">使用坐标</button>
                    <button onClick={onGenerate} disabled={!setup.modelId} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded text-xl disabled:opacity-50">开始锚定</button>
                </div>
            </div>
        </div>
    );
};
