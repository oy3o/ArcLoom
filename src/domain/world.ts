export interface WorldLoreItem {
  title: string;
  description: string;
  type: '力量体系' | '地点' | '组织' | '历史' | '传说';
}

export interface MainQuest {
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'completed';
}
