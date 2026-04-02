import { jsx, jsxs } from "react/jsx-runtime";
import { P as PageContainer, S as SummaryRow } from "./SummaryRow-3HynMwwn.js";
import { P as PageFrame } from "./PageFrame-Cq4YOB6Y.js";
import { a as SoftPanel } from "./router-Dve3S_a4.js";
function WorkspaceScaffold({
  title,
  subtitle,
  actions,
  summaryItems = [],
  primaryTitle,
  primarySubtitle,
  primary,
  asideTitle,
  asideSubtitle,
  aside
}) {
  return /* @__PURE__ */ jsx(PageContainer, { children: /* @__PURE__ */ jsxs(PageFrame, { title, subtitle, actions, children: [
    /* @__PURE__ */ jsx(SummaryRow, { items: summaryItems }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]", children: [
      /* @__PURE__ */ jsx(
        SoftPanel,
        {
          title: primaryTitle,
          subtitle: primarySubtitle,
          variant: "elevated",
          className: "min-h-[420px]",
          children: primary
        }
      ),
      /* @__PURE__ */ jsx(
        SoftPanel,
        {
          title: asideTitle,
          subtitle: asideSubtitle,
          variant: "utility",
          className: "min-h-[420px]",
          children: aside
        }
      )
    ] })
  ] }) });
}
export {
  WorkspaceScaffold as W
};
