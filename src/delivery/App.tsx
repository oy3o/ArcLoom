import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NarrativeService, ImageService, WorldGenerationOutput } from '@/app'
import {
  GameState, GameSetupOptions, INITIAL_GAME_STATE,
  NarrativeBlock, PlayerChoice, AvailableModel,
} from '@/domain';
import {
  useNarrativeService, useImageService, useGameStateRepository, useBackendRepository
} from './context';
import { createNarrativeService, createImageService } from '@/infra/ai/factory';
import { importJson } from '@/pkg/json-helpers';

// UI Component Imports
import { NarrativeView } from './components/NarrativeView';
import { PlayerDashboard } from './components/PlayerDashboard';
import { TitleScreen } from './components/TitleScreen';
import { WorldOverviewScreen } from './components/WorldOverviewScreen';
import { SetupScreen } from './components/SetupScreen';
import { ConfirmationDialog } from './components/ui/ConfirmationDialog';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { BackendManagementScreen } from './components/BackendManagementScreen';
import { Menu } from 'lucide-react';


// Helper function for deep merging game state updates
function updateCompanions(companions, updates) {
  // 创建一个从 id 到伙伴对象的映射，以便快速查找
  const companionMap = new Map(companions.map(c => [c.id, c]));

  // 遍历更新数组
  for (const update of updates) {
    // 检查是否存在具有相同 id 的伙伴对象
    if (companionMap.has(update.id)) {
      // 获取原始的伙伴对象
      const originalCompanion = companionMap.get(update.id);

      // 使用 Object.assign 将更新对象的属性合并到原始对象中
      // 这会覆盖现有属性并添加新属性
      Object.assign(originalCompanion, update);
    }else{
      companions.push(update)
    }
  }

  // 返回更新后的数组
  return companions;
}


const mergeGameState = (prevState: GameState, updates: Partial<GameState>): GameState => {
  const newState = { ...prevState };
  if (updates.player) {
    newState.player = { ...prevState.player, ...updates.player };
    if (updates.player.stats) {
      newState.player.stats = { ...prevState.player.stats, ...updates.player.stats };
    }
  }
  if (updates.world) {
    newState.world = { ...prevState.world, ...updates.world };
  }
  if (updates.companions) {
    newState.companions = updateCompanions(prevState.companions, updates.companions);
  }
  if (updates.setup) {
    newState.setup = { ...prevState.setup, ...updates.setup };
  }
  return newState;
};

type GamePhase = 'title' | 'backend_management' | 'setup' | 'overview' | 'playing';
type GeneratedWorldData = GameState['world'] & { companions: GameState['companions'] };

