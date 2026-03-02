"use strict";

/**
 * TypeScript diagnostic codes for "Cannot find name 'X'." (and "Did you mean ...?" variant).
 * @see https://github.com/microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
 */
const TS_CANNOT_FIND_NAME = 2304;
const TS_CANNOT_FIND_NAME_SUGGESTION = 2552;
const UNIMPORTED_CODES = [TS_CANNOT_FIND_NAME, TS_CANNOT_FIND_NAME_SUGGESTION];

/**
 * Flatten TypeScript DiagnosticMessage (string or { message: string, next?: DiagnosticMessageChain }).
 * @param {string | { message: string; next?: unknown } } messageText
 * @returns {string}
 */
function flattenMessageText(messageText) {
  if (typeof messageText === "string") return messageText;
  if (messageText && typeof messageText === "object" && "message" in messageText) {
    const head = messageText.message;
    const next = messageText.next;
    if (next && Array.isArray(next)) {
      return [head, ...next.map(flattenMessageText)].join(" ");
    }
    if (next && typeof next === "object" && "message" in next) {
      return head + " " + flattenMessageText(next);
    }
    return head;
  }
  return String(messageText);
}

/**
 * Report identifiers that are used but not imported (TS semantic diagnostic 2304).
 * Requires type-aware linting (parserOptions.project or projectService).
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Report identifiers that are used in the file but not imported or declared (catches missing imports like 'usePreferencesSubmit is not defined').",
    },
    schema: [],
    messages: {
      notImported: "{{name}} is used but not imported or declared. {{message}}",
    },
  },

  create(context) {
    return {
      Program(programNode) {
        const parserServices = context.sourceCode?.parserServices;
        const program = parserServices?.program;
        if (!program) return;

        const tsNode = parserServices.esTreeNodeToTSNodeMap?.get(programNode);
        const sourceFile = tsNode ? tsNode.getSourceFile() : null;
        if (!sourceFile) return;

        const semantic = program.getSemanticDiagnostics(sourceFile);
        const syntactic = program.getSyntacticDiagnostics(sourceFile);
        const diagnostics = [...syntactic, ...semantic];

        for (const diagnostic of diagnostics) {
          if (!UNIMPORTED_CODES.includes(diagnostic.code)) continue;

          const start = diagnostic.start;
          const length = diagnostic.length ?? 0;
          if (start == null) continue;

          const { line, character } = sourceFile.getLineAndCharacterOfPosition(start);
          const endPos = Math.min(start + length, sourceFile.getEnd());
          const { line: endLine, character: endCharacter } =
            sourceFile.getLineAndCharacterOfPosition(endPos);

          const message = flattenMessageText(diagnostic.messageText);
          const nameMatch = message.match(/Cannot find name '([^']+)'/);
          const name = nameMatch ? nameMatch[1] : "Identifier";

          context.report({
            messageId: "notImported",
            data: { name, message },
            loc: {
              start: { line: line + 1, column: character },
              end: { line: endLine + 1, column: endCharacter },
            },
          });
        }
      },
    };
  },
};
