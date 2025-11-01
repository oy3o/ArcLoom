import { BackendConfig } from '@/domain';

export interface BackendRepository {
  GetAll(): Promise<BackendConfig[]>;
  Add(config: BackendConfig): Promise<void>;
  Remove(id: string): Promise<void>;
  Update(config: BackendConfig): Promise<void>;
  GetById(id: string): Promise<BackendConfig | null>;
}
