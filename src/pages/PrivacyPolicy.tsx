import privacyHtml from '@/pages-static/privacidade.html?raw';

export default function PrivacyPolicy() {
  return <div dangerouslySetInnerHTML={{ __html: privacyHtml }} />;
}
