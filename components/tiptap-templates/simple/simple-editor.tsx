"use client"

import * as React from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { TaskItem } from "@tiptap/extension-task-item"
import { Typography } from "@tiptap/extension-typography"
import { Underline } from "@tiptap/extension-underline"
import { BulletList } from "@tiptap/extension-bullet-list"
import { OrderedList } from "@tiptap/extension-ordered-list"
import { ListItem } from "@tiptap/extension-list-item"
import { Strike } from '@tiptap/extension-strike'
import { TextSelection } from 'prosemirror-state'

// --- Custom Extensions ---
import { isValidDomain, Link } from "@/components/tiptap-extension/link-extension"
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
import { normalizeHref } from "@/components/tiptap-extension/link-extension"
import { convertToMarkdown } from "@/utils/markdownConverter"

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
  const [isReadOnly, setIsReadOnly] = React.useState(readOnly);
  
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !isReadOnly,
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

        // Handle Enter and Shift+Enter for text formatting
        if (event.key === 'Enter') {
          const { state } = view;
          const { selection } = state;
          const { $from } = selection;
          const marks = $from.marks();

          // If Shift+Enter, keep the formatting
          if (event.shiftKey) {
            return false;
          }

          // If Enter and there are marks, create a new line without formatting
          if (marks.length > 0) {
            event.preventDefault();
            
            // Create a new paragraph node
            const { tr } = view.state;
            const pos = selection.from;
            
            // Insert a new line and remove marks
            tr.insert(pos, view.state.schema.nodes.paragraph.create())
              .setStoredMarks([])
              .setSelection(TextSelection.create(tr.doc, pos + 1));
            
            view.dispatch(tr);
            return true;
          }
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
        strike: false,
      }),
      Strike.extend({
        addKeyboardShortcuts() {
          return {
            'Alt-Shift-5': () => this.editor.commands.toggleStrike(),
          }
        },
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
      Typography,
      Selection,
      TrailingNode,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: markdownToHtml(text),
  });

  useEffect(() => {
      editor?.commands.setContent(markdownToHtml(text));
  }, [editor, text]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [editor, isReadOnly]);

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

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.tagName === 'a' || target.tagName === 'button' || target.tagName === 'span' || target.classList.contains('tiptap-button')) {
        const href = (target as HTMLAnchorElement).getAttribute('href');
        if (href) {
          e.preventDefault();
          const normalized = /^https?:\/\//i.test(href) ? href : `https://${href}`;
          window.open(normalized, '_blank', 'noopener,noreferrer');
        }
      }
    };

    const editorContent = document.querySelector('.simple-editor-content');
    editorContent?.addEventListener('click', handleLinkClick as EventListener);

    return () => {
      editorContent?.removeEventListener('click', handleLinkClick as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleCopy = (event: ClipboardEvent) => {
      if (!editor) return;
      const selection = window.getSelection();
      if (!selection) return;
      event.preventDefault();
      try {
        const { from, to } = editor.state.selection;
        let markdown = '';
        if (from !== to) {
          // Always wrap the selected content in a doc node
          const selectedContent = editor.state.doc.slice(from, to).content.toJSON();
          markdown = convertToMarkdown({ type: 'doc', content: selectedContent });
        } else {
          const jsonContent = editor.getJSON();
          markdown = convertToMarkdown(jsonContent);
        }
        event.clipboardData?.setData('text/plain', markdown);
        event.clipboardData?.setData('text/markdown', markdown);
      } catch (error) {
        // fallback: let default copy happen
      }
    };

    document.addEventListener('copy', handleCopy as EventListener);
    return () => {
      document.removeEventListener('copy', handleCopy as EventListener);
    };
  }, [editor]);

  return (
    <EditorContext.Provider value={{ editor }}>
      <div className="editor-controls">
        <label className="read-only-toggle">
          <input
            type="checkbox"
            checked={isReadOnly}
            onChange={() => setIsReadOnly(!isReadOnly)}
          />
          Read Only
        </label>
      </div>
      
      {!isReadOnly ? (
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