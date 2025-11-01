export interface NarrativeBlock {
  id:string;
  type: 'story' | 'action' | 'system';
  text: string;
  imageUrl?: string;
  imagePrompt?: string;
}

export interface PlayerChoice {
  text: string;
  prompt: string;
}
