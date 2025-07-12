{
  description = "eduteams – Next.js 15 + pnpm";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
  };

  outputs = { nixpkgs, ... }: 
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
      
      # Build the application using buildPnpmPackage
      app = pkgs.stdenv.mkDerivation {
        pname = "eduteams";
        version = "0.1.0";
        src = ./.;
        
        buildInputs = [ pkgs.nodejs_20 pkgs.nodePackages.pnpm ];
        
        buildPhase = ''
          export HOME=$TMPDIR
          export NEXT_TELEMETRY_DISABLED=1
          pnpm install --frozen-lockfile
          pnpm run build
        '';
        
        installPhase = ''
          mkdir -p $out
          cp -r .next $out/
          cp package.json $out/
        '';
      };

      # Lint check using simple derivation
      lintCheck = pkgs.stdenv.mkDerivation {
        pname = "eduteams-lint";
        version = "0.1.0";
        src = ./.;
        
        buildInputs = [ pkgs.nodejs_20 pkgs.nodePackages.pnpm ];
        
        buildPhase = ''
          export HOME=$TMPDIR
          export NEXT_TELEMETRY_DISABLED=1
          pnpm install --frozen-lockfile
          pnpm run lint
        '';
        
        installPhase = ''
          mkdir -p $out
          echo "Lint passed!" > $out/result
        '';
      };
    in {
      # Development shell
      devShells.${system}.default = pkgs.mkShell {
        packages = [ pkgs.nodejs_20 pkgs.nodePackages.pnpm pkgs.git ];
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
