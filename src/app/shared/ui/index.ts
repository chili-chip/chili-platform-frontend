// The site's component library. Styles are in src/styles/ui; see /dev/ui for every component.
import { UiButton } from './button';
import { UiDialog, UiDialogFooter } from './dialog';
import { UiCheck, UiChoice, UiField, UiInput } from './form';
import { UiBackLink, UiPage, UiPageActions, UiPageHeader } from './layout';
import { UiQuantity } from './quantity';
import { UiBadge, UiChip, UiNotice } from './status';
import { UiAvatar, UiCard, UiCover, UiEmpty, UiStat, UiTable } from './surface';

export * from './button';
export * from './dialog';
export * from './form';
export * from './layout';
export * from './quantity';
export * from './status';
export * from './surface';

/** Everything at once: `imports: [UI]`. */
export const UI = [
  UiAvatar,
  UiBackLink,
  UiBadge,
  UiButton,
  UiCard,
  UiCheck,
  UiChip,
  UiChoice,
  UiCover,
  UiDialog,
  UiDialogFooter,
  UiEmpty,
  UiField,
  UiInput,
  UiNotice,
  UiPage,
  UiPageActions,
  UiPageHeader,
  UiQuantity,
  UiStat,
  UiTable,
] as const;
