const { spawnSync } = require('node:child_process');

const ignoredPaths = [
  ':(exclude)docs/**',
  ':(exclude)scripts/**',
  ':(exclude)*.md',
  ':(exclude).gitignore',
  ':(exclude).vscode/**'
];

function proceed(message) {
  console.log(message);
  process.exit(1);
}

function skip(message) {
  console.log(message);
  process.exit(0);
}

if (process.env.FORCE_PREVIEW_DEPLOY === '1') {
  proceed('Forced preview deployment');
}

if (process.env.VERCEL_GIT_COMMIT_REF !== 'main') {
  skip('Skipping non-main branch preview');
}

if (!process.env.VERCEL_GIT_PREVIOUS_SHA) {
  proceed('No previous successful deployment SHA, proceeding with build');
}

const diff = spawnSync(
  'git',
  ['diff', '--quiet', process.env.VERCEL_GIT_PREVIOUS_SHA, 'HEAD', '--', ...ignoredPaths],
  { stdio: 'inherit' }
);

if (diff.error) {
  proceed(`Failed to evaluate git diff: ${diff.error.message}`);
}

if (diff.status === 0) {
  skip('Only ignored files changed');
}

if (diff.status === 1) {
  proceed('Relevant files changed');
}

proceed(`Unexpected git diff exit code: ${diff.status}`);