import type { ComponentProps } from 'react';

import LegalView from '../../views/LegalView';

export default function LegalPage(props: ComponentProps<typeof LegalView>) {
  return <LegalView {...props} />;
}
