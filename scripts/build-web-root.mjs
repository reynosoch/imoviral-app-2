import { spawnSync } from 'node:child_process';

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(command, ['expo', 'export', '-p', 'web'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    WEB_DEPLOY_TARGET: 'root',
  },
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
