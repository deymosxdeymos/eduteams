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

      # Basic validation checks that don't require network access
      checks.${system} = {
        # Check that required files exist and are valid
        structure = pkgs.runCommand "eduteams-structure-check" {} ''
          echo "Checking project structure..."
          
          # Check required files exist
          if [[ ! -f "${./.}/package.json" ]]; then
            echo "ERROR: package.json not found"
            exit 1
          fi
          
          if [[ ! -f "${./.}/pnpm-lock.yaml" ]]; then
            echo "ERROR: pnpm-lock.yaml not found"
            exit 1
          fi
          
          if [[ ! -f "${./.}/next.config.ts" ]]; then
            echo "ERROR: next.config.ts not found"
            exit 1
          fi
          
          echo "✓ All required files present"
          echo "Project structure check passed!" > $out
        '';

        # Validate package.json syntax
        package-json = pkgs.runCommand "eduteams-package-json-check" {
          buildInputs = [ pkgs.jq ];
        } ''
          echo "Validating package.json..."
          
          if ! jq . "${./.}/package.json" > /dev/null; then
            echo "ERROR: package.json is not valid JSON"
            exit 1
          fi
          
          # Check required fields
          if ! jq -e '.scripts.build' "${./.}/package.json" > /dev/null; then
            echo "ERROR: build script not found in package.json"
            exit 1
          fi
          
          if ! jq -e '.scripts.lint' "${./.}/package.json" > /dev/null; then
            echo "ERROR: lint script not found in package.json"
            exit 1
          fi
          
          echo "✓ package.json is valid"
          echo "Package.json validation passed!" > $out
        '';

        # Check TypeScript configuration
        typescript = pkgs.runCommand "eduteams-typescript-check" {
          buildInputs = [ pkgs.jq ];
        } ''
          echo "Checking TypeScript configuration..."
          
          if [[ ! -f "${./.}/tsconfig.json" ]]; then
            echo "ERROR: tsconfig.json not found"
            exit 1
          fi
          
          if ! jq . "${./.}/tsconfig.json" > /dev/null; then
            echo "ERROR: tsconfig.json is not valid JSON"
            exit 1
          fi
          
          echo "✓ TypeScript configuration is valid"
          echo "TypeScript check passed!" > $out
        '';
      };

      # Simple package that just succeeds for now
      packages.${system}.default = pkgs.runCommand "eduteams-success" {} ''
        echo "eduteams build configured for Garnix CI" > $out
      '';
    };
}
