import { readFileSync } from 'node:fs';

export const CUSTOM_COMMANDS = JSON.parse(
  readFileSync(new URL('./custom-commands.json', import.meta.url), 'utf8'),
);
