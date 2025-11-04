import {
    NarrativeService,
    ImageService,
    WorldGenerationOutput,
    Response,
    StreamingCallbacks,
    BackendRepository
} from '@/app';
import { GameState, GameSetupOptions, BackendPoolConfig, isBackendPool, BackendConfig } from '@/domain';
import { createNarrativeService, createImageService } from './factory';

abstract class RotatingService {
    protected poolConfig: BackendPoolConfig;
    protected repository: BackendRepository;
    private currentIndex = 0;

    constructor(poolConfig: BackendPoolConfig, repository: BackendRepository) {
        if (!isBackendPool(poolConfig)) {
            throw new Error("RotatingService requires a BackendPoolConfig.");
        }
        this.poolConfig = poolConfig;
        this.repository = repository;
    }

    protected async getNextConfig(): Promise<BackendConfig> {
        const configs = await this.repository.GetAll();
        const poolKeys = configs.filter(c =>
            this.poolConfig.backendIds.includes(c.id) && c.configType === 'single'
        ) as BackendConfig[];

        if (poolKeys.length === 0) {
            throw new Error(`密钥池 "${this.poolConfig.name}" 为空或密钥已失联`);
        }

        const config = poolKeys[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % poolKeys.length;
        return config;
    }
}

export class RotatingNarrativeService extends RotatingService implements NarrativeService {
    private async getNextService(): Promise<NarrativeService> {
        const config = await this.getNextConfig();
        // We pass the repository again, but it won't be used since this is a single config
        return createNarrativeService(config, this.repository);
    }

    async GetNextStep(playerInput: string, currentState: GameState, callbacks: StreamingCallbacks): Promise<void> {
        const service = await this.getNextService();
        return service.GetNextStep(playerInput, currentState, callbacks);
    }

    async GenerateWorld(setupOptions: GameSetupOptions, setLoadingMessage: (message: string) => void): Promise<WorldGenerationOutput> {
        const service = await this.getNextService();
        return service.GenerateWorld(setupOptions, setLoadingMessage);
    }

    async CompleteWorld(partialData: Partial<WorldGenerationOutput>, setupOptions: GameSetupOptions, setLoadingMessage: (message: string) => void): Promise<WorldGenerationOutput> {
        const service = await this.getNextService();
        return service.CompleteWorld(partialData, setupOptions, setLoadingMessage);
    }
}

export class RotatingImageService extends RotatingService implements ImageService {
    private async getNextService(): Promise<ImageService | null> {
        const config = await this.getNextConfig();
        return createImageService(config, this.repository);
    }

    async GenerateImage(prompt: string, aspectRatio: '1:1' | '16:9'): Promise<string | null> {
        const service = await this.getNextService();
        if (!service) {
             throw new Error("在密钥池中无法创建图片服务");
        }
        return service.GenerateImage(prompt, aspectRatio);
    }
}
