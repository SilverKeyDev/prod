#!/usr/bin/env bash
# Portable dev-port helpers: free TCP ports and probe listeners.
# macOS and Linux: prefers lsof(8). Linux without lsof: fuser(1) -k on the port.
# "In use" checks prefer nc(1) -z (common on both platforms).
#
# shellcheck shell=bash
# Intended to be sourced from other bash scripts in this directory.

dev_kill_tcp_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti:"$port" 2>/dev/null || true)
    if [[ -n "${pids}" ]]; then
      echo "${pids}" | xargs kill -9 2>/dev/null || true
    fi
    return 0
  fi
  if [[ "$(uname -s)" == "Linux" ]] && command -v fuser >/dev/null 2>&1; then
    fuser -k -9 "${port}/tcp" 2>/dev/null || true
    return 0
  fi
  echo "dev_kill_tcp_port: install lsof, or on Linux install psmisc (fuser), to clear port ${port}" >&2
  return 1
}

# True (0) if something accepts TCP on host:port (typically Metro/Vite/Flask).
dev_tcp_port_open() {
  local host="${1:-127.0.0.1}"
  local port="$2"
  if command -v nc >/dev/null 2>&1 && nc -z "$host" "$port" 2>/dev/null; then
    return 0
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti:"$port" >/dev/null 2>&1
    return $?
  fi
  return 1
}

# True (0) if any known tool reports activity on TCP port (listener or held socket).
dev_port_busy() {
  local port="$1"
  dev_tcp_port_open 127.0.0.1 "$port" && return 0
  if command -v lsof >/dev/null 2>&1 && [[ -n "$(lsof -ti:"$port" 2>/dev/null || true)" ]]; then
    return 0
  fi
  if [[ "$(uname -s)" == "Linux" ]] && command -v fuser >/dev/null 2>&1 && fuser "${port}/tcp" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}
