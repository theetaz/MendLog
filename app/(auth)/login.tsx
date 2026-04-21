import { LoginScreen } from '../../src/features/auth/LoginScreen';
import { useAuth } from '../../src/features/auth/AuthProvider';

export default function LoginRoute() {
  const { signIn } = useAuth();
  return <LoginScreen onSubmit={signIn} />;
}
