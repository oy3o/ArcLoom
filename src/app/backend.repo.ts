import { AnyBackendConfig } from '@/domain';

export interface BackendRepository {
  GetAll(): Promise<AnyBackendConfig[]>;
  Add(config: AnyBackendConfig): Promise<void>;
  Remove(id: string): Promise<void>;
  Update(config: AnyBackendConfig): Promise<void>;
  GetById(id: string): Promise<AnyBackendConfig | null>;
}
