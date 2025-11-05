/**
 * Triggers a browser download for a given JSON object.
 * @param data The JavaScript object to export.
 * @param filename The desired name for the downloaded file.
 */
export const exportJson = (data: object, filename: string): void => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export JSON:", error);
    alert("未知干扰阻止您留下时空标记");
  }
};

/**
 * Opens a file dialog for the user to select a JSON file and returns its parsed content.
 * @returns A promise that resolves with the parsed JSON object of type T.
 */
export const importJson = <T>(): Promise<T> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json, .json';

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) {
        reject(new Error("空"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = JSON.parse(text) as T;
          resolve(data);
        } catch (error) {
          console.error("Failed to parse JSON file:", error);
          reject(new Error("世界已崩坏"));
        }
      };

      reader.onerror = (error) => {
        console.error("File reading error:", error);
        reject(new Error("未知干扰阻止了您的观察"));
      };

      reader.readAsText(file);
    };
    
    input.click();
  });
};

// 定义可以被 JSON 序列化的值类型
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

/**
 * `repairJson` 函数的选项接口。
 */
interface RepairJsonOptions {
    /** 是否在控制台打印修复过程的日志 */
    logging?: boolean;
    /** 是否尝试从输入文本中提取 JSON 部分 (默认为 true) */
    extractJson?: boolean;
    /**
     * 安全模式：
     * - true: 不会尝试过于激进的修复（如平衡括号），并在最终解析失败时抛出一个通用错误。
     * - false: 尝试所有修复，并在失败时抛出包含输入预览的详细错误。
     */
    safeMode?: boolean;
    /**
     * 返回值类型选项：
     * - true: 返回一个 JavaScript 对象。
     * - false (默认): 返回一个格式化的 JSON 字符串。
     */
    returnObject?: boolean;
    /** 是否将非 ASCII 字符编码为 \uXXXX 格式 */
    encodeAscii?: boolean;
}


/**
 * 从文本中提取出第一个完整的 JSON 对象或数组。
 * 这个函数通过匹配括号的平衡来确定 JSON 的结束位置，从而能处理 {...}undefined 或 {...}{...} 这种尾随无效字符的情况。
 *
 * @param input - 可能包含 JSON 的输入字符串。
 * @returns 提取出的 JSON 字符串。
 */
function extractJsonFromText(input: string): string {
    // 清理输入字符串，移除常见的代码块标记
    let cleaned = input.trim()
        .replace(/^```json\s*/i, '')
        .replace(/```$/, '')
        .trim();

    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');

    // 确定 JSON 的起始位置，'{' 或 '['，取先出现的那个
    const start = firstBrace >= 0 && (firstBrace < firstBracket || firstBracket === -1)
        ? firstBrace
        : firstBracket;

    // 如果找不到起始括号，直接返回原始输入
    if (start === -1) {
        return input;
    }

    // 使用栈来追踪括号的匹配情况
    const stack: ('{' | '[')[] = [];
    let end = -1; // 初始化结束位置为 -1

    for (let i = start; i < cleaned.length; i++) {
        const char = cleaned[i];

        if (char === '{' || char === '[') {
            stack.push(char);
        } else if (char === '}' || char === ']') {
            // 如果栈为空或括号类型不匹配，则认为 JSON 结构已损坏，停止扫描
            const last = stack.pop();
            if (!last || (char === '}' && last !== '{') || (char === ']' && last !== '[')) {
                break;
            }

            // 当栈为空时，意味着第一个完整的 JSON 对象/数组已找到
            if (stack.length === 0) {
                end = i + 1;
                break; // 找到后立即退出，忽略尾随的任何字符
            }
        }
    }

    // 如果找到了合法的结束位置，则截取字符串
    if (end !== -1) {
        return cleaned.substring(start, end);
    }
    
    // 如果没有找到平衡的结束括号，则从起点截取到字符串末尾（尽力而为）
    return cleaned.substring(start);
}


/**
 * 修复单行中类似 `{foo: bar}` 这种未加引号的字符串值。
 * @param json - JSON 字符串。
 * @returns 修复后的 JSON 字符串。
 */
