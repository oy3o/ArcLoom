export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'consumable' | 'key_item' | 'artifact';
}
