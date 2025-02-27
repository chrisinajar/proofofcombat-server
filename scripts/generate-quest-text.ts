import * as fs from 'fs';
import * as path from 'path';
import { getQuestDescription } from '../schema/quests/text/quest-descriptions';

// Function to convert camelCase or kebab-case to Title Case
function toTitleCase(str: string): string {
  return str
    .replace(/-/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Function to process a single quest text file
async function processQuestFile(filePath: string): Promise<string> {
  // Get the quest name from the file name
  const questName = path.basename(filePath, '-text.ts');
  let markdown = `## ${toTitleCase(questName)}\n\n`;

  try {
    // Import the quest events dynamically
    const { questEvents } = await import(filePath);

    // Process each event in the quest
    for (const [eventName, texts] of Object.entries(questEvents)) {
      if (Array.isArray(texts)) {
        markdown += `### ${toTitleCase(eventName)}\n\n`;
        markdown += texts.join('\n\n');
        markdown += '\n\n---\n\n';
      }
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }

  return markdown;
}

// Main function to generate the markdown file
async function generateQuestTextMarkdown() {
  const questTextDir = path.join(__dirname, '..', 'schema', 'quests', 'text');
  const outputPath = path.join(__dirname, '..', 'docs', 'quest-text.md');

  // Create docs directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, '..', 'docs'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'docs'));
  }

  let markdown = '# Quest Text\n\n';

  // Process quest descriptions first
  markdown += '## Quest Descriptions\n\n';
  
  // Get all quest text files (excluding quest-descriptions.ts)
  const files = fs.readdirSync(questTextDir)
    .filter(file => file.endsWith('-text.ts') && file !== 'quest-descriptions.ts');

  // Extract quest names from file names
  const questNames = files.map(file => path.basename(file, '-text.ts'));

  // Process each quest description
  for (const questName of questNames) {
    const description = getQuestDescription(questName.toUpperCase() as any);
    if (description) {
      markdown += `### ${toTitleCase(questName)}\n\n${description}\n\n---\n\n`;
    }
  }

  // Process all quest text files
  for (const file of files) {
    const filePath = path.join(questTextDir, file);
    markdown += await processQuestFile(filePath);
  }

  // Write the markdown file
  fs.writeFileSync(outputPath, markdown);
  console.log(`Quest text markdown generated at: ${outputPath}`);
}

// Run the script
generateQuestTextMarkdown().catch(console.error);
