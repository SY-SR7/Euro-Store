import { Tabs } from 'expo-router';
import { Grid2X2, Heart, Home, ShoppingBag, UserRound } from 'lucide-react-native';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function TabsLayout() {
  const { t } = usePreferences();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: t('tabs.home'),
          tabBarAccessibilityLabel: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name='categories'
        options={{
          title: t('tabs.categories'),
          tabBarAccessibilityLabel: t('tabs.categories'),
          tabBarIcon: ({ color, size }) => <Grid2X2 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name='cart'
        options={{
          title: t('tabs.cart'),
          tabBarAccessibilityLabel: t('tabs.cart'),
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name='wishlist'
        options={{
          title: t('profile.wishlist'),
          tabBarAccessibilityLabel: t('profile.wishlist'),
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: t('tabs.account'),
          tabBarAccessibilityLabel: t('tabs.account'),
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
