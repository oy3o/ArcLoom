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

/**
 * Cleans a JSON string that might be wrapped in a markdown code block.
 * @param rawResponse The raw string response from the AI.
 * @returns A clean string ready for JSON.parse().
 */
export function sanitizeJsonResponse(rawResponse: string): string {
  const trimmed = rawResponse.trim();
  // Regex to find ```json at the start and ``` at the end, with optional newlines
  const regex = /^```json\s*([\s\S]*?)\s*```$/;
  const match = trimmed.match(regex)?.[1];
  
  // If it matches, return the captured group (the actual JSON)
  if (match) {
    return match;
  }

  // Otherwise, return the original trimmed string
  return trimmed;
}