function fixBrokenStringValues(json: string): string {
    return json
        .split('\n')
        .map((line) => {
            const start = line.indexOf('{');
            const end = line.lastIndexOf('}');
            // 忽略不符合 `{key: value}` 格式的行
            if (start === -1 || end === -1 || start >= end || line.includes(',')) return line;

            const content = line.slice(start + 1, end);
            const colon = content.indexOf(':');
            if (colon === -1) return line;

            const key = content.slice(0, colon).trim();
            let value = content.slice(colon + 1).trim();

            // 如果值中包含引号，则确保它被正确包裹
            if (value.includes('"')) {
                if (!value.startsWith('"')) value = '"' + value;
                if (!value.endsWith('"')) value = value + '"';
                
                // 转义内部未被转义的引号
                value = value.slice(1, -1).replace(/(?<!\\)"/g, '\\"');
                value = '"' + value + '"';
            }
            return `{${key}: ${value}}`;
        })
        .join('\n');
}

/**
 * 转义字符串值中未被保护的双引号。
 * 例如：`{"key": "this is a "quote""}` 会被修复为 `{"key": "this is a \"quote\""}`
 * @param json - JSON 字符串。
 * @returns 修复后的 JSON 字符串。
 */
function escapeInnerQuotesInStrings(json: string): string {
    return json.replace(/"([^"\n\\]*?)"/g, (match, content) => {
        // 如果内容中包含未转义的引号，则进行修复
        if (/[^\\]"/.test(content)) {
            const safe = content.replace(/([^\\])"/g, '$1\\"');
            return `"${safe}"`;
        }
        return match;
    });
}

/**
 * 天真地平衡大括号和方括号：
 * - 如果出现一个没有对应开启括号的闭合括号，则移除它。
 * - 如果扫描完后仍有未闭合的括号，则在末尾补全。
 * @param input - JSON 字符串。
 * @returns 修复后的 JSON 字符串。
 */
function balanceJsonBrackets(input: string): string {
    let curlyCount = 0; // 记录 { }
    let squareCount = 0; // 记录 [ ]
    const chars = [...input];

    for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (c === '{') {
            curlyCount++;
        } else if (c === '}') {
            if (curlyCount > 0) curlyCount--;
            else chars[i] = ''; // 移除多余的 '}'
        } else if (c === '[') {
            squareCount++;
        } else if (c === ']') {
            if (squareCount > 0) squareCount--;
            else chars[i] = ''; // 移除多余的 ']'
        }
    }

    let result = chars.join('');
    // 在末尾补全未闭合的括号
    if (curlyCount > 0) {
        result += '}'.repeat(curlyCount);
    }
    if (squareCount > 0) {
        result += ']'.repeat(squareCount);
    }
    return result;
}

/**
 * 将字符串值中的真实换行符 (\n)、回车符 (\r)、制表符 (\t) 替换为其转义形式 (\\n, \\r, \\t)。
 * @param json - JSON 字符串。
 * @returns 修复后的 JSON 字符串。
 */
function escapeControlCharsInsideStrings(json: string): string {
    let inString = false;
    let escaped = false;
    const chars = [...json];

    for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (c === '"' && !escaped) {
            inString = !inString; // 进入或退出字符串
        } else if (c === '\\' && !escaped) {
            escaped = true; // 下一个字符是转义字符
        } else {
            if (inString) {
                if (c === '\n') chars[i] = '\\n';
                else if (c === '\r') chars[i] = '\\r';
                else if (c === '\t') chars[i] = '\\t';
            }
            escaped = false;
        }
    }
    return chars.join('');
}


/**
 * 修复可能不规范的 JSON 字符串，通过一系列转换来使其变得合法。
 */
