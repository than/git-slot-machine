import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  getApiToken,
  setApiToken,
  clearApiToken,
  getGlobalConfig,
  getAuthenticatedUsernames,
  setPlayAsUsername,
  saveGlobalConfig,
} from './config.js';

// config.ts resolves the global config under os.homedir() and the repo config
// under process.cwd()/.git — both are pointed at fresh temp dirs per test, so
// these tests never touch the real ~/.git-slot-machine.
//
// os.homedir is mocked directly, NOT via process.env.HOME: jest gives each
// test file a copied process.env, so assigning HOME there never reaches the
// real environ that uv_os_homedir reads — writes would land in the real home.
describe('config: per-identity tokens and legacy migration', () => {
  let tempHome: string;
  let tempRepo: string;
  let homedirSpy: jest.SpyInstance<string, []>;
  const originalCwd = process.cwd();

  const globalConfigPath = () => path.join(tempHome, '.git-slot-machine', 'config.json');

  const writeGlobalConfig = (config: object) => {
    fs.mkdirSync(path.join(tempHome, '.git-slot-machine'), { recursive: true });
    fs.writeFileSync(globalConfigPath(), JSON.stringify(config));
  };

  const readGlobalConfigFile = () =>
    JSON.parse(fs.readFileSync(globalConfigPath(), 'utf-8'));

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gsm-home-'));
    tempRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'gsm-repo-'));
    fs.mkdirSync(path.join(tempRepo, '.git'));
    homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(tempHome);
    process.chdir(tempRepo);
  });

  afterEach(() => {
    homedirSpy.mockRestore();
    process.chdir(originalCwd);
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempRepo, { recursive: true, force: true });
  });

  it('migrates a pre-3.1 apiToken under its lowercased username', () => {
    writeGlobalConfig({ githubUsername: 'Than', apiToken: 'legacy-token' });

    expect(getApiToken()).toBe('legacy-token');

    const onDisk = readGlobalConfigFile();
    expect(onDisk.apiTokens).toEqual({ than: 'legacy-token' });
    expect(onDisk.apiToken).toBeUndefined();
  });

  it('re-reads idempotently after migration', () => {
    writeGlobalConfig({ githubUsername: 'than', apiToken: 'legacy-token' });

    const first = getGlobalConfig();
    const second = getGlobalConfig();
    expect(second).toEqual(first);
    expect(second.apiTokens).toEqual({ than: 'legacy-token' });
  });

  it('removes a lingering legacy token even when the username already has one', () => {
    writeGlobalConfig({
      githubUsername: 'than',
      apiToken: 'stale-legacy',
      apiTokens: { than: 'current-token' },
    });

    expect(getApiToken()).toBe('current-token');
    expect(readGlobalConfigFile().apiToken).toBeUndefined();
  });

  it('returns no token for a playAsUsername with no token of its own', () => {
    writeGlobalConfig({ githubUsername: 'than', apiTokens: { than: 'personal' } });
    setPlayAsUsername('acme-corp');

    expect(getApiToken()).toBeNull();
  });

  it('keeps the personal token when logging out an org identity', () => {
    writeGlobalConfig({
      githubUsername: 'than',
      apiTokens: { than: 'personal', 'acme-corp': 'org-token' },
    });

    clearApiToken('acme-corp');

    expect(readGlobalConfigFile().apiTokens).toEqual({ than: 'personal' });
    expect(getApiToken()).toBe('personal');
  });

  it('lowercases mixed-case keys written by 3.1.0 so lookups still hit', () => {
    // 3.1.0 stored keys with the casing the user typed; 3.1.1 lowercases every
    // lookup, so without key normalization these tokens would silently miss.
    writeGlobalConfig({
      githubUsername: 'than',
      apiTokens: {
        than: 'personal',
        Broomfitters: 'org-token',
        PlaydownApp: 'app-token',
      },
    });
    setPlayAsUsername('Broomfitters');

    expect(getApiToken()).toBe('org-token');
    expect(getAuthenticatedUsernames()).toEqual(['broomfitters', 'playdownapp', 'than']);
    expect(Object.keys(readGlobalConfigFile().apiTokens).sort()).toEqual([
      'broomfitters',
      'playdownapp',
      'than',
    ]);
  });

  it('stores and looks up tokens case-insensitively', () => {
    writeGlobalConfig({ githubUsername: 'other' });
    setApiToken('org-token', 'Netflix');
    setPlayAsUsername('netflix');

    expect(getApiToken()).toBe('org-token');
    expect(getAuthenticatedUsernames()).toEqual(['netflix']);
  });

  it('serves the migrated config in memory when the write-back fails', () => {
    writeGlobalConfig({ githubUsername: 'than', apiToken: 'legacy-token' });
    fs.chmodSync(globalConfigPath(), 0o400);

    // Migration can't persist (config file is read-only), but the read must
    // return the migrated config, not `{}` — a valid file is on disk.
    expect(getApiToken()).toBe('legacy-token');
    expect(getGlobalConfig().githubUsername).toBe('than');
  });

  it('writes the global config owner-only', () => {
    if (process.platform === 'win32') {
      return;
    }

    saveGlobalConfig({ githubUsername: 'than' });

    const mode = fs.statSync(globalConfigPath()).mode & 0o777;
    expect(mode).toBe(0o600);
  });
});
