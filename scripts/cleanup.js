import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = process.cwd();

function cleanOldFiles() {
  const oldDirs = [
    'src/js',
    'src/css',
    'src/locales',
    'test',
    'build/webpack'
  ];

  console.log('?? Cleaning up old project structure...\n');
  
  oldDirs.forEach(dir => {
    const fullPath = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(fullPath)) {
      console.log(`?? Found: ${dir}`);
      
      // List files
      try {
        const files = getAllFiles(fullPath);
        console.log(`   Files: ${files.length} files`);
        
        // Ask for confirmation in real scenario
        // For now, just list
      } catch (err) {
        console.log(`   Error reading: ${err.message}`);
      }
    }
  });
  
  console.log('\n? Cleanup analysis complete.');
  console.log('?? To actually delete, uncomment the delete lines in cleanup.js');
}

function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  
  return results;
}

function checkUnusedDependencies() {
  console.log('\n?? Checking for unused dependencies...');
  
  try {
    const result = execSync('npx depcheck', { encoding: 'utf8' });
    console.log(result);
  } catch (error) {
    console.log('??  depcheck not installed. Run: npm install -g depcheck');
  }
}

function main() {
  console.log('?? TEXT CLEANER PRO - PROJECT CLEANUP\n');
  console.log('='.repeat(50));
  
  cleanOldFiles();
  checkUnusedDependencies();
  
  console.log('\n='.repeat(50));
  console.log('?? RECOMMENDED ACTIONS:');
  console.log('1. Backup important files from src/js/ if needed');
  console.log('2. Move cleaners from src/js/modules/cleaners/ to src/features/cleaners/');
  console.log('3. Update imports in components');
  console.log('4. Run: npm run update-status to regenerate status');
}

main();