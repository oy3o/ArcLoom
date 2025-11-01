import React, { createContext, useContext, ReactNode, useState } from 'react';
import { NarrativeService, ImageService } from '@/app';

// The context will now hold both the service and a function to update it
interface NarrativeServiceContext {
  service: NarrativeService | null;
  setService: (service: NarrativeService) => void;
}

const NarrativeServiceContext = createContext<NarrativeServiceContext | null>(null);

export const useNarrativeService = (): NarrativeServiceContext => {
  const context = useContext(NarrativeServiceContext);
  if (!context) throw new Error('useNarrativeService must be used within a NarrativeServiceProvider');
  return context;
};

// Provider no longer takes a service prop, it manages it internally
export const NarrativeServiceProvider = ({ children }: { children: ReactNode }) => {
  const [service, setService] = useState<NarrativeService | null>(null);

  return (
    <NarrativeServiceContext.Provider value={{ service, setService }}>
      {children}
    </NarrativeServiceContext.Provider>
  );
};

// The context will now hold both the service and a function to update it
interface ImageServiceContext {
  service: ImageService | null;
  setService: (service: ImageService) => void;
}

const ImageServiceContext = createContext<ImageServiceContext | null>(null);

export const useImageService = (): ImageServiceContext => {
  const context = useContext(ImageServiceContext);
  if (!context) throw new Error('useImageService must be used within a ImageServiceProvider');
  return context;
};

// Provider no longer takes a service prop, it manages it internally
export const ImageServiceProvider = ({ children }: { children: ReactNode }) => {
  const [service, setService] = useState<ImageService | null>(null);

  return (
    <ImageServiceContext.Provider value={{ service, setService }}>
      {children}
    </ImageServiceContext.Provider>
  );
};
