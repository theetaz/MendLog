import { Tabs, useRouter, useSegments } from 'expo-router';
import { TabBar, type TabId } from '../../src/design/components/TabBar';

const ROUTE_TO_TAB: Record<string, TabId> = {
  index: 'home',
  jobs: 'jobs',
  search: 'search',
  me: 'me',
};

const TAB_TO_ROUTE: Record<TabId, string> = {
  home: '/(tabs)/',
  jobs: '/(tabs)/jobs',
  search: '/(tabs)/search',
  me: '/(tabs)/me',
  new: '/new-job',
};

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const last = segments[segments.length - 1] ?? 'index';
  const active: TabId = ROUTE_TO_TAB[last] ?? 'home';

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={() => (
        <TabBar
          active={active}
          onTab={(id) => router.push(TAB_TO_ROUTE[id] as never)}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="jobs" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
