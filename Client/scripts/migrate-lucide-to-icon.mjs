import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

/**
 * Converts `lucide-react` component identifiers to our `IconName` kebab-case vocabulary.
 * Keep this list in sync with `packages/ui/types/icons.ts` and `packages/ui/components/icons/Icon.*`.
 */
const LUCIDE_IMPORT_TO_ICON_NAME = {
  Activity: "activity",
  AlertCircle: "alert-circle",
  AlertTriangle: "alert-triangle",
  ArrowLeft: "arrow-left",
  ArrowRight: "arrow-right",
  Asterisk: "asterisk",
  BarChart2: "bar-chart-2",
  Bath: "bath",
  Bed: "bed",
  Bookmark: "bookmark",
  Bot: "bot",
  Building: "building",
  Building2: "building-2",
  Calendar: "calendar",
  Check: "check",
  CheckCircle: "check-circle",
  CheckCircle2: "check-circle-2",
  CheckSquare: "check-square",
  ChevronDown: "chevron-down",
  ChevronLeft: "chevron-left",
  ChevronRight: "chevron-right",
  ChevronUp: "chevron-up",
  ClipboardCheck: "clipboard-check",
  Clock: "clock",
  Copy: "copy",
  CreditCard: "credit-card",
  DollarSign: "dollar-sign",
  Download: "download",
  Edit: "edit",
  ExternalLink: "external-link",
  Eye: "eye",
  EyeOff: "eye-off",
  File: "file",
  FileImage: "file-image",
  FileSignature: "file-signature",
  FileText: "file-text",
  Flag: "flag",
  FolderLock: "folder-lock",
  Footprints: "footprints",
  GitCompare: "git-compare",
  GraduationCap: "graduation-cap",
  Grid3X3: "grid-3x3",
  Handshake: "handshake",
  Heart: "heart",
  Home: "home",
  Inbox: "inbox",
  Info: "info",
  Key: "key",
  Lightbulb: "lightbulb",
  Link2: "link-2",
  Loader2: "loader-2",
  Lock: "lock",
  LogIn: "log-in",
  LogOut: "log-out",
  Mail: "mail",
  Map: "map",
  MapPin: "map-pin",
  Menu: "menu",
  MessageCircle: "message-circle",
  MessageSquare: "message-square",
  MoreHorizontal: "more-horizontal",
  Pencil: "pencil",
  Phone: "phone",
  Plus: "plus",
  Receipt: "receipt",
  RefreshCw: "refresh-cw",
  Save: "save",
  Search: "search",
  Send: "send",
  SendHorizontal: "send-horizontal",
  Settings2: "settings-2",
  Share: "share",
  Shield: "shield",
  SlidersHorizontal: "sliders-horizontal",
  Sparkles: "sparkles",
  Square: "square",
  Target: "target",
  Trash2: "trash-2",
  TrendingDown: "trending-down",
  TrendingUp: "trending-up",
  Upload: "upload",
  User: "user",
  Users: "users",
  UtensilsCrossed: "utensils-crossed",
  Video: "video",
  Volume2: "volume-2",
  VolumeX: "volume-x",
  X: "x",
  XCircle: "x-circle",
};

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  "dist",
  "coverage",
  "playwright-report",
  ".expo",
  ".next",
  "ios",
  "android",
]);

function shouldSkipFile(absPath) {
  const norm = absPath.split(path.sep).join("/");
  // Keep icon libraries confined to the icon layer.
  if (norm.includes("/packages/ui/components/icons/")) return true;
  return false;
}

function walk(dirAbs, out) {
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      walk(path.join(dirAbs, entry.name), out);
    } else if (entry.isFile()) {
      if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
      out.push(path.join(dirAbs, entry.name));
    }
  }
}

function isLucideReactImport(decl) {
  return (
    ts.isImportDeclaration(decl) &&
    ts.isStringLiteral(decl.moduleSpecifier) &&
    decl.moduleSpecifier.text === "lucide-react"
  );
}

function ensureIconImport(statements) {
  // If an import from "@ui/icons" exists, add Icon specifier if needed.
  for (let i = 0; i < statements.length; i++) {
    const st = statements[i];
    if (!ts.isImportDeclaration(st)) continue;
    if (!ts.isStringLiteral(st.moduleSpecifier)) continue;
    if (st.moduleSpecifier.text !== "@ui/icons") continue;
    const clause = st.importClause;
    if (!clause || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) break;

    const hasIcon = clause.namedBindings.elements.some((e) => e.name.text === "Icon");
    if (hasIcon) return statements;

    const nextNamedBindings = ts.factory.updateNamedImports(clause.namedBindings, [
      ...clause.namedBindings.elements,
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("Icon")),
    ]);
    const nextClause = ts.factory.updateImportClause(
      clause,
      clause.isTypeOnly,
      clause.name ?? undefined,
      nextNamedBindings
    );
    const nextDecl = ts.factory.updateImportDeclaration(
      st,
      st.modifiers,
      nextClause,
      st.moduleSpecifier,
      st.assertClause
    );
    const nextStatements = statements.slice();
    nextStatements[i] = nextDecl;
    return nextStatements;
  }

  const importDecl = ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports([
        ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("Icon")),
      ])
    ),
    ts.factory.createStringLiteral("@ui/icons"),
    undefined
  );

  // Insert after last import.
  let insertAt = 0;
  while (insertAt < statements.length && ts.isImportDeclaration(statements[insertAt])) {
    insertAt++;
  }
  return [...statements.slice(0, insertAt), importDecl, ...statements.slice(insertAt)];
}