// 函数重载：当 options.returnObject 为 true 时，返回 JavaScript 对象
export function repairJson(input: string, options: RepairJsonOptions & { returnObject: true }): JsonValue;
// 函数重载：当 options.returnObject 为 false 或未定义时，返回 JSON 字符串
export function repairJson(input: string, options?: Omit<RepairJsonOptions, 'returnObject'> & { returnObject?: false }): string;
// 主函数实现
export function repairJson(input: string, options: RepairJsonOptions = {}): string | JsonValue {
    try {
        // 1. 首先尝试直接解析，如果成功，直接返回结果
        const parsed = JSON.parse(input);
        if (!options.returnObject) {
            let json = JSON.stringify(parsed);
            if (options.encodeAscii) {
                json = json.replace(/[^\x00-\x7F]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
            }
            return json;
        }
        return parsed;
    } catch (e: unknown) {
        if (options.logging) {
            console.warn('JSON.parse 直接解析失败:', e);
            console.warn('正在尝试修复 JSON...');
        }
        let fixed = input;
        
        // --- 开始修复流程 ---

        // 1. 从文本中提取 JSON 部分 (默认开启)
        if (options.extractJson !== false) {
            fixed = extractJsonFromText(fixed);
            if (options.logging) console.log('1. 提取 JSON 块:', fixed);
        }

        // 2. 移除注释
        fixed = fixed.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
        if (options.logging) console.log('2. 移除注释:', fixed);

        // 3. 移除末尾多余的逗号
        fixed = fixed.replace(/,\s*([\]}])/g, '$1');
        if (options.logging) console.log('3. 移除末尾逗号:', fixed);

        // 4. 为未加引号的键添加双引号
        fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
        if (options.logging) console.log('4. 为键添加引号:', fixed);

        // 5. 将所有单引号转换为双引号
        fixed = fixed.replace(/'/g, '"');
        if (options.logging) console.log('5. 单引号转为双引号:', fixed);

        // 6. 替换 JS 中的无效字面量 (NaN, undefined, Infinity) 为 null
        fixed = fixed.replace(/\b(NaN|undefined|Infinity|-Infinity)\b/g, 'null');
        if (options.logging) console.log('6. 替换无效字面量:', fixed);
        
        // 7. 替换大写的 True/False/Null
        fixed = fixed.replace(/\bTrue\b/gi, 'true')
                     .replace(/\bFalse\b/gi, 'false')
                     .replace(/\bNull\b/gi, 'null');
        if (options.logging) console.log('7. 替换大写布尔/Null值:', fixed);

        // 8. 为未加引号的字符串值添加引号 (但不包括 true/false/null)
        fixed = fixed.replace(/:\s*(?!true\b|false\b|null\b)([a-zA-Z_][a-zA-Z0-9_]*)\s*([\}\],])/g, ': "$1"$2');
        if (options.logging) console.log('8. 为值添加引号:', fixed);

        // 9. 修复类似 `: John"` 这样缺少左引号的值
        fixed = fixed.replace(/:\s*([a-zA-Z0-9_]+)"([\}\],])/g, ': "$1"$2');
        if (options.logging) console.log('9. 修复值缺少左引号:', fixed);
        
        // 10. 修复单行破损的字符串值
        fixed = fixBrokenStringValues(fixed);
        if (options.logging) console.log('10. 修复单行破损字符串:', fixed);
        
        // 11. 转义字符串值内部未转义的双引号
        fixed = escapeInnerQuotesInStrings(fixed);
        if (options.logging) console.log('11. 转义内部双引号:', fixed);
        
        // 12. 平衡括号 (在非安全模式下)
        if (!options.safeMode) {
            fixed = balanceJsonBrackets(fixed);
            if (options.logging) console.log('12. 平衡括号:', fixed);
        }

        // 13. 转义字符串中的控制字符 (如真实换行符)
        fixed = escapeControlCharsInsideStrings(fixed);
        if (options.logging) console.log('13. 转义控制字符:', fixed);

        // --- 最后一次尝试解析 ---
        try {
            const repaired = JSON.parse(fixed);
            if (!options.returnObject) {
                let json = JSON.stringify(repaired);
                // 可选：将非 ASCII 字符编码
                if (options.encodeAscii) {
                    json = json.replace(/[^\x00-\x7F]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
                }
                return json;
            }
            return repaired;
        } catch (err: unknown) {
            if (options.logging) {
                console.warn('[json-repair] 修复后解析仍然失败:', err);
                console.warn('最终尝试的字符串:', fixed);
            }
            const preview = input.slice(0, 100).replace(/\n/g, ' ').trim();
            const baseMessage = `[json-repair] 修复 JSON 失败。`;
            const details = err instanceof Error ? err.message : '未知的解析错误';
            const combined = `${baseMessage} ${details} 输入预览: "${preview}..."`;
            
            // 在安全模式下抛出通用错误，否则抛出详细错误
            if (options.safeMode) {
                throw new Error(baseMessage);
            } else {
                throw new Error(combined);
            }
        }
    }
}
