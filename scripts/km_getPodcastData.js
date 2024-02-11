#!/usr/bin/env node

// Use to trigger tests of capabilities.
import { TroopTrack } from './TroopTrack.mjs';

// ===== CREATE TROOPTRACK OBJECT =====
const tt = new TroopTrack();
await tt.getPodcastData('2024-02-06');

/*
// This will get the command line arguments
const args = process.argv.slice(2); // slice(2) to ignore the first two default arguments

// Call your function with the first argument
await tt.getPodcastData(args[0]); */