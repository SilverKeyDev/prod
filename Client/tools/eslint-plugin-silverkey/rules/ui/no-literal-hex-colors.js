const path = require("path");

/** Match hex color: #RGB, #RRGGBB, #RRGGBBAA */
const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

/**
 * Match Tailwind arbitrary color inside brackets: [#...], [rgb(...)], [hsl(...)], etc.
 * Used to flag className strings like "text-[#ff0000]" or "bg-[rgb(0,0,0)]".
 */
const TAILWIND_ARBITRARY_HEX_RE =
  /\[#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})\]/g;
const TAILWIND_ARBITRARY_FUNC_RE = /\[(rgb|rgba|hsl|hsla)\s*\(/g;

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow literal hex colors and Tailwind arbitrary colors in design-system-consuming code. Use design-tokens (color(), Tailwind theme classes from packages/design-tokens) instead. Hex/arbitrary colors are allowed only in packages/design-tokens.",
    },
    schema: [
      {
        type: "object",
        properties: {
          includePaths: {
            type: "array",
            items: { type: "string" },
            description:
              "Glob-like paths where the rule applies (e.g. apps/web/components/**)",
          },
          allowedPaths: {
            type: "array",
            items: { type: "string" },
            description:
              "Paths where hex literals are allowed (e.g. packages/design-tokens/**)",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      literalHex:
        "Do not use literal hex colors here. Use color() from packages/design-tokens or Tailwind theme classes (e.g. text-brand-accent, bg-neutral-100).",
      arbitraryColor:
        "Do not use Tailwind arbitrary colors (e.g. text-[#hex], bg-[rgb()]). Use design-token theme classes (e.g. text-brand-accent, bg-neutral-100) or color() from packages/design-tokens.",
    },
  },

  create(context) {
    const rawFilename = context.getFilename();
    const filename = rawFilename.split(path.sep).join("/");
    const opt = context.options[0] || {};
    const includePaths = opt.includePaths || [
      "apps/web/components/",
      "apps/web/features/",
    ];
    const allowedPaths = opt.allowedPaths || ["packages/design-tokens/"];

    const isIncluded = includePaths.some((p) =>
      filename.includes(p.replace(/\*\*/g, "")),
    );
    const isAllowed = allowedPaths.some((p) =>
      filename.includes(p.replace(/\*\*/g, "")),
    );

    if (!isIncluded || isAllowed) {
      return {};
    }

    function isHexColor(str) {
      return typeof str === "string" && HEX_COLOR_RE.test(str.trim());
    }

    function hasArbitraryColorInString(str) {
      if (typeof str !== "string") return false;
      TAILWIND_ARBITRARY_HEX_RE.lastIndex = 0;
      TAILWIND_ARBITRARY_FUNC_RE.lastIndex = 0;
      return (
        TAILWIND_ARBITRARY_HEX_RE.test(str) ||
        TAILWIND_ARBITRARY_FUNC_RE.test(str)
      );
    }

    function reportArbitraryColorsInString(node, str) {
      if (hasArbitraryColorInString(str)) {
        context.report({ node, messageId: "arbitraryColor" });
      }
    }

    function checkStringLiteral(node) {
      if (node.type !== "Literal" || typeof node.value !== "string") return;
      if (isHexColor(node.value)) {
        context.report({ node, messageId: "literalHex" });
        return;
      }
      reportArbitraryColorsInString(node, node.value);
    }

    function checkTemplateLiteral(node) {
      if (node.type !== "TemplateLiteral") return;
      node.quasis.forEach((quasi) => {
        const cooked = quasi.value?.cooked;
        if (isHexColor(cooked)) {
          context.report({ node: quasi, messageId: "literalHex" });
          return;
        }
        reportArbitraryColorsInString(quasi, cooked);
      });
    }

    return {
      Literal(node) {
        checkStringLiteral(node);
      },
      TemplateLiteral(node) {
        checkTemplateLiteral(node);
      },
    };
  },
};
