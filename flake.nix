{
  description = "eduteams – Next.js 15 + pnpm";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
  };

  outputs = { nixpkgs, ... }: 
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      # Development shell
      devShells.${system}.default = pkgs.mkShell {
        packages = [ 
          pkgs.nodejs_20 
          pkgs.nodePackages.pnpm 
          pkgs.git 
        ];
        shellHook = ''
          echo "🔧 Node  $(node  -v)"
          echo "🔧 pnpm $(pnpm -v)"
          echo "🔧 Git   $(git --version)"
        '';
      };

      # CI checks using local node_modules if available
      checks.${system} = {
        build = pkgs.runCommand "eduteams-build" {
          buildInputs = [ pkgs.nodejs_20 pkgs.nodePackages.pnpm ];
          __impure = true;  # Allow network access
        } ''
          cp -r ${./.} source
          cd source
          chmod -R +w .
          export HOME=$TMPDIR
          export NEXT_TELEMETRY_DISABLED=1
          
          # Try to use offline mode first
          echo "Attempting offline build..."
          if pnpm install --offline --frozen-lockfile 2>/dev/null; then
            echo "Using offline cache"
          else
            echo "Offline failed, installing dependencies..."
            pnpm install --frozen-lockfile
          fi
          
          echo "Building application..."
          pnpm run build
          
          echo "Build successful!" > $out
        '';

        lint = pkgs.runCommand "eduteams-lint" { 
          buildInputs = [ pkgs.nodejs_20 pkgs.nodePackages.pnpm ];
          __impure = true;  # Allow network access
        } ''
          cp -r ${./.} source
          cd source
          chmod -R +w .
          export HOME=$TMPDIR
          export NEXT_TELEMETRY_DISABLED=1
          
          # Try to use offline mode first
          echo "Attempting offline lint..."
          if pnpm install --offline --frozen-lockfile 2>/dev/null; then
            echo "Using offline cache"
          else
            echo "Offline failed, installing dependencies..."
            pnpm install --frozen-lockfile
          fi
          
          echo "Running lint..."
          pnpm run lint
          
          echo "Lint passed!" > $out
        '';
      };

      # Simple package that just succeeds for now
      packages.${system}.default = pkgs.runCommand "eduteams-success" {} ''
        echo "eduteams build configured for Garnix CI" > $out
      '';
    };
}
