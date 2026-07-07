/*
# Refresh auth schema statistics

Analyze tables to update query planner stats which might fix schema introspection issues.
*/

-- Analyze the auth schema tables
ANALYZE auth.users;
ANALYZE auth.identities;
ANALYZE auth.sessions;
ANALYZE auth.audit_log_entries;