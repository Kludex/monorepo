import { visit } from "unist-util-visit";

const KNOWN = new Set(["note", "info", "tip", "warning", "danger"]);

/**
 * Renders `:::note[Title]` containers (via remark-directive) as callout asides,
 * replacing mkdocs-material `!!! note` admonitions.
 */
export function remarkCallouts() {
  return (tree) => {
    visit(tree, "containerDirective", (node) => {
      if (!KNOWN.has(node.name)) return;
      const data = node.data ?? (node.data = {});
      const label = node.children.find((child) => child.data?.directiveLabel);
      let title = node.name.charAt(0).toUpperCase() + node.name.slice(1);
      if (label) {
        title = label.children.map((child) => child.value ?? "").join("");
        node.children = node.children.filter((child) => child !== label);
      }
      node.children.unshift({
        type: "paragraph",
        data: {
          hName: "p",
          hProperties: { className: ["callout-title"] },
        },
        children: [{ type: "text", value: title }],
      });
      data.hName = "aside";
      data.hProperties = { className: ["callout", `callout-${node.name}`] };
    });
  };
}
