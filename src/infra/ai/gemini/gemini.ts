import { GoogleGenAI } from '@google/genai';
import { NarrativeService, ImageService, WorldGenerationOutput, Response, StreamingCallbacks } from '@/app';
import { GameState, GameSetupOptions, WorldLoreItem, BackendConfig } from '@/domain';
import { MASTER_PROMPT, STEP_1_PROMPT, STEP_2_PROMPT, STEP_3_PROMPT, STEP_4_PROMPT, STEP_5_PROMPT, STEP_6_PROMPT } from '../prompts'
import { ResponseSchema, STEP_1_SCHEMA, STEP_2_SCHEMA, STEP_3_SCHEMA, STEP_4_SCHEMA, STEP_5_SCHEMA, STEP_6_SCHEMA } from './schema';

// A utility to safely extract the streaming narrative text.
function extractNarrativeText(partialJson: string): string {
    const textKey = '"text": "';
    const startIndex = partialJson.lastIndexOf(textKey);
    if (startIndex === -1) return '';
    const textValueStart = startIndex + textKey.length;
    let rawText = partialJson.substring(textValueStart);
    let endIndex = -1;
    let i = 0;
    while (i < rawText.length) {
        if (rawText[i] === '"' && (i === 0 || rawText[i - 1] !== '\\')) {
            endIndex = i;
            break;
        }
        i++;
    }
    if (endIndex !== -1) rawText = rawText.substring(0, endIndex);
    try { return JSON.parse(`"${rawText}"`); }
    catch (e) { return rawText.replace(/\\n/g, '\n').replace(/\\"/g, '"'); }
}

export class Gemini implements NarrativeService, ImageService {
    private ai: GoogleGenAI;
    private config: BackendConfig;

    constructor(config: BackendConfig) {
        if (config.provider !== 'google') {
            throw new Error("叙述者无法理解此语言, 请使用 google 协定的语言进行沟通");
        }
        this.ai = new GoogleGenAI({ apiKey: config.apiKey });
        this.config = config;
    }

    updateConfig(config: BackendConfig) {
        this.config = config
    }

    private async callWorldGenStep(prompt: string, schema: any, context?: any): Promise<any> {
        if (!this.config?.modelId) {
            throw new Error("叙述者已失联");
        }
        const fullPrompt = context ? prompt.replace('{CONTEXT}', JSON.stringify(context, null, 2)) : prompt;
        const response = await this.ai.models.generateContent({
            model: this.config.modelId,
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.9,
            },
        });
        return JSON.parse(response.text.trim());
    }

    async GetNextStep(playerInput: string, currentState: GameState, callbacks: StreamingCallbacks): Promise<void> {
        const { onChunk, onComplete, onError } = callbacks;
        if (!this.config?.modelId) {
            onError(new Error("叙述者已失联"));
            return;
        }
        try {
            const stateForApi = {
                ...currentState,
                narrativeLog: currentState.narrativeLog.map(({ imageUrl, ...block }) => block),
                companions: currentState.companions.map(({ imageUrl, ...companion }) => companion),
            };

            const responseSchema = ResponseSchema(currentState.world.playerStatsSchema);
            const systemInstruction = MASTER_PROMPT(currentState.setup);
            const userContent = `PLAYER INPUT: "${playerInput}"\n\nCURRENT GAME STATE:\n${JSON.stringify(stateForApi, null, 2)}\n /* updating companions, make sure to specify the id. */`;

            const stream = await this.ai.models.generateContentStream({
                model: this.config.modelId,
                contents: userContent,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                    temperature: 0.8,
                },
            });

            let accumulatedJson = '';
            for await (const chunk of stream) {
                accumulatedJson += chunk.text;
                const narrativeText = extractNarrativeText(accumulatedJson);
                onChunk(narrativeText);
            }

            const finalResponse: Response = JSON.parse(accumulatedJson);
            onComplete(finalResponse);

        } catch (error) {
            console.error(`叙述者 ${currentState.setup.modelId} 陷入混乱:`, error);
            onError(new Error("与以太之网的连接不稳定"));
        }
    }

    async GenerateImage(prompt: string, aspectRatio: '1:1' | '16:9'): Promise<string | null> {
        if (!this.config?.modelId) { // Should use a dedicated imageModelId from setup
            console.error("Image generation service is not configured with a modelId.");
            return null;
        }

        try {
            const response = await this.ai.models.generateImages({
                model: this.config.modelId, // In a real scenario, this should be an image model
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspectRatio,
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                return `data:image/jpeg;base64,${base64ImageBytes}`;
            }
            return null;
        } catch (error) {
            console.error(`Error generating image with model ${this.config.modelId}:`, error);
            return null;
        }
    }

    async GenerateWorld(setupOptions: GameSetupOptions, setLoadingMessage: (message: string) => void): Promise<WorldGenerationOutput> {
        const modelId = setupOptions.modelId;
        try {
            setLoadingMessage('解析世界基质...');
            const step1Data = await this.callWorldGenStep(STEP_1_PROMPT(setupOptions), STEP_1_SCHEMA);
            const context1 = { lore: [...step1Data.lore] };

            setLoadingMessage('探查人类分布...');
            const [step2Data, step3Data] = await Promise.all([
                this.callWorldGenStep(STEP_2_PROMPT(setupOptions), STEP_2_SCHEMA, context1),
                this.callWorldGenStep(STEP_3_PROMPT(setupOptions), STEP_3_SCHEMA, context1)
            ]);

            const context3 = { lore: [...context1.lore, ...step3Data.lore] };
            setLoadingMessage('触摸历史刻痕...');
            const step4Data = await this.callWorldGenStep(STEP_4_PROMPT(setupOptions), STEP_4_SCHEMA, context3);

            const context4 = { lore: [...context3.lore, ...step4Data.lore] };
            setLoadingMessage('占卜羁绊目标...');
            const step5Data = await this.callWorldGenStep(STEP_5_PROMPT(setupOptions), STEP_5_SCHEMA, context4);

            const fullWorldContext = {
                lore: [...context4.lore, ...(step5Data.lore || [])],
                companions: step5Data.companions || [],
                playerStatsSchema: step2Data.playerStatsSchema,
            };

            setLoadingMessage('锚定时空分支...');
            const step6Data = await this.callWorldGenStep(STEP_6_PROMPT(setupOptions), STEP_6_SCHEMA, fullWorldContext);

            const finalOutput: WorldGenerationOutput = {
                lore: fullWorldContext.lore,
                mainQuests: step6Data.mainQuests,
                companions: fullWorldContext.companions,
                playerStatsSchema: fullWorldContext.playerStatsSchema,
            };

            setLoadingMessage('时空已锚定');
            return finalOutput;
        } catch (error) {
            console.error(`叙述者 ${modelId} 陷入混乱:`, error);
            throw new Error("时空锚定失败, 与以太之网的连接不稳定");
        }
    }

    async CompleteWorld(partialData: Partial<WorldGenerationOutput>, setupOptions: GameSetupOptions, setLoadingMessage: (message: string) => void): Promise<WorldGenerationOutput> {
        const modelId = setupOptions.modelId;
        const completedData: WorldGenerationOutput = {
            lore: partialData.lore || [],
            mainQuests: partialData.mainQuests || [],
            companions: partialData.companions || [],
            playerStatsSchema: partialData.playerStatsSchema || [],
        };

        if (completedData.lore.length === 0) {
            throw new Error("无法锚定没有传说的时空");
        }

        const getContext = () => ({
            lore: completedData.lore,
            mainQuests: completedData.mainQuests,
            companions: completedData.companions,
            playerStatsSchema: completedData.playerStatsSchema,
        });

        if (!completedData.playerStatsSchema || completedData.playerStatsSchema.length === 0) {
            setLoadingMessage('解析世界基质...');
            const data = await this.callWorldGenStep(STEP_2_PROMPT(setupOptions), STEP_2_SCHEMA, getContext());
            completedData.playerStatsSchema = data.playerStatsSchema;
        }

        const hasFactions = completedData.lore.some(l => l.type === '组织');
        if (!hasFactions) {
            setLoadingMessage('探查人类分布...');
            const data = await this.callWorldGenStep(STEP_3_PROMPT(setupOptions), STEP_3_SCHEMA, getContext());
            const newLore = data.lore.filter((newItem: WorldLoreItem) =>
                !completedData.lore.some(existingItem => existingItem.title === newItem.title)
            );
            completedData.lore.push(...newLore);
        }

        if (!completedData.lore.some(l => l.type === '历史')) {
            setLoadingMessage('触摸历史刻痕...');
            const data = await this.callWorldGenStep(STEP_4_PROMPT(setupOptions), STEP_4_SCHEMA, getContext());
            const newLore = data.lore.filter((newItem: WorldLoreItem) =>
                !completedData.lore.some(existingItem => existingItem.title === newItem.title)
            );
            completedData.lore.push(...newLore);
        }

        if (!completedData.companions || completedData.companions.length === 0) {
            setLoadingMessage('占卜羁绊目标...');
            const data = await this.callWorldGenStep(STEP_5_PROMPT(setupOptions), STEP_5_SCHEMA, getContext());
            if (data.lore) {
                const newLore = data.lore.filter((newItem: WorldLoreItem) =>
                    !completedData.lore.some(existingItem => existingItem.title === newItem.title)
                );
                completedData.lore.push(...newLore);
            }
            completedData.companions = data.companions || [];
        }

        if (!completedData.mainQuests || completedData.mainQuests.length === 0) {
            setLoadingMessage('锚定时空分支...');
            const data = await this.callWorldGenStep(STEP_6_PROMPT(setupOptions), STEP_6_SCHEMA, getContext());
            completedData.mainQuests = data.mainQuests;
        }

        setLoadingMessage('时空已锚定');
        return completedData;
    }
}
