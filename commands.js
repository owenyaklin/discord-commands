import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

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

const ALL_COMMANDS = [TEST_COMMAND, TEST_MESSAGE_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
