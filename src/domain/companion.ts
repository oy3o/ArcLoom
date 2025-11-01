export interface Companion {
  id: string;
  name: string;
  title: string;
  affinity: number; // 0-100
  backstory: string;
  imageUrl?: string;
  imagePrompt?: string;
}
