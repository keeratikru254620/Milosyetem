import type { ComponentProps } from 'react';

import AuthView from '../../views/AuthView';

type ForgotPasswordPageProps = Pick<ComponentProps<typeof AuthView>, 'onLogin'>;

export default function ForgotPasswordPage({ onLogin }: ForgotPasswordPageProps) {
  return <AuthView initialMode="forgot" onLogin={onLogin} />;
}
