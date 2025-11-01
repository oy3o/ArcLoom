import React, { useEffect, useState, useMemo } from 'react';
import { NarrativeBlock, PlayerChoice } from '@/domain';
import { ChoiceButton } from './ui/ChoiceButton';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Send, ChevronsUp } from 'lucide-react';

interface NarrativeViewProps {
  narrativeLog: NarrativeBlock[];
  choices: PlayerChoice[];
  onChoice: (choice: PlayerChoice) => void;
  onFreeformAction: (actionText: string) => void;
  isLoading: boolean;
  narrativeEndRef: React.RefObject<HTMLDivElement>;
  onGenerateImageUrl: (itemType: 'narrative', itemId: string, prompt: string) => void;
  isImageGenerationEnabled: boolean;
}

interface NarrativeBlockDisplayProps {
  block: NarrativeBlock;
  onGenerateImageUrl: (itemType: 'narrative', itemId: string, prompt: string) => void;
  isLastImageInLog: boolean;
  isImageGenerationEnabled: boolean;
}

const NarrativeBlockDisplay: React.FC<NarrativeBlockDisplayProps> = React.memo(({ block, onGenerateImageUrl, isLastImageInLog, isImageGenerationEnabled }) => {
  const [isClickedToLoad, setIsClickedToLoad] = useState(false);
  const baseClasses = "mb-6 p-4 rounded-lg shadow-md max-w-4xl mx-auto backdrop-blur-sm";

  useEffect(() => {
    if (isImageGenerationEnabled && block.imagePrompt && !block.imageUrl) {
      if (isLastImageInLog || isClickedToLoad) {
        onGenerateImageUrl('narrative', block.id, block.imagePrompt);
      }
    }
  }, [block.id, block.imagePrompt, block.imageUrl, isLastImageInLog, isClickedToLoad, onGenerateImageUrl, isImageGenerationEnabled]);

  if (block.type === 'action') {
    return (
      <div className={`${baseClasses} bg-blue-900/40 border border-blue-400/30 text-right`}>
        <p className="text-blue-200 italic font-semibold">_&gt; {block.text}</p>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} bg-black/30 border border-purple-500/20`}>
      {block.imageUrl && (
        <img src={block.imageUrl} alt="Scene" className="rounded-lg mb-4 w-full h-auto object-cover" />
      )}
      {isImageGenerationEnabled && block.imagePrompt && !block.imageUrl && (
        <div className="w-full aspect-video bg-black/30 rounded-lg mb-4 flex items-center justify-center">
          {isLastImageInLog || isClickedToLoad ? (
            <LoadingSpinner />
          ) : (
            <button
              onClick={() => setIsClickedToLoad(true)}
              className="p-3 bg-purple-800/50 rounded-lg text-purple-300 hover:bg-purple-800/80 transition-colors text-sm"
            >
              点击回忆场景
            </button>
          )}
        </div>
      )}
      <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{block.text}</p>
    </div>
  );
});

const INITIAL_VISIBLE_COUNT = 15;

export const NarrativeView: React.FC<NarrativeViewProps> = ({
  narrativeLog, choices, onChoice, onFreeformAction, isLoading, narrativeEndRef, onGenerateImageUrl, isImageGenerationEnabled,
}) => {
  const [freeformInput, setFreeformInput] = useState('');
  const [visibleLogCount, setVisibleLogCount] = useState(INITIAL_VISIBLE_COUNT);

  useEffect(() => {
    if (narrativeLog.length <= INITIAL_VISIBLE_COUNT) {
        setVisibleLogCount(INITIAL_VISIBLE_COUNT);
    }
  }, [narrativeLog.length]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (freeformInput.trim() && !isLoading) {
      onFreeformAction(freeformInput.trim());
      setFreeformInput('');
    }
  };
  
  const handleLoadMore = () => setVisibleLogCount(prev => prev + 15);
  const visibleLog = useMemo(() => narrativeLog.slice(-visibleLogCount), [narrativeLog, visibleLogCount]);
  const lastImageBlockId = useMemo(() => [...narrativeLog].reverse().find(b => b.imagePrompt)?.id, [narrativeLog]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow overflow-y-auto pr-2">
        {narrativeLog.length > visibleLogCount && (
            <div className="text-center mb-4">
                <button
                    onClick={handleLoadMore}
                    className="px-4 py-2 text-sm bg-gray-800/60 text-purple-300 rounded-lg hover:bg-gray-700/80 transition-colors flex items-center mx-auto"
                >
                    <ChevronsUp size={16} className="mr-2" />
                    注视更遥远的时空
                </button>
            </div>
        )}
        {visibleLog.map((block) => (
          <NarrativeBlockDisplay key={block.id} block={block} onGenerateImageUrl={onGenerateImageUrl} isLastImageInLog={block.id === lastImageBlockId} isImageGenerationEnabled={isImageGenerationEnabled} />
        ))}
        <div ref={narrativeEndRef} />
      </div>

      <div className="flex-shrink-0 pt-4 max-w-4xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <LoadingSpinner />
            <p className="ml-4 text-purple-300 animate-pulse">编织命运中...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {choices.map((choice, index) => <ChoiceButton key={index} choice={choice} onChoice={onChoice} />)}
            </div>
            <form onSubmit={handleFormSubmit} className="mt-4 flex gap-2">
              <input type="text" value={freeformInput} onChange={(e) => setFreeformInput(e.target.value)} placeholder="你想做什么？" disabled={isLoading} className="flex-grow bg-gray-800/50 border-2 border-gray-700 rounded-lg text-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors" />
              <button type="submit" disabled={isLoading || !freeformInput.trim()} className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg shadow-purple-600/30 transition-all transform hover:scale-105 disabled:cursor-not-allowed disabled:bg-purple-800/50 disabled:scale-100">
                <Send size={20} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
