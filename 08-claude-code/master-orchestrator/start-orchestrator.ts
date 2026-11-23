#!/usr/bin/env node
/**
 * ZAK Studio Web - Master Orchestrator Entry Point
 * Run with: npx ts-node start-orchestrator.ts
 * Or compile and run: node dist/start-orchestrator.js
 */

import { startOrchestrator } from './master-orchestrator';

async function main() {
  console.log('🚀 ZAK Studio Web - Master Orchestrator');
  console.log('==========================================');
  console.log('');

  try {
    await startOrchestrator();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();