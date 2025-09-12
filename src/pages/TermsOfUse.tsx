import React from 'react';
import termosHtml from '@/pages-static/termos.html?raw';

export default function TermsOfUse() {
  return <div dangerouslySetInnerHTML={{ __html: termosHtml }} />;
}
