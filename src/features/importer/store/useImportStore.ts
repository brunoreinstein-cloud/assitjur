import { create } from 'zustand';
import type { ImportSession, ValidationResult } from '@/lib/importer/types';
import { logger } from '@/lib/logger';
import { ErrorHandler } from '@/lib/error-handling';

export type ImportStep = 'upload' | 'validation' | 'preview' | 'publish';

interface ImportState {
  // Core state
  currentStep: ImportStep;
  session: ImportSession | null;
  file: File | null;
  validationResult: ValidationResult | null;
  
  // Versioning state
  currentVersionId: string | null;
  versionNumber: number | null;
  
  // UI state
  isProcessing: boolean;
  uploadProgress: number;
  error: string | null;
  
  // Actions
  setCurrentStep: (step: ImportStep) => void;
  setSession: (session: ImportSession) => void;
  setFile: (file: File) => void;
  setValidationResult: (result: ValidationResult) => void;
  setIsProcessing: (processing: boolean) => void;
  setUploadProgress: (progress: number | ((prev: number) => number)) => void;
  setError: (error: string | null) => void;
  resetWizard: () => void;
  
  // Version actions
  setCurrentVersion: (versionId: string, number: number) => void;
  createNewVersion: () => Promise<void>;
  publishCurrentVersion: () => Promise<void>;
  
  // Step navigation
  nextStep: () => void;
  previousStep: () => void;
  canProceedToNext: () => boolean;
}

const STEP_ORDER: ImportStep[] = ['upload', 'validation', 'preview', 'publish'];

export const useImportStore = create<ImportState>((set, get) => ({
  // Initial state
  currentStep: 'upload',
  session: null,
  file: null,
  validationResult: null,
  currentVersionId: null,
  versionNumber: null,
  isProcessing: false,
  uploadProgress: 0,
  error: null,
  
  // Actions
  setCurrentStep: (step) => set({ currentStep: step }),
  
  setSession: (session) => set({ session }),
  
  setFile: (file) => set({ file }),
  
  setValidationResult: (result) => set({ validationResult: result }),
  
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  
  setUploadProgress: (progress) => set((state) => ({ 
    uploadProgress: typeof progress === 'function' ? progress(state.uploadProgress) : progress 
  })),
  
  setError: (error) => set({ error }),
  
  resetWizard: () => set({
    currentStep: 'upload',
    session: null,
    file: null,
    validationResult: null,
    currentVersionId: null,
    versionNumber: null,
    isProcessing: false,
    uploadProgress: 0,
    error: null,
  }),
  
  // Version actions
  setCurrentVersion: (versionId, number) => set({ 
    currentVersionId: versionId, 
    versionNumber: number 
  }),
  
  createNewVersion: async () => {
    try {
      set({ isProcessing: true, error: null });
      
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('create-version', {
        body: {}
      });
      
      if (error) throw error;
      
      set({ 
        currentVersionId: data.versionId, 
        versionNumber: data.number,
        isProcessing: false
      });
      
      logger.info('Version created successfully', {
        versionId: data.versionId,
        number: data.number
      }, 'ImportStore');
    } catch (error) {
      const handledError = ErrorHandler.handle(error, 'ImportStore.createNewVersion');
      set({ 
        error: handledError.userMessage || 'Falha ao criar nova versão', 
        isProcessing: false 
      });
      throw handledError;
    }
  },
  
  publishCurrentVersion: async () => {
    const state = get();
    if (!state.currentVersionId) {
      throw new Error('No version to publish');
    }
    
    try {
      set({ isProcessing: true, error: null });
      
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('publish-version', {
        body: { versionId: state.currentVersionId }
      });
      
      if (error) throw error;
      
      logger.info('Version published successfully', {
        versionId: state.currentVersionId,
        number: data.number,
        publishedAt: data.publishedAt
      }, 'ImportStore');
      
      set({ isProcessing: false });
      
      return data;
    } catch (error) {
      const handledError = ErrorHandler.handle(error, 'ImportStore.publishCurrentVersion');
      set({ 
        error: handledError.userMessage || 'Falha ao publicar versão', 
        isProcessing: false 
      });
      throw handledError;
    }
  },
  
  // Step navigation helpers
  nextStep: () => {
    const { currentStep } = get();
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      set({ currentStep: STEP_ORDER[currentIndex + 1] });
    }
  },
  
  previousStep: () => {
    const { currentStep } = get();
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: STEP_ORDER[currentIndex - 1] });
    }
  },
  
  canProceedToNext: () => {
    const state = get();
    
    switch (state.currentStep) {
      case 'upload':
        return !!(state.session && state.file);
      case 'validation':
        return !!(state.validationResult && state.validationResult.summary.errors === 0);
      case 'preview':
        return !!(state.validationResult && state.validationResult.summary.valid > 0);
      case 'publish':
        return false; // Final step
      default:
        return false;
    }
  },
}));

// Selectors for optimized re-renders
export const selectCurrentStep = (state: ImportState) => state.currentStep;
export const selectSession = (state: ImportState) => state.session;
export const selectFile = (state: ImportState) => state.file;
export const selectValidationResult = (state: ImportState) => state.validationResult;
export const selectIsProcessing = (state: ImportState) => state.isProcessing;
export const selectError = (state: ImportState) => state.error;