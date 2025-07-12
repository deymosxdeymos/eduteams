{
  inputs = {
    garnix-lib.url = "github:garnix-io/garnix-lib";
    NodeJS.url = "github:garnix-io/nodejs-module";
  };

  nixConfig = {
    extra-substituters = [ "https://cache.garnix.io" ];
    extra-trusted-public-keys = [ "cache.garnix.io:CTFPyKSLcx5RMJKfLo5EEPUObbA78b0YQ2DTCJXqr9g=" ];
  };

  outputs = inputs: inputs.garnix-lib.lib.mkModules {
    modules = [
      inputs.NodeJS.garnixModules.default
    ];

    config = { pkgs, ... }: {
      nodejs = {
        nodejs-project = {
          buildDependencies = [  ];
          devTools = [ pkgs.pnpm pkgs.typescript pkgs.nodejs ];
          prettier = true;
          runtimeDependencies = [  ];
          src = ./.;
          testCommand = "pnpm run lint";
          webServer = null;
        };
      };

      garnix.deployBranch = "main";
    };
  };
}
