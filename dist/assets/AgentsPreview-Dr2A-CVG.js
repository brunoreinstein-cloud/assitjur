import {
  r as t,
  cJ as J,
  j as e,
  J as I,
  bJ as $,
  R as g,
  M,
  bx as T,
  be as K,
  g as L,
  cc as q,
} from "./vendor-xNGbxDip.js";
import {
  g as x,
  a as y,
  C as j,
  b,
  j as N,
  k as v,
  m as C,
} from "./page-About-RKuI2z9S.js";
import "./page-Login-5_M3Gm0y.js";
const w = t.createContext(null);
function p() {
  const r = t.useContext(w);
  if (!r) throw new Error("useCarousel must be used within a <Carousel />");
  return r;
}
const S = t.forwardRef(
  (
    {
      orientation: r = "horizontal",
      opts: a,
      setApi: l,
      plugins: n,
      className: c,
      children: s,
      ...o
    },
    m,
  ) => {
    const [R, i] = J({ ...a, axis: r === "horizontal" ? "x" : "y" }, n),
      [z, k] = t.useState(!1),
      [A, B] = t.useState(!1),
      u = t.useCallback((d) => {
        d && (k(d.canScrollPrev()), B(d.canScrollNext()));
      }, []),
      h = t.useCallback(() => {
        i?.scrollPrev();
      }, [i]),
      f = t.useCallback(() => {
        i?.scrollNext();
      }, [i]),
      D = t.useCallback(
        (d) => {
          d.key === "ArrowLeft"
            ? (d.preventDefault(), h())
            : d.key === "ArrowRight" && (d.preventDefault(), f());
        },
        [h, f],
      );
    return (
      t.useEffect(() => {
        !i || !l || l(i);
      }, [i, l]),
      t.useEffect(() => {
        if (i)
          return (
            u(i),
            i.on("reInit", u),
            i.on("select", u),
            () => {
              i?.off("select", u);
            }
          );
      }, [i, u]),
      e.jsx(w.Provider, {
        value: {
          carouselRef: R,
          api: i,
          opts: a,
          orientation: r || (a?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev: h,
          scrollNext: f,
          canScrollPrev: z,
          canScrollNext: A,
        },
        children: e.jsx("div", {
          ref: m,
          onKeyDownCapture: D,
          className: x("relative", c),
          role: "region",
          "aria-roledescription": "carousel",
          ...o,
          children: s,
        }),
      })
    );
  },
);
S.displayName = "Carousel";
const E = t.forwardRef(({ className: r, ...a }, l) => {
  const { carouselRef: n, orientation: c } = p();
  return e.jsx("div", {
    ref: n,
    className: "overflow-hidden",
    children: e.jsx("div", {
      ref: l,
      className: x("flex", c === "horizontal" ? "-ml-4" : "-mt-4 flex-col", r),
      ...a,
    }),
  });
});
E.displayName = "CarouselContent";
const P = t.forwardRef(({ className: r, ...a }, l) => {
  const { orientation: n } = p();
  return e.jsx("div", {
    ref: l,
    role: "group",
    "aria-roledescription": "slide",
    className: x(
      "min-w-0 shrink-0 grow-0 basis-full",
      n === "horizontal" ? "pl-4" : "pt-4",
      r,
    ),
    ...a,
  });
});
P.displayName = "CarouselItem";
const G = t.forwardRef(
  ({ className: r, variant: a = "outline", size: l = "icon", ...n }, c) => {
    const { orientation: s, scrollPrev: o, canScrollPrev: m } = p();
    return e.jsxs(y, {
      ref: c,
      variant: a,
      size: l,
      className: x(
        "absolute  h-8 w-8 rounded-full",
        s === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        r,
      ),
      disabled: !m,
      onClick: o,
      ...n,
      children: [
        e.jsx(I, { className: "h-4 w-4" }),
        e.jsx("span", { className: "sr-only", children: "Previous slide" }),
      ],
    });
  },
);
G.displayName = "CarouselPrevious";
const H = t.forwardRef(
  ({ className: r, variant: a = "outline", size: l = "icon", ...n }, c) => {
    const { orientation: s, scrollNext: o, canScrollNext: m } = p();
    return e.jsxs(y, {
      ref: c,
      variant: a,
      size: l,
      className: x(
        "absolute h-8 w-8 rounded-full",
        s === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        r,
      ),
      disabled: !m,
      onClick: o,
      ...n,
      children: [
        e.jsx($, { className: "h-4 w-4" }),
        e.jsx("span", { className: "sr-only", children: "Next slide" }),
      ],
    });
  },
);
H.displayName = "CarouselNext";
function Q() {
  const r = [
      {
        icon: M,
        title: "Assistente de Prompts Jurídicos",
        description:
          'Otimização inteligente de instruções para IA, guiando o advogado com insights estratégicos para construir a melhor estrutura de prompt. Explora todo o potencial da inteligência artificial, incorporando contexto, jurisdição e formato jurídico adequado, reduzindo retrabalho e riscos de "alucinação".',
        status: "Disponível (Beta)",
        statusColor: "bg-success/20 text-success border-success/30",
      },
      {
        icon: T,
        title: "Coleta e Análise de Dados Judiciais",
        description:
          "Camada de inteligência estratégica sobre dados de contencioso. Extração inteligente de informações judiciais e processamento avançado para insights estratégicos.",
        status: "Em Breve",
        statusColor: "bg-primary/20 text-primary border-primary/30",
      },
      {
        icon: K,
        title: "Mapeamento de Testemunhas",
        description:
          "Mapeamento e análise estratégica da prova testemunhal, identificando vícios e padrões.",
        status: "Em Breve",
        statusColor: "bg-primary/20 text-primary border-primary/30",
      },
      {
        icon: L,
        title: "Relatórios Especializados",
        description:
          "Geração automática de relatórios executivos e análises detalhadas.",
        status: "Em Breve",
        statusColor: "bg-primary/20 text-primary border-primary/30",
      },
      {
        icon: q,
        title: "Estratégia Jurídica",
        description:
          "Suporte inteligente para tomada de decisões estratégicas em contencioso.",
        status: "Em Breve",
        statusColor: "bg-primary/20 text-primary border-primary/30",
      },
    ],
    [a, l] = g.useState(),
    [n, c] = g.useState(0);
  return (
    g.useEffect(() => {
      if (!a) return;
      const s = () => c(a.selectedScrollSnap());
      return (
        s(),
        a.on("select", s),
        () => {
          a.off("select", s);
        }
      );
    }, [a]),
    e.jsx("section", {
      className: "py-20 bg-muted/20",
      children: e.jsx("div", {
        className: "container mx-auto px-6",
        children: e.jsxs("div", {
          className: "max-w-6xl mx-auto",
          children: [
            e.jsxs("div", {
              className: "text-center mb-16",
              children: [
                e.jsx("h2", {
                  className:
                    "text-3xl md:text-4xl font-bold text-foreground mb-4",
                  children: "Catálogo de Assistentes",
                }),
                e.jsxs("div", {
                  className:
                    "text-xl text-muted-foreground max-w-4xl mx-auto text-left space-y-8",
                  children: [
                    e.jsxs("div", {
                      children: [
                        e.jsxs("h3", {
                          className:
                            "text-2xl font-semibold mb-2 flex items-center gap-2",
                          children: [
                            e.jsx("span", {
                              role: "img",
                              "aria-label": "diamante",
                              children: "🔹",
                            }),
                            "Assistentes Personalizados",
                          ],
                        }),
                        e.jsx("p", {
                          children:
                            "Encomende um assistente desenvolvido sob medida para a sua maior dor.",
                        }),
                        e.jsx("p", {
                          children:
                            "Customizamos de acordo com a necessidade do seu time ou escritório.",
                        }),
                        e.jsx("h4", {
                          className: "text-xl font-semibold mt-4",
                          children: "Exemplos já criados:",
                        }),
                        e.jsxs("ul", {
                          className: "list-disc pl-6 space-y-1",
                          children: [
                            e.jsx("li", {
                              children:
                                "Relatórios de processos trabalhistas e cíveis",
                            }),
                            e.jsx("li", {
                              children:
                                "Relatórios para escritórios no formato exigido por clientes externos",
                            }),
                            e.jsx("li", {
                              children:
                                "Preenchimento automatizado de formulários (ex.: solicitação de seguro garantia)",
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs("div", {
                      children: [
                        e.jsxs("h3", {
                          className:
                            "text-2xl font-semibold mb-2 flex items-center gap-2",
                          children: [
                            e.jsx("span", {
                              role: "img",
                              "aria-label": "diamante",
                              children: "🔹",
                            }),
                            "Assistentes Plug & Play",
                          ],
                        }),
                        e.jsx("p", {
                          children:
                            "Assistentes já prontos para facilitar etapas estratégicas do trabalho jurídico.",
                        }),
                        e.jsx("p", {
                          children:
                            "A plataforma está em fase beta, com lançamento inicial e uso para clientes exclusivos da Bianca Reinstein Consultoria.",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs("div", {
              className: "md:hidden mb-12",
              children: [
                e.jsx(S, {
                  setApi: l,
                  opts: { align: "start" },
                  className: "-mx-6",
                  children: e.jsx(E, {
                    children: r.map((s, o) =>
                      e.jsx(
                        P,
                        {
                          className: "pl-6",
                          children: e.jsxs(j, {
                            className:
                              "relative border-border/50 hover:shadow-lg transition-all duration-300 group overflow-hidden",
                            children: [
                              e.jsx("div", {
                                className: "absolute top-4 right-4 z-10",
                                children: e.jsx(b, {
                                  variant: "secondary",
                                  className: `font-medium ${s.statusColor}`,
                                  children: s.status,
                                }),
                              }),
                              e.jsxs(N, {
                                className: "text-center pb-4",
                                children: [
                                  e.jsx("div", {
                                    className:
                                      "w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-card border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform",
                                    children: e.jsx(s.icon, {
                                      className: "h-8 w-8 text-primary",
                                    }),
                                  }),
                                  e.jsx(v, {
                                    className:
                                      "text-lg text-foreground leading-tight",
                                    children: s.title,
                                  }),
                                ],
                              }),
                              e.jsx(C, {
                                className: "text-center",
                                children: e.jsx("p", {
                                  className:
                                    "text-muted-foreground text-sm leading-relaxed",
                                  children: s.description,
                                }),
                              }),
                            ],
                          }),
                        },
                        o,
                      ),
                    ),
                  }),
                }),
                e.jsx("div", {
                  className: "flex justify-center mt-4 gap-2",
                  children: r.map((s, o) =>
                    e.jsx(
                      "button",
                      {
                        onClick: () => a?.scrollTo(o),
                        className: "p-4",
                        "aria-label": `Ir para agente ${o + 1}`,
                        children: e.jsx("span", {
                          className: `block w-3 h-3 rounded-full ${n === o ? "bg-primary" : "bg-muted-foreground/20"}`,
                        }),
                      },
                      o,
                    ),
                  ),
                }),
              ],
            }),
            e.jsx("div", {
              className:
                "hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12",
              children: r.map((s, o) =>
                e.jsxs(
                  j,
                  {
                    className:
                      "relative border-border/50 hover:shadow-lg transition-all duration-300 group overflow-hidden",
                    children: [
                      e.jsx("div", {
                        className: "absolute top-4 right-4 z-10",
                        children: e.jsx(b, {
                          variant: "secondary",
                          className: `font-medium ${s.statusColor}`,
                          children: s.status,
                        }),
                      }),
                      e.jsxs(N, {
                        className: "text-center pb-4",
                        children: [
                          e.jsx("div", {
                            className:
                              "w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-card border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform",
                            children: e.jsx(s.icon, {
                              className: "h-8 w-8 text-primary",
                            }),
                          }),
                          e.jsx(v, {
                            className: "text-lg text-foreground leading-tight",
                            children: s.title,
                          }),
                        ],
                      }),
                      e.jsx(C, {
                        className: "text-center",
                        children: e.jsx("p", {
                          className:
                            "text-muted-foreground text-sm leading-relaxed",
                          children: s.description,
                        }),
                      }),
                    ],
                  },
                  o,
                ),
              ),
            }),
          ],
        }),
      }),
    })
  );
}
export { Q as AgentsPreview };
