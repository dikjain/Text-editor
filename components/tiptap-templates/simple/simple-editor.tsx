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

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { NodeButton } from "@/components/tiptap-ui/node-button"
import {
  HighlightPopover,
  HighlightContent,
  HighlighterButton,
} from "@/components/tiptap-ui/highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useMobile } from "@/hooks/use-mobile"
import { useWindowSize } from "@/hooks/use-window-size"

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"

// --- Lib -
// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import { markdownToHtml } from "@/app/utils/markdownToHtml"


// Sample markdown data for testing
const SAMPLE_MARKDOWN = `
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

interface MainToolbarContentProps {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
}

const MainToolbarContent: React.FC<MainToolbarContentProps> = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}) => {
  const { editor } = React.useContext(EditorContext);

  const handleCopyMarkdown = () => {
    if (!editor) return;
    
    // A more robust approach: Get JSON content from editor and convert to Markdown
    const jsonContent = editor.getJSON();
    console.log("Editor JSON:", jsonContent);
    
    // Function to convert the editor's JSON structure to Markdown
    const convertToMarkdown = (content: any): string => {
      if (!content || !content.content) return "";
      
      let result = "";
      
      // Process each node in the content
      content.content.forEach((node: any) => {
        switch (node.type) {
          case "paragraph":
            result += convertInlineContent(node) + "\n\n";
            break;
            
          case "heading":
            const level = node.attrs.level;
            const headingText = convertInlineContent(node);
            result += `${"#".repeat(level)} ${headingText}\n\n`;
            break;
            
          case "bulletList":
            result += processBulletList(node, 0) + "\n";
            break;
            
          case "orderedList":
            result += processOrderedList(node, 0) + "\n";
            break;
            
          case "blockquote":
            const quoteContent = node.content ? convertToMarkdown(node) : "";
            result += quoteContent.split("\n").map((line: string) => `> ${line}`).join("\n") + "\n\n";
            break;
            
          case "codeBlock":
            const code = node.content ? convertInlineContent(node) : "";
            const lang = node.attrs?.language || "";
            result += `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
            break;
            
          // Add other node types as needed
        }
      });
      
      return result;
    };
    
    // Process inline marks (bold, italic, etc.)
    const convertInlineContent = (node: any): string => {
      if (!node.content) return "";
      
      let text = "";
      
      node.content.forEach((inline: any) => {
        if (inline.type === "text") {
          let content = inline.text || "";
          
          // Apply marks (bold, italic, etc.)
          if (inline.marks) {
            inline.marks.forEach((mark: any) => {
              switch (mark.type) {
                case "bold":
                  content = `**${content}**`;
                  break;
                case "italic":
                  content = `*${content}*`;
                  break;
                case "strike":
                  content = `~~${content}~~`;
                  break;
                case "underline":
                  content = `__${content}__`;
                  break;
                case "code":
                  content = `\`${content}\``;
                  break;
                case "link":
                  content = `[${content}](${mark.attrs.href})`;
                  break;
                // Add other marks as needed
              }
            });
          }
          
          text += content;
        }
      });
      
      return text;
    };
    
    // Process bullet lists
    const processBulletList = (node: any, level: number): string => {
      if (!node.content) return "";
      
      let result = "";
      const indent = "  ".repeat(level);
      
      node.content.forEach((item: any) => {
        if (item.type === "listItem") {
          // Get text content of this list item
          let itemContent = "";
          
          if (item.content) {
            item.content.forEach((content: any) => {
              if (content.type === "paragraph") {
                itemContent += convertInlineContent(content);
              } else if (content.type === "bulletList") {
                itemContent += "\n" + processBulletList(content, level + 1);
              } else if (content.type === "orderedList") {
                itemContent += "\n" + processOrderedList(content, level + 1);
              }
            });
          }
          
          result += `${indent}- ${itemContent.trimStart()}\n`;
        }
      });
      
      return result;
    };
    
    // Process ordered lists with consistent 4-space indentation
    const processOrderedList = (node: any, level: number): string => {
      if (!node.content) return "";
      
      let result = "";
      const indent = "    ".repeat(level); // 4 spaces per level
      
      node.content.forEach((item: any, index: number) => {
        if (item.type === "listItem") {
          let itemContent = "";
          
          if (item.content) {
            item.content.forEach((content: any) => {
              if (content.type === "paragraph") {
                itemContent += convertInlineContent(content);
              } else if (content.type === "orderedList") {
                itemContent += "\n" + processOrderedList(content, level + 1);
              } else if (content.type === "bulletList") {
                itemContent += "\n" + processBulletList(content, level + 1);
              }
            });
          }
          
          result += `${indent}${index + 1}. ${itemContent.trimStart()}\n`;
        }
      });
      
      return result;
    };
    
    try {
      // Try the JSON approach first
      const markdown = convertToMarkdown(jsonContent);
      console.log("Generated markdown:", markdown);
      
      // Copy to clipboard
      navigator.clipboard.writeText(markdown)
        .then(() => {
          console.log('Markdown copied to clipboard successfully');
          // You could add a toast notification here
        })
        .catch(err => {
          console.error('Failed to copy markdown:', err);
        });
    } catch (error) {
      console.error("Error converting to markdown:", error);
      
      // Fallback to HTML approach if JSON conversion fails
      try {
        const htmlContent = editor.getHTML();
        console.log("Falling back to HTML approach");
        
        // Create simpler HTML to Markdown converter here
        // This is a simplified version that may not handle all cases perfectly
        
        // ... (your existing HTML approach)
      } catch (fallbackError) {
        console.error("Both conversion approaches failed:", fallbackError);
      }
    }
  };

  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
        <Button onClick={handleCopyMarkdown}>
          <svg className="tiptap-button-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 2H9C8.44772 2 8 2.44772 8 3V5C8 5.55228 8.44772 6 9 6H15C15.5523 6 16 5.55228 16 5V3C16 2.44772 15.5523 2 15 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Copy Markdown
        </Button>
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} />
        <ListDropdownMenu types={["bulletList", "orderedList"]} />
        <NodeButton type="blockquote" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <Button
          onClick={() => {
            if (!editor) return;
            const { state } = editor.view;
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
              editor.commands.sinkListItem('listItem');
            }
          }}
          disabled={!editor?.can().sinkListItem('listItem')}
        >
          Indent
        </Button>
        <Button
          onClick={() => editor?.commands.liftListItem('listItem')}
          disabled={!editor?.can().liftListItem('listItem')}
        >
          Outdent
        </Button>
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <HighlightPopover />
        ) : (
          <HighlighterButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  );
};

