import { jsx, jsxs } from "react/jsx-runtime";
const variantClasses = {
  default: "bg-white/80 text-slate-600 border border-white/70 shadow-[0_4px_12px_rgba(15,23,42,0.04)]",
  primary: "bg-[linear-gradient(135deg,#11151d,#1c2230)] text-white border border-black/15 shadow-[0_8px_20px_rgba(15,23,42,0.2)]",
  success: "bg-accent-mint/45 text-neutral-800 border border-white/70",
  warning: "bg-accent-sun/45 text-neutral-800 border border-white/70",
  danger: "bg-accent-rose/45 text-neutral-800 border border-white/70"
};
function SoftChip({ label, icon, onRemove, className = "", variant = "default" }) {
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className: `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${variantClasses[variant]} ${className}`,
      children: [
        icon && /* @__PURE__ */ jsx("span", { className: "shrink-0", children: icon }),
        label,
        onRemove && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onRemove,
            "aria-label": `Remove ${label}`,
            className: "ml-0.5 rounded-full hover:opacity-70 transition-opacity",
            children: /* @__PURE__ */ jsx("svg", { className: "w-3 h-3", viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M9 3L3 9M3 3l6 6" }) })
          }
        )
      ]
    }
  );
}
const statusVariant = {
  todo: "default",
  "in-progress": "primary",
  blocked: "danger",
  done: "success",
  backlog: "default"
};
const statusLabel = {
  todo: "To Do",
  "in-progress": "In Progress",
  blocked: "Blocked",
  done: "Done",
  backlog: "Backlog"
};
function StatusPill({ status, className = "" }) {
  const variant = statusVariant[status];
  const mutedClass = status === "backlog" ? "opacity-70" : "";
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: `inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${variantClasses[variant]} ${mutedClass} ${className}`,
      children: statusLabel[status]
    }
  );
}
export {
  SoftChip as S,
  StatusPill as a
};
