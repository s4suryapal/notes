import { Tabs } from 'expo-router';
import { Hop as Home, Folder, Search, Menu } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.light.surface,
          borderTopColor: Colors.light.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notes',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="folders"
        options={{
          title: 'Folders',
          tabBarIcon: ({ size, color }) => <Folder size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ size, color }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ size, color }) => <Menu size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
