import type { ComponentProps } from 'react';

import UsersView from '../../views/UsersView';

export default function UsersPage(props: ComponentProps<typeof UsersView>) {
  return <UsersView {...props} />;
}
