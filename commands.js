import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';
import { CUSTOM_COMMANDS } from './custom-commands.js';

// Simple test command
const TEST_COMMAND = {
  name: 'testcommand',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const TEST_MESSAGE_COMMAND = {
  name: 'Test Message Command',
  description: '',
  type: 3,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const CUSTOM_MESSAGE_COMMANDS = CUSTOM_COMMANDS.map(({ name }) => ({
  name,
  description: '',
  type: 3,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
}));

const ALL_COMMANDS = [...CUSTOM_MESSAGE_COMMANDS];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
