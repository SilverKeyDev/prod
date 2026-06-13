#!/usr/bin/env sh
# Shared DATABASE_URL classification helpers for secrets.sh and setup-verify.sh.
# shellcheck shell=sh

secrets_env_file_value() {
  key="$1"
  file="$2"
  [ -f "$file" ] || return 0
  awk -F= -v key="$key" '
    $1 == key {
      val = substr($0, index($0, "=") + 1)
    }
    END {
      gsub(/^"/, "", val)
      gsub(/"$/, "", val)
      print val
    }
  ' "$file"
}

secrets_is_database_secret_name() {
  case "$1" in
    db_url|database_url|DATABASE_URL|*/db_url|*/db|*/database|*/database/*|*silverkey*database*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

secrets_is_local_database_url() {
  case "$1" in
    *localhost*|*127.0.0.1*|*::1*|*silverkey-dev-postgres*|*postgres:5432*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}
