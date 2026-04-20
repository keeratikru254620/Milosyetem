import type { ComponentProps } from 'react';

import SettingsView from '../../views/SettingsView';

export default function SettingsPage(props: ComponentProps<typeof SettingsView>) {
  return <SettingsView {...props} />;
}
