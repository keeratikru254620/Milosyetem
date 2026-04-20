import type { ComponentProps } from 'react';

import DocTypesView from '../../views/DocTypesView';

export default function DocTypesPage(props: ComponentProps<typeof DocTypesView>) {
  return <DocTypesView {...props} />;
}
