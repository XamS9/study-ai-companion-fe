/**
 * Converts Markdown to plain text that mirrors what the rendered `<Markdown>` shows:
 * emphasis/heading/code markers are stripped, links collapse to their label, and list
 * items keep a bullet + their indentation (so nesting survives). Used to copy the
 * "clean" summary text rather than the raw Markdown source.
 */
export function markdownToPlainText(markdown: string): string {
  const lines = markdown.split('\n').map((line) =>
    line
      // Headings: "## Title" -> "Title"
      .replace(/^\s{0,3}#{1,6}\s+/, '')
      // Blockquote marker: "> quote" -> "quote"
      .replace(/^\s{0,3}>\s?/, '')
      // Unordered list marker (any depth): "- item" / "* item" / "+ item" -> "• item"
      .replace(/^(\s*)[-*+]\s+/, (_m, indent: string) => `${indent}• `),
  );

  return lines
    .join('\n')
    // Images: ![alt](url) -> alt   (before links, which share the [..](..) shape)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Links: [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Bold: **text** / __text__ -> text
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    // Italic: *text* / _text_ -> text
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Inline code: `code` -> code
    .replace(/`([^`]+)`/g, '$1')
    // Collapse 3+ blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
