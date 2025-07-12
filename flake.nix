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
        # ─── pull in the pnpm2nix overlay so pkgs has mkPnpmPackage ───────
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ pnpm2nix.overlays.default ];
        };

        node = pkgs.nodejs_20;
        pnpm = pkgs.nodePackages.pnpm;
      in rec {
        # ─────────── build artefact ───────────
        packages.default = pkgs.mkPnpmPackage {
          pname      = "eduteams";
          version    = "0.1.0";
          src        = ./.;

          nodejs     = node;
          pnpm       = pnpm;

          script     = "build";    # runs: pnpm run build  → next build
          distDir    = ".next";    # production bundle
        };

        # ─────────── CI check: lint ───────────
        checks.lint = pkgs.runCommand "lint" { src = ./.; } ''
          cp -R $src source
          cd source
          ${pnpm}/bin/pnpm lint
          touch $out
        '';

        # ─────────── dev-shell ───────────
        devShells.default = pkgs.mkShell {
          packages = [ node pnpm ];
          shellHook = ''
            echo "🔧 Node  $(node  -v)"
            echo "🔧 pnpm $(pnpm -v)"
          '';
        };
      });
}
