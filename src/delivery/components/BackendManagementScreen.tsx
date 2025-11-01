import React, { useState, useEffect, useCallback } from 'react';
import { BackendConfig } from '@/domain';
import { useBackendRepository } from '../context';
import { AddGoogleModal } from './modals/AddGoogleModal';
import { AddOpenAIModal } from './modals/AddOpenAIModal';
import { Edit, Copy, Trash2, PlusCircle } from 'lucide-react';

interface BackendManagementScreenProps {
  onBack: () => void;
}

// State to manage which modal is open and its mode
type ModalState = {
  type: 'google' | 'openai' | null;
  mode: 'add' | 'edit' | 'duplicate';
  data?: BackendConfig;
}

export const BackendManagementScreen: React.FC<BackendManagementScreenProps> = ({ onBack }) => {
  const backendRepository = useBackendRepository();
  const [backends, setBackends] = useState<BackendConfig[]>([]);
  const [modalState, setModalState] = useState<ModalState>({ type: null, mode: 'add' });

  const fetchBackends = useCallback(async () => {
    setBackends(await backendRepository.GetAll());
  }, [backendRepository]);

  useEffect(() => {
    fetchBackends();
  }, [fetchBackends]);

  const handleOpenModal = (type: 'google' | 'openai', mode: 'add' | 'edit' | 'duplicate', data?: BackendConfig) => {
    setModalState({ type, mode, data });
  };

  const handleCloseModal = () => {
    setModalState({ type: null, mode: 'add' });
  };

  const handleSaveBackend = async (config: BackendConfig) => {
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

    if (modalState.type === 'google') return <AddGoogleModal {...props} />;
    if (modalState.type === 'openai') return <AddOpenAIModal {...props} />;
    return null;
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-b from-[#0f0f1b] to-[#1a1a2e]">
      {getModal()}
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-gray-700 rounded">&larr; Back to Title</button>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-purple-300">Manage AI Backends</h1>
          <div className="flex gap-2">
            <button onClick={() => handleOpenModal('google', 'add')} className="p-2 bg-blue-600 rounded flex items-center gap-2"><PlusCircle size={20}/> Google</button>
            <button onClick={() => handleOpenModal('openai', 'add')} className="p-2 bg-green-600 rounded flex items-center gap-2"><PlusCircle size={20}/> OpenAI</button>
          </div>
        </div>

        <div className="space-y-4">
          {backends.length === 0 && <p className="text-center text-gray-400 py-8">No backends configured. Add one to get started.</p>}
          {backends.map(config => (
            <div key={config.id} className="bg-black/30 p-4 rounded-lg flex justify-between items-center transition-all hover:bg-black/50">
              <div>
                <p className="font-bold text-lg">{config.name}</p>
                <p className="text-sm text-gray-400">Provider: {config.provider} | Type: {config.generationType}</p>
                {config.modelId && <p className="text-xs text-gray-500 font-mono">{config.modelId}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(config.provider, 'edit', config)} title="Edit" className="p-2 hover:bg-gray-600 rounded"><Edit size={18}/></button>
                <button onClick={() => handleOpenModal(config.provider, 'duplicate', config)} title="Duplicate" className="p-2 hover:bg-gray-600 rounded"><Copy size={18}/></button>
                <button onClick={() => handleDeleteBackend(config.id)} title="Delete" className="p-2 text-red-400 hover:bg-red-900/50 rounded"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
