import React from 'react';
import { ResultBlock } from '@/stores/useChatStore';
import { Executive } from './Executive';
import { Details } from './Details';
import { Alerts } from './Alerts';
import { Strategies } from './Strategies';

interface ResultBlocksProps {
  blocks: ResultBlock[];
}

export function ResultBlocks({ blocks }: ResultBlocksProps) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'executive':
            return <Executive key={index} block={block} />;
          case 'details':
            return <Details key={index} block={block} />;
          case 'alerts':
            return <Alerts key={index} block={block} />;
          case 'strategies':
            return <Strategies key={index} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
}