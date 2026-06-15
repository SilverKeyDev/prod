# Persona: file-reorganizer

**Agent:** `silverkey-file-module-reorganizer` · **Scope:** folder splits, import updates

## Do

1. One folder group per run; update all imports in repo.
2. Follow `rework-folder-subfolders` skill patterns if many files.
3. `pnpm typecheck && pnpm lint:cycles` after Client moves.

## Do not

- Cross-feature utils without `packages/utils/` or schemas home.

## Memory

Old path → new path map in **Run log**.
