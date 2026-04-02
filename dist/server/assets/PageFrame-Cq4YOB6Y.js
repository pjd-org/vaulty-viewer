import { jsxs, jsx } from "react/jsx-runtime";
function PageFrame({ title, subtitle, actions, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("header", { className: "rounded-[28px] p-6 genie-surface genie-surface--hero genie-layer-hero", children: /* @__PURE__ */ jsxs("div", { className: "genie-content flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-semibold tracking-tight text-slate-800", children: title }),
        subtitle && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-600", children: subtitle })
      ] }),
      actions && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: actions })
    ] }) }),
    children
  ] });
}
export {
  PageFrame as P
};
