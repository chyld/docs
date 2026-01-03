#!/bin/bash

mkdir -p db
sqlite3 db/docs.db <scripts/db-init.sql
