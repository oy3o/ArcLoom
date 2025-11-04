import React, { useState } from 'react';
import { GameState, WorldLoreItem } from '@/domain';
import { CardContent } from '../ui/Card';
import { TabButton } from '../ui/TabButton';
import { Star, ScrollText, Users, ChevronDown } from 'lucide-react';

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; subTitle?: string }> = ({ title, children, subTitle }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="mb-2 bg-black/30 rounded-lg border border-purple-500/20 overflow-hidden">
            <button
                className="w-full text-left p-3 flex justify-between items-center cursor-pointer hover:bg-purple-900/20 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div>
                    <h3 className="font-semibold text-gray-200">{title}</h3>
                    {subTitle && <p className="text-xs text-purple-400">{subTitle}</p>}
                </div>
                <ChevronDown
                    size={20}
                    className={`transform transition-transform duration-200 text-gray-400 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            {isOpen && (
                <CardContent className="p-3 border-t border-purple-500/30">
                    <div className="text-sm text-gray-400 whitespace-pre-wrap">{children}</div>
                </CardContent>
            )}
        </div>
    );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center py-8">
        <p className="text-gray-500 italic">{message}</p>
    </div>
);


export const WorldPanel: React.FC<{ gameState: GameState }> = ({ gameState }) => {
    const [activeTab, setActiveTab] = useState<'quests' | 'lore' | 'people'>('quests');
    const { mainQuests, lore, companions } = gameState.world;
    
    const loreByType = (lore || []).reduce((acc, item) => {
        if (!acc[item.type]) {
            acc[item.type] = [];
        }
        acc[item.type].push(item);
        return acc;
    }, {} as Record<WorldLoreItem['type'], WorldLoreItem[]>);
    const typeOrder: WorldLoreItem['type'][] = ['Power', 'Location', 'Organization', 'History', 'Legend'];
    const sortedTypes = Object.keys(loreByType).sort((a, b) => typeOrder.indexOf(a as any) - typeOrder.indexOf(b as any));

    const renderContent = () => {
        switch (activeTab) {
            case 'quests':
                return (!mainQuests || mainQuests.length === 0)
                    ? <EmptyState message="命运的丝线尚未显现..." />
                    : <div>{mainQuests.map((q, i) => <AccordionItem key={i} title={q.title} subTitle={`状态: ${q.status}`}>{q.description}</AccordionItem>)}</div>;
            
            case 'lore':
                return (!lore || lore.length === 0)
                    ? <EmptyState message="世界的秘密仍笼罩在迷雾之中..." />
                    : <div>{sortedTypes.map(type => (
                        <div key={type} className="mb-4">
                            <h2 className="text-lg font-bold text-purple-300 mb-2 border-b border-purple-500/20 pb-1">{type}</h2>
                            {loreByType[type as WorldLoreItem['type']].map((item, i) => <AccordionItem key={i} title={item.title}>{item.description}</AccordionItem>)}
                        </div>
                      ))}</div>;
            
            case 'people':
                 return (!gameState.companions || gameState.companions.length === 0)
                    ? <EmptyState message="你正独自一人行走在这条道路上..." />
                    : <div>{gameState.companions.map(p => <AccordionItem key={p.id} title={p.name} subTitle={p.title}>{p.backstory}</AccordionItem>)}</div>;

            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 mb-3">
                <div className="flex space-x-1 bg-black/20 p-1 rounded-md">
                    <TabButton label="主线" icon={<Star size={16}/>} isActive={activeTab==='quests'} onClick={()=>setActiveTab('quests')}/>
                    <TabButton label="世界" icon={<ScrollText size={16}/>} isActive={activeTab==='lore'} onClick={()=>setActiveTab('lore')}/>
                    <TabButton label="人物" icon={<Users size={16}/>} isActive={activeTab==='people'} onClick={()=>setActiveTab('people')}/>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto pr-1">{renderContent()}</div>
        </div>
    );
};
