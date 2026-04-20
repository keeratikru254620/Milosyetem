import type { ComponentProps } from 'react';

import AuthView from '../../views/AuthView';

type RegisterPageProps = Pick<ComponentProps<typeof AuthView>, 'onLogin'>;

export default function RegisterPage({ onLogin }: RegisterPageProps) {
  return <AuthView initialMode="register" onLogin={onLogin} />;
}
