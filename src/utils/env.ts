export const getSiteUrl = () => {
  const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error('VITE_PUBLIC_SITE_URL is not defined');
  }
  return siteUrl;
};
