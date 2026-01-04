#!/bin/bash

# clean up
rm bun.lock
rm -rf node_modules
rm -rf db
rm -rf docs
ls -al

# install dependencies
bun install
mkdir -p db docs
sqlite3 db/docs.db <scripts/schema.sql
ls -al

# run server
bun run index.ts
