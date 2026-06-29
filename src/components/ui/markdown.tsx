import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import RNMarkdown, { type MarkdownStyles } from 'react-native-markdown-display';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MarkdownProps = { children: string };

/**
 * Renders Markdown (e.g. AI-generated summaries) styled with the app's theme and
 * spacing tokens so it tracks light/dark like the rest of the UI.
 */
export const Markdown = ({ children }: MarkdownProps) => {
  const theme = useTheme();

  const styles = useMemo<MarkdownStyles>(
    () => ({
      body: { color: theme.text, fontSize: 16, lineHeight: 24, fontWeight: '500' },
      heading1: { color: theme.text, fontSize: 22, lineHeight: 30, fontWeight: '700', marginBottom: Spacing.one },
      heading2: { color: theme.text, fontSize: 18, lineHeight: 26, fontWeight: '700', marginTop: Spacing.two, marginBottom: Spacing.one },
      heading3: { color: theme.text, fontSize: 16, lineHeight: 24, fontWeight: '700', marginTop: Spacing.two, marginBottom: Spacing.one },
      strong: { fontWeight: '700' },
      em: { fontStyle: 'italic' },
      paragraph: { marginTop: 0, marginBottom: Spacing.two },
      bullet_list: { marginBottom: Spacing.two },
      ordered_list: { marginBottom: Spacing.two },
      list_item: { marginBottom: Spacing.half },
      bullet_list_icon: { color: theme.primary },
      ordered_list_icon: { color: theme.textSecondary },
      code_inline: {
        fontFamily: Fonts.mono,
        backgroundColor: theme.backgroundSelected,
        color: theme.text,
        fontSize: 14,
        borderRadius: Spacing.one,
        paddingHorizontal: Spacing.one,
      },
      fence: {
        fontFamily: Fonts.mono,
        backgroundColor: theme.backgroundSelected,
        color: theme.text,
        fontSize: 13,
        padding: Spacing.two,
        borderRadius: Spacing.two,
      },
      code_block: {
        fontFamily: Fonts.mono,
        backgroundColor: theme.backgroundSelected,
        color: theme.text,
        fontSize: 13,
        padding: Spacing.two,
        borderRadius: Spacing.two,
      },
      blockquote: {
        backgroundColor: theme.backgroundSelected,
        borderLeftColor: theme.primary,
        borderLeftWidth: 3,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.one,
        marginBottom: Spacing.two,
      },
      link: { color: theme.primary },
      hr: { backgroundColor: theme.border, height: StyleSheet.hairlineWidth, marginVertical: Spacing.two },
      table: { borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: Spacing.two },
      thead: { backgroundColor: theme.surface },
      th: { padding: Spacing.two },
      td: { padding: Spacing.two },
    }),
    [theme],
  );

  return <RNMarkdown style={styles}>{children}</RNMarkdown>;
};
