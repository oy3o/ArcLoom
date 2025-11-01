import React, { useState, useEffect } from 'react';
import { useBackendRepository } from '../context';

interface TitleScreenProps {
  onStart: () => void;
  onLoadGame: () => void;
  onManageBackends: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onLoadGame, onManageBackends }) => {
  const backendRepository = useBackendRepository();
  const [isGameReady, setIsGameReady] = useState(false);

  useEffect(() => {
    const checkBackends = async () => {
      const backends = await backendRepository.GetAll();
      const hasTextBackend = backends.some(b => b.generationType === 'text');
      setIsGameReady(hasTextBackend);
    };
    checkBackends();
  }, [backendRepository]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-[#0f0f1b] to-[#1a1a2e] text-white p-4">
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-purple-300">ArcLoom</h1>
        <p className="mt-4 text-lg text-gray-400">An extensible engine for interactive narratives.</p>
      </div>

      {!isGameReady && (
        <p className="mt-8 text-yellow-400 bg-yellow-900/50 p-3 rounded-md">
          Please connect at least one narrator.
        </p>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button onClick={onStart} disabled={!isGameReady} className="px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded disabled:opacity-50">Re-anchoring</button>
        <button onClick={onLoadGame} disabled={!isGameReady} className="px-6 py-3 bg-transparent border-2 border-purple-400 rounded disabled:opacity-50">Load Coordinates</button>
      </div>

      <div className="mt-6">
        <button onClick={onManageBackends} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded">Connecting</button>
      </div>
    </div>
  );
};
