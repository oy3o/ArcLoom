/**
 * This module adapts the base prompts for use with OpenAI-compatible models.
 * It decorates the original prompts with explicit instructions to ensure
 * reliable JSON output when using OpenAI's JSON mode.
 */

import { GameSetupOptions, GameState } from '@/domain';

// 1. Import all the original, base prompts with aliases to avoid name clashes.
import {
    MASTER_PROMPT as BASE_MASTER_PROMPT,
    STEP_1_PROMPT as BASE_STEP_1_PROMPT,
    STEP_2_PROMPT as BASE_STEP_2_PROMPT,
    STEP_3_PROMPT as BASE_STEP_3_PROMPT,
    STEP_4_PROMPT as BASE_STEP_4_PROMPT,
    STEP_5_PROMPT as BASE_STEP_5_PROMPT,
    STEP_6_PROMPT as BASE_STEP_6_PROMPT,
} from '../prompts';

// 2. Define a decorator function that appends the strict JSON instructions.
/**
 * A decorator function that wraps a base prompt with strict instructions for OpenAI's JSON mode.
 * @param basePrompt The original prompt content.
 * @param jsonSchemaDescription A string representing the expected JSON structure.
 * @returns A new prompt string optimized for OpenAI.
 */
const createOpenAIPrompt = (basePrompt: string, jsonSchemaDescription: string): string => {
    return `${basePrompt}

**CRITICAL INSTRUCTION**: Your entire response MUST be a single, valid JSON object that strictly adheres to the structure described below. Do not include any explanatory text, markdown formatting (like \`\`\`json), or any other characters before or after the JSON object.

**REQUIRED JSON STRUCTURE:**
${jsonSchemaDescription}
`;
};

// 3. Define the string descriptions for each required JSON schema.

// Schema for the main narrative turn (MASTER_PROMPT)
const MASTER_PROMPT_SCHEMA_DESC = `{
  "narrativeBlock": { "id": "string", "type": "'story' | 'action' | 'system'", "text": "string", "imagePrompt": "string | undefined" }, /* using "story" is sufficient, unless it's a brief action response. */
  "choices": [ { "text": "string", "prompt": "string" } ],
  "gameStateUpdate": { /* An object containing optional updates to player, companions, or world state */ }
}`;

// Schema for World Gen Step 1: Foundation (Lore)
const STEP_1_SCHEMA_DESC = `{
  "lore": [ { "title": "string", "description": "string", "type": "'力量体系' | '地点' | '组织' | '历史' | '传说'" } ]
}`;

// Schema for World Gen Step 2: Core Attributes
const STEP_2_SCHEMA_DESC = `{
  "playerStatsSchema": [ { "name": "string", "description": "string" } ]
}`;

// Schema for World Gen Step 3 & 4: Factions, Locations, History (Lore)
const STEP_3_AND_4_SCHEMA_DESC = STEP_1_SCHEMA_DESC; // They share the same output structure

// Schema for World Gen Step 5: Characters (Companions & Lore)
const STEP_5_SCHEMA_DESC = `{
  "companions": [ { "id": "string", "name": "string", "title": "string", "affinity": "number", "backstory": "string", "imagePrompt": "string" } ],
  "lore": [ { "title": "string", "description": "string", "type": "'力量体系' | '地点' | '组织' | '历史' | '传说'" } ]
}`;

// Schema for World Gen Step 6: Main Quests
const STEP_6_SCHEMA_DESC = `{
  "mainQuests": [ { "title": "string", "description": "string" } ]
}`;


// 4. Export the decorated prompts for use in the OpenAI service.

export const MASTER_PROMPT_OPENAI = (setup: GameState['setup']) => createOpenAIPrompt(BASE_MASTER_PROMPT(setup), MASTER_PROMPT_SCHEMA_DESC);
export const STEP_1_PROMPT_OPENAI = (setup: GameSetupOptions) => createOpenAIPrompt(BASE_STEP_1_PROMPT(setup), STEP_1_SCHEMA_DESC);
export const STEP_2_PROMPT_OPENAI = (setup: GameSetupOptions) => createOpenAIPrompt(BASE_STEP_2_PROMPT(setup), STEP_2_SCHEMA_DESC);
export const STEP_3_PROMPT_OPENAI = (setup: GameSetupOptions) => createOpenAIPrompt(BASE_STEP_3_PROMPT(setup), STEP_1_SCHEMA_DESC);
export const STEP_4_PROMPT_OPENAI = (setup: GameSetupOptions) => createOpenAIPrompt(BASE_STEP_4_PROMPT(setup), STEP_1_SCHEMA_DESC);
export const STEP_5_PROMPT_OPENAI = (setup: GameSetupOptions) => createOpenAIPrompt(BASE_STEP_5_PROMPT(setup), STEP_5_SCHEMA_DESC);
export const STEP_6_PROMPT_OPENAI = (setup: GameSetupOptions) => createOpenAIPrompt(BASE_STEP_6_PROMPT(setup), STEP_6_SCHEMA_DESC);
