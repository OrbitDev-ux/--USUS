/** customId에 인자를 붙인다: withArgs('settings:channel', 'welcome') → 'settings:channel:welcome' */
export function withArgs(prefix: string, ...args: readonly (string | number)[]): string {
  return [prefix, ...args.map(String)].join(':');
}
