import { seedFixture } from './seed-fixture';
import fs from 'fs';

// Get fixture path from command line argument
const fixturePath = process.argv[2];
if (!fixturePath) {
  console.error('Usage: ts-node seed-fixture-cli.ts <fixture-path>');
  process.exit(1);
}

// Read and parse the fixture
console.log('Reading fixture from:', fixturePath);
const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
const fixture = JSON.parse(fixtureContent);

// Seed the fixture
seedFixture(fixture)
  .then(() => {
    console.log('Fixture seeded successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding fixture:', error);
    process.exit(1);
  }); 