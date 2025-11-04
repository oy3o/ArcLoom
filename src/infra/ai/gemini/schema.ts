
import { GameState, INITIAL_GAME_STATE } from '@/domain';
import { LORE_TYPES_ENUM } from '../prompts'
import { Type } from '@google/genai';

export const ResponseSchema = (playerStatsSchema: GameState['world']['playerStatsSchema']) => {
    const statsProperties: Record<string, { type: Type.INTEGER }> = {};
    const schemaSource = (playerStatsSchema && playerStatsSchema.length > 0)
        ? playerStatsSchema
        : Object.keys(INITIAL_GAME_STATE.player.stats).map(name => ({ name }));

    schemaSource.forEach(stat => {
        statsProperties[stat.name] = { type: Type.INTEGER };
    });

    return {
        type: Type.OBJECT,
        properties: {
            narrativeBlock: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    text: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING },
                },
                required: ["id", "type", "text"],
            },
            choices: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        prompt: { type: Type.STRING },
                    },
                    required: ["text", "prompt"],
                },
            },
            gameStateUpdate: {
                type: Type.OBJECT,
                properties: {
                    player: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            level: { type: Type.INTEGER },
                            currentPower: {
                                type: Type.OBJECT,
                                properties: {
                                    domain: { type: Type.STRING },
                                    sequence: { type: Type.INTEGER },
                                    name: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    abilities: { type: Type.ARRAY, items: { type: Type.STRING } },
                                },
                            },
                            stats: { type: Type.OBJECT, properties: statsProperties },
                            inventory: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        type: { type: Type.STRING },
                                    },
                                },
                            },
                        },
                    },
                    companions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                name: { type: Type.STRING },
                                title: { type: Type.STRING },
                                affinity: { type: Type.INTEGER },
                                backstory: { type: Type.STRING },
                            },
                            required: ["id"],
                        },
                    },
                    world: {
                        type: Type.OBJECT,
                        properties: {
                            location: { type: Type.STRING },
                            time: { type: Type.STRING },
                        },
                    },
                },
            },
        },
        required: ["narrativeBlock", "choices", "gameStateUpdate"],
    };
};

export const STEP_1_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        lore: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: LORE_TYPES_ENUM },
                },
                required: ["title", "description", "type"],
            }
        }
    },
    required: ["lore"],
};

export const STEP_2_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        playerStatsSchema: {
            type: Type.ARRAY,
            description: "定义此世界观下的核心玩家属性",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "属性的名称, e.g., '根骨' or '理智'." },
                    description: { type: Type.STRING, description: "该属性作用的简短描述。" },
                },
                required: ["name", "description"],
            }
        }
    },
    required: ["playerStatsSchema"],
};

export const STEP_3_SCHEMA = STEP_1_SCHEMA;

export const STEP_4_SCHEMA = STEP_1_SCHEMA;

export const STEP_5_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        companions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    title: { type: Type.STRING },
                    affinity: { type: Type.INTEGER },
                    backstory: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING, description: "为该角色生成一张高质量'写实感动漫风格, 电影级光照'的肖像画的详细提示。" },
                },
                required: ["id", "name", "title", "affinity", "backstory", "imagePrompt"],
            }
        },
        lore: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: LORE_TYPES_ENUM },
                },
                required: ["title", "description", "type"],
            }
        }
    },
    required: ["companions", "lore"],
};

export const STEP_6_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        mainQuests: {
            type: Type.ARRAY,
            description: "游戏的核心主线任务。",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                },
                required: ["title", "description"],
            }
        }
    },
    required: ["mainQuests"],
};
