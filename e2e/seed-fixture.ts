import Level from 'level-ts';
import path from 'path';
import fs from 'fs';
import Databases from '../db';

export interface FixtureData {
  accounts: Record<string, any>;
  heroes: Record<string, any>;
}

export async function seedFixture(fixture: FixtureData): Promise<void> {
  const dbPath = process.env.DB_PATH;
  if (!dbPath) {
    throw new Error('DB_PATH environment variable must be set');
  }

  // Ensure we're using absolute paths relative to the server root
  const serverRoot = path.resolve(__dirname, '..');
  const absoluteDbPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(serverRoot, dbPath);
  console.log('Server root directory:', serverRoot);
  console.log('Seeding fixture to absolute path:', absoluteDbPath);

  // Verify directories exist
  if (!fs.existsSync(absoluteDbPath)) {
    console.log('Creating database directory:', absoluteDbPath);
    fs.mkdirSync(absoluteDbPath, { recursive: true });
  }

  // Initialize leveldb instances with absolute paths
  console.log('Initializing databases...');
  const accountDb = new Level(path.join(absoluteDbPath, 'account'));
  const heroDb = new Level(path.join(absoluteDbPath, 'hero'));

  // Log fixture contents
  console.log('Fixture contents:', {
    accountCount: Object.keys(fixture.accounts || {}).length,
    heroCount: Object.keys(fixture.heroes || {}).length
  });

  // Seed accounts first since heroes depend on them
  if (fixture.accounts) {
    console.log('Seeding accounts...');
    for (const [id, account] of Object.entries(fixture.accounts)) {
      console.log('Writing account:', id);
      await accountDb.put(id, account);
    }
  }

  // Then seed heroes
  if (fixture.heroes) {
    console.log('Seeding heroes...');
    for (const [id, hero] of Object.entries(fixture.heroes)) {
      console.log('Writing hero:', id);
      // Upgrade the hero data using the hero model before writing
      const upgradedHero = Databases.hero.upgrade(hero);
      await heroDb.put(id, upgradedHero);
    }
  }

  console.log('Fixture seeding complete');
  
  // Verify data was written
  for (const [id] of Object.entries(fixture.accounts || {})) {
    const exists = await accountDb.exists(id);
    console.log('Verifying account exists:', id, exists);
  }
  
  for (const [id] of Object.entries(fixture.heroes || {})) {
    const exists = await heroDb.exists(id);
    console.log('Verifying hero exists:', id, exists);
  }
} 