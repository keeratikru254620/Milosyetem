import type { ComponentProps } from 'react';

import NotFoundView from '../../views/NotFoundView';

export default function NotFoundPage(props: ComponentProps<typeof NotFoundView>) {
  return <NotFoundView {...props} />;
}
