import { useAuth } from '../../src/features/auth/AuthProvider';
import { MeScreen } from '../../src/features/me/MeScreen';

export default function MeRoute() {
  const { session, signOut } = useAuth();
  const email = session?.user?.email ?? null;
  const displayName = (session?.user?.user_metadata?.full_name as string | undefined) ?? undefined;
  return <MeScreen email={email} displayName={displayName} onSignOut={signOut} />;
}
