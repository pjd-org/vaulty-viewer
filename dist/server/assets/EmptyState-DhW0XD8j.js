import { jsxs, jsx } from "react/jsx-runtime";
function EmptyState({ icon, title, description, action }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [
    icon && /* @__PURE__ */ jsx("div", { className: "text-4xl", style: { color: "var(--color-text-3)" }, children: icon }),
    /* @__PURE__ */ jsx(
      "h2",
      {
        className: "text-lg font-semibold mt-4",
        style: { color: "var(--color-text-2)" },
        children: title
      }
    ),
    description && /* @__PURE__ */ jsx(
      "p",
      {
        className: "text-sm mt-2 max-w-sm",
        style: { color: "var(--color-text-3)" },
        children: description
      }
    ),
    action && /* @__PURE__ */ jsx("div", { className: "mt-6", children: action })
  ] });
}
export {
  EmptyState as E
};
