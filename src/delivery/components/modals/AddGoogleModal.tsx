import React, { useState, useEffect } from 'react';
import { BackendConfig, AvailableModel, GenerationType } from '@/domain';
import { listAvailableTextModels, listAvailableImageModels } from '@/infra/ai/gemini/models';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface AddGoogleModalProps {
  initialData?: BackendConfig;
  isEditMode: boolean;
  onSave: (config: BackendConfig) => void;
  onClose: () => void;
}

export const AddGoogleModal: React.FC<AddGoogleModalProps> = ({ initialData, isEditMode, onSave, onClose }) => {
  // Initialize state from initialData if provided
  const [apiKey, setApiKey] = useState(initialData?.apiKey || '');
  const [name, setName] = useState(initialData?.name || '');
  const [generationType, setGenerationType] = useState<GenerationType>(initialData?.generationType || 'text');
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState(initialData?.modelId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // If we are in edit mode with initial data, we can assume it's already verified.
  const [isVerified, setIsVerified] = useState(!!initialData);

  // If initialData exists, fetch models on mount
  useEffect(() => {
    if (initialData?.apiKey) {
      handleVerifyAndFetch(true); // silent verify on load
    }
  }, [initialData]);

  const handleVerifyAndFetch = async (isSilent = false) => {
    if (!apiKey.trim()) {
      setError('API Key cannot be empty.');
      return;
    }
    if (!isSilent) setIsLoading(true);
    setError('');

    try {
      const modelFetcher = generationType === 'text' ? listAvailableTextModels : listAvailableImageModels;
      const models = await modelFetcher(apiKey);
      setAvailableModels(models);
      if (models.length > 0) {
        // If we are editing and the old model still exists, keep it selected
        if (initialData?.modelId && models.some(m => m.id === initialData.modelId)) {
          setSelectedModelId(initialData.modelId);
        } else {
          setSelectedModelId(models[0].id); // Otherwise, default to the first
        }
        setIsVerified(true);
      } else {
        setError('No compatible models found for this key and generation type.');
        setIsVerified(false);
      }
    } catch (e) {
      setError((e as Error).message);
      setIsVerified(false);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !selectedModelId) {
      setError('Please provide a name and select a model.');
      return;
    }
    // If we are editing, use the existing ID. Otherwise, create a new one.
    const id = isEditMode && initialData ? initialData.id : `google-${Date.now()}`;
    const newConfig: BackendConfig = {
      id,
      name,
      provider: 'google',
      apiKey,
      generationType,
      modelId: selectedModelId,
    };
    onSave(newConfig);
    onClose();
  };

  const modalTitle = isEditMode ? "Edit Google Backend" : "Add Google Backend";
  const saveButtonText = isEditMode ? "Update" : "Save";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#141424] border border-purple-500/30 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-purple-300 mb-4">{modalTitle}</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Custom Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-gray-800 rounded" />
          <input type="password" placeholder="Gemini API Key" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full p-2 bg-gray-800 rounded" />
          <select value={generationType} onChange={e => setGenerationType(e.target.value as GenerationType)} className="w-full p-2 bg-gray-800 rounded">
            <option value="text">文本叙述者</option>
            <option value="image">图片回想者</option>
          </select>

          <button onClick={handleVerifyAndFetch} disabled={isLoading} className="w-full p-2 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50">
            {isLoading ? <LoadingSpinner /> : 'Verify & Fetch Models'}
          </button>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {isVerified && (
            <div className="pt-4 border-t border-gray-700">
              <p className="text-green-400 text-sm mb-2 text-center">目标成功连接以太之网</p>
              <label className="block text-sm font-semibold text-gray-300 mb-1">选择推理者</label>
              <select value={selectedModelId} onChange={e => setSelectedModelId(e.target.value)} className="w-full p-2 bg-gray-800 rounded">
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>{model.displayName}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded">Cancel</button>
          <button onClick={handleSave} disabled={!isVerified} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded disabled:opacity-50">{saveButtonText}</button>
        </div>
      </div>
    </div>
  );
};
