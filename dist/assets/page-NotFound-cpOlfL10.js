import {
  r as d,
  by as N,
  j as e,
  be as g,
  bz as E,
  bA as v,
  bB as C,
} from "./vendor-xNGbxDip.js";
import {
  h as S,
  C as _,
  j as A,
  k as T,
  m as B,
  a as l,
} from "./page-About-RKuI2z9S.js";
import { I as L } from "./page-Login-5_M3Gm0y.js";
const { siteUrl: j } = S(),
  k = (r) =>
    r
      .replace(/(\?|&)(utm_[^=&]+|gclid|fbclid)=[^&]*/g, "")
      .replace(/\?&/, "?")
      .replace(/\?$/, ""),
  I = "/brand/og-assistjur.png",
  U = "AssistJur",
  F =
    "Análise avançada de testemunhas para processos trabalhistas - Identifique padrões suspeitos e riscos processuais";
function q({
  title: r,
  description: s,
  path: m = "/",
  ogImage: n,
  noindex: o,
}) {
  return (
    d.useEffect(() => {
      const i = r ?? U,
        p = s ?? F,
        y = new URL(m, j).toString(),
        h = k(y),
        f = n?.startsWith("http") ? n : `${j}${n ?? I}`;
      i && (document.title = i);
      const x = (c) => {
          document.head.appendChild(c);
        },
        t = (c, u) => {
          let a = document.head.querySelector(c);
          (a || ((a = document.createElement("meta")), x(a)),
            Object.entries(u).forEach(([b, w]) => a.setAttribute(b, w)));
        };
      (((c, u) => {
        let a = document.head.querySelector(`link[rel="${c}"]`);
        (a ||
          ((a = document.createElement("link")),
          a.setAttribute("rel", c),
          x(a)),
          a.setAttribute("href", u));
      })("canonical", h),
        t('meta[name="description"]', { name: "description", content: p }),
        o &&
          t('meta[name="robots"]', {
            name: "robots",
            content: "noindex, nofollow",
          }),
        t('meta[property="og:type"]', {
          property: "og:type",
          content: "website",
        }),
        t('meta[property="og:url"]', { property: "og:url", content: h }),
        t('meta[property="og:site_name"]', {
          property: "og:site_name",
          content: "AssistJur",
        }),
        t('meta[property="og:locale"]', {
          property: "og:locale",
          content: "pt_BR",
        }),
        t('meta[property="og:image"]', { property: "og:image", content: f }),
        t('meta[name="twitter:card"]', {
          name: "twitter:card",
          content: "summary_large_image",
        }),
        t('meta[name="twitter:image"]', { name: "twitter:image", content: f }),
        i &&
          (t('meta[property="og:title"]', { property: "og:title", content: i }),
          t('meta[name="twitter:title"]', {
            name: "twitter:title",
            content: i,
          })),
        p &&
          (t('meta[property="og:description"]', {
            property: "og:description",
            content: p,
          }),
          t('meta[name="twitter:description"]', {
            name: "twitter:description",
            content: p,
          })));
    }, [r, s, m, n, o]),
    null
  );
}
const D = () => {
    const r = N(),
      [s, m] = d.useState("");
    d.useEffect(() => {
      console.error(
        "404 Error: User attempted to access non-existent route:",
        r.pathname,
      );
    }, [r.pathname]);
    const n = (o) => {
      (o.preventDefault(),
        s.trim() &&
          (window.location.href = `/mapa?query=${encodeURIComponent(s)}`));
    };
    return e.jsxs(e.Fragment, {
      children: [
        e.jsx(q, {
          title: "Página não encontrada",
          path: r.pathname,
          noindex: !0,
        }),
        e.jsx("div", {
          className:
            "min-h-screen flex items-center justify-center p-4 bg-gradient-subtle",
          children: e.jsxs(_, {
            className: "w-full max-w-lg",
            children: [
              e.jsx(A, {
                className: "text-center",
                children: e.jsx(T, { children: "Página não encontrada" }),
              }),
              e.jsxs(B, {
                className: "space-y-4",
                children: [
                  e.jsx("p", {
                    className: "text-center text-muted-foreground",
                    children:
                      "A página que você procura não existe. Tente buscar novamente ou acessar uma das opções abaixo.",
                  }),
                  e.jsxs("form", {
                    onSubmit: n,
                    role: "search",
                    "aria-label": "Buscar conteúdo",
                    className: "flex gap-2",
                    children: [
                      e.jsx("label", {
                        htmlFor: "search",
                        className: "sr-only",
                        children: "Buscar",
                      }),
                      e.jsx(L, {
                        id: "search",
                        value: s,
                        onChange: (o) => m(o.target.value),
                        placeholder: "Buscar...",
                        "aria-label": "Buscar",
                        className: "flex-1",
                      }),
                      e.jsxs(l, {
                        type: "submit",
                        "aria-label": "Buscar",
                        children: [
                          e.jsx(g, { className: "w-4 h-4 mr-2" }),
                          " Buscar",
                        ],
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className: "grid grid-cols-2 gap-2 pt-2",
                    children: [
                      e.jsx(l, {
                        asChild: !0,
                        variant: "secondary",
                        className: "w-full",
                        children: e.jsxs("a", {
                          href: "/",
                          "aria-label": "Ir para o início",
                          children: [
                            e.jsx(E, { className: "w-4 h-4 mr-2" }),
                            " Início",
                          ],
                        }),
                      }),
                      e.jsx(l, {
                        asChild: !0,
                        variant: "secondary",
                        className: "w-full",
                        children: e.jsxs("a", {
                          href: "/mapa",
                          "aria-label": "Ir para o mapa",
                          children: [
                            e.jsx(g, { className: "w-4 h-4 mr-2" }),
                            " Mapa",
                          ],
                        }),
                      }),
                      e.jsx(l, {
                        asChild: !0,
                        variant: "secondary",
                        className: "w-full",
                        children: e.jsxs("a", {
                          href: "mailto:suporte@assistjur.com",
                          "aria-label": "Contatar suporte",
                          children: [
                            e.jsx(v, { className: "w-4 h-4 mr-2" }),
                            " Suporte",
                          ],
                        }),
                      }),
                      e.jsx(l, {
                        asChild: !0,
                        variant: "secondary",
                        className: "w-full",
                        children: e.jsxs("a", {
                          href: "https://status.assistjur.com",
                          target: "_blank",
                          rel: "noopener noreferrer",
                          "aria-label": "Ver status dos serviços",
                          children: [
                            e.jsx(C, { className: "w-4 h-4 mr-2" }),
                            " Status",
                          ],
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      ],
    });
  },
  P = Object.freeze(
    Object.defineProperty({ __proto__: null, default: D }, Symbol.toStringTag, {
      value: "Module",
    }),
  );
export { P as N, q as S };
