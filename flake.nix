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

      # CI checks - this is what Garnix will run
      checks.${system} = {
        build = pkgs.runCommand "eduteams-build" {
          buildInputs = [ pkgs.nodejs_20 pkgs.nodePackages.pnpm ];
        } ''
          cp -r ${./.} source
          cd source
          chmod -R +w .
          export HOME=$TMPDIR
          export NEXT_TELEMETRY_DISABLED=1
          
          echo "Installing dependencies..."
          pnpm install --no-frozen-lockfile
          
          echo "Building application..."
          pnpm run build
          
          echo "Build successful!" > $out
        '';

        lint = pkgs.runCommand "eduteams-lint" { 
          buildInputs = [ pkgs.nodejs_20 pkgs.nodePackages.pnpm ];
        } ''
          cp -r ${./.} source
          cd source
          chmod -R +w .
          export HOME=$TMPDIR
          export NEXT_TELEMETRY_DISABLED=1
          
          echo "Installing dependencies..."
          pnpm install --no-frozen-lockfile
          
          echo "Running lint..."
          pnpm run lint
          
          echo "Lint passed!" > $out
        '';
      };

      # Alias the build check as the default package  
      packages.${system}.default = pkgs.runCommand "eduteams-default" {
        buildInputs = [ pkgs.nodejs_20 pkgs.nodePackages.pnpm ];
      } ''
        cp -r ${./.} source
        cd source
        chmod -R +w .
        export HOME=$TMPDIR
        export NEXT_TELEMETRY_DISABLED=1
        
        echo "Installing dependencies..."
        pnpm install --frozen-lockfile
        
        echo "Building application..."
        pnpm run build
        
        echo "Build successful!" > $out
      '';
    };
}
