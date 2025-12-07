import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = process.cwd();
const STATUS_FILE = path.join(PROJECT_ROOT, 'PROJECT_STATUS.md');

function getGitStatus() {
  try {
    const staged = execSync('git diff --name-only --cached', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    const unstaged = execSync('git diff --name-only', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    const untracked = execSync('git ls-files --others --exclude-standard', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    
    return { staged, unstaged, untracked };
  } catch (error) {
    return { staged: [], unstaged: [], untracked: [] };
  }
}

function getRecentCommits() {
  try {
    const commits = execSync('git log --oneline -5', { encoding: 'utf8' }).trim();
    return commits;
  } catch (error) {
    return 'No git history';
  }
}

function generateStatus() {
  const gitStatus = getGitStatus();
  const commits = getRecentCommits();
  const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  const statusContent = `# ?? TEXT CLEANER PRO - AUTO STATUS
**Generated:** ${now}  
**Version:** ${packageJson.version}

## ?? RECENT CHANGES
### Staged for commit:
${gitStatus.staged.map(f => `- ? ${f}`).join('\n') || 'No staged files'}

### Unstaged changes:
${gitStatus.unstaged.map(f => `- ?? ${f}`).join('\n') || 'No unstaged changes'}

### New files (untracked):
${gitStatus.untracked.map(f => `- ? ${f}`).join('\n') || 'No new files'}

## ?? RECENT COMMITS
\`\`\`
${commits}
\`\`\`

## ?? PROJECT STRUCTURE (src/)
\`\`\`
${getDirectoryTree(path.join(PROJECT_ROOT, 'src'))}
\`\`\`

## ?? QUICK COMMANDS
\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run update-status # Update this file
\`\`\`
`;

  fs.writeFileSync(STATUS_FILE, statusContent);
  console.log('? PROJECT_STATUS.md updated successfully!');
}

function getDirectoryTree(dir, prefix = '') {
  const files = fs.readdirSync(dir);
  let tree = '';
  
  files.forEach((file, index) => {
    const isLast = index === files.length - 1;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    tree += prefix + (isLast ? 'ÀÄÄ ' : 'ÃÄÄ ') + file + '\n';
    
    if (stat.isDirectory()) {
      tree += getDirectoryTree(fullPath, prefix + (isLast ? '    ' : '³   '));
    }
  });
  
  return tree;
}

// Run
generateStatus();