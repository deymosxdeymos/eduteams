# Garnix CI - Next Steps

## 🚨 Immediate Improvements (1-2 hours)

### 1. Single Source of Truth for Node Version
- [ ] Create `versions.json` or use flake output for Node version
- [ ] Update GitHub Actions to read Node version from flake: `echo "NODE=$(nix eval .#legacyPackages.x86_64-linux.nodejs.version --raw) >> $GITHUB_ENV"`
- [ ] Remove hardcoded Node 20 from `.github/workflows/ci.yml`

### 2. Optimize GitHub Actions Build Speed
- [ ] Add `.next/cache` caching to GitHub Actions workflow
- [ ] Cache pnpm store: `~/.pnpm-store`
- [ ] Use `actions/cache@v4` for faster builds

### 3. Reusable Static Checks
- [ ] Move static validation from `flake.nix` to `scripts/check.sh`
- [ ] Update both Nix checks and GitHub Actions to use same script
- [ ] Add ESLint/TypeScript config checksum validation

## 🔧 Technical Debt (3-5 hours)

### 4. Upgrade to Full Nix Build (pnpm2nix)
**Goal**: Single pipeline, fully reproducible builds in Garnix

#### Steps:
- [ ] Add `pnpm2nix.url = "github:nix-community/pnpm2nix"` to flake inputs
- [ ] Create `nix/` directory for generated files
- [ ] Run update script:
  ```bash
  pnpm2nix --lock pnpm-lock.yaml --output nix/pnpm-deps.nix
  ```
- [ ] Replace "success" package with real build using generated deps
- [ ] Add `postInstall` phase for `pnpm run build`
- [ ] Test offline build works: `nix build --offline`
- [ ] Commit generated `nix/pnpm-deps.nix` file

### 5. Binary Cache Setup
- [ ] Configure Garnix binary cache for faster contributor onboarding
- [ ] Document how contributors can use cached node_modules
- [ ] Add cache warming for common development dependencies

## 📋 Documentation & Process

### 6. Developer Experience
- [ ] Update README with Garnix CI status badges
- [ ] Document two-phase CI approach (static + build)
- [ ] Add troubleshooting guide for lockfile version issues
- [ ] Create onboarding docs for `nix develop`

### 7. Monitoring & Alerts
- [ ] Set up notifications for CI failures
- [ ] Monitor GitHub Actions vs Garnix result divergence
- [ ] Track build times and cache hit rates

## 🎯 Long-term Goals (Future Sprints)

### 8. Full Nixification
- [ ] Migrate from hybrid to single Nix pipeline
- [ ] Remove GitHub Actions dependency
- [ ] Implement proper supply chain security with locked dependencies
- [ ] Add Nix-based deployment pipeline

### 9. Advanced Features
- [ ] Multi-architecture builds (ARM64 + x86_64)
- [ ] Preview deployments triggered by Garnix
- [ ] Integration tests in Nix environment
- [ ] Security scanning of dependencies

## 🚫 Won't Do (Oracle confirmed)
- ❌ Use `__impure` flags (requires experimental features)
- ❌ dream2nix without prefetch (network restrictions)  
- ❌ Vendored node_modules tarball (inflates repo)

---

## Current Status: ✅ Hybrid Working
- Static validation in Garnix ✅
- Build/lint in GitHub Actions ✅
- Development shell available ✅
- Ready for incremental upgrades ✅

**Next Priority**: Items 1-3 for immediate wins, then item 4 for full Nix builds.
