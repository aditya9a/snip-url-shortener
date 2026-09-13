import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    // Ensure tests don't run in parallel for DB safety if needed, 
    // but MongoMemoryServer can handle parallel if each test file has its own DB.
    // For simplicity, we'll let it use the default pool.
    poolOptions: {
      threads: {
        singleThread: true,
      }
    }
  },
});