const App: React.FC = () => {
  // --- Hooks for services and repositories ---
  const { service: narrativeService, setService: setNarrativeService } = useNarrativeService();
  const { service: imageService, setService: setImageService } = useImageService();
  const gameStateRepository = useGameStateRepository();
  const backendRepository = useBackendRepository();

  // --- Core Application State ---
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [history, setHistory] = useState<GameState[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('title');

  // --- UI-related State ---
  const [generatedWorld, setGeneratedWorld] = useState<GeneratedWorldData | null>(null);
  const [isImported, setIsImported] = useState<boolean>(false);
  const [availableTextModels, setAvailableTextModels] = useState<AvailableModel[]>([]);
  const [availableImageModels, setAvailableImageModels] = useState<AvailableModel[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const narrativeEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Effect to scroll to the bottom of the narrative log
  useEffect(() => {
    if (gamePhase === 'playing') {
      narrativeEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState.narrativeLog, gamePhase]);

  // Effect to dynamically create and set AI services when the selected backend changes
  useEffect(() => {
    const initializeServices = async () => {
      const { modelId, imageModelId } = gameState.setup;
      try {
        if (modelId) {
          const config = await backendRepository.GetById(modelId);
          if (config) setNarrativeService(createNarrativeService(config, backendRepository));
          else setNarrativeService(null);
        } else {
          setNarrativeService(null);
        }

        if (imageModelId) {
          const config = await backendRepository.GetById(imageModelId); 
          if (config) setImageService(createImageService(config, backendRepository));
          else setImageService(null);
        } else {
          setImageService(null);
        }
      } catch (err) {
        setError(`Failed to initialize AI services: ${(err as Error).message}`);
        setNarrativeService(null);
        setImageService(null);
      }
    };
    initializeServices();
  }, [gameState.setup.modelId, gameState.setup.imageModelId, backendRepository, setNarrativeService, setImageService]);


  const getNarrativeService = useCallback(async (): Promise<NarrativeService> => {
    if (narrativeService) return narrativeService;
    const configId = gameState.setup.modelId || availableTextModels?.[0].id;
    if (!configId) throw new Error("没有叙述者");
    const config = await backendRepository.GetById(configId);
    if (!config) {
      const allBackends = await backendRepository.GetAll();
      const textModels = allBackends.filter(b => b.generationType === 'text');
      setError(`叙述者 "${gameState.setup.modelId}" 已失联, 使用默认目标`);
      if (textModels.length) {
        gameState.setup.modelId = textModels[0].id
        setGameState(gameState)
      }
      else throw new Error("没有连接的叙述者")
    }
    const service = createNarrativeService(config, backendRepository);
    setNarrativeService(service);
    return service;
  }, [narrativeService, gameState.setup, backendRepository, setNarrativeService]);

  const getImageService = useCallback(async (): Promise<ImageService> => {
    if (imageService) return imageService;
    const configId = gameState.setup.imageModelId || availableImageModels?.[0].id;
    if (!configId) throw new Error("没有回想者");
    const config = await backendRepository.GetById(configId);
    if (!config) {
      const allBackends = await backendRepository.GetAll();
      const imageModels = allBackends.filter(b => b.generationType === 'image');
      setError(`回想者 "${gameState.setup.imageModelId}" 已失联, 使用默认目标`);
      if (imageModels.length) gameState.setup.imageModelId = imageModels[0].id
      else gameState.setup.isImageGenerationEnabled = false;
      setGameState(gameState)
    }
    const service = createImageService(config, backendRepository);
    if (!service) throw new Error("目标不是回想者");
    setImageService(service);
    return service as any; // Cast is safe due to the check above
  }, [imageService, gameState.setup, backendRepository, setImageService]);

  // --- Core Logic Callbacks ---

  const handleUpdateSetup = useCallback((updates: Partial<GameSetupOptions>) => {
    setGameState(prev => ({ ...prev, setup: { ...prev.setup, ...updates } }));
  }, []);

  const generateAndShowWorld = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedWorld(null);
    setIsImported(false);

    try {
      const service = await getNarrativeService();

      setGamePhase('overview');
      setLoadingMessage('Weaving the Genesis...');
      if (!gameState.setup.imageModelId) gameState.setup.isImageGenerationEnabled = false;
      setGameState(gameState)
      const worldData = await service.GenerateWorld(gameState.setup, setLoadingMessage);
      const worldState: GeneratedWorldData = {
        ...INITIAL_GAME_STATE.world,
        lore: worldData.lore as any,
        mainQuests: worldData.mainQuests.map(q => ({ ...q, status: 'inactive' })),
        companions: worldData.companions,
        playerStatsSchema: worldData.playerStatsSchema,
      };
      setGeneratedWorld(worldState);
    } catch (e) {
      setError('World generation failed: ' + (e as Error).message);
      setGamePhase('setup'); // Revert to setup on failure
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [getNarrativeService, gameState.setup]);

  const handleImportWorld = useCallback(async () => {
    try {
      setError(null);
      // We expect a world file, which matches the GeneratedWorldData structure.
      const worldData = await importJson<GeneratedWorldData>();

      // Validate the imported world file structure.
      if (worldData && Array.isArray(worldData.lore) && Array.isArray(worldData.mainQuests)) {
        setGeneratedWorld(worldData);
        setIsImported(true); // Flag this as an import that might need completion.
        setGamePhase('overview');
      } else {
        throw new Error("时空标记已损坏");
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const confirmWorldAndStartNarrative = useCallback(async () => {
    if (!generatedWorld) { setError("Cannot start: World data is missing."); setGamePhase('title'); return; }
    if (!narrativeService) { setError("Cannot start: Narrative service is not initialized."); return; }

    setIsLoading(true);
    setLoadingMessage(generatedWorld.mainQuests?.[0].title || 'Awaking...');

    const initialStats: Record<string, number> = {};
    generatedWorld.playerStatsSchema.forEach(stat => { initialStats[stat.name] = 10; });

    const initialWorldState: GameState = {
      ...INITIAL_GAME_STATE,
      player: { ...INITIAL_GAME_STATE.player, stats: initialStats },
      setup: gameState.setup,
      world: {
        ...((({ companions, ...rest }) => rest)(generatedWorld)),
        mainQuests: generatedWorld.mainQuests.map((q, i) => ({ ...q, status: i === 0 ? 'active' : 'inactive' })),
      },
      companions: generatedWorld.companions,
    };

    await narrativeService.GetNextStep('START_GAME', initialWorldState, {
      onChunk: () => { },
      onComplete: (res) => {
        setGameState({
          ...mergeGameState(initialWorldState, res.gameStateUpdate),
          narrativeLog: [res.narrativeBlock],
          currentChoices: res.choices,
        });
        setHistory([]);
        setGamePhase('playing');
        setIsLoading(false);
      },
      onError: (e) => {
        setError('Failed to start the story: ' + e.message);
        setIsLoading(false);
      }
    });
  }, [generatedWorld, gameState.setup, narrativeService]);

  const processPlayerAction = useCallback((choice: PlayerChoice) => {
    if (!narrativeService) { setError("Narrative service is not initialized!"); return; }

    setHistory(prev => [...prev.slice(-10), gameState]);
    setIsLoading(true);
    setError(null);

    const playerActionBlock: NarrativeBlock = { id: `action-${Date.now()}`, type: 'action', text: choice.text };
    const streamingBlockId = `story-${Date.now()}`;
    const streamingBlock: NarrativeBlock = { id: streamingBlockId, type: 'story', text: '...' };

    setGameState(prev => ({ ...prev, narrativeLog: [...prev.narrativeLog, playerActionBlock, streamingBlock], currentChoices: [] }));

    narrativeService.GetNextStep(choice.prompt, { ...gameState, narrativeLog: [...gameState.narrativeLog, playerActionBlock] }, {
      onChunk: (text) => setGameState(prev => ({ ...prev, narrativeLog: prev.narrativeLog.map(b => b.id === streamingBlockId ? { ...b, text } : b) })),
      onComplete: (res) => {
        setGameState(prev => ({
          ...mergeGameState(prev, res.gameStateUpdate),
          narrativeLog: prev.narrativeLog.map(b => b.id === streamingBlockId ? res.narrativeBlock : b),
          currentChoices: res.choices,
        }));
        setIsLoading(false);
      },
      onError: (e) => { setError(e.message); setIsLoading(false); }
    });
  }, [gameState, narrativeService]);

  const handleGenerateImageUrl = useCallback(async (
    itemType: 'narrative' | 'companion',
    itemId: string,
    prompt: string
  ) => {
    if (!gameState.setup.isImageGenerationEnabled) return;

    try {
      const service = await getImageService();
      const aspectRatio = itemType === 'narrative' ? '16:9' : '1:1';
      const imageUrl = await service.GenerateImage(prompt, aspectRatio);
      if (!imageUrl) return;

      setGameState(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        if (itemType === 'narrative') {
          const block = newState.narrativeLog.find((b: NarrativeBlock) => b?.id === itemId);
          if (block) block.imageUrl = imageUrl;
        } else {
          const companion = newState.companions.find((c: any) => c?.id === itemId);
          if (companion) companion.imageUrl = imageUrl;
        }
        return newState;
      });
    } catch (e) {
      gameState.setup.isImageGenerationEnabled = false
      setGameState(gameState)
      console.error(`Failed to generate image: ${(e as Error).message}`);
    }
  }, [getImageService, gameState.setup.isImageGenerationEnabled]);

  // --- Save/Load and Navigation Callbacks ---

  const handleNavigateToSetup = useCallback(async () => {
    setIsLoading(true);
    const allBackends = await backendRepository.GetAll();
    const textModels = allBackends.filter(b => b.generationType === 'text')
    const imageModels = allBackends.filter(b => b.generationType === 'image')

    setAvailableTextModels(textModels);
    setAvailableImageModels(imageModels);

    setGameState(prev => ({
      ...prev,
      setup: {
        ...prev.setup,
        modelId: prev.setup.modelId || textModels[0]?.id || '',
        imageModelId: prev.setup.imageModelId || imageModels[0]?.id || ''
      }
    }));

    setIsLoading(false);
    setGamePhase('setup');
  }, [backendRepository]);

  const handleLoadGame = useCallback(async () => {
    try {
      setError(null);
      // We expect a full GameState object from a save file.
      const loadedState = await importJson<GameState>();
      if (!loadedState) return;

      // Validate the save file structure.
      if (!loadedState.player || !loadedState.world || !loadedState.setup) {
        throw new Error("时空标记已损坏");
      }

      const allBackends = await backendRepository.GetAll();
      const textModels = allBackends.filter(b => b.generationType === 'text')
      const imageModels = allBackends.filter(b => b.generationType === 'image')

      if (!textModels.some(b => b.id === loadedState.setup.modelId)) {
        setError(`叙述者 "${loadedState.setup.modelId}" 已失联, 使用默认目标`);
        if (textModels.length) loadedState.setup.modelId = textModels[0].id
        else throw new Error("没有连接的叙述者")
      }

      if (loadedState.setup.isImageGenerationEnabled) {
        if (!imageModels.some(b => b.id === loadedState.setup.imageModelId)) {
          setError(`回想者 "${loadedState.setup.imageModelId}" 已失联, 使用默认目标`);
          if (imageModels.length) loadedState.setup.imageModelId = imageModels[0].id
          else loadedState.setup.isImageGenerationEnabled = false;
        }
      }

      setAvailableTextModels(textModels);
      setAvailableImageModels(imageModels);
      setGameState(loadedState);
      setHistory([]);
      setGamePhase('playing');
    } catch (err) {
      setError((err as Error).message);
    }
  }, [backendRepository]);

  const handleQuicksave = useCallback(() => { gameStateRepository.QuickSave(gameState).catch(err => setError((err as Error).message)); }, [gameState, gameStateRepository]);
  const handleQuickload = useCallback(() => { gameStateRepository.QuickLoad().then(s => { if (s) { setGameState(s); setHistory([]); setGamePhase('playing'); } else { setError('No quicksave found.'); } }).catch(err => setError((err as Error).message)); }, [gameStateRepository]);
  const handleExport = useCallback(() => { gameStateRepository.Export(gameState).catch(err => setError((err as Error).message)); }, [gameState, gameStateRepository]);
  const handleRollback = useCallback(() => { if (history.length > 0) { setGameState(history[history.length - 1]); setHistory(prev => prev.slice(0, -1)); } }, [history]);
  const handleConfirmReturn = useCallback((shouldSave: boolean) => { if (shouldSave) handleQuicksave(); setShowReturnConfirm(false); setGamePhase('title'); setGameState(INITIAL_GAME_STATE); setHistory([]); setGeneratedWorld(null); setError(null); setIsImported(false); }, [handleQuicksave]);

  const handleCompleteWorld = useCallback(async () => {
    if (!narrativeService || !generatedWorld) return;
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Completing world data...');
    try {
      const partialData: Partial<WorldGenerationOutput> = {
        lore: generatedWorld.lore,
        mainQuests: generatedWorld.mainQuests,
        companions: generatedWorld.companions,
        playerStatsSchema: generatedWorld.playerStatsSchema,
      };
      const completedData = await narrativeService.CompleteWorld(partialData, gameState.setup, setLoadingMessage);
      setGeneratedWorld(prev => ({
        ...(prev as GeneratedWorldData),
        lore: completedData.lore as any,
        mainQuests: completedData.mainQuests.map(q => ({ ...q, status: 'inactive' })),
        companions: completedData.companions,
        playerStatsSchema: completedData.playerStatsSchema
      }));
      setIsImported(false);
    } catch (e) {
      setError('Failed to complete world: ' + (e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [narrativeService, generatedWorld, gameState.setup]);

  // --- Render Logic ---

  if (isLoading && gamePhase !== 'overview' && gamePhase !== 'playing') {
    return <div className="flex items-center justify-center h-screen bg-[#0f0f1b]"><LoadingSpinner /></div>;
  }

  const renderContent = () => {
    switch (gamePhase) {
      case 'backend_management':
        return <BackendManagementScreen onBack={() => setGamePhase('title')} />;

      case 'setup':
        return <SetupScreen
          setup={gameState.setup}
          onSetupChange={handleUpdateSetup}
          onGenerate={generateAndShowWorld}
          onImportWorld={handleImportWorld}
          textBackends={availableTextModels}
          imageBackends={availableImageModels}
        />;

      case 'overview':
        return <WorldOverviewScreen
          worldData={generatedWorld}
          onConfirm={confirmWorldAndStartNarrative}
          onRegenerate={() => setGamePhase('setup')}
          onCompleteWorld={handleCompleteWorld}
          isImported={isImported}
          isLoading={isLoading}
          loadingText={loadingMessage}
        />;

      case 'playing':
        return (
          <div className="relative flex h-screen bg-[#0f0f1b] font-sans overflow-hidden">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
            {showReturnConfirm && <ConfirmationDialog title="Return to Title" message="Save progress before returning?" onConfirmSave={() => handleConfirmReturn(true)} onConfirmNoSave={() => handleConfirmReturn(false)} onCancel={() => setShowReturnConfirm(false)} />}
            <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto relative">
              <button className="absolute top-4 left-4 z-20 p-2 bg-gray-800/50 rounded-md md:hidden" onClick={() => setIsSidebarOpen(true)}><Menu className="text-white" size={24} /></button>
              <NarrativeView
                narrativeLog={gameState.narrativeLog}
                choices={gameState.currentChoices}
                onChoice={processPlayerAction}
                onFreeformAction={(text) => processPlayerAction({ text, prompt: text })}
                isLoading={isLoading}
                narrativeEndRef={narrativeEndRef}
                onGenerateImageUrl={handleGenerateImageUrl}
                isImageGenerationEnabled={gameState.setup.isImageGenerationEnabled}
              />
              {error && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-800/90 text-white p-4 rounded-lg shadow-lg z-50">Error: {error}<button onClick={() => setError(null)} className="ml-4 font-bold">X</button></div>}
            </main>
            <aside className={`fixed inset-y-0 right-0 z-40 w-4/5 max-w-sm bg-[#141424] p-4 border-l-2 border-purple-500/30 overflow-y-auto transform transition-transform duration-300 md:relative md:w-1/3 lg:w-1/4 xl:w-1/5 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <PlayerDashboard
                gameState={gameState}
                onQuicksave={handleQuicksave}
                onQuickload={handleQuickload}
                onRollback={handleRollback}
                isRollbackAvailable={history.length > 0}
                onGenerateImageUrl={handleGenerateImageUrl}
                onClose={() => setIsSidebarOpen(false)}
                onReturnToTitle={() => setShowReturnConfirm(true)}
                onUpdateSetup={handleUpdateSetup}
                onExport={handleExport}
                availableTextModels={availableTextModels}
                availableImageModels={availableImageModels}
                isImageGenerationEnabled={gameState.setup.isImageGenerationEnabled}
              />
            </aside>
          </div>
        );

      case 'title':
      default:
        return <TitleScreen
          onStart={handleNavigateToSetup}
          onLoadGame={handleLoadGame}
          onManageBackends={() => setGamePhase('backend_management')}
        />;
    }
  };

  return renderContent();
};

export default App;
