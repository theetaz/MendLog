import { useRouter } from 'expo-router';
import { SearchScreen } from '../../src/features/search/SearchScreen';

export default function SearchRoute() {
  const router = useRouter();
  return <SearchScreen onOpenJob={(id) => router.push(`/jobs/${id}` as never)} />;
}
