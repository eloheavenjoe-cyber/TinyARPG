import { Logger } from '../core/Logger';

type CommandFn = (args: string[]) => string;

interface Command {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  run: CommandFn;
}

export class DeveloperConsole {
  private container: HTMLDivElement;
  private output: HTMLDivElement;
  private input: HTMLInputElement;
  private visible = false;
  private history: string[] = [];
  private historyIdx = -1;
  private commands: Map<string, Command> = new Map();
  private onCommand: (cmd: string, args: string[]) => string = () => '';

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'dev-console';
    this.container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.75); z-index: 9999;
      display: none; flex-direction: column; font-family: monospace;
      pointer-events: auto;
    `;

    this.output = document.createElement('div');
    this.output.style.cssText = `
      flex: 1; overflow-y: auto; padding: 10px 14px;
      color: #ccc; font-size: 14px; line-height: 1.5;
      white-space: pre-wrap;
    `;
    this.container.appendChild(this.output);

    this.input = document.createElement('input');
    this.input.style.cssText = `
      width: 100%; padding: 10px 14px; font-size: 15px;
      background: #1a1a2a; color: #ffdd88; border: none;
      border-top: 1px solid #333; outline: none; font-family: monospace;
      box-sizing: border-box;
    `;
    this.input.placeholder = 'Type /help for commands...';
    this.container.appendChild(this.input);

    document.body.appendChild(this.container);

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const text = this.input.value.trim();
        if (text) this.execute(text);
        this.input.value = '';
        this.historyIdx = -1;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.history.length === 0) return;
        this.historyIdx = Math.max(0, this.historyIdx - 1);
        this.input.value = this.history[this.historyIdx];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.history.length === 0) return;
        this.historyIdx = Math.min(this.history.length - 1, this.historyIdx + 1);
        this.input.value = this.history[this.historyIdx];
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.autocomplete();
      }
    });
  }

  registerCommand(cmd: Command) {
    this.commands.set(cmd.name, cmd);
    for (const alias of cmd.aliases) {
      this.commands.set(alias, cmd);
    }
  }

  onCommandCallback(cb: (cmd: string, args: string[]) => string) {
    this.onCommand = cb;
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
  }

  show() {
    this.visible = true;
    this.container.style.display = 'flex';
    this.input.focus();
    this.print('[Dev Console] Type /help for commands');
  }

  hide() {
    this.visible = false;
    this.container.style.display = 'none';
    this.input.blur();
  }

  isVisible(): boolean {
    return this.visible;
  }

  private execute(text: string) {
    this.history.push(text);
    const parts = text.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [text];
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1).map(a => a.replace(/^["']|["']$/g, ''));

    this.print(`> ${text}`, '#ffdd88');

    let result: string;
    const cmd = this.commands.get(cmdName);
    if (cmd) {
      result = cmd.run(args);
    } else {
      result = this.onCommand(cmdName, args);
    }
    if (result) {
      for (const line of result.split('\n')) {
        this.print(line);
      }
    }
    this.output.scrollTop = this.output.scrollHeight;
  }

  private autocomplete() {
    const text = this.input.value.toLowerCase().trim();
    if (!text.startsWith('/')) return;
    const partial = text.slice(1);
    const matches = [...this.commands.keys()].filter(c => c.startsWith(partial));
    if (matches.length === 1) {
      this.input.value = '/' + matches[0] + ' ';
    } else if (matches.length > 1) {
      this.print(matches.map(m => `  /${m}`).join('\n'), '#888');
    }
  }

  private print(msg: string, color = '#ccccdd') {
    const line = document.createElement('div');
    line.style.color = color;
    line.textContent = msg;
    this.output.appendChild(line);
  }

  getBuiltInCommands(): Command[] {
    return [
      {
        name: 'help', aliases: ['h', '?'],
        description: 'Show all available commands',
        usage: '/help [command]',
        run: (args) => {
          if (args.length > 0) {
            const cmd = this.commands.get(args[0].toLowerCase());
            if (cmd) return `${cmd.name} ${cmd.usage}\n  ${cmd.description}`;
            return `Unknown command: ${args[0]}`;
          }
          const lines: string[] = ['Available commands:'];
          const seen = new Set<string>();
          for (const [name, cmd] of this.commands) {
            if (seen.has(cmd.name)) continue;
            seen.add(cmd.name);
            const aliasStr = cmd.aliases.filter(a => a !== cmd.name).join(', ');
            lines.push(`  ${cmd.name} ${cmd.usage}${aliasStr ? ` (${aliasStr})` : ''}`);
          }
          return lines.join('\n');
        },
      },
      {
        name: 'clear', aliases: ['cls'],
        description: 'Clear the console output',
        usage: '/clear',
        run: () => { this.output.innerHTML = ''; return ''; },
      },
    ];
  }

  destroy() {
    document.body.removeChild(this.container);
  }
}
