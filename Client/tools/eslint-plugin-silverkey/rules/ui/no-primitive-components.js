module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce UI standardization: ban primitive HTML elements in favor of design system components from components/ui. Use Button, Image, Video, Title, BodyText, Label, Input, Select, etc.",
    },
    schema: [
      {
        type: "object",
        properties: {
          primitives: {
            type: "array",
            items: { type: "string" },
          },
          uiLibraryPath: {
            type: "string",
          },
          exceptions: {
            type: "object",
            properties: {
              uiComponents: { type: "boolean" },
              testFiles: { type: "boolean" },
              externalLinks: { type: "boolean" },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useButton:
        "Use <Button> from components/ui instead of <button>. Import: import { Button } from '../ui'",
      useLink:
        "Use <Link> from react-router-dom or <NavigationButton> from components/ui instead of <a>. For external links, use <a> with href starting with http:// or https://",
      useBodyText:
        "Use <BodyText as='span'> from components/ui instead of <span>. Import: import { BodyText } from '../ui'",
      useImage:
        "Use <Image> from components/ui instead of <img>. Import: import { Image } from '../ui'",
      useVideo:
        "Use <Video> from components/ui instead of <video>. Import: import { Video } from '../ui'",
      useBodyTextP:
        "Use <BodyText as='p'> from components/ui instead of <p>. Import: import { BodyText } from '../ui'",
      useTitle:
        "Use <Title as='h1'|'h2'|...> from components/ui instead of <h1>-<h6>. Import: import { Title } from '../ui'",
      useInput:
        "Use <Input> or <AccessibleTextInput> from components/ui instead of <input>. Import: import { Input } from '../ui'",
      useTextarea:
        "Use <AccessibleTextInput> or form components from components/ui instead of <textarea>. Import from '../ui'",
      useSelect:
        "Use <Select> from components/ui instead of <select>. Import: import { Select } from '../ui'",
      useLabel:
        "Use <Label> from components/ui instead of <label>. Import: import { Label } from '../ui'",
    },
  },

  create(context) {
    const filename = context.getFilename();
    const opt = context.options[0] || {};
    const primitives = opt.primitives || [
      "button",
      "a",
      "span",
      "img",
      "video",
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "input",
      "textarea",
      "select",
      "label",
    ];
    const exceptions = opt.exceptions || {
      uiComponents: true,
      testFiles: true,
      externalLinks: true,
    };

    // Only apply to components, features, and pages directories
    if (
      !filename.includes("apps/web/components/") &&
      !filename.includes("apps/web/features/") &&
      !filename.includes("apps/web/pages/")
    ) {
      return {};
    }

    // Allow in UI components themselves
    if (
      exceptions.uiComponents &&
      filename.includes("apps/web/components/ui/")
    ) {
      return {};
    }

    // Allow in test files
    if (
      exceptions.testFiles &&
      (filename.includes(".test.") || filename.includes(".spec."))
    ) {
      return {};
    }

    // Helper to check if <a> is external link
    const isExternalLink = (node) => {
      if (!node || !node.attributes) return false;
      const hrefAttr = node.attributes.find(
        (attr) => attr.name && attr.name.name === "href",
      );
      if (!hrefAttr || !hrefAttr.value) return false;

      if (
        hrefAttr.value.type === "Literal" &&
        typeof hrefAttr.value.value === "string"
      ) {
        const hrefValue = hrefAttr.value.value;
        return (
          hrefValue.startsWith("http://") || hrefValue.startsWith("https://")
        );
      }

      if (hrefAttr.value.type === "JSXExpressionContainer") {
        return false;
      }

      return false;
    };

    const messageIdByElement = {
      button: "useButton",
      a: "useLink",
      span: "useBodyText",
      img: "useImage",
      video: "useVideo",
      p: "useBodyTextP",
      h1: "useTitle",
      h2: "useTitle",
      h3: "useTitle",
      h4: "useTitle",
      h5: "useTitle",
      h6: "useTitle",
      input: "useInput",
      textarea: "useTextarea",
      select: "useSelect",
      label: "useLabel",
    };

    return {
      JSXOpeningElement(node) {
        const elementName = node.name && node.name.name;
        if (!elementName) return;

        if (!primitives.includes(elementName)) return;

        // Allow external <a> when exception is enabled
        if (
          elementName === "a" &&
          exceptions.externalLinks &&
          isExternalLink(node)
        ) {
          return;
        }

        const messageId = messageIdByElement[elementName];
        if (messageId) {
          context.report({
            node,
            messageId,
          });
        }
      },
    };
  },
};
