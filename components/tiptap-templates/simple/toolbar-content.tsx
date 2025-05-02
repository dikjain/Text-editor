import * as React from "react"
import { EditorContext } from "@tiptap/react"
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
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
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"
import { convertToMarkdown } from "@/utils/markdownConverter"

interface MainToolbarContentProps {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
}

export const MainToolbarContent: React.FC<MainToolbarContentProps> = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}) => {
  const { editor } = React.useContext(EditorContext);

  const handleCopyMarkdown = () => {
    if (!editor) return;
    
    try {
      const jsonContent = editor.getJSON();
      const markdown = convertToMarkdown(jsonContent);
      
      navigator.clipboard.writeText(markdown)
        .then(() => {
          console.log('Markdown copied to clipboard successfully');
        })
        .catch(err => {
          console.error('Failed to copy markdown:', err);
        });
    } catch (error) {
      console.error("Error converting to markdown:", error);
    }
  };

  const handleIndent = () => {
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

export const MobileToolbarContent: React.FC<MobileToolbarContentProps> = ({
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

export const CopyOnlyToolbar: React.FC = () => {
  const { editor } = React.useContext(EditorContext);

  const handleCopyMarkdown = () => {
    if (!editor) return;
    try {
      const jsonContent = editor.getJSON();
      const markdown = convertToMarkdown(jsonContent);
      navigator.clipboard.writeText(markdown)
        .then(() => {
          console.log('Markdown copied to clipboard successfully');
        })
        .catch(err => {
          console.error('Failed to copy markdown:', err);
        });
    } catch (error) {
      console.error("Error converting to markdown:", error);
    }
  };

  return (
    <div className="tiptap-toolbar">
      <Spacer />
      <ToolbarGroup>
        <Button onClick={handleCopyMarkdown}>
          <svg className="tiptap-button-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 2H9C8.44772 2 8 2.44772 8 3V5C8 5.55228 8.44772 6 9 6H15C15.5523 6 16 5.55228 16 5V3C16 2.44772 15.5523 2 15 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Copy Markdown
        </Button>
      </ToolbarGroup>
      <Spacer />
    </div>
  );
}; 