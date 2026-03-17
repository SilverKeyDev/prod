/**
 * Stub rule for no-dynamic-class-names.
 * Disallow dynamic Tailwind class names (e.g. cn(`text-${color}`)) in favor of static cn() or safelist.
 * Currently a no-op; enables eslint-disable comments to work without "rule not found" errors.
 * TODO: Implement full rule to flag dynamic class construction.
 */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer static Tailwind class names over dynamic construction. Use cn() with static strings or add to safelist.",
    },
    schema: [],
    messages: {},
  },

  create() {
    return {};
  },
};
