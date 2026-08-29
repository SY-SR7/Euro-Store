import { Tabs } from 'expo-router';
import { Grid2X2, Home, ShoppingBag, UserRound } from 'lucide-react-native';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function TabsLayout() {
  const { resolvedTheme, t } = usePreferences();
  const dark = resolvedTheme === 'dark';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: dark ? '#1C1917' : '#FFFFFF',
          borderTopColor: dark ? '#27272A' : '#E0DCD5',
        },
        tabBarActiveTintColor: dark ? '#CFA63D' : '#9A7209',
        tabBarInactiveTintColor: dark ? '#A3A3A3' : '#71716C',
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name='categories'
        options={{
          title: t('tabs.categories'),
          tabBarIcon: ({ color, size }) => <Grid2X2 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name='cart'
        options={{
          title: t('tabs.cart'),
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: t('tabs.account'),
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
