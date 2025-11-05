export interface WorldLoreItem {
  title: string;
  description: string;
  type: 'Power' | 'Location' | 'Organization' | 'History' | 'Legend';
}

export interface MainQuest {
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'completed';
}
