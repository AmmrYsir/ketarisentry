import { initializeSchema, seedDefaultData, dbPath } from './db';

console.log('----------------------------------------------------');
console.log('🛡️ KetariSentry First-Timer Database Initializer');
console.log('----------------------------------------------------');
console.log(`📂 Database Location: ${dbPath}`);

try {
  initializeSchema();
  seedDefaultData();
  console.log('✅ SQLite Database tables created successfully.');
  console.log('✅ Default telemetry service seeds populated.');
  console.log('🎉 Setup complete! You can now run "bun run server" or "bun dev".');
  console.log('----------------------------------------------------');
} catch (err: any) {
  console.error('❌ Database Initialization Failed:', err.message || err);
  process.exit(1);
}
