import { GameState, INITIAL_GAME_STATE } from '@/domain';
import { LORE_TYPES_ENUM } from '../prompts'

export const ResponseSchema = (playerStatsSchema: GameState['world']['playerStatsSchema']) => {
    const statsProperties = {};
    // 确保 schemaSource 有一个保底值
    const schemaSource = (playerStatsSchema && playerStatsSchema.length > 0)
        ? playerStatsSchema
        : Object.keys(INITIAL_GAME_STATE.player.stats).map(name => ({ name }));

    schemaSource.forEach(stat => {
        statsProperties[stat.name] = { "type": "integer" };
    });

    return {
        "type": "object",
        "properties": {
            "narrativeBlock": {
                "type": "object",
                "properties": {
                    "id": { "type": "string" },
                    "type": { "type": "string" },
                    "text": { "type": "string" },
                    "imagePrompt": { "type": "string" },
                },
                "required": ["id", "type", "text"],
            },
            "choices": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "text": { "type": "string" },
                        "prompt": { "type": "string" },
                    },
                    "required": ["text", "prompt"],
                },
            },
            "gameStateUpdate": {
                "type": "object",
                "properties": {
                    "player": {
                        "type": "object",
                        "properties": {
                            "name": { "type": "string" },
                            "level": { "type": "integer" },
                            "currentPower": {
                                "type": "object",
                                "properties": {
                                    "domain": { "type": "string" },
                                    "sequence": { "type": "integer" },
                                    "name": { "type": "string" },
                                    "description": { "type": "string" },
                                    "abilities": { "type": "array", "items": { "type": "string" } },
                                },
                                "required": ["description"],
                            },
                            "stats": {
                                "type": "object",
                                "properties": statsProperties,
                                "required": Object.keys(statsProperties),
                            },
                            "inventory": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": { "type": "string" },
                                        "name": { "type": "string" },
                                        "description": { "type": "string" },
                                        "type": { "type": "string" },
                                    },
                                    "required": ["id", "name", "description", "type"],
                                },
                            },
                        },
                        "required": ["currentPower"],
                    },
                    "companions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": { "type": "string" },
                                "name": { "type": "string" },
                                "title": { "type": "string" },
                                "affinity": { "type": "integer" },
                                "backstory": { "type": "string" },
                            },
                            "required": ["id"],
                        },
                    },
                    "world": {
                        "type": "object",
                        "properties": {
                            "location": { "type": "string" },
                            "time": { "type": "string" },
                        },
                        "required": ["location", "time"],
                    },
                },
                "required": ["companions", "world"],
            },
        },
        "required": ["narrativeBlock", "choices", "gameStateUpdate"],
    };
};

export const STEP_1_SCHEMA = {
    "type": "object",
    "properties": {
        "lore": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": { "type": "string" },
                    "description": { "type": "string" },
                    "type": { "type": "string", "enum": LORE_TYPES_ENUM },
                },
                "required": ["title", "description", "type"],
            }
        }
    },
    "required": ["lore"],
};

export const STEP_2_SCHEMA = {
    "type": "object",
    "properties": {
        "playerStatsSchema": {
            "type": "array",
            "description": "定义此世界观下的核心玩家属性",
            "items": {
                "type": "object",
                "properties": {
                    "name": { "type": "string", "description": "属性的名称, e.g., '根骨' or '理智'." },
                    "description": { "type": "string", "description": "该属性作用的简短描述。" },
                },
                "required": ["name", "description"],
            }
        }
    },
    "required": ["playerStatsSchema"],
};

export const STEP_3_SCHEMA = STEP_1_SCHEMA;

export const STEP_4_SCHEMA = STEP_1_SCHEMA;

export const STEP_5_SCHEMA = {
    "type": "object",
    "properties": {
        "companions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": { "type": "string" },
                    "name": { "type": "string" },
                    "title": { "type": "string" },
                    "affinity": { "type": "integer" },
                    "backstory": { "type": "string" },
                    "imagePrompt": { "type": "string", "description": "为该角色生成一张高质量'写实感动漫风格, 电影级光照'的肖像画的详细提示。" },
                },
                "required": ["id", "name", "title", "affinity", "backstory", "imagePrompt"],
            }
        },
        "lore": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": { "type": "string" },
                    "description": { "type": "string" },
                    "type": { "type": "string", "enum": LORE_TYPES_ENUM },
                },
                "required": ["title", "description", "type"],
            }
        }
    },
    "required": ["companions", "lore"],
};

export const STEP_6_SCHEMA = {
    "type": "object",
    "properties": {
        "mainQuests": {
            "type": "array",
            "description": "游戏的核心主线任务。",
            "items": {
                "type": "object",
                "properties": {
                    "title": { "type": "string" },
                    "description": { "type": "string" },
                },
                "required": ["title", "description"],
            }
        }
    },
    "required": ["mainQuests"],
};