interface MobileToolbarContentProps {
  type: "highlighter" | "link";
  onBack: () => void;
}

const MobileToolbarContent: React.FC<MobileToolbarContentProps> = ({
  type,
  onBack,
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? <HighlightContent /> : <LinkContent />}
  </>
);

export function SimpleEditor() {
  const isMobile = useMobile();
  const windowSize = useWindowSize();
  const [mobileView, setMobileView] = React.useState<
    "main" | "highlighter" | "link"
  >("main");
  const [rect, setRect] = React.useState<
    Pick<DOMRect, "x" | "y" | "width" | "height">
  >({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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

  const editor = useEditor({
    immediatelyRender: false,
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
            // Check if we're at the 3rd level
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
            
            // Only allow indentation if we're not at the 3rd level
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
    content: markdownToHtml(SAMPLE_MARKDOWN),
  });

  React.useEffect(() => {
    const checkCursorVisibility = () => {
      if (!editor || !toolbarRef.current) return;

      const { state, view } = editor;
      if (!view.hasFocus()) return;

      const { from } = state.selection;
      const cursorCoords = view.coordsAtPos(from);

      if (windowSize.height < rect.height) {
        if (cursorCoords && toolbarRef.current) {
          const toolbarHeight =
            toolbarRef.current.getBoundingClientRect().height;
          const isEnoughSpace =
            windowSize.height - cursorCoords.top - toolbarHeight > 0;

          // If not enough space, scroll until the cursor is the middle of the screen
          if (!isEnoughSpace) {
            const scrollY =
              cursorCoords.top - windowSize.height / 2 + toolbarHeight;
            window.scrollTo({
              top: scrollY,
              behavior: "smooth",
            });
          }
        }
      }
    };

    checkCursorVisibility();
  }, [editor, rect.height, windowSize.height]);

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  return (
    <EditorContext.Provider value={{ editor }}>
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