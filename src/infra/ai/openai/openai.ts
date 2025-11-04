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
import { MASTER_PROMPT, STEP_1_PROMPT, STEP_2_PROMPT, STEP_3_PROMPT, STEP_4_PROMPT, STEP_5_PROMPT, STEP_6_PROMPT } from '../prompts'
import { ResponseSchema, STEP_1_SCHEMA, STEP_2_SCHEMA, STEP_3_SCHEMA, STEP_4_SCHEMA, STEP_5_SCHEMA, STEP_6_SCHEMA } from './schema';
import { sanitizeJsonResponse } from '@/pkg/json-helpers';

function extractNarrativeText(partialJson: string): string {
    // Find the last occurrence of the pattern `"narrativeBlock": { ... "text": "`
    // This is more robust than a simple indexOf.
    const textKeyPattern = '"text": "';
    let textStartIndex = partialJson.indexOf(textKeyPattern);

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
     * A helper method for making non-streaming world generation API calls.
     */
    private async callWorldGenStep(prompt: string, schema: any, context?: any): Promise<any> {
        if (!this.config?.modelId) {
            throw new Error("叙述者已失联");
        }
        const fullPrompt = context ? prompt.replace('{CONTEXT}', JSON.stringify(context, null, 2)) : prompt;

        const response = await this.ai.chat.completions.create({
            model: this.config.modelId,
            messages: [{ role: "system", content: fullPrompt },{ role: "user", content: "请确保枚举类型正确 ['力量体系', '地点', '组织', '历史', '传说'] " }],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: 'system_data',
                    schema: schema,
                }
            },
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error("叙述者已迷失");
        }
        return JSON.parse(sanitizeJsonResponse(content));
    }

    /**
     * Generates the next turn in the narrative using OpenAI's streaming chat completions.
     */
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
            const userContent = `PLAYER INPUT: "${playerInput}"\n\nCURRENT GAME STATE:\n${JSON.stringify(stateForApi, null, 2)}\n`;

            const stream = await this.ai.chat.completions.create({
                model: this.config.modelId,
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userContent }
                ],
                stream: true,
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: 'system_data',
                        schema: responseSchema
                    }
                },
            });

            let accumulatedJson = '';
            for await (const chunk of stream) {
                accumulatedJson += chunk.choices[0]?.delta?.content || '';
                const narrativeText = extractNarrativeText(accumulatedJson);
                onChunk(narrativeText);
            }
            const sanitizedJson = sanitizeJsonResponse(accumulatedJson);
            console.log(sanitizedJson)
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
