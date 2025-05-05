"use client"

import * as React from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { TaskItem } from "@tiptap/extension-task-item"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Underline } from "@tiptap/extension-underline"
import { BulletList } from "@tiptap/extension-bullet-list"
import { OrderedList } from "@tiptap/extension-ordered-list"
import { ListItem } from "@tiptap/extension-list-item"

// --- Custom Extensions ---
import { Link } from "@/components/tiptap-extension/link-extension"
import { Selection } from "@/components/tiptap-extension/selection-extension"
import { TrailingNode } from "@/components/tiptap-extension/trailing-node-extension"

// --- Components ---
import { Toolbar } from "@/components/tiptap-ui-primitive/toolbar"
import { MainToolbarContent, MobileToolbarContent, CopyOnlyToolbar } from "./toolbar-content"

// --- Hooks ---
import { useMobile } from "@/hooks/use-mobile"
import { useWindowSize } from "@/hooks/use-window-size"

// --- Utils ---
import { markdownToHtml } from "@/app/utils/markdownToHtml"

// --- Styles ---
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"
import "@/components/tiptap-templates/simple/simple-editor.scss"
import { useEffect } from "react"

const sampleMarkdownContent = `
# Welcome to the Editor, Userology

This is a **simple** editor with _markdown_ support.

## Features

- Rich text editing
- Markdown support
- Task lists

### Code Example

\`\`\`javascript
function hello() {
  console.log("Hello world!");
}
\`\`\`

> This is a blockquote that can be used for important notes.

1. First ordered item
    1. Nested item
        1. Deep nested item
2. Second ordered item

- [ ] Task to complete
- [x] Completed task
`;



interface SimpleEditorProps {
  readOnly?: boolean;
  text?: string;
}

export function SimpleEditor({ readOnly = false , text = sampleMarkdownContent }: SimpleEditorProps) {
  const isMobile = useMobile();
  const windowSize = useWindowSize();
  const [mobileView, setMobileView] = React.useState<"main" | "highlighter" | "link">("main");
  const [rect, setRect] = React.useState<Pick<DOMRect, "x" | "y" | "width" | "height">>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [sampleMarkdown, setSampleMarkdown] = React.useState(text);
  
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Tab') {
          event.preventDefault();
          if (event.shiftKey) {
            editor?.commands.liftListItem('listItem');
          } else {
            const { state } = view;
            const { selection } = state;
            const { $from } = selection;
            let depth = 0;
            let node: any = $from.node();
            
            while (node) {
              if (node.type.name === 'listItem') {
                depth++;
              }
              node = node.parent;
            }
            
            if (depth < 3) {
              editor?.commands.sinkListItem('listItem');
            }
          }
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain');
        if (text) {
          event.preventDefault();
          const htmlContent = markdownToHtml(text);
          editor?.commands.insertContent(htmlContent);
          return true;
        }
        return false;
      }
    },
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      BulletList,
      OrderedList.configure({
        HTMLAttributes: {
          class: 'ordered-list',
        },
        itemTypeName: 'listItem',
        keepMarks: true,
        keepAttributes: false,
      }),
      ListItem,
      Underline,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Typography,
      Superscript,
      Subscript,
      Selection,
      TrailingNode,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        }
      }),
    ],
    content: markdownToHtml(text),
  });

  useEffect(() => {
      editor?.commands.setContent(markdownToHtml(text));
  }, [editor, text]);

  useEffect(() => {
    const updateRect = () => {
      setRect(document.body.getBoundingClientRect());
    };

    updateRect();
    const resizeObserver = new ResizeObserver(updateRect);
    resizeObserver.observe(document.body);
    window.addEventListener("scroll", updateRect);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateRect);
    };
  }, []);

  useEffect(() => {
    const checkCursorVisibility = () => {
      if (!editor || !toolbarRef.current) return;

      const { state, view } = editor;
      if (!view.hasFocus()) return;

      const { from } = state.selection;
      const cursorCoords = view.coordsAtPos(from);

      if (windowSize.height < rect.height && cursorCoords) {
        const toolbarHeight = toolbarRef.current.getBoundingClientRect().height;
        const isEnoughSpace = windowSize.height - cursorCoords.top - toolbarHeight > 0;

        if (!isEnoughSpace) {
          const scrollY = cursorCoords.top - windowSize.height / 2 + toolbarHeight;
          window.scrollTo({
            top: scrollY,
            behavior: "smooth",
          });
        }
      }
    };

    checkCursorVisibility();
  }, [editor, rect.height, windowSize.height]);

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  return (
    <EditorContext.Provider value={{ editor }}>
      {!readOnly ? (
        <Toolbar
          ref={toolbarRef}
          style={
            isMobile
              ? {
                  bottom: `calc(100% - ${windowSize.height - rect.y}px)`,
                }
              : {}
          }
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>
      ) : (
        <CopyOnlyToolbar />
      )}

      <div className="content-wrapper">
        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </div>
    </EditorContext.Provider>
  );
}