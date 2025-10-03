import { r as e, j as t } from "./vendor-xNGbxDip.js";
import "./page-Login-5_M3Gm0y.js";
import "./page-About-RKuI2z9S.js";
function p() {
  const [s, c] = e.useState(null),
    [a, n] = e.useState(null);
  return (
    e.useEffect(() => {
      const o = performance.now();
      fetch("/api/health")
        .then(async (r) => {
          const l = await r.json();
          (c(l), n(performance.now() - o));
        })
        .catch(() => n(null));
    }, []),
    t.jsxs("div", {
      className: "p-4 space-y-2",
      children: [
        t.jsx("h1", {
          className: "text-2xl font-bold",
          children: "Status do Sistema",
        }),
        s && t.jsxs("p", { children: ["Uptime: ", Math.round(s.uptime), "s"] }),
        a !== null &&
          t.jsxs("p", { children: ["Latência: ", Math.round(a), "ms"] }),
      ],
    })
  );
}
export { p as default };
