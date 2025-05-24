#!/usr/bin/env node

/**
 * Script to run tests with c8 coverage
 * Usage: node scripts/run-c8-coverage.js [test files]
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Default test files if none specified
const defaultTestFiles = ['tests/**/*.test.ts', 'tests/**/*.test.tsx'];

// Get test files from command line args or use defaults
const testFiles = process.argv.length > 2 
  ? process.argv.slice(2) 
  : defaultTestFiles;

// Build the c8 command
const c8Command = [
  'npx c8',
  '--reporter=text',
  '--reporter=html',
  '--reporter=lcov',
  '--exclude="tests/**"',
  '--exclude="node_modules/**"',
  'npx vitest run',
  testFiles.map(file => `"${file}"`).join(' ')
].join(' ');

try {
  // Create coverage directory if it doesn't exist
  const coverageDir = path.join(process.cwd(), 'coverage');
  if (!fs.existsSync(coverageDir)) {
    fs.mkdirSync(coverageDir, { recursive: true });
  }

  // Run the command
  console.log(`Running tests with coverage: ${c8Command}`);
  execSync(c8Command, { stdio: 'inherit' });
  
  console.log('\nCoverage report generated in ./coverage/');
  console.log('Open ./coverage/index.html in your browser to view the HTML report');
} catch (error) {
  console.error('Error running tests with coverage:', error.message);
  process.exit(1);
}
