/**
 * Re-export the central API barrel so that "packages/config/api" resolves.
 * API clients live in packages/api/; this file exposes them under config for
 * backward compatibility and architecture conventions.
 */
export * from "packages/api";
