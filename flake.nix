{
  description = "eduteams – Next 15 + pnpm-lock v9, built with Dream2nix";

  inputs = {
    nixpkgs.url     = "github:NixOS/nixpkgs/nixos-24.11";
    dream2nix.url   = "github:jkarni/dream2nix";
    dream2nix.inputs.nixpkgs.follows = "nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, dream2nix, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        pnpm = pkgs.nodePackages.pnpm;
      in
      let
        # ─── Dream2nix package built from pnpm-lock.yaml ──────────────────
        eduteams = dream2nix.lib.evalModules {
          packageSets.nixpkgs = pkgs;
          modules = [
            dream2nix.modules.dream2nix.nodejs-pnpm-lock-v9
            dream2nix.modules.dream2nix.nodejs-granular-v3
            {
              mkDerivation.src = ./.;                 # project root
              nodejs-pnpm-lock-v9.pnpmLockFile = ./pnpm-lock.yaml;
              name    = "eduteams";
              version = "0.1.0";
            }
          ];
        };
      in {
        ####################################################################
        # Standard flake keys only — nix flake metadata is now happy       #
        ####################################################################

        packages.default = eduteams;

        checks.lint = pkgs.runCommand "lint" { } ''
          ${pnpm}/bin/pnpm lint
          touch $out
        '';

        devShells.default = pkgs.mkShell {
          packages = [ pkgs.nodejs_20 pnpm ];
          shellHook = ''
            echo "🔧 Node  : $(node -v)"
            echo "🔧 pnpm  : $(pnpm -v)"
          '';
        };
      });
}
