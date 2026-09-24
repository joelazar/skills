---
name: upstream-sync
description: Check skills in this repo against the upstream skills they were copied from and propose changes worth porting. Use when Joe asks to check, sync, or compare skills with upstream.
---

# upstream-sync

Tracked skills pin the upstream file or directory at the commit last synced, in `SKILL.md` frontmatter:

```yaml
metadata:
  source: https://github.com/<owner>/<repo>/tree/<sha>/<dir>
  source: https://github.com/<owner>/<repo>/blob/<sha>/<file>
  source: https://github.com/<owner>/<repo>/tree/<sha>
  source: https://gist.github.com/<user>/<id>/<sha>
```

No path after `<sha>` means the whole repo is the skill. Upstream clones live at `$(git config --global gj.root)/<host>/<owner>/<repo>` and are cloned with `gj get <host>/<owner>/<repo>`.

## Steps

1. Run `.agents/skills/upstream-sync/status.sh [skill...]`. It fetches each upstream and prints, per skill, `up to date`, `removed upstream`, or the new commits plus the exact `git log -p` command for them.
2. For each skill with new commits, run the printed `git log -p` command and read the local skill files.
3. Classify every upstream change into one of:
   - **port**: a fix or improvement that applies to the local skill
   - **skip**: irrelevant here, e.g. touches parts Joe removed, only reformats, or changes packaging, installers, or provider-specific copies he does not keep
   - **conflict**: overlaps a local change; describe both sides
4. Present a table per skill: commit, one-line summary, verdict, one-line reason. Rank ports first. Do not edit files yet.
5. After Joe picks what to port, apply it in the local style. Local edits win over upstream ones (e.g. `disable-model-invocation`, `~/.agents/skills` paths, dropped wrappers).
6. Bump `<sha>` in `metadata.source` to the upstream `origin/HEAD` commit you reviewed up to, even if nothing was ported, so the next run only shows newer commits.
7. For `removed upstream`, find where it went with `git -C <dir> log --stat -1 origin/HEAD -- <path>`. If it was renamed, ask Joe whether to follow the new path; if not, replace `source` with `https://github.com/<owner>/<repo>` (no sha, no longer tracked).

## Adding a new tracked skill

Add `metadata.source` with the permalink of the upstream commit it was copied from to the skill's `SKILL.md` frontmatter.
