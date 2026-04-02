import { jsx, jsxs } from "react/jsx-runtime";
import { a as SoftPanel } from "./router-Dve3S_a4.js";
function PageContainer({ children, className }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: [
        "mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6 space-y-6",
        className ?? ""
      ].join(" ").trim(),
      children
    }
  );
}
function SummaryRow({ items }) {
  if (!items.length) {
    return null;
  }
  return /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4", children: items.map((item) => /* @__PURE__ */ jsxs(SoftPanel, { variant: "utility", className: "p-4", children: [
    /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: item.label }),
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-2xl font-semibold tracking-tight text-slate-100", children: item.value }),
    item.detail && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-400", children: item.detail })
  ] }, item.label)) });
}
export {
  PageContainer as P,
  SummaryRow as S
};
