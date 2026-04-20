import type { ComponentProps } from 'react';

import DocumentsView from '../../views/DocumentsView';

export default function DocumentsPage(props: ComponentProps<typeof DocumentsView>) {
  return <DocumentsView {...props} />;
}
