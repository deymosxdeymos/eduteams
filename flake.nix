{
  description = "eduteams – Next.js 15 + pnpm";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    pnpm2nix.url = "github:nzbr/pnpm2nix-nzbr";
    pnpm2nix.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { nixpkgs, pnpm2nix, ... }: 
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        overlays = [ pnpm2nix.overlays.default ];
      };
      node = pkgs.nodejs_20;
      pnpm = pkgs.nodePackages.pnpm;

      # Build the application with pnpm2nix
      app = pkgs.mkPnpmPackage {
        pname = "eduteams";
        version = "0.1.0";
        src = ./.;
        
        nodejs = node;
        pnpm = pnpm;
        
        script = "build";
        distDir = ".next";
        
        # Set environment variables for Next.js build
        preBuild = ''
          export HOME=$TMPDIR
          export NEXT_TELEMETRY_DISABLED=1
        '';
      };

      # Lint check
      lintCheck = pkgs.mkPnpmPackage {
        pname = "eduteams-lint";
        version = "0.1.0";
        src = ./.;
        
        nodejs = node;
        pnpm = pnpm;
        
        script = "lint";
        
        # Override to just run lint, no build artifacts
        installPhase = ''
          echo "Lint passed!" > $out
        '';
        
        preBuild = ''
          export HOME=$TMPDIR
          export NEXT_TELEMETRY_DISABLED=1
        '';
      };
    in {
      # Development shell
      devShells.${system}.default = pkgs.mkShell {
        packages = [ node pnpm pkgs.git ];
        shellHook = ''
          echo "🔧 Node  $(node  -v)"
          echo "🔧 pnpm $(pnpm -v)"
          echo "🔧 Git   $(git --version)"
        '';
      };

      # Main package
      packages.${system}.default = app;

      # CI checks that actually build and lint
      checks.${system} = {
        build = app;
        lint = lintCheck;
      };
    };
}
