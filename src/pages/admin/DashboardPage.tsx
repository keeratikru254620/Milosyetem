import type { ComponentProps } from 'react';

import DashboardView from '../../views/DashboardView';

export default function DashboardPage(props: ComponentProps<typeof DashboardView>) {
  return <DashboardView {...props} />;
}
