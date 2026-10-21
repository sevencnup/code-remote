# Project rename to `code-remote`

## Goal

Rename the local project directory and GitHub repository to `code-remote`, and align the package/workspace name and current setup instructions. Keep the existing Codex Remote product label, Android application ID, service names, and persistent data directories so installed clients and user data retain their identity.

## Implementation steps

1. [x] Confirm the target directory and GitHub repository name are available.
2. [x] Update package/workspace metadata, lockfile importer, current setup paths, GitHub links, and semantic version records.
3. [x] Rename the GitHub repository and update this checkout's GitHub remote URL.
4. [x] Rename the local project directory and point the installed systemd service at its new path. Reload systemd configuration without restarting the active service; retain a symlink at the old path for the active process.
5. [x] Review and locally commit only this rename. Do not push source commits to GitHub.

## Acceptance criteria

- The project directory is `/mnt/data/code/code-remote`, and pnpm recognizes the package as `code-remote` from the workspace root.
- The GitHub repository is `sevencnup/code-remote`, and the local `github` remote uses its canonical SSH URL.
- Current setup instructions and Android release links use the new name.
- Existing app identity, service names, and persistent data paths remain intact; the running service is not interrupted, and the old local path resolves to the renamed directory during the transition.
