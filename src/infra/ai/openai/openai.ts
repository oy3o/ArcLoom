import { OpenAI } from 'openai';
import {
    NarrativeService,
    ImageService,
    WorldGenerationOutput,
    Response,
    StreamingCallbacks
} from '@/app';
import {
    GameState,
    GameSetupOptions,
    BackendConfig,
    WorldLoreItem
} from '@/domain';

// Import the prompts specifically adapted for OpenAI
import {
    MASTER_PROMPT_OPENAI,
    STEP_1_PROMPT_OPENAI,
    STEP_2_PROMPT_OPENAI,
    STEP_3_PROMPT_OPENAI,
    STEP_4_PROMPT_OPENAI,
    STEP_5_PROMPT_OPENAI,
    STEP_6_PROMPT_OPENAI,
} from './schema';

import { sanitizeJsonResponse } from '@/pkg/json-helpers';

function extractNarrativeText(partialJson: string): string {
    // Find the last occurrence of the pattern `"narrativeBlock": { ... "text": "`
    // This is more robust than a simple indexOf.
    const textKeyPattern = '"text": "';
    let textStartIndex = partialJson.lastIndexOf(textKeyPattern);

    if (textStartIndex === -1) {
        return ''; // The text field hasn't started streaming yet.
    }

    // Move the index to the beginning of the actual text value
    textStartIndex += textKeyPattern.length;

    // Extract the substring from the start of the text value to the end of the partial JSON
    let rawText = partialJson.substring(textStartIndex);

    // Now, we need to find the end of the text value.
    // The value ends at the first unescaped double quote.
    let endIndex = -1;
    for (let i = 0; i < rawText.length; i++) {
        if (rawText[i] === '"' && (i === 0 || rawText[i - 1] !== '\\')) {
            endIndex = i;
            break;
        }
    }

    // If we found a closing quote, the text field is complete (within the stream so far).
    if (endIndex !== -1) rawText = rawText.substring(0, endIndex);
    try { return JSON.parse(`"${rawText}"`); }
    catch (e) { return rawText; }
}

/**
 * A service class that implements the narrative and image generation services
 * using the OpenAI API. It handles both streaming chat completions for narrative
 * and image generation via DALL-E.
 */
export class Open implements NarrativeService, ImageService {
    private ai: OpenAI;
    private config: BackendConfig;

    constructor(config: BackendConfig) {
        if (config.provider !== 'openai') {
            throw new Error("叙述者无法理解此语言, 请使用 openai 协定的语言进行沟通");
        }
        this.ai = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.endpoint, // Allows using custom/proxy OpenAI-compatible endpoints
            dangerouslyAllowBrowser: true, // This is required for client-side browser usage
        });
        this.config = config;
    }

    /**
     * Generates the next turn in the narrative using OpenAI's streaming chat completions.
     */
    async GetNextStep(playerInput: string, currentState: GameState, callbacks: StreamingCallbacks): Promise<void> {
        const { onChunk, onComplete, onError } = callbacks;

        try {
            const systemPrompt = MASTER_PROMPT_OPENAI(currentState.setup);
            const userContent = `PLAYER INPUT: "${playerInput}"\n\nCURRENT GAME STATE:\n${JSON.stringify(currentState, null, 2)}`;

            const stream = await this.ai.chat.completions.create({
                model: this.config.modelId,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent }
                ],
                stream: true,
                response_format: { type: "json_object" }, // Crucial for reliable JSON output
            });

            let accumulatedJson = '';
            for await (const chunk of stream) {
                accumulatedJson += chunk.choices[0]?.delta?.content || '';
                const narrativeText = extractNarrativeText(accumulatedJson);
                onChunk(narrativeText);
            }
            const sanitizedJson = sanitizeJsonResponse(accumulatedJson);
            const finalResponse: Response = JSON.parse(sanitizedJson);
            onComplete(finalResponse);

        } catch (error) {
            console.error("叙述者陷入混乱:", error);
            const err = error instanceof Error ? error : new Error("与以太之网的连接不稳定");
            onError(err);
        }
    }

    /**
     * Generates an image using DALL-E 3.
     */
    async GenerateImage(prompt: string, aspectRatio: '1:1' | '16:9'): Promise<string | null> {
        try {
            const response = await this.ai.images.generate({
                model: this.config.modelId,
                prompt: `A beautiful, high-quality, cinematic anime style illustration of: ${prompt}`, // Pre-pend style guide for consistency
                n: 1,
                size: aspectRatio === '16:9' ? "1792x1024" : "1024x1024",
                response_format: 'b64_json', // Get image data directly
            });

            const b64Json = response.data[0]?.b64_json;
            if (b64Json) {
                return `data:image/png;base64,${b64Json}`;
            }
            return null;
        } catch (error) {
            console.error("Error generating image with DALL-E:", error);
            return null;
        }
    }

    /**
     * A helper method for making non-streaming world generation API calls.
     */
    private async callWorldGenStep(prompt: string, context?: any): Promise<any> {
        const fullPrompt = context ? prompt.replace('{CONTEXT}', JSON.stringify(context, null, 2)) : prompt;

        const response = await this.ai.chat.completions.create({
            model: this.config.modelId,
            messages: [{ role: "system", content: fullPrompt }],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error("叙述者已迷失");
        }
        return JSON.parse(content);
    }

    /**
     * Generates a new game world using a sequence of calls to the OpenAI API.
     */
    async GenerateWorld(setupOptions: GameSetupOptions, setLoadingMessage: (message: string) => void): Promise<WorldGenerationOutput> {
        try {
            setLoadingMessage('解析世界基质...');
            const step1Data = await this.callWorldGenStep(STEP_1_PROMPT_OPENAI(setupOptions));
            const context1 = { lore: step1Data.lore };

            setLoadingMessage('探查人类分布...');
            const [step2Data, step3Data] = await Promise.all([
                this.callWorldGenStep(STEP_2_PROMPT_OPENAI(setupOptions), context1),
                this.callWorldGenStep(STEP_3_PROMPT_OPENAI(setupOptions), context1)
            ]);

            const context3 = { lore: [...context1.lore, ...step3Data.lore] };
            setLoadingMessage('触摸历史刻痕...');
            const step4Data = await this.callWorldGenStep(STEP_4_PROMPT_OPENAI(setupOptions), context3);

            const context4 = { lore: [...context3.lore, ...step4Data.lore] };
            setLoadingMessage('占卜羁绊目标...');
            const step5Data = await this.callWorldGenStep(STEP_5_PROMPT_OPENAI(setupOptions), context4);

            const fullWorldContext = {
                lore: [...context4.lore, ...(step5Data.lore || [])],
                companions: step5Data.companions || [],
                playerStatsSchema: step2Data.playerStatsSchema,
            };

            setLoadingMessage('锚定时空分支...');
            const step6Data = await this.callWorldGenStep(STEP_6_PROMPT_OPENAI(setupOptions), fullWorldContext);


            setLoadingMessage('时空已锚定');
            return {
                lore: fullWorldContext.lore,
                mainQuests: step6Data.mainQuests,
                companions: fullWorldContext.companions,
                playerStatsSchema: fullWorldContext.playerStatsSchema,
            };

        } catch (error) {
            console.error(`叙述者 ${setupOptions.modelId} 陷入混乱:`, error);
            throw new Error("时空锚定失败, 与以太之网的连接不稳定");
        }
    }

    /**
     * Completes a partially defined world using OpenAI.
     */
    async CompleteWorld(
        partialData: Partial<WorldGenerationOutput>,
        setupOptions: GameSetupOptions,
        setLoadingMessage: (message: string) => void
    ): Promise<WorldGenerationOutput> {
        try {
            // Initialize our working copy of the world data
            const completedData: WorldGenerationOutput = {
                lore: partialData.lore || [],
                mainQuests: partialData.mainQuests || [],
                companions: partialData.companions || [],
                playerStatsSchema: partialData.playerStatsSchema || [],
            };

            // A world cannot be completed from nothing. It needs a conceptual seed.
            if (completedData.lore.length === 0) {
                throw new Error("无法锚定没有传说的时空");
            }

            // Helper function to get the most current state of the world for context
            const getContext = () => ({
                lore: completedData.lore,
                mainQuests: completedData.mainQuests,
                companions: completedData.companions,
                playerStatsSchema: completedData.playerStatsSchema,
            });

            // Step 2: Generate Player Stats if they are missing
            if (!completedData.playerStatsSchema || completedData.playerStatsSchema.length === 0) {
                setLoadingMessage('解析世界基质...');
                const data = await this.callWorldGenStep(STEP_2_PROMPT_OPENAI(setupOptions), getContext());
                completedData.playerStatsSchema = data.playerStatsSchema;
            }

            // Step 3: Generate Factions and Locations if they are missing
            if (!completedData.lore.some(l => l.type === '组织' || l.type === '地点')) {
                setLoadingMessage('探查人类分布...');
                const data = await this.callWorldGenStep(STEP_3_PROMPT_OPENAI(setupOptions), getContext());
                // Merge new lore, avoiding duplicates
                const newLore = (data.lore as WorldLoreItem[]).filter(newItem =>
                    !completedData.lore.some(existingItem => existingItem.title === newItem.title)
                );
                completedData.lore.push(...newLore);
            }

            // Step 4: Generate History and Legends if they are missing
            if (!completedData.lore.some(l => l.type === '历史')) {
                setLoadingMessage('触摸历史刻痕...');
                const data = await this.callWorldGenStep(STEP_4_PROMPT_OPENAI(setupOptions), getContext());
                const newLore = (data.lore as WorldLoreItem[]).filter(newItem =>
                    !completedData.lore.some(existingItem => existingItem.title === newItem.title)
                );
                completedData.lore.push(...newLore);
            }

            // Step 5: Generate Companions if they are missing
            if (!completedData.companions || completedData.companions.length === 0) {
                setLoadingMessage('占卜羁绊目标...');
                const data = await this.callWorldGenStep(STEP_5_PROMPT_OPENAI(setupOptions), getContext());

                // This step can also add lore (for NPCs), so we merge that too
                if (data.lore) {
                    const newLore = (data.lore as WorldLoreItem[]).filter(newItem =>
                        !completedData.lore.some(existingItem => existingItem.title === newItem.title)
                    );
                    completedData.lore.push(...newLore);
                }
                completedData.companions = data.companions || [];
            }

            // Step 6: Generate Main Quests if they are missing
            if (!completedData.mainQuests || completedData.mainQuests.length === 0) {
                setLoadingMessage('锚定时空分支...');
                const data = await this.callWorldGenStep(STEP_6_PROMPT_OPENAI(setupOptions), getContext());
                completedData.mainQuests = data.mainQuests;
            }

            setLoadingMessage('时空已锚定');
            return completedData;

        } catch (error) {
            console.error(`叙述者 ${setupOptions.modelId} 陷入混乱:`, error);
            throw new Error("时空锚定失败, 与以太之网的连接不稳定");
        }
    }
}
