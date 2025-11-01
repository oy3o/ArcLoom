import React from 'react';
import ReactDOM from 'react-dom/client';

import { GameStateRepository, BackendRepository } from '@/app';
import { BackendConfig } from '@/domain';
import { LocalStorageRepository } from '@/infra/storage/local-storage';
import { listAvailableOpenAITextModels } from '@/infra/ai/openai/models';

import {
  GameStateRepositoryProvider,
  BackendRepositoryProvider,
  NarrativeServiceProvider,
  ImageServiceProvider,
} from '@/delivery/context';
import App from '@/delivery/App';

const repo: GameStateRepository & BackendRepository = new LocalStorageRepository();
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

repo.GetAll().then(async backends => {
  if (!backends?.length) {
    const config: BackendConfig = {
      id: "test",
      name: "LLM7 Free API",
      provider: "openai",
      apiKey: "DifPewHlfvwWQ37LB4DtTKbuqrtToE8OutWFyr2X4lxQDpN3LiqUaEDSWbyoYxP8G0KjlnC49vhAPpC2fknzHeW5CGoNGoUy2TyMx4ZiJY0bPgllKiqhVdgf+sGEQqX5cN1B",
      generationType: "text",
      endpoint: "https://api.llm7.io/v1",
    }
    const models = await listAvailableOpenAITextModels(config.apiKey, config.endpoint);
    if (models?.length) {
      config.modelId = models[0].id
    }
    repo.Add(config)
  }
})

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BackendRepositoryProvider repository={repo}>
      <GameStateRepositoryProvider repository={repo}>
        <NarrativeServiceProvider>
          <ImageServiceProvider>
            <App />
          </ImageServiceProvider>
        </NarrativeServiceProvider>
      </GameStateRepositoryProvider>
    </BackendRepositoryProvider>
  </React.StrictMode>
);
