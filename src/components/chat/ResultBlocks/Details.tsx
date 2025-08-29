import React from 'react';
import { ResultBlock } from '@/stores/useChatStore';
import { AnalysisAccordion } from '../AnalysisAccordion';

interface DetailsProps {
  block: ResultBlock;
}

export function Details({ block }: DetailsProps) {
  const { data } = block;

  return (
    <AnalysisAccordion
      secoes={data.secoes}
      textoOriginal={data.textoOriginal}
    />
  );
}