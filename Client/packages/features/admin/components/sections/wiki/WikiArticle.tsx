import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  resolveRelativeWikiHref,
  slugifyHeading,
  wikiHrefForDocPath,
} from "packages/features/admin/utils/wiki/wikiTree";
import { BodyText, Box, Button, Title } from "packages/ui";
import { getDocument, getWindow } from "packages/utils/core/platform";

type WikiArticleProps = {
  content: string;
  currentDocPath: string;
  onNavigate: (docPath: string) => void;
};

function headingId(children: React.ReactNode): string {
  const text = flattenText(children);
  return slugifyHeading(text);
}

function flattenText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(flattenText).join("");
  }
  if (node && typeof node === "object" && "props" in node) {
    const el = node as { props?: { children?: React.ReactNode } };
    return flattenText(el.props?.children);
  }
  return "";
}

export function WikiArticle({ content, currentDocPath, onNavigate }: WikiArticleProps) {
  const components: Components = {
    h1: ({ children }) => (
      <Title size="xl" as="h1" className="mb-4 mt-2" id={headingId(children)}>
        {children}
      </Title>
    ),
    h2: ({ children }) => (
      <Title size="lg" as="h2" className="mb-3 mt-8 scroll-mt-4" id={headingId(children)}>
        {children}
      </Title>
    ),
    h3: ({ children }) => (
      <Title size="md" as="h3" className="mb-2 mt-6 scroll-mt-4" id={headingId(children)}>
        {children}
      </Title>
    ),
    h4: ({ children }) => (
      <Title size="sm" as="h4" className="mb-2 mt-4" id={headingId(children)}>
        {children}
      </Title>
    ),
    p: ({ children }) => (
      <BodyText size="md" className="mb-3 leading-relaxed">
        {children}
      </BodyText>
    ),
    li: ({ children }) => (
      <li className="mb-1">
        <BodyText size="md" as="span">
          {children}
        </BodyText>
      </li>
    ),
    ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>,
    ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>,
    a: ({ href, children }) => {
      const label = flattenText(children) || "Open link";
      const relative = href ? resolveRelativeWikiHref(href, currentDocPath) : null;
      if (relative !== null) {
        return (
          <Button
            variant="ghost"
            size="sm"
            label={label}
            onPress={() => onNavigate(relative)}
            className="text-brand-accent inline h-auto px-0 py-0 font-normal underline underline-offset-2"
          >
            {children}
          </Button>
        );
      }
      if (href?.startsWith("#")) {
        const id = href.slice(1);
        return (
          <Button
            variant="ghost"
            size="sm"
            label={label}
            onPress={() => {
              getDocument()
                ?.getElementById(id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="text-brand-accent inline h-auto px-0 py-0 font-normal underline underline-offset-2"
          >
            {children}
          </Button>
        );
      }
      if (href && /^https?:\/\//i.test(href)) {
        return (
          <Button
            variant="ghost"
            size="sm"
            label={label}
            onPress={() => {
              getWindow()?.open(href, "_blank", "noopener,noreferrer");
            }}
            className="text-brand-accent inline h-auto px-0 py-0 font-normal underline underline-offset-2"
          >
            {children}
          </Button>
        );
      }
      return (
        <Button
          variant="ghost"
          size="sm"
          label={label}
          onPress={() => {
            if (href) getWindow()?.open(href, "_blank", "noopener,noreferrer");
          }}
          className="text-brand-accent inline h-auto px-0 py-0 font-normal underline underline-offset-2"
        >
          {children}
        </Button>
      );
    },
    code: ({ className, children }) => {
      const isBlock = Boolean(className);
      if (isBlock) {
        return (
          <code
            className={`${className ?? ""} block overflow-x-auto rounded bg-gray-900 p-3 text-sm text-gray-100`}
          >
            {children}
          </code>
        );
      }
      return (
        <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.875em] text-gray-800">
          {children}
        </code>
      );
    },
    pre: ({ children }) => <pre className="mb-4 overflow-x-auto rounded-md">{children}</pre>,
    blockquote: ({ children }) => (
      <blockquote className="mb-4 border-l-4 border-gray-300 pl-4 italic text-gray-600">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <Box className="mb-4 w-full overflow-x-auto">
        <table className="w-full min-w-80 border-collapse text-left text-sm">{children}</table>
      </Box>
    ),
    th: ({ children }) => (
      <th className="border border-gray-200 bg-gray-50 px-3 py-2 font-medium">{children}</th>
    ),
    td: ({ children }) => (
      <td className="border border-gray-200 px-3 py-2 align-top">{children}</td>
    ),
    hr: () => <hr className="my-6 border-gray-200" />,
  };

  return (
    <Box className="prose-wiki min-w-0 flex-1" data-wiki-href={wikiHrefForDocPath(currentDocPath)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </Box>
  );
}
