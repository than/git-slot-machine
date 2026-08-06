import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import {
  getApiToken,
  setApiToken,
  clearApiToken,
  getConfig,
  getGlobalConfig,
  getRepoConfig,
  getAuthenticatedUsernames,
  getGitHubUsername,
  setGitHubUsername,
  setPlayAsUsername,
  getPlayAsUsername,
  clearPlayAsUsername,
  saveGlobalConfig,
  saveRepoConfig,
  hasRepoConfigTarget,
  isSyncEnabled,
  setSyncEnabled,
  isPrivateRepo,
  setPrivateRepo,
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

  it('preserves an unattributable legacy token instead of deleting it', () => {
    // No githubUsername to re-home the token under: deleting it would destroy
    // the config's only credential. It stays put, awaiting attribution.
    writeGlobalConfig({ apiToken: 'orphan-token' });

    expect(getGlobalConfig().apiToken).toBe('orphan-token');
    expect(readGlobalConfigFile().apiToken).toBe('orphan-token');
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

  it('clears the per-repo override when personal credit is chosen again', () => {
    // init's "1) personal" branch calls this; without it the override
    // survives the re-run while the CLI prints that credit went personal.
    setPlayAsUsername('acme-corp');
    expect(getPlayAsUsername()).toBe('acme-corp');

    clearPlayAsUsername();
    expect(getPlayAsUsername()).toBeNull();
  });

  it('first writer wins when normalization collides two casings of one name', () => {
    writeGlobalConfig({
      githubUsername: 'other',
      apiTokens: { Netflix: 'first-token', netflix: 'second-token' },
    });
    setPlayAsUsername('netflix');

    // Insertion order of the JSON object decides; matches pre-3.1.1 lookups.
    expect(getApiToken()).toBe('first-token');
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

    // A mocked throw, not chmod 0o400: root ignores permission bits, so under
    // root CI a chmod-based block silently stops exercising this path.
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw new Error('EROFS: read-only file system');
    });

    try {
      // Migration can't persist, but the read must return the migrated
      // config, not `{}` — a valid file is on disk.
      expect(getApiToken()).toBe('legacy-token');
      expect(getGlobalConfig().githubUsername).toBe('than');
    } finally {
      writeSpy.mockRestore();
    }

    // The on-disk file is untouched, still awaiting migration on a next read.
    expect(readGlobalConfigFile().apiToken).toBe('legacy-token');
  });

  it('keeps the global identity personal when a playAs override is present', () => {
    // init's identity detection must read the global config, not the resolved
    // identity: resolving playAsUsername first is how a re-run in an org repo
    // used to adopt the org globally.
    writeGlobalConfig({ githubUsername: 'than', apiTokens: { than: 'personal' } });
    setPlayAsUsername('acme-corp');

    expect(getGlobalConfig().githubUsername).toBe('than');

    // The org login path persists its token without touching the identity
    setApiToken('org-token', 'acme-corp');
    expect(getGlobalConfig().githubUsername).toBe('than');
    expect(getAuthenticatedUsernames()).toEqual(['acme-corp', 'than']);
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

describe('config: scoped setters and the identity collapse', () => {
  let tempHome: string;
  let tempRepo: string;
  let homedirSpy: jest.SpyInstance<string, []>;
  const originalCwd = process.cwd();

  const globalConfigPath = () => path.join(tempHome, '.git-slot-machine', 'config.json');
  const repoConfigPath = () => path.join(tempRepo, '.git', 'slot-machine-config.json');

  const writeGlobalConfig = (config: object) => {
    fs.mkdirSync(path.join(tempHome, '.git-slot-machine'), { recursive: true });
    fs.writeFileSync(globalConfigPath(), JSON.stringify(config));
  };

  const writeRepoConfig = (config: object) =>
    fs.writeFileSync(repoConfigPath(), JSON.stringify(config));

  const readGlobalConfigFile = () => JSON.parse(fs.readFileSync(globalConfigPath(), 'utf-8'));
  const readRepoConfigFile = () => JSON.parse(fs.readFileSync(repoConfigPath(), 'utf-8'));

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

  describe('pre-3.2 repo identity migration', () => {
    it('moves playAsUsername to githubUsername and drops the legacy key', () => {
      writeGlobalConfig({ githubUsername: 'than' });
      writeRepoConfig({ playAsUsername: 'broomfitters' });

      expect(getGitHubUsername()).toBe('broomfitters');

      const onDisk = readRepoConfigFile();
      expect(onDisk.githubUsername).toBe('broomfitters');
      expect(onDisk.playAsUsername).toBeUndefined();
    });

    it('keeps the global identity personal through the migration', () => {
      // The 3.1.0 guarantee: an org override credits the repo without ever
      // becoming the personal identity. The collapse must not regress it.
      writeGlobalConfig({ githubUsername: 'than' });
      writeRepoConfig({ playAsUsername: 'broomfitters' });

      getRepoConfig();

      expect(getGlobalConfig().githubUsername).toBe('than');
      expect(readGlobalConfigFile().githubUsername).toBe('than');
    });

    it('re-reads idempotently and leaves a clean config untouched on disk', () => {
      writeGlobalConfig({ githubUsername: 'than' });
      writeRepoConfig({ playAsUsername: 'broomfitters', privateRepo: true });

      const first = getRepoConfig();
      const mtime = fs.statSync(repoConfigPath()).mtimeMs;
      const second = getRepoConfig();

      expect(second).toEqual(first);
      expect(second.privateRepo).toBe(true);
      // No write on the second read: getRepoConfig runs on every post-commit
      // play, so a migration that rewrites unconditionally is a per-commit write.
      expect(fs.statSync(repoConfigPath()).mtimeMs).toBe(mtime);
    });

    it('lets an explicit githubUsername win and still drops the stale key', () => {
      writeRepoConfig({ githubUsername: 'broomfitters', playAsUsername: 'stale-org' });

      expect(getGitHubUsername()).toBe('broomfitters');
      expect(readRepoConfigFile().playAsUsername).toBeUndefined();
    });

    it('serves the migrated identity in memory when the write-back fails', () => {
      writeRepoConfig({ playAsUsername: 'broomfitters' });

      const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
        throw new Error('EROFS: read-only file system');
      });

      try {
        expect(getGitHubUsername()).toBe('broomfitters');
      } finally {
        writeSpy.mockRestore();
      }

      expect(readRepoConfigFile().playAsUsername).toBe('broomfitters');
    });

    it('finds a migrated identity its own token', () => {
      // getApiToken resolves through getGitHubUsername, so a repo override
      // that failed to migrate would silently fall back to the personal token.
      writeGlobalConfig({
        githubUsername: 'than',
        apiTokens: { than: 'personal', broomfitters: 'org-token' },
      });
      writeRepoConfig({ playAsUsername: 'Broomfitters' });

      expect(getApiToken()).toBe('org-token');
    });
  });

  describe('scope isolation', () => {
    it('defaults sync:disable to this repo and leaves global alone', () => {
      writeGlobalConfig({ githubUsername: 'than' });

      setSyncEnabled(false);

      expect(readRepoConfigFile().syncEnabled).toBe(false);
      expect(readGlobalConfigFile().syncEnabled).toBeUndefined();
      expect(isSyncEnabled()).toBe(false);
    });

    it('disables globally on demand, without writing the repo config', () => {
      writeGlobalConfig({ githubUsername: 'than' });

      setSyncEnabled(false, 'global');

      expect(readGlobalConfigFile().syncEnabled).toBe(false);
      expect(fs.existsSync(repoConfigPath())).toBe(false);
      expect(isSyncEnabled()).toBe(false);
    });

    it('lets a repo re-enable sync that is disabled globally', () => {
      writeGlobalConfig({ githubUsername: 'than', syncEnabled: false });

      setSyncEnabled(true, 'repo');

      expect(isSyncEnabled()).toBe(true);
      expect(readGlobalConfigFile().syncEnabled).toBe(false);
    });

    it('honors a global privacy default and a per-repo opt-out', () => {
      writeGlobalConfig({ githubUsername: 'than' });
      setPrivateRepo(true, 'global');
      expect(isPrivateRepo()).toBe(true);

      setPrivateRepo(false);
      expect(isPrivateRepo()).toBe(false);
      expect(readGlobalConfigFile().privateRepo).toBe(true);
    });

    it('scopes username:set global by default and per-repo on request', () => {
      setGitHubUsername('than');
      expect(readGlobalConfigFile().githubUsername).toBe('than');
      expect(fs.existsSync(repoConfigPath())).toBe(false);

      setGitHubUsername('broomfitters', 'repo');
      expect(getGitHubUsername()).toBe('broomfitters');
      expect(readGlobalConfigFile().githubUsername).toBe('than');
      expect(getConfig().githubUsername).toBe('broomfitters');
    });

    it('reports whether a repo config can be written here', () => {
      expect(hasRepoConfigTarget()).toBe(true);

      const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'gsm-bare-'));
      try {
        process.chdir(bare);
        expect(hasRepoConfigTarget()).toBe(false);
      } finally {
        process.chdir(tempRepo);
        fs.rmSync(bare, { recursive: true, force: true });
      }
    });
  });

  // cwd/.git only resolves at the repo root of an ordinary checkout. Repo is
  // the default scope for sync and privacy now, so a config the CLI writes and
  // then can't find again is a setting that silently doesn't apply.
  describe('git directory resolution', () => {
    const git = (cwd: string, args: string) =>
      execSync(`git ${args}`, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });

    let realRepo: string;

    beforeEach(() => {
      realRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'gsm-git-'));
      git(realRepo, 'init -q -b main');
      git(realRepo, 'config user.email test@example.com');
      git(realRepo, 'config user.name Test');
      fs.writeFileSync(path.join(realRepo, 'README'), 'x');
      git(realRepo, 'add README');
      git(realRepo, 'commit -qm init');
    });

    afterEach(() => {
      fs.rmSync(realRepo, { recursive: true, force: true });
    });

    it('finds the repo config from a subdirectory', () => {
      process.chdir(realRepo);
      setSyncEnabled(false);

      const sub = path.join(realRepo, 'src', 'deep');
      fs.mkdirSync(sub, { recursive: true });
      process.chdir(sub);

      // Reading `{}` here would fall back to the syncEnabled !== false
      // default, so a repo the user disabled would sync anyway.
      expect(hasRepoConfigTarget()).toBe(true);
      expect(isSyncEnabled()).toBe(false);
    });

    it('writes into the linked git dir of a worktree, where .git is a file', () => {
      const tree = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gsm-wt-')), 'wt');
      git(realRepo, `worktree add -q ${tree}`);

      try {
        expect(fs.statSync(path.join(tree, '.git')).isFile()).toBe(true);

        process.chdir(tree);
        expect(hasRepoConfigTarget()).toBe(true);

        // Before the git-dir resolution this threw ENOTDIR: the guard saw a
        // .git that exists and let the write through into a file.
        setSyncEnabled(false);
        expect(isSyncEnabled()).toBe(false);
      } finally {
        process.chdir(originalCwd);
        fs.rmSync(path.dirname(tree), { recursive: true, force: true });
      }
    });

    it('reports no target outside a repo', () => {
      const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'gsm-out-'));
      try {
        process.chdir(outside);
        expect(hasRepoConfigTarget()).toBe(false);
        expect(() => saveRepoConfig({ syncEnabled: false })).toThrow('Not a git repository');
      } finally {
        process.chdir(tempRepo);
        fs.rmSync(outside, { recursive: true, force: true });
      }
    });
  });

  describe('the per-repo override clear path', () => {
    it('clears an override written under the 3.2 key', () => {
      writeGlobalConfig({ githubUsername: 'than' });
      setPlayAsUsername('broomfitters');
      expect(getPlayAsUsername()).toBe('broomfitters');

      clearPlayAsUsername();

      expect(getPlayAsUsername()).toBeNull();
      expect(getGitHubUsername()).toBe('than');
    });

    it('clears a legacy override that has not been migrated yet', () => {
      // init's "personal credit" branch is the only way back from an org
      // override; leaving playAsUsername behind would print success and lie.
      writeGlobalConfig({ githubUsername: 'than' });
      writeRepoConfig({ playAsUsername: 'broomfitters' });

      clearPlayAsUsername();

      expect(readRepoConfigFile().playAsUsername).toBeUndefined();
      expect(readRepoConfigFile().githubUsername).toBeUndefined();
      expect(getGitHubUsername()).toBe('than');
    });

    it('keeps other repo settings when clearing the override', () => {
      writeGlobalConfig({ githubUsername: 'than' });
      saveRepoConfig({ githubUsername: 'broomfitters', privateRepo: true, syncEnabled: false });

      clearPlayAsUsername();

      expect(readRepoConfigFile()).toEqual({ privateRepo: true, syncEnabled: false });
    });
  });
});
