import React from 'react';
import { PlayerChoice } from '@/domain';

export const ChoiceButton: React.FC<{ choice: PlayerChoice; onChoice: (choice: PlayerChoice) => void; }> = ({ choice, onChoice }) => (
    <button onClick={() => onChoice(choice)} className="w-full text-left p-4 bg-gray-800/50 border-2 border-transparent rounded-lg hover:bg-purple-800/50 hover:border-purple-500 transition-all">
        {choice.text}
    </button>
);
