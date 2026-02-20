const path = require("path");

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Enforce file extensions in specific folders" },
    schema: [
      {
        type: "object",
        properties: {
          policies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                folder: { type: "string" },
                allowed: { type: "array", items: { type: "string" } },
              },
              required: ["folder", "allowed"],
              additionalProperties: false,
            },
          },
        },
        required: ["policies"],
        additionalProperties: false,
      },
    ],
    messages: {
      badExt:
        "Files under '{{folder}}' must be: {{allowed}}. Found '.{{ext}}'.",
    },
  },

  create(context) {
    const rawFilename = context.getFilename();
    const filename = rawFilename.split(path.sep).join("/");
    const opt = context.options[0] || {};
    const policies = opt.policies || [];

    const ext = path.extname(filename).replace(".", "");
    const match = policies.find((p) => filename.includes(p.folder));
    if (!match) return {};

    const allowed = match.allowed;
    if (allowed.includes(ext)) return {};

    return {
      Program(node) {
        context.report({
          node,
          messageId: "badExt",
          data: {
            folder: match.folder,
            allowed: allowed.map((a) => `.${a}`).join(", "),
            ext,
          },
        });
      },
    };
  },
};
