{
  description = "eduteams – Next.js 15 + pnpm (built with pnpm2nix-nzbr)";

  inputs = {
    nixpkgs.url   = "github:NixOS/nixpkgs/nixos-24.11";

    # actively maintained fork that supports lockfile-v9
    pnpm2nix = {
      url = "github:nzbr/pnpm2nix-nzbr";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, pnpm2nix, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        node = pkgs.nodejs_20;               # Node 20 LTS – meets Next 15 req
        pnpm = pkgs.nodePackages.pnpm;
      in rec {
        # ─────────── build artefact ───────────
        packages.default = pnpm2nix.lib.mkPnpmPackage {
          pname      = "eduteams";
          version    = "0.1.0";
          src        = ./.;

          nodejs     = node;
          pnpm       = pnpm;

          script     = "build";              # runs: pnpm run build → next build
          distDir    = ".next";              # keep the production bundle
        };

        # ─────────── CI check: lint ───────────
        # copy the source into /build because runCommand starts in an empty dir
        checks.lint = pkgs.runCommand "lint" { src = ./.; } ''
          cp -R $src source
          cd source
          ${pnpm}/bin/pnpm lint
          touch $out
        '';

        # ─────────── dev shell ───────────
        devShells.default = pkgs.mkShell {
          packages = [ node pnpm ];
          shellHook = ''
            echo "🔧  Node  $(node  -v)"
            echo "🔧  pnpm $(pnpm -v)"
          '';
        };
      });
}
