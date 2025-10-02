import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { useLocation } from 'react-router-dom';

export type TourType = 'mapa' | 'dashboard' | 'admin';

interface FeatureTourProps {
  type: TourType;
  run?: boolean;
  onFinish?: () => void;
}

const tourSteps: Record<TourType, Step[]> = {
  mapa: [
    {
      target: '[data-tour="filters"]',
      content: 'Use os filtros para refinar sua busca por processos e testemunhas específicas.',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '[data-tour="table"]',
      content: 'Visualize e analise os dados em formato de tabela. Clique em qualquer linha para ver mais detalhes.',
      placement: 'top',
    },
    {
      target: '[data-tour="chat"]',
      content: 'Converse com a IA para fazer perguntas sobre seus dados e obter insights instantâneos.',
      placement: 'left',
    },
    {
      target: '[data-tour="export"]',
      content: 'Exporte seus dados filtrados em diversos formatos (Excel, PDF, etc.).',
      placement: 'bottom',
    },
  ],
  dashboard: [
    {
      target: '[data-tour="metrics"]',
      content: 'Acompanhe as principais métricas do sistema em tempo real.',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '[data-tour="charts"]',
      content: 'Visualize tendências e padrões através de gráficos interativos.',
      placement: 'top',
    },
    {
      target: '[data-tour="recent-activity"]',
      content: 'Veja as atividades mais recentes do sistema.',
      placement: 'left',
    },
  ],
  admin: [
    {
      target: '[data-tour="ia-config"]',
      content: 'Configure os modelos de IA e ajuste os parâmetros para melhor performance.',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '[data-tour="import"]',
      content: 'Importe novos dados através de arquivos CSV ou XLSX.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="organization"]',
      content: 'Gerencie configurações da organização e permissões de usuários.',
      placement: 'bottom',
    },
  ],
};

export function FeatureTour({ type, run = false, onFinish }: FeatureTourProps) {
  const [tourRun, setTourRun] = useState(run);
  const location = useLocation();

  useEffect(() => {
    setTourRun(run);
  }, [run]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type: eventType } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setTourRun(false);
      
      // Save to localStorage that user has seen this tour
      localStorage.setItem(`tour-${type}-completed`, 'true');
      
      if (onFinish) {
        onFinish();
      }
    }

    // Close tour if user navigates away
    if (eventType === EVENTS.TOUR_END) {
      setTourRun(false);
    }
  };

  // Check if user has already completed this tour
  const hasCompletedTour = localStorage.getItem(`tour-${type}-completed`) === 'true';

  if (hasCompletedTour && !run) {
    return null;
  }

  return (
    <Joyride
      steps={tourSteps[type]}
      run={tourRun}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(257, 42%, 51%)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
        },
        buttonNext: {
          borderRadius: 6,
          padding: '8px 16px',
        },
        buttonBack: {
          marginRight: 8,
          color: 'hsl(0, 0%, 54%)',
        },
        buttonSkip: {
          color: 'hsl(0, 0%, 54%)',
        },
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular tour',
      }}
    />
  );
}

// Hook to easily start a tour
export function useTour(type: TourType) {
  const [run, setRun] = useState(false);

  const startTour = () => setRun(true);
  const resetTour = () => {
    localStorage.removeItem(`tour-${type}-completed`);
    setRun(true);
  };

  return { run, startTour, resetTour, FeatureTour: () => <FeatureTour type={type} run={run} onFinish={() => setRun(false)} /> };
}
