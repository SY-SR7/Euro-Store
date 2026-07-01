import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1C1917',
          borderTopColor: '#27272A',
        },
        tabBarActiveTintColor: '#B8860B',
        tabBarInactiveTintColor: '#A3A3A3',
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: '????????',
        }}
      />
      <Tabs.Screen
        name='categories'
        options={{
          title: '???????',
        }}
      />
      <Tabs.Screen
        name='cart'
        options={{
          title: '?????',
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: '?????',
        }}
      />
    </Tabs>
  );
}
