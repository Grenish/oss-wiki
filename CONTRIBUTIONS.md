# Contributing to OSS Wiki

Thank you for your interest in contributing to **oss-wiki**! We welcome contributions of all kinds — documentation, content, code, design, and community help. This document provides a clear, step-by-step guide from setting up your environment to submitting a pull request.

---

## 📋 Contents

- [Ways to Contribute](#ways-to-contribute)
- [Repository setup & installation](#repository-setup--installation)
- [Branching & commit conventions](#branching--commit-conventions)
- [Development workflow & making changes](#development-workflow--making-changes)
- [Code review process & expectations](#code-review-process--expectations)
- [Issues and templates overview](#issues-and-templates-overview)
- [Pull request guidelines & checklist](#pull-request-guidelines--checklist)
- [Communication & discussion](#communication--discussion)
- [Code of Conduct & reporting](#code-of-conduct--reporting)
- [References & resources](#references--resources)

---

## 🤝 Ways to Contribute

- Documentation: add or improve guides in `/content/docs`
- Content: author new MDX pages or update examples
- Code: fix bugs, implement features, add tests
- Design: UI/UX improvements, icons, illustrations
- Community: triage issues, answer questions, review PRs
- Reporting: file clear bug reports and feature requests

---

## ⚙️ Repository setup & installation

Prerequisites

- Git
- Node.js 18+ or Bun runtime
- A GitHub account

Setup steps

```powershell
# clone your fork (replace <your-username>)
git clone https://github.com/<your-username>/oss-wiki.git
cd oss-wiki

# add upstream remote
git remote add upstream https://github.com/Grenish/oss-wiki.git
```

Install dependencies (preferred: Bun)

```powershell
# using Bun (recommended)
bun install

# or npm
npm install

# or yarn
yarn install
```

Start development server

```powershell
bun dev
# or: npm run dev
# or: yarn dev
```

Open http://localhost:3000 to confirm the site runs locally.

Quick verification

- Browse `/content/docs` pages
- Make a small change (e.g. edit a doc) to confirm hot reload
- Check console for build/runtime errors

---

## 🌳 Branching & commit conventions

Branching

- Create a branch per change from `main` (or `dev` if instructed):
  - `feat/<short-description>`
  - `fix/<short-description>`
  - `docs/<short-description>`
  - `refactor/<short-description>`

Commit messages

- Use Conventional Commits format: `<type>(<scope>): <short description>`
- Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

Examples

```powershell
git commit -m "feat(docs): add contributing guide"
git commit -m "fix(search): fix pagination bug"
```

Keeping your fork up-to-date

```powershell
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

---

## 🛠 Development workflow & making changes

1. Sync with upstream `main` and create a branch.
2. Make focused, small changes. Prefer multiple small PRs over one large PR.
3. Update or add tests where appropriate.
4. Run the dev server and lint/build steps before committing.

Useful commands

```powershell
# start dev server
bun dev

# build to ensure production build works
bun run build

# lint (if configured)
bun run lint
```

Project structure guidance

- Content: `/content/docs` (MDX files)
- Components/UI: `/components` and `/components/ui`
- App entry and routes: `/app`
- Utilities & libs: `/lib`

---

## 🔍 Code review process & expectations

Submitting a PR

- Push your branch to your fork and open a PR against `main` (or `dev` if requested).
- Fill out the PR description with what changed, why, and any manual test steps.
- Link related issues using `Closes #<issue-number>` when appropriate.

Review lifecycle

- CI will run (build, lint, tests) — ensure these pass.
- Maintainers/reviewers will request changes or approve.
- Address feedback promptly and keep the PR up-to-date.

Reviewer expectations

- Provide constructive, specific feedback
- Prefer small incremental suggestions
- Run the branch locally if needed for UI changes

Merging

- Maintainers merge PRs after approvals and passing CI.
- Squash merge is preferred to keep history tidy unless otherwise requested.

---

## 🐞 Issues and templates overview

Before opening an issue

- Search existing issues and discussions to avoid duplicates.
- Confirm the issue persists on the latest `main`.

Filing a bug report

Include:
- Title: concise summary
- Description: what happened
- Steps to reproduce: exact steps
- Expected vs actual behavior
- Environment: browser, OS, Node/Bun version
- Attach logs/screenshots if helpful

Feature requests

Include:
- Problem statement
- Proposed solution or examples
- Alternatives considered

Templates

- Use the provided GitHub issue templates (Bug report / Feature request) when opening a new issue.

---

## ✅ Pull request guidelines & checklist

Before requesting review ensure:

- [ ] Code compiles and builds locally
- [ ] Your branch is up-to-date with `main`
- [ ] Tests pass (if applicable)
- [ ] Linting passes
- [ ] Commit messages follow conventions
- [ ] Documentation is updated (if needed)
- [ ] PR description includes testing steps and related issues

Best practices

- Keep PRs focused on a single change
- Write clear PR descriptions and include screenshots for UI changes
- Tag reviewers or teams as appropriate

---

## 💬 Communication & discussion

Where to ask questions

- Use GitHub Issues for bugs and feature requests
- Use GitHub Discussions for broader questions and community talk
- Use PR comments for code-specific discussion

Guidelines

- Be respectful and concise
- Provide context and steps to reproduce
- Search for existing answers before posting

---

## 📜 Code of Conduct & reporting

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md). All contributors must abide by it.

If you experience or witness unacceptable behavior, please report it to the maintainers.

---

## 📚 References & resources

- Project README: `./README.md`
- Documentation content: `/content/docs`
- Code of Conduct: `./CODE_OF_CONDUCT.md`
- License: `./LICENSE`
- Conventional Commits: https://www.conventionalcommits.org/
- Markdown guide: https://www.markdownguide.org/

---

Thank you for helping improve OSS Wiki — every contribution helps!