function migrateFile(absPath) {
  if (shouldSkipFile(absPath)) return { changed: false };

  const original = fs.readFileSync(absPath, "utf8");
  if (!original.includes('"lucide-react"') && !original.includes("'lucide-react'")) {
    return { changed: false };
  }

  const scriptKind = absPath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(absPath, original, ts.ScriptTarget.Latest, true, scriptKind);

  /** @type {Record<string, { imported: string, local: string }>} */
  const localToImported = {};
  const nextStatements = [];

  for (const st of sf.statements) {
    if (isLucideReactImport(st)) {
      const clause = st.importClause;
      const isTypeOnly = clause?.isTypeOnly === true;

      if (!isTypeOnly && clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const el of clause.namedBindings.elements) {
          const imported = (el.propertyName?.text ?? el.name.text).trim();
          const local = el.name.text.trim();
          if (imported === "LucideIcon") continue; // type handled separately elsewhere
          if (Object.prototype.hasOwnProperty.call(LUCIDE_IMPORT_TO_ICON_NAME, imported)) {
            localToImported[local] = { imported, local };
          }
        }
      }
      // Drop the lucide-react import entirely.
      continue;
    }
    nextStatements.push(st);
  }

  let didReplaceAny = false;

  /** @type {import("typescript").TransformerFactory<import("typescript").SourceFile>} */
  const transformer = (ctx) => {
    const visit = (node) => {
      if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
        const tag = node.tagName;
        if (ts.isIdentifier(tag) && localToImported[tag.text]) {
          const imported = localToImported[tag.text].imported;
          const iconName = LUCIDE_IMPORT_TO_ICON_NAME[imported];
          if (!iconName) return node;

          didReplaceAny = true;

          const existingAttrs = node.attributes.properties;
          const hasNameAttr = existingAttrs.some(
            (p) => ts.isJsxAttribute(p) && ts.isIdentifier(p.name) && p.name.text === "name"
          );

          const nameAttr = ts.factory.createJsxAttribute(
            ts.factory.createIdentifier("name"),
            ts.factory.createStringLiteral(iconName)
          );

          const nextAttrs = ts.factory.updateJsxAttributes(node.attributes, [
            ...(hasNameAttr ? [] : [nameAttr]),
            ...existingAttrs,
          ]);

          if (ts.isJsxSelfClosingElement(node)) {
            return ts.factory.updateJsxSelfClosingElement(
              node,
              ts.factory.createIdentifier("Icon"),
              node.typeArguments,
              nextAttrs
            );
          }
          return ts.factory.updateJsxOpeningElement(
            node,
            ts.factory.createIdentifier("Icon"),
            node.typeArguments,
            nextAttrs
          );
        }
      }

      if (ts.isJsxClosingElement(node)) {
        const tag = node.tagName;
        if (ts.isIdentifier(tag) && localToImported[tag.text]) {
          didReplaceAny = true;
          return ts.factory.updateJsxClosingElement(node, ts.factory.createIdentifier("Icon"));
        }
      }

      return ts.visitEachChild(node, visit, ctx);
    };

    return (node) => ts.visitNode(node, visit);
  };

  const transformed = ts.transform(sf, [transformer]);
  const transformedSf = transformed.transformed[0];
  transformed.dispose();

  let finalStatements = Array.from(transformedSf.statements).filter(
    (st) => !isLucideReactImport(st)
  );

  if (didReplaceAny) finalStatements = ensureIconImport(finalStatements);

  const updatedSf = ts.factory.updateSourceFile(transformedSf, finalStatements);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const nextText = printer.printFile(updatedSf);

  if (nextText !== original) {
    fs.writeFileSync(absPath, nextText, "utf8");
    return { changed: true, didReplaceAny };
  }
  return { changed: false };
}

function main() {
  const clientRoot = path.resolve(process.cwd());
  const files = [];
  walk(clientRoot, files);

  let changed = 0;
  for (const absPath of files) {
    const result = migrateFile(absPath);
    if (result.changed) changed++;
  }

  process.stdout.write(`lucide-react → Icon migration complete. Files changed: ${changed}\n`);
}

main();
