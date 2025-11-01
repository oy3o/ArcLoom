import {
  GameState,
  GameSetupOptions,
  WorldLoreItem,
  MainQuest,
  NarrativeBlock,
  PlayerChoice,
} from '@/domain';

export interface WorldGenerationOutput {
  lore: (Omit<WorldLoreItem, 'type'> & { type: string })[];
  mainQuests: Omit<MainQuest, 'status'>[];
  companions: MainQuest[];
  playerStatsSchema: { name: string; description: string; }[];
}

export interface Response {
    narrativeBlock: NarrativeBlock;
    choices: PlayerChoice[];
    gameStateUpdate: Partial<GameState>;
}

export interface StreamingCallbacks {
  onChunk: (text: string) => void;
  onComplete: (response: Response) => void;
  onError: (error: Error) => void;
}

/**
 * Defines the contract for a service responsible for generating all
 * AI-driven narrative and world content.
 */
export interface NarrativeService {
  /**
   * Generates the next turn in the narrative based on player input.
   * This is a streaming operation that uses callbacks to update the UI in real-time.
   * @param playerInput The prompt or action from the player.
   * @param currentState The complete current state of the game.
   * @param callbacks An object containing onChunk, onComplete, and onError handlers.
   * @returns A promise that resolves when the streaming process is initiated.
   */
  GetNextStep(
    playerInput: string,
    currentState: GameState,
    callbacks: StreamingCallbacks
  ): Promise<void>;

  /**
   * Generates a new, complete game world from scratch based on user-defined options.
   * @param setupOptions The options selected by the user for world creation.
   * @param setLoadingMessage A callback to update the UI with progress messages.
   * @returns A promise that resolves with the fully generated world data.
   */
  GenerateWorld(
    setupOptions: GameSetupOptions,
    setLoadingMessage: (message: string) => void
  ): Promise<WorldGenerationOutput>;

  /**
   * Completes a partially defined world, filling in missing essential details.
   * Useful for imported or user-created worlds.
   * @param partialData The incomplete world data.
   * @param setupOptions The game setup options to guide the completion.
   * @param setLoadingMessage A callback to update the UI with progress messages.
   * @returns A promise that resolves with the completed world data.
   */
  CompleteWorld(
    partialData: Partial<WorldGenerationOutput>,
    setupOptions: GameSetupOptions,
    setLoadingMessage: (message: string) => void
  ): Promise<WorldGenerationOutput>;
}
