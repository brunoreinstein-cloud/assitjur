import { useEffect } from "react";
import { getEnv } from "@/lib/getEnv";

type SEOProps = {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  noindex?: boolean;
};

const { siteUrl: BASE_URL } = getEnv();

const stripTracking = (url: string) =>
  url
    .replace(/(\?|&)(utm_[^=&]+|gclid|fbclid)=[^&]*/g, "")
    .replace(/\?&/, "?")
    .replace(/\?$/, "");

const DEFAULT_IMAGE = "/brand/og-assistjur.png";
const DEFAULT_TITLE = "AssistJur";
const DEFAULT_DESCRIPTION =
  "Análise avançada de testemunhas para processos trabalhistas - Identifique padrões suspeitos e riscos processuais";

export function SEO({
  title,
  description,
  path = "/",
  ogImage,
  noindex,
}: SEOProps) {
  useEffect(() => {
    const finalTitle = title ?? DEFAULT_TITLE;
    const finalDesc = description ?? DEFAULT_DESCRIPTION;
    const url = new URL(path, BASE_URL).toString();
    const canonical = stripTracking(url);
    const image = ogImage?.startsWith("http")
      ? ogImage
      : `${BASE_URL}${ogImage ?? DEFAULT_IMAGE}`;

    if (finalTitle) {
      document.title = finalTitle;
    }

    const setTag = (tag: HTMLElement) => {
      document.head.appendChild(tag);
    };

    const updateMeta = (selector: string, attrs: Record<string, string>) => {
      let el = document.head.querySelector(selector) as HTMLElement | null;
      if (!el) {
        el = document.createElement("meta");
        setTag(el);
      }
      Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    };

    const updateLink = (rel: string, href: string) => {
      let link = document.head.querySelector(
        `link[rel="${rel}"]`,
      ) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        setTag(link);
      }
      link.setAttribute("href", href);
    };

    updateLink("canonical", canonical);

    updateMeta('meta[name="description"]', {
      name: "description",
      content: finalDesc,
    });
    if (noindex) {
      updateMeta('meta[name="robots"]', {
        name: "robots",
        content: "noindex, nofollow",
      });
    }

    updateMeta('meta[property="og:type"]', {
      property: "og:type",
      content: "website",
    });
    updateMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonical,
    });
    updateMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: "AssistJur",
    });
    updateMeta('meta[property="og:locale"]', {
      property: "og:locale",
      content: "pt_BR",
    });
    updateMeta('meta[property="og:image"]', {
      property: "og:image",
      content: image,
    });
    updateMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    updateMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: image,
    });

    if (finalTitle) {
      updateMeta('meta[property="og:title"]', {
        property: "og:title",
        content: finalTitle,
      });
      updateMeta('meta[name="twitter:title"]', {
        name: "twitter:title",
        content: finalTitle,
      });
    }

    if (finalDesc) {
      updateMeta('meta[property="og:description"]', {
        property: "og:description",
        content: finalDesc,
      });
      updateMeta('meta[name="twitter:description"]', {
        name: "twitter:description",
        content: finalDesc,
      });
    }
  }, [title, description, path, ogImage, noindex]);

  return null;
}
