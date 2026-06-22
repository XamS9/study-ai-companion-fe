import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { type ColorValue, Text } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Glyph tab icon — mirrors the simple symbols used in the Figma design. */
function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 20, lineHeight: 24, fontFamily: Fonts.sans }}>{glyph}</Text>;
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <TabIcon glyph="⌂" color={color} />,
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          title: t('tabs.subjects'),
          tabBarIcon: ({ color }) => <TabIcon glyph="◫" color={color} />,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: t('tabs.exams'),
          tabBarIcon: ({ color }) => <TabIcon glyph="✎" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color }) => <TabIcon glyph="◷" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <TabIcon glyph="◉" color={color} />,
        }}
      />
    </Tabs>
  );
}
