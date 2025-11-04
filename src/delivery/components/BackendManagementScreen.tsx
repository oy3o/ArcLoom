import React, { useState, useEffect, useCallback } from 'react';
import { AnyBackendConfig, BackendConfig } from '@/domain';
import { useBackendRepository } from '../context';
import { AddGoogleModal } from './modals/AddGoogleModal';
import { AddOpenAIModal } from './modals/AddOpenAIModal';
import { AddPoolModal } from './modals/AddPoolModal';
import { Edit, Copy, Trash2, PlusCircle } from 'lucide-react';

interface BackendManagementScreenProps {
  onBack: () => void;
}

// State to manage which modal is open and its mode
type ModalState = {
  type: 'google' | 'openai' | 'pool' | null;
  mode: 'add' | 'edit' | 'duplicate';
  data?: AnyBackendConfig;
}

export const BackendManagementScreen: React.FC<BackendManagementScreenProps> = ({ onBack }) => {
  const backendRepository = useBackendRepository();
  const [backends, setBackends] = useState<AnyBackendConfig[]>([]);
  const [modalState, setModalState] = useState<ModalState>({ type: null, mode: 'add' });

  const fetchBackends = useCallback(async () => {
    setBackends(await backendRepository.GetAll());
  }, [backendRepository]);

  useEffect(() => {
    fetchBackends();
  }, [fetchBackends]);

  const handleOpenModal = (type: ModalState['type'], mode: 'add' | 'edit' | 'duplicate', data?: AnyBackendConfig) => {
    setModalState({ type, mode, data });
  };

  const handleCloseModal = () => {
    setModalState({ type: null, mode: 'add' });
  };

  const handleSaveBackend = async (config: AnyBackendConfig) => {
    if (modalState.mode === 'edit') {
      await backendRepository.Update(config);
    } else { // 'add' or 'duplicate'
      await backendRepository.Add(config);
    }
    fetchBackends(); // Refresh list
  };

  const handleDeleteBackend = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this backend configuration? This action cannot be undone.")) {
      await backendRepository.Remove(id);
      fetchBackends(); // Refresh list
    }
  };

  const getModal = () => {
    if (!modalState.type) return null;

    const initialDataForDuplicate = modalState.mode === 'duplicate' && modalState.data
      ? { ...modalState.data, name: `${modalState.data.name} (Copy)` }
      : modalState.data;

    const props = {
      initialData: modalState.mode !== 'add' ? initialDataForDuplicate : undefined,
      isEditMode: modalState.mode === 'edit',
      onSave: handleSaveBackend,
      onClose: handleCloseModal,
    };

    if (modalState.type === 'google') return <AddGoogleModal {...props as any} />;
    if (modalState.type === 'openai') return <AddOpenAIModal {...props as any} />;
    if (modalState.type === 'pool') {
      const allSingleKeys = backends.filter(b => b.configType === 'single') as BackendConfig[];
      return <AddPoolModal {...props} singleKeys={allSingleKeys} />;
    }
    return null;
  };

  const singleKeys = backends.filter(b => b.configType === 'single');
  const pools = backends.filter(b => b.configType === 'pool');

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-b from-[#0f0f1b] to-[#1a1a2e]">
      {getModal()}
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-gray-700 rounded">&larr; Back to Title</button>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-300">Manage Backends</h1>
          <p className="text-gray-400">密钥池通过轮换多个独立密钥来避免速率限制</p>
        </div>

        {/* Pools Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-cyan-300">密钥池</h2>
          <button onClick={() => handleOpenModal('pool', 'add')} className="p-2 bg-cyan-600 rounded flex items-center gap-2"><PlusCircle size={20} /> 新建密钥池</button>
        </div>
        <div className="space-y-4 mb-10">
          {pools.length === 0 && <p className="text-center text-gray-500 py-4">No pools configured.</p>}
          {pools.map(config => (
            <div key={config.id} className="bg-black/30 p-4 rounded-lg flex justify-between items-center transition-all hover:bg-black/50 border-l-4 border-cyan-500">
              <div>
                <p className="font-bold text-lg">{config.name}</p>
                <p className="text-sm text-gray-400">Provider: {config.provider} | Type: {config.generationType}</p>
                <p className="text-xs text-gray-500 font-mono">Keys: {config.configType === 'pool' ? config.backendIds.length : 'N/A'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal('pool', 'edit', config)} title="Edit" className="p-2 hover:bg-gray-600 rounded"><Edit size={18} /></button>
                <button onClick={() => handleOpenModal('pool', 'duplicate', config)} title="Duplicate" className="p-2 hover:bg-gray-600 rounded"><Copy size={18} /></button>
                <button onClick={() => handleDeleteBackend(config.id)} title="Delete" className="p-2 text-red-400 hover:bg-red-900/50 rounded"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Single Keys Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-purple-300">独立密钥</h2>
          <div className="flex gap-2">
            <button onClick={() => handleOpenModal('google', 'add')} className="p-2 bg-blue-600 rounded flex items-center gap-2"><PlusCircle size={20} /> Google</button>
            <button onClick={() => handleOpenModal('openai', 'add')} className="p-2 bg-green-600 rounded flex items-center gap-2"><PlusCircle size={20} /> OpenAI</button>
          </div>
        </div>

        <div className="space-y-4">
          {singleKeys.length === 0 && <p className="text-center text-gray-500 py-4">No single keys configured. Add one to get started.</p>}
          {singleKeys.map(config => (
            <div key={config.id} className="bg-black/30 p-4 rounded-lg flex justify-between items-center transition-all hover:bg-black/50 border-l-4 border-purple-500">
              <div>
                <p className="font-bold text-lg">{config.name}</p>
                <p className="text-sm text-gray-400">Provider: {config.provider} | Type: {config.generationType} </p>
                {config.configType === 'single' && config.modelId && <p className="text-xs text-gray-500 font-mono">{config.modelId}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(config.configType === 'single' ? config.provider : 'pool', 'edit', config)} title="Edit" className="p-2 hover:bg-gray-600 rounded"><Edit size={18} /></button>
                <button onClick={() => handleOpenModal(config.configType === 'single' ? config.provider : 'pool', 'duplicate', config)} title="Duplicate" className="p-2 hover:bg-gray-600 rounded"><Copy size={18} /></button>
                <button onClick={() => handleDeleteBackend(config.id)} title="Delete" className="p-2 text-red-400 hover:bg-red-900/50 rounded"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
