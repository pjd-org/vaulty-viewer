const React = window.React;
const CMS = window.CMS;

const MarkdownPreview = ({ entry, widgetFor }) => {
  const title = entry.getIn(["data", "title"]) || "Untitled";
  return React.createElement(
    "div",
    { className: "preview" },
    React.createElement("h1", null, title),
    React.createElement("div", { className: "preview__body" }, widgetFor("body"))
  );
};

CMS.registerPreviewTemplate("notes", MarkdownPreview);
CMS.registerPreviewTemplate("tasks", MarkdownPreview);
CMS.registerPreviewTemplate("reports", MarkdownPreview);
CMS.registerPreviewStyle("/admin/preview.css");
