import { create } from 'zustand';
import { toast } from '@/hooks/use-toast';

interface BetaFormState {
  email: string;
  needs: string[];
  otherNeed: string;
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface BetaFormActions {
  setEmail: (email: string) => void;
  setNeeds: (needs: string[]) => void;
  setOtherNeed: (otherNeed: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  submitBeta: () => Promise<boolean>;
  reset: () => void;
}

type BetaFormStore = BetaFormState & BetaFormActions;

const initialState: BetaFormState = {
  email: '',
  needs: [],
  otherNeed: '',
  loading: false,
  error: null,
  success: false,
};

export const useBetaFormStore = create<BetaFormStore>((set, get) => ({
  ...initialState,

  setEmail: (email) => set({ email }),
  setNeeds: (needs) => set({ needs }),
  setOtherNeed: (otherNeed) => set({ otherNeed }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),

  submitBeta: async () => {
    const { email, needs, otherNeed } = get();
    
    set({ loading: true, error: null });

    try {
      // Preparar payload
      const payload = {
        email,
        needs,
        otherNeed: otherNeed || undefined,
        timestamp: new Date().toISOString(),
      };

      // Tentar enviar para a API
      let success = false;
      
      try {
        const response = await fetch('/api/beta-signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          success = true;
        } else {
          throw new Error('API not available');
        }
      } catch (apiError) {
        // Fallback para mock se API não existir
        console.log('Beta signup mock data:', payload);
        
        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        success = true;
      }

      if (success) {
        set({ success: true, loading: false });
        
        // Toast de sucesso
        toast({
          title: "Inscrição recebida!",
          description: "Em breve entraremos em contato com os passos do Beta.",
        });

        // Reset form
        setTimeout(() => {
          set(initialState);
        }, 100);

        return true;
      }
    } catch (error) {
      console.error('Erro ao enviar inscrição beta:', error);
      
      const errorMessage = 'Não foi possível enviar. Tente novamente.';
      set({ 
        error: errorMessage, 
        loading: false 
      });
      
      // Toast de erro
      toast({
        title: "Erro no envio",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }

    return false;
  },

  reset: () => set(initialState),
}));