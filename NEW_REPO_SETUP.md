# Creating a Fresh Clean Repository

This guide walks through creating a brand-new repository from the current working state, with no messy history or branches.

---

## Goal

Create a new GitHub repository with:
- ✅ Single clean commit of the current working app
- ✅ No branch clutter or old history
- ✅ New name: `coast-viewer-roulette`
- ✅ Proper README and project files

The old repo stays as an archive if you need to reference it.

---

## Step-by-Step Instructions

### 1. Verify You're on the Working Branch

```bash
cd /home/user/CarloMTG-Slots
git status
```

Make sure:
- All changes are committed
- You're on the branch with the current production/working code

### 2. Create a Clean Copy (No Git History)

**Option A: Copy folder and remove .git**

```bash
cd /home/user
cp -r CarloMTG-Slots coast-viewer-roulette
cd coast-viewer-roulette
rm -rf .git
```

**Option B: Use git archive (cleaner method)**

```bash
cd /home/user/CarloMTG-Slots
git checkout claude/scale-header-logo-01FPnwn7AEviQPfJFmZMDsNr  # or main/master

# Create tarball of current state
git archive --format=tar HEAD | (mkdir ../coast-viewer-roulette && cd ../coast-viewer-roulette && tar xf -)
cd ../coast-viewer-roulette
```

Either way, `coast-viewer-roulette` now contains just the code with no history or branches.

### 3. Initialize Brand-New Git Repository

```bash
cd /home/user/coast-viewer-roulette
git init
git add .
git commit -m "Initial commit: CoAST Viewer Roulette v1.0"
```

### 4. Create New GitHub Repository

1. Go to GitHub → **New repository**
2. Set name: `coast-viewer-roulette`
3. Description: "Streamer-style probability slot machine for community game selection"
4. **DO NOT** check "Add README" or ".gitignore" (you already have them locally)
5. Click **Create repository**

### 5. Connect Local Repo to GitHub

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/coast-viewer-roulette.git
git branch -M main
git push -u origin main
```

**Important:** Replace `<YOUR_USERNAME>` with your actual GitHub username!

### 6. Verify on GitHub

Visit `https://github.com/<YOUR_USERNAME>/coast-viewer-roulette` and confirm:
- ✅ One clean commit
- ✅ README.md displays properly
- ✅ All files are present
- ✅ No old branches

---

## What You Now Have

### New Clean Repo
- **Name**: `coast-viewer-roulette`
- **History**: 1 commit (clean slate)
- **Branch**: `main` only
- **Files**:
  - `README.md` ← Comprehensive documentation
  - `.gitignore` ← Proper ignore rules
  - `package.json` ← Project metadata
  - `index.html` ← Main app
  - Simulation/test files
  - Analysis documentation

### Old Repo
- Still exists at `/home/user/CarloMTG-Slots`
- Keep as archive/backup
- Can delete later if no longer needed

---

## Next Steps

### Set Up Vercel Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import from GitHub: `<YOUR_USERNAME>/coast-viewer-roulette`
4. Framework Preset: **Other** (it's a static HTML app)
5. Root Directory: `./`
6. Build Command: (leave empty)
7. Output Directory: `./`
8. Click **Deploy**

Vercel will automatically deploy on every push to `main`.

### Create Sensible Branches Going Forward

```bash
# Feature branches
git checkout -b feature/ui-improvements
git checkout -b feature/new-diagnostics

# Bug fix branches
git checkout -b bugfix/reel-animation

# Always merge back to main when done
git checkout main
git merge feature/ui-improvements
git push
```

### Update package.json

Edit `package.json` and replace `<USERNAME>` with your actual GitHub username:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/YOUR_USERNAME/coast-viewer-roulette.git"
},
"bugs": {
  "url": "https://github.com/YOUR_USERNAME/coast-viewer-roulette/issues"
},
"homepage": "https://github.com/YOUR_USERNAME/coast-viewer-roulette#readme"
```

Then commit:
```bash
git add package.json
git commit -m "Update repository URLs in package.json"
git push
```

---

## File Organization (Optional)

If you want to organize files into folders later:

```bash
mkdir -p tests docs
mv simulation-test.html comprehensive-simulation.js run-simulation.js stress-test.js tests/
mv BALANCE_IMPROVEMENTS.md LUNA_CARLO_SCALING_ANALYSIS.md SIMULATION_ANALYSIS.md docs/
```

Then update paths in README.md to match the new structure.

---

## Common Issues

### "Permission denied" when pushing

Make sure you're authenticated with GitHub:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

For HTTPS, you may need a Personal Access Token instead of password.

### "Remote origin already exists"

Remove it first:
```bash
git remote remove origin
git remote add origin https://github.com/<YOUR_USERNAME>/coast-viewer-roulette.git
```

### Want to rename the old repo folder?

```bash
cd /home/user
mv CarloMTG-Slots CarloMTG-Slots-ARCHIVE
```

---

## Summary

You now have:
1. ✅ Clean new repo with proper name
2. ✅ Single commit, no branch chaos
3. ✅ Professional README
4. ✅ Proper .gitignore and package.json
5. ✅ Ready for clean development workflow

The old messy repo is preserved as a backup.

**Start fresh, develop clean!** 🎰✨
