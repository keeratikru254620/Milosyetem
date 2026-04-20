import type { ComponentProps } from 'react';

import AuthView from '../../views/AuthView';

type LoginPageProps = Pick<ComponentProps<typeof AuthView>, 'onLogin'>;

export default function LoginPage({ onLogin }: LoginPageProps) {
  return <AuthView initialMode="login" onLogin={onLogin} />;
}
