import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

const HYDRATE_COMMAND = {
  name: 'Hydrate',
  description: '',
  type: 3,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const ALL_COMMANDS = [HYDRATE_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS, process.env.DISCORD_TOKEN);
