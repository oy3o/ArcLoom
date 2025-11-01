import React from 'react';

interface ConfirmationDialogProps { title: string; message: string; onConfirmSave: () => void; onConfirmNoSave: () => void; onCancel: () => void; }

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ title, message, onConfirmSave, onConfirmNoSave, onCancel }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#141424] border-2 border-purple-500/30 rounded-lg p-6 max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold text-purple-300 mb-4">{title}</h2>
        <p className="mb-6">{message}</p>
        <div className="flex flex-col space-y-3">
          <button onClick={onConfirmSave} className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg">保存并返回</button>
          <button onClick={onConfirmNoSave} className="w-full px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg">直接返回</button>
          <button onClick={onCancel} className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg">取消</button>
        </div>
      </div>
    </div>
);
