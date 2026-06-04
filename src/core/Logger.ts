const PREFIXES = {
  input: '[Input]',
  movement: '[Movement]',
  collision: '[Collision]',
  entity: '[Entity]',
  combat: '[Combat]',
  ui: '[UI]',
  game: '[Game]',
  system: '[System]',
  skill: '[Skill]',
} as const;

type Category = keyof typeof PREFIXES;

function ts(): string {
  return new Date().toISOString().slice(11, 23);
}

export class Logger {
  static log(category: Category, message: string, data?: Record<string, unknown>) {
    const prefix = PREFIXES[category];
    const line = `${ts()} ${prefix} ${message}`;
    if (data) {
      console.log(line, JSON.stringify(data));
    } else {
      console.log(line);
    }
  }

  static error(category: Category, message: string, error?: unknown) {
    console.error(`${ts()} ${PREFIXES[category]} ERROR: ${message}`, error ?? '');
  }

  static warn(category: Category, message: string) {
    console.warn(`${ts()} ${PREFIXES[category]} WARNING: ${message}`);
  }
}
