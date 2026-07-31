import type {
  ButtonHandler,
  ChannelSelectHandler,
  ModalHandler,
  RoleSelectHandler,
  StringSelectHandler,
} from '../types';
import { authVerify } from './buttons/authVerify';
import { channelCreateStart } from './buttons/channelCreateButtons';
import { gameDiceRoll, gameGuessStart, gameRpsChoice, gameRpsReplay } from './buttons/gameButtons';
import { orderQuote } from './buttons/orderQuote';
import { reportDismiss, reportResolve } from './buttons/reportActions';
import { reviewCreate } from './buttons/reviewButtons';
import { serverCancel, serverConfirm } from './buttons/serverActions';
import { settingsAutomodToggle, settingsBack, settingsToggle } from './buttons/settingsButtons';
import { ticketClose, ticketCreate, ticketDelete } from './buttons/ticketButtons';
import { announceModal } from './modals/announceModal';
import { channelCreateModal } from './modals/channelCreateModal';
import { gameGuessModal } from './modals/gameGuessModal';
import { orderQuoteModal } from './modals/orderQuoteModal';
import { reportModal } from './modals/reportModal';
import { reviewModal } from './modals/reviewModal';
import { settingsMessagesModal } from './modals/settingsMessagesModal';
import { ticketCreateModal } from './modals/ticketCreateModal';
import { updateModal } from './modals/updateModal';
import { gameMenu } from './selectMenus/gameMenu';
import { settingsChannel } from './selectMenus/settingsChannel';
import { settingsMenu } from './selectMenus/settingsMenu';
import { settingsRole } from './selectMenus/settingsRole';

export const buttonHandlers: readonly ButtonHandler[] = [
  authVerify,
  ticketCreate,
  ticketClose,
  ticketDelete,
  orderQuote,
  reviewCreate,
  reportResolve,
  reportDismiss,
  gameRpsChoice,
  gameRpsReplay,
  gameDiceRoll,
  gameGuessStart,
  channelCreateStart,
  serverConfirm,
  serverCancel,
  settingsToggle,
  settingsAutomodToggle,
  settingsBack,
];

export const stringSelectHandlers: readonly StringSelectHandler[] = [settingsMenu, gameMenu];

export const channelSelectHandlers: readonly ChannelSelectHandler[] = [settingsChannel];

export const roleSelectHandlers: readonly RoleSelectHandler[] = [settingsRole];

export const modalHandlers: readonly ModalHandler[] = [
  ticketCreateModal,
  orderQuoteModal,
  announceModal,
  settingsMessagesModal,
  updateModal,
  reportModal,
  reviewModal,
  gameGuessModal,
  channelCreateModal,
];
