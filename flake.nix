{
  description = ''
    Garnix module for a NodeJS project **backed by pnpm-lock v9**.
    No web-server section (pure Next.js frontend).
  '';

  ################################# inputs ##################################
  inputs = {
    nixpkgs.url   = "github:NixOS/nixpkgs/nixos-24.11";

    dream2nix = {
      url = "github:jkarni/dream2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  ###########################################################################
  outputs = { dream2nix, nixpkgs, ... }:
  {
    ####################### garnixModules.default ###########################
    garnixModules.default = { lib, pkgs, config, ... }:
    let
      ########################### 1. SUBMODULES #############################
      nodejsSubmodule.options = {
        # 🔹 path that contains *package.json* + *pnpm-lock.yaml*
        src = lib.mkOption {
          type        = lib.types.path;
          example     = "./.";
          description = "Directory with package.json and pnpm-lock.yaml";
        };

        prettier = lib.mkOption {
          type        = lib.types.bool;
          default     = false;
          description = "Add a Prettier CI check & dev-shell package";
        };

        devTools = lib.mkOption {
          type        = lib.types.listOf lib.types.package;
          default     = [ ];
          description = "Extra packages to expose in the dev-shell (e.g. LSPs)";
        };

        buildDependencies = lib.mkOption {
          type        = lib.types.listOf lib.types.package;
          default     = [ ];
          description = "Native buildInputs (e.g. pkg-config, make)";
        };

        runtimeDependencies = lib.mkOption {
          type        = lib.types.listOf lib.types.package;
          default     = [ ];
          description = "Packages required at runtime (imagemagick, ffmpeg, …)";
        };

        testCommand = lib.mkOption {
          type        = lib.types.str;
          default     = "pnpm run lint";
          description = "Command executed in CI under checks.<name>-test";
        };
      };

      ################################ 2. MAIN ##############################
      theModule = projectCfg:
        { dream2nix, lib, config, ... }:
        {
          imports = [
            ### 👉  use *pnpm-lock* reader instead of npm
            dream2nix.modules.dream2nix.nodejs-pnpm-lock-v9
            dream2nix.modules.dream2nix.nodejs-granular-v3
          ];

          mkDerivation = {
            src         = projectCfg.src;
            buildInputs = projectCfg.buildDependencies;
          };

          # Tell the reader where the lock file lives
          nodejs-pnpm-lock-v9.pnpmLockFile =
            "${config.mkDerivation.src}/pnpm-lock.yaml";

          name    = "nodejs-app";
          version = "0.1.0";

          ## Optional but nice: declare project root so dream2nix prints shorter paths
          paths.projectRoot      = ./.;
          paths.projectRootFile  = "flake.nix";
          paths.package          = ./.;
        };

    in
    {
      ######################## 3. OPTION DECLARATION ########################
      options.nodejs = lib.mkOption {
        type        = lib.types.attrsOf (lib.types.submodule nodejsSubmodule);
        description = "Attrset of NodeJS projects to generate";
      };

      ########################## 4. CONFIG LOGIC ############################
      config = let
        pkgs' = pkgs;  # (short alias)
      in rec {
        # -------- packages.<name> -----------------------------------------
        packages = lib.mapAttrs
          (name: projCfg: dream2nix.lib.evalModules {
            packageSets.nixpkgs = pkgs';
            modules             = [ (theModule projCfg) ];
          })
          config.nodejs;

        # -------- checks.<name>-test [+ prettier] -------------------------
        checks = lib.foldlAttrs
          (acc: name: projCfg:
             acc //
             {
               "${name}-test" = pkgs'.runCommand "${name}-test"
                 { buildInputs = [ pkgs'.nodejs ] ++ projCfg.buildDependencies; }
                 ''
                   GLOBIGNORE=".:.."
                   cp -r ${packages.${name}}/lib/node_modules/nodejs-app/* .
                   chmod -R 755 .
                   export PATH=${packages.${name}}/lib/node_modules/.bin:$PATH
                   ${projCfg.testCommand}
                   mkdir $out
                 '';
             } //
             (if projCfg.prettier then {
               "${name}-prettier" = pkgs'.runCommand "${name}-prettier"
                 { buildInputs = [ pkgs'.nodePackages.prettier pkgs'.coreutils ]; }
                 ''
                   find ${projCfg.src} -regex '.*\\.(js\\|jsx\\|ts\\|tsx)' |
                     xargs prettier --check
                   mkdir $out
                 '';
             } else { })
          ) { } config.nodejs;

        # -------- devShells.<name> ----------------------------------------
        devShells = lib.mapAttrs
          (name: projCfg: pkgs'.mkShell {
            inputsFrom = [ packages.${name} ];
            packages   = [ pkgs'.nodejs pkgs'.nodePackages.pnpm ]
                       ++ projCfg.devTools
                       ++ projCfg.buildDependencies
                       ++ projCfg.runtimeDependencies
                       ++ (if projCfg.prettier then [ pkgs'.nodePackages.prettier ] else [ ]);
          })
          config.nodejs;
      };
    };
  };

  ######################## 5. PROJECT CONFIG HERE ###########################
  # Everything above is reusable boilerplate.  Below is *your* attrset.
  garnixModules.default.nodejs.eduteams = {
    src = ./.;                        # root folder with package.json & pnpm-lock.yaml
    prettier       = true;            # add a prettier check + dev-shell package
    testCommand    = "pnpm run lint"; # what CI should execute
    devTools       = [ ];             # e.g. pkgs.nodePackages."typescript-language-server"
    buildDependencies = [ ];          # native deps (rare for pure TS/Next)
    runtimeDependencies = [ ];        # e.g. pkgs.webp if you optimise images at runtime
  };
}
