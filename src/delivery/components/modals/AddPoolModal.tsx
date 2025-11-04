import React, { useState, useMemo } from 'react';
import { BackendConfig, BackendPoolConfig, GenerationType, BackendProvider } from '@/domain';

interface AddPoolModalProps {
  initialData?: BackendPoolConfig;
  isEditMode: boolean;
  onSave: (config: BackendPoolConfig) => void;
  onClose: () => void;
  singleKeys: BackendConfig[];
}

export const AddPoolModal: React.FC<AddPoolModalProps> = ({ initialData, isEditMode, onSave, onClose, singleKeys }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [generationType, setGenerationType] = useState<GenerationType>(initialData?.generationType || 'text');
  const [provider, setProvider] = useState<BackendProvider>(initialData?.provider || 'google');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialData?.backendIds || []));
  const [error, setError] = useState('');

  const compatibleKeys = useMemo(() => {
    return singleKeys.filter(key => key.generationType === generationType && key.provider === provider);
  }, [singleKeys, generationType, provider]);

  const handleToggleKey = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Pool name cannot be empty.');
      return;
    }
    if (selectedIds.size === 0) {
        setError('A pool must contain at least one key.');
        return;
    }
    const id = (isEditMode && initialData) ? initialData.id : `pool-${Date.now()}`;
    const newPool: BackendPoolConfig = {
      configType: 'pool',
      id,
      name,
      provider,
      generationType,
      backendIds: Array.from(selectedIds),
    };
    onSave(newPool);
    onClose();
  };

  const modalTitle = isEditMode ? "Edit Key Pool" : "Create New Key Pool";
  const saveButtonText = isEditMode ? "Update Pool" : "Save Pool";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-[#141424] border border-cyan-500/30 rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold text-cyan-300 mb-4">{modalTitle}</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Pool Name (e.g., Rotational Narrators)" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-gray-800 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <select value={provider} onChange={e => setProvider(e.target.value as BackendProvider)} className="w-full p-2 bg-gray-800 rounded">
              <option value="google">Google</option>
              <option value="openai">OpenAI</option>
            </select>
            <select value={generationType} onChange={e => setGenerationType(e.target.value as GenerationType)} className="w-full p-2 bg-gray-800 rounded">
              <option value="text">文本叙述者</option>
              <option value="image">图片回想者</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <h3 className="font-semibold text-gray-300 mb-2">Select Compatible Keys</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-black/30 rounded">
                {compatibleKeys.length === 0 && <p className="text-gray-500 text-center py-4">No compatible single keys found for the selected type and provider.</p>}
                {compatibleKeys.map(key => (
                    <div key={key.id} className="flex items-center bg-gray-800/50 p-2 rounded">
                        <input type="checkbox" id={`key-${key.id}`} checked={selectedIds.has(key.id)} onChange={() => handleToggleKey(key.id)} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500" />
                        <label htmlFor={`key-${key.id}`} className="ml-3 text-sm font-medium text-gray-300">{key.name}</label>
                    </div>
                ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || selectedIds.size === 0} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded disabled:opacity-50">{saveButtonText}</button>
        </div>
      </div>
    </div>
  );
};
