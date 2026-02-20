module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow files over N lines; warn at warnAt, error at max. Files over the limit should be broken into proper subfiles or subcomponents.",
    },
    schema: [
      {
        type: "object",
        properties: {
          warnAt: { type: "number" },
          max: { type: "number" },
          ignorePatterns: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooLong:
        "File has {{count}} lines (max {{max}}). Break this file into proper subfiles or subcomponents.",
      warnLong:
        "File has {{count}} lines (warn at {{warnAt}}, error at {{max}}). Consider splitting.",
    },
  },

  create(context) {
    const filename = context.getFilename();
    const opt = context.options[0] || {};
    const warnAt = opt.warnAt ?? null;
    const max = opt.max ?? 500;
    const ignorePatterns = opt.ignorePatterns ?? [];

    const isIgnored = ignorePatterns.some((p) => filename.includes(p));
    if (isIgnored) return {};

    return {
      Program(node) {
        const source = context.getSourceCode().text;
        const count = source.split(/\r\n|\r|\n/).length;
        if (count > max) {
          context.report({
            node,
            messageId: "tooLong",
            data: { count, max },
          });
        } else if (warnAt != null && count > warnAt) {
          context.report({
            node,
            messageId: "warnLong",
            data: { count, warnAt, max },
            severity: 1,
          });
        }
      },
    };
  },
};
