#!/usr/bin/env node

import { initDatabase } from '../database/db'
import { generateAndDeployMerkleDistributor } from '../rewards/generateMerkleDistributor'

async function run() {
  await initDatabase()
  await generateAndDeployMerkleDistributor()
}
run()
