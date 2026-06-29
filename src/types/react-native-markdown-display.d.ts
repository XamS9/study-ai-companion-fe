// The published package points its `types` field at a `.d.ts` that isn't actually
// shipped, so we declare the slice of the API we use.
declare module 'react-native-markdown-display' {
  import type { ComponentType, ReactNode } from 'react';
  import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

  /** Style map keyed by markdown node type (`body`, `heading1`, `strong`, `bullet_list`, …). */
  export type MarkdownStyles = Partial<Record<string, StyleProp<ViewStyle & TextStyle>>>;

  export interface MarkdownProps {
    children?: ReactNode;
    style?: MarkdownStyles;
    mergeStyle?: boolean;
    onLinkPress?: (url: string) => boolean;
  }

  const Markdown: ComponentType<MarkdownProps>;
  export default Markdown;
}
