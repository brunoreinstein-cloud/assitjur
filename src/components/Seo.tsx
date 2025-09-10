import { useEffect } from 'react';
import { ROUTE_META, buildUrl, defaultOgImage } from '@/utils/seo';

interface SeoProps {
  path: string;
  title?: string;
  description?: string;
  image?: string;
}

function updateMeta(name: string, content?: string) {
  if (!content) return;
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function updateProperty(property: string, content?: string) {
  if (!content) return;
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

export const Seo = ({ path, title, description, image }: SeoProps) => {
  useEffect(() => {
    const meta = ROUTE_META[path] || {};
    const finalTitle = title ?? meta.title;
    const finalDesc = description ?? meta.description;
    const url = buildUrl(path);
    const img = image ?? meta.image ?? buildUrl(defaultOgImage);

    if (finalTitle) document.title = finalTitle;
    if (finalDesc) updateMeta('description', finalDesc);

    let linkCanonical = document.querySelector("link[rel='canonical']");
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', url);

    updateProperty('og:type', 'website');
    updateProperty('og:title', finalTitle);
    updateProperty('og:description', finalDesc);
    updateProperty('og:url', url);
    updateProperty('og:image', img);

    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', finalTitle);
    updateMeta('twitter:description', finalDesc);
    updateMeta('twitter:image', img);
  }, [path, title, description, image]);

  return null;
};
