import React, { useEffect } from 'react';
import { Companion } from '@/domain';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const AffinityBar: React.FC<{ value: number }> = ({ value }) => ( <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1"><div className="bg-pink-500 h-2.5 rounded-full" style={{ width: `${value}%` }}></div></div> );

const CompanionCard: React.FC<{ companion: Companion; onGenerateImageUrl: (itemType: 'companion', itemId: string, prompt: string) => void; isImageGenerationEnabled: boolean; }> = 
({ companion, onGenerateImageUrl, isImageGenerationEnabled }) => {
    useEffect(() => {
        if (isImageGenerationEnabled && companion.imagePrompt && !companion.imageUrl) {
            onGenerateImageUrl('companion', companion.id, companion.imagePrompt);
        }
    }, [companion.id, companion.imagePrompt, companion.imageUrl, onGenerateImageUrl, isImageGenerationEnabled]);

    return (
        <Card>
            <CardHeader><CardTitle className="text-lg text-pink-300">{companion.name}</CardTitle><p className="text-sm text-gray-400 italic">{companion.title}</p></CardHeader>
            <CardContent>
                {companion.imageUrl ? <img src={companion.imageUrl} alt={companion.name} className="rounded-md mb-2 w-full h-auto object-cover"/> : isImageGenerationEnabled && companion.imagePrompt && <div className="w-full aspect-square bg-black/30 rounded-md mb-2 flex items-center justify-center"><LoadingSpinner /></div>}
                <div className="text-sm flex justify-between items-center"><span>亲密度</span><span className="font-bold">{companion.affinity}/100</span></div>
                <AffinityBar value={companion.affinity} />
            </CardContent>
        </Card>
    );
};

export const CompanionsPanel: React.FC<{ companions: Companion[]; onGenerateImageUrl: (itemType: 'companion', itemId: string, prompt: string) => void; isImageGenerationEnabled: boolean; }> = 
({ companions, onGenerateImageUrl, isImageGenerationEnabled }) => {
  if (!companions || companions.length === 0) return <p className="text-gray-500 italic p-4 text-center">你正独自一人。</p>;
  return <div className="space-y-4">{companions.map((c) => <CompanionCard key={c.id} companion={c} onGenerateImageUrl={onGenerateImageUrl} isImageGenerationEnabled={isImageGenerationEnabled}/>)}</div>;
};
