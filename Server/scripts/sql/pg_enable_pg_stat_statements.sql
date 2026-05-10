-- Run on PostgreSQL as a superuser (e.g. rds_superuser) to enable slow query visibility.
-- Then use: SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20;

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
