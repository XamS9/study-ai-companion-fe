import { type ReactNode } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FieldProps = TextInputProps & {
  label: string;
  rightElement?: ReactNode;
};

export function Field({ label, style, rightElement, ...rest }: FieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View
        style={[
          styles.inputWrapper,
          { backgroundColor: theme.inputBackground, borderColor: theme.border },
        ]}
      >
        <TextInput
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }, rightElement ? styles.inputWithRight : null, style]}
          {...rest}
        />
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  inputWithRight: {
    paddingRight: 0,
  },
  rightElement: {
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
});
