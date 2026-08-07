import { initializeSchema, dbPath } from './db';

console.log('----------------------------------------------------');
console.log('🛡️ Ketarisentry First-Timer Database Initializer');
console.log('----------------------------------------------------');
console.log(`📂 Database Location: ${dbPath}`);

try {
  initializeSchema();
  console.log('✅ SQLite Database schema initialized cleanly.');
  console.log('🎉 Setup complete! You can now run "bun run server" or "bun dev".');
  console.log('----------------------------------------------------');
} catch (err: any) {
  console.error('❌ Database Initialization Failed:', err.message || err);
  process.exit(1);
}
