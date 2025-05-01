"use client"

import * as React from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem } from "@tiptap/extension-task-item"
import { TaskList } from "@tiptap/extension-task-list"
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
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
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

import content from "@/components/tiptap-templates/simple/data/content.json"

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  const { editor } = React.useContext(EditorContext)

  const handleCopyMarkdown = () => {
    if (!editor) return
    
    // Get the editor content as HTML
    const html = editor.getHTML()
    
    // Convert HTML to Markdown
    // This is a more comprehensive conversion to properly handle markdown formatting
    let markdown = html
      // Headings
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
      .replace(/<h4>(.*?)<\/h4>/g, '#### $1\n\n')
      // Paragraphs
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      // Text formatting
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<u>(.*?)<\/u>/g, '__$1__')
      .replace(/<s>(.*?)<\/s>/g, '~~$1~~')
      // Code blocks
      .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```\n\n')
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      // Lists - handle nested lists better
      .replace(/<ul>([\s\S]*?)<\/ul>/g, function(match: string, content: string) {
        return content.replace(/<li>([\s\S]*?)<\/li>/g, '- $1\n');
      })
      // Handle ordered lists with proper nesting
      .replace(/<ol>([\s\S]*?)<\/ol>/g, function(match: string, content: string) {
        // Count the number of spaces before the list to determine nesting level
        const baseIndent = (match.match(/^\s*/) || [''])[0].length;
        let result = '';
        let currentIndent = baseIndent;
        let counters: number[] = [0];
        
        content.split('\n').forEach(line => {
          const indent = (line.match(/^\s*/) || [''])[0].length;
          const isListItem = line.includes('<li>');
          
          if (isListItem) {
            // Adjust counters array based on indentation level
            while (counters.length <= (indent - baseIndent) / 4) {
              counters.push(0);
            }
            while (counters.length > (indent - baseIndent) / 4 + 1) {
              counters.pop();
            }
            
            // Increment the counter for the current level
            counters[counters.length - 1]++;
            
            // Generate the number with proper dots
            const number = counters.join('.');
            
            // Replace the list item with proper indentation and number
            result += ' '.repeat(indent) + number + '. ' + 
              line.replace(/<li>(.*?)<\/li>/, '$1').trim() + '\n';
          } else {
            result += line + '\n';
          }
        });
        
        return result;
      })
      // Task lists
      .replace(/<li data-type="taskItem" data-checked="true">([\s\S]*?)<\/li>/g, '- [x] $1\n')
      .replace(/<li data-type="taskItem" data-checked="false">([\s\S]*?)<\/li>/g, '- [ ] $1\n')
      // Blockquotes
      .replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, function(match: string, content: string) {
        return content.split('\n').map((line: string) => `> ${line}`).join('\n') + '\n\n';
      })
      // Links
      .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')
      // Images
      .replace(/<img src="(.*?)" alt="(.*?)".*?>/g, '![$2]($1)')
      // Line breaks
      .replace(/<br\s*\/?>/g, '\n')
      // Clean up any remaining HTML tags
      .replace(/<[^>]+>/g, '')
      // Clean up excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim()
    
    // Copy to clipboard
    navigator.clipboard.writeText(markdown)
      .then(() => {
        console.log('Markdown copied to clipboard')
        // You could add a toast notification here
      })
      .catch(err => {
        console.error('Failed to copy markdown:', err)
      })
  }

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
        <ListDropdownMenu types={["bulletList", "orderedList", "taskList"]} />
        <NodeButton type="blockquote" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <Button
          onClick={() => {
            if (!editor) return
            const { state } = editor.view
            const { selection } = state
            const { $from } = selection
            let depth = 0
            let node: any = $from.node()
            
            while (node) {
              if (node.type.name === 'listItem') {
                depth++
              }
              node = node.parent
            }
            
            if (depth < 3) {
              editor.commands.sinkListItem('listItem')
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
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
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
)

export function SimpleEditor() {
  const isMobile = useMobile()
  const windowSize = useWindowSize()
  const [mobileView, setMobileView] = React.useState<
    "main" | "highlighter" | "link"
  >("main")
  const [rect, setRect] = React.useState<
    Pick<DOMRect, "x" | "y" | "width" | "height">
  >({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const updateRect = () => {
      setRect(document.body.getBoundingClientRect())
    }

    updateRect()

    const resizeObserver = new ResizeObserver(updateRect)
    resizeObserver.observe(document.body)

    window.addEventListener("scroll", updateRect)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("scroll", updateRect)
    }
  }, [])

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
          event.preventDefault()
          if (event.shiftKey) {
            editor?.commands.liftListItem('listItem')
          } else {
            // Check if we're at the 3rd level
            const { state } = view
            const { selection } = state
            const { $from } = selection
            let depth = 0
            let node: any = $from.node()
            
            while (node) {
              if (node.type.name === 'listItem') {
                depth++
              }
              node = node.parent
            }
            
            // Only allow indentation if we're not at the 3rd level
            if (depth < 3) {
              editor?.commands.sinkListItem('listItem')
            }
          }
          return true
        }
        return false
      },
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
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Typography,
      Superscript,
      Subscript,
      Selection,
      TrailingNode,
      Link.configure({ openOnClick: false }),
    ],
    content: content,
  })

  React.useEffect(() => {
    const checkCursorVisibility = () => {
      if (!editor || !toolbarRef.current) return

      const { state, view } = editor
      if (!view.hasFocus()) return

      const { from } = state.selection
      const cursorCoords = view.coordsAtPos(from)

      if (windowSize.height < rect.height) {
        if (cursorCoords && toolbarRef.current) {
          const toolbarHeight =
            toolbarRef.current.getBoundingClientRect().height
          const isEnoughSpace =
            windowSize.height - cursorCoords.top - toolbarHeight > 0

          // If not enough space, scroll until the cursor is the middle of the screen
          if (!isEnoughSpace) {
            const scrollY =
              cursorCoords.top - windowSize.height / 2 + toolbarHeight
            window.scrollTo({
              top: scrollY,
              behavior: "smooth",
            })
          }
        }
      }
    }

    checkCursorVisibility()
  }, [editor, rect.height, windowSize.height])

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

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
  )
}