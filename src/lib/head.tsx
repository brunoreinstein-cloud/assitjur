
export type HeadProps = {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  path: string;
};

const BASE_URL = 'https://assistjur.com.br';

export function Head({ title, description, canonical, ogImage, path }: HeadProps) {
  const url = canonical ?? `${BASE_URL}${path}`;
  const image = ogImage?.startsWith('http') ? ogImage : `${BASE_URL}${ogImage ?? '/brand/og-assistjur.png'}`;

  const orgJson = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AssistJur.IA',
    url: BASE_URL,
  } as const;

  const siteJson = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AssistJur.IA',
    url: BASE_URL,
  } as const;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="AssistJur.IA" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJson) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJson) }} />
    </>
  );
}

export default Head;
