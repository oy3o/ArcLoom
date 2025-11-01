import React from 'react';
import { GameStateRepository, BackendRepository } from '@/app';

// --- GameState Repository Context ---

const GameStateRepositoryContext = React.createContext<GameStateRepository | null>(null);

/**
 * Custom hook to access the GameStateRepository instance.
 * @throws {Error} if used outside of a RepositoryProvider.
 */
export const useGameStateRepository = (): GameStateRepository => {
  const context = React.useContext(GameStateRepositoryContext);
  if (!context) {
    throw new Error('useGameStateRepository must be used within a RepositoryProvider');
  }
  return context;
};

interface RepositoryProviderProps {
  children: React.ReactNode;
  repository: GameStateRepository;
}

/**
 * Provider component for the GameStateRepository.
 */
export const GameStateRepositoryProvider = ({ children, repository }: RepositoryProviderProps) => (
  <GameStateRepositoryContext.Provider value={repository}>
    {children}
  </GameStateRepositoryContext.Provider>
);


// --- Backend Repository Context ---

const BackendRepositoryContext = React.createContext<BackendRepository | null>(null);

/**
 * Custom hook to access the BackendRepository instance.
 * @throws {Error} if used outside of a BackendRepositoryProvider.
 */
export const useBackendRepository = (): BackendRepository => {
  const context = React.useContext(BackendRepositoryContext);
  if (!context) {
    throw new Error('useBackendRepository must be used within a BackendRepositoryProvider');
  }
  return context;
};

interface BackendRepositoryProviderProps {
  children: React.ReactNode;
  repository: BackendRepository;
}

/**
 * Provider component for the BackendRepository.
 */
export const BackendRepositoryProvider = ({ children, repository }: BackendRepositoryProviderProps) => (
  <BackendRepositoryContext.Provider value={repository}>
    {children}
  </BackendRepositoryContext.Provider>
);
