-- Copy a hot query from pg_stat_statements (or the app) and run with:

EXPLAIN (ANALYZE, BUFFERS, VERBOSE) /* your SELECT here */;
