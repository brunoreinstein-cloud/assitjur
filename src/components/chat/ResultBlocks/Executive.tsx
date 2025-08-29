import React from 'react';
import { ResultBlock } from '@/stores/useChatStore';
import { ExecutiveSummaryCard } from '../ExecutiveSummaryCard';
import { Citations } from '../Citations';

interface ExecutiveProps {
  block: ResultBlock;
}

export function Executive({ block }: ExecutiveProps) {
  const { data, citations } = block;

  // Transform citations to match ExecutiveSummaryCard interface
  const transformedCitations = citations?.map(citation => ({
    label: citation.ref,
    onClick: () => {
      // Focus on evidence panel or handle citation click
      console.log('Citation clicked:', citation);
    }
  })) || [];

  return (
    <ExecutiveSummaryCard
      cnj={data.cnj}
      reclamante={data.reclamante}
      reu={data.reu}
      status={data.status}
      observacoes={data.observacoes}
      riscoNivel={data.riscoNivel}
      confianca={data.confianca}
      alerta={data.alerta}
      citacoes={transformedCitations}
    />
  );
}