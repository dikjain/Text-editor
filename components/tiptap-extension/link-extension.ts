import TiptapLink from "@tiptap/extension-link"
import type { EditorView } from "@tiptap/pm/view"
import { getMarkRange } from "@tiptap/react"
import { Plugin, TextSelection } from "@tiptap/pm/state"

export function normalizeHref(href: string): string {
  if (!href) return '';
  // If already has protocol, return as is
  if (/^https?:\/\//i.test(href)) return href;
  // If looks like a domain, prepend https://
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(href)) return `https://${href}`;
  return href;
}

export function isValidDomain(href: string): boolean {
  // Basic domain validation (e.g. google.com, example.org)
  return /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(href);
}

export const Link = TiptapLink.extend({
  inclusive: false,

  addAttributes() {
    return {
      ...this.parent?.(),
      href: {
        default: null,
        parseHTML: element => normalizeHref(element.getAttribute('href') || ''),
        renderHTML: attributes => {
          const href = normalizeHref(attributes.href || '');
          if (!isValidDomain(href)) return {};
          return { href };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[href]:not([data-type="button"]):not([href *= "javascript:" i])',
      },
    ]
  },

  addProseMirrorPlugins() {
    const { editor } = this

    return [
      ...(this.parent?.() || []),
      new Plugin({
        props: {
          handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
            const { selection } = editor.state

            if (event.key === "Escape" && selection.empty !== true) {
              editor.commands.focus(selection.to, { scrollIntoView: false })
              return true
            }

            // Handle backspace for links
            if (event.key === "Backspace" && selection.empty) {
              const { from } = selection
              const { doc } = editor.state
              const $pos = doc.resolve(from)
              const linkMark = $pos.marks().find(mark => mark.type.name === 'link')
              
              if (linkMark) {
                // Remove the link mark but keep the text
                editor.commands.unsetLink()
                return true
              }

              // Check if we're at the start of a link
              const before = from - 1
              const $before = doc.resolve(before)
              const beforeLinkMark = $before.marks().find(mark => mark.type.name === 'link')
              
              if (beforeLinkMark) {
                editor.commands.unsetLink()
                return true
              }
            }

            return false
          },
          handleClick(view, pos) {
            const { schema, doc, tr } = view.state
            let range: ReturnType<typeof getMarkRange> | undefined

            if (schema.marks.link) {
              range = getMarkRange(doc.resolve(pos), schema.marks.link)
            }

            if (!range) {
              return
            }

            const { from, to } = range
            const start = Math.min(from, to)
            const end = Math.max(from, to)

            if (pos < start || pos > end) {
              return
            }

            const $start = doc.resolve(start)
            const $end = doc.resolve(end)
            const transaction = tr.setSelection(new TextSelection($start, $end))

            view.dispatch(transaction)
          },
        },
      }),
    ]
  },
})

export default Link
