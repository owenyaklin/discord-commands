import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';
import { CUSTOM_COMMANDS } from './custom-commands.js';

const CUSTOM_MESSAGE_COMMANDS = CUSTOM_COMMANDS.map(({ name }) => ({
  name,
  description: '',
  type: 3,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
}));

const ALL_COMMANDS = [...CUSTOM_MESSAGE_COMMANDS];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS, process.env.DISCORD_TOKEN);
