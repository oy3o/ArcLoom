import React, { useState } from 'react';
import { GameState, WorldLoreItem } from '@/domain';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { TabButton } from './ui/TabButton';
import { Star, Heart, Zap, Shield, MapPin, ScrollText, BrainCircuit } from 'lucide-react';

interface WorldOverviewScreenProps {
    worldData: (GameState['world'] & { companions: GameState['companions'] }) | null;
    onConfirm: () => void;
    onRegenerate: () => void;
    onCompleteWorld: () => void;
    isImported: boolean;
    isLoading: boolean;
    loadingText: string;
}

export const WorldOverviewScreen: React.FC<WorldOverviewScreenProps> = ({ worldData, onConfirm, onRegenerate, isLoading, loadingText }) => {
    const [activeTab, setActiveTab] = useState<'power' | 'factions' | 'locations' | 'history'>('power');

    if (isLoading || !worldData) {
        return (
            <div className="fixed inset-0 bg-black/60 flex flex-col items-center justify-center z-50">
                <LoadingSpinner />
                <p className="mt-4 text-lg text-purple-300">{loadingText || '编织命运中...'}</p>
            </div>
        );
    }

    const { lore, mainQuests, companions, playerStatsSchema } = worldData;
    const loreByType = (lore || []).reduce((acc, item) => {
        const type = item.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(item);
        return acc;
    }, {} as Record<WorldLoreItem['type'], WorldLoreItem[]>);

    const LoreTabContent = () => {
        const typesMap = {
            power: 'Power', factions: 'Organization', locations: 'Location',
            history: ['History', 'Legend']
        };
        const currentTypes = typesMap[activeTab];
        const items = Array.isArray(currentTypes)
            ? currentTypes.flatMap(type => loreByType[type as WorldLoreItem['type']] || [])
            : loreByType[currentTypes as WorldLoreItem['type']] || [];

        return (
            <div className="space-y-4">
                {items.map((item, i) => (
                    <Card key={`${activeTab}-${i}`}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent><p className="text-gray-400 whitespace-pre-wrap">{item.description}</p></CardContent></Card>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#0f0f1b] to-[#1a1a2e] text-white p-4 md:p-8">
            <div className="w-full max-w-5xl mx-auto py-8">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-purple-300 mb-2">时空已锚定</h1>
                    <p className="text-gray-400 mb-8">编织者的权能予以启示...</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="flex flex-col"><h2 className="text-2xl font-bold text-yellow-300 mb-3 flex items-center"><Star size={20} className="mr-2" /> 命运征兆</h2><Card className="h-full"><CardHeader><CardTitle>{mainQuests[0]?.title}</CardTitle></CardHeader><CardContent><p>{mainQuests[0]?.description}</p></CardContent></Card></div>
                    <div className="flex flex-col"><h2 className="text-2xl font-bold text-cyan-300 mb-3 flex items-center"><BrainCircuit size={20} className="mr-2" /> 力量维度</h2><Card className="h-full"><CardContent className="pt-4"><ul className="space-y-2">{playerStatsSchema.map(s => <li key={s.name}><p className="font-bold">{s.name}</p><p className="text-xs">{s.description}</p></li>)}</ul></CardContent></Card></div>
                    <div className="flex flex-col"><h2 className="text-2xl font-bold text-pink-300 mb-3 flex items-center"><Heart size={20} className="mr-2" /> 初始姻缘</h2><Card className="h-full"><CardHeader><CardTitle>{companions[0]?.name}</CardTitle><p className="text-sm italic">{companions[0]?.title}</p></CardHeader><CardContent><p>{companions[0]?.backstory}</p></CardContent></Card></div>
                </div>
                <Card>
                    <div className="p-2 border-b-2 border-purple-500/30"><div className="flex space-x-1">
                        <TabButton label="力量体系" icon={<Zap size={16} />} isActive={activeTab === 'power'} onClick={() => setActiveTab('power')} />
                        <TabButton label="组织" icon={<Shield size={16} />} isActive={activeTab === 'factions'} onClick={() => setActiveTab('factions')} />
                        <TabButton label="地点" icon={<MapPin size={16} />} isActive={activeTab === 'locations'} onClick={() => setActiveTab('locations')} />
                        <TabButton label="传说/历史" icon={<ScrollText size={16} />} isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                    </div></div>
                    <CardContent className="pt-4 max-h-[40vh] overflow-y-auto"><LoreTabContent /></CardContent>
                </Card>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={onRegenerate} className="px-4 py-2 bg-transparent border-2 border-purple-400 text-purple-300 hover:bg-purple-400/20 font-semibold rounded-lg">重新锚定</button>
                    <button onClick={onConfirm} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xl rounded-lg shadow-lg">介入时空</button>
                </div>
            </div>
        </div>
    );
};
