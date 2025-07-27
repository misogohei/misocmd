import type { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import type { SpawnSyncOptions, SpawnSyncReturns } from "node:child_process";

export interface IMisoBuildOption {
  timeout?: number;
}

export class MisoCommandResult {
  public readonly spawnResult: SpawnSyncReturns<
    Buffer<ArrayBufferLike> | string
  >;
  constructor(result: SpawnSyncReturns<Buffer<ArrayBufferLike> | string>) {
    this.spawnResult = result;
  }

  public get exitCode(): number | null {
    return this.spawnResult.status;
  }

  public get asText(): string {
    return this.spawnResult.stdout.toString();
  }

  public get asObject(): object | null {
    return JSON.parse(this.asText);
  }
}

export class MisoCommandExecutor {
  private path: string;
  private option?: IMisoBuildOption;

  constructor(path: string, option?: IMisoBuildOption) {
    this.path = path;
    this.option = option;
  }

  public execute(
    args: string[],
    ext_args: string[],
    option?: SpawnSyncOptions,
  ): MisoCommandResult {
    if (option != null) {
      option.timeout ??= this.option?.timeout;
    }
    return new MisoCommandResult(
      spawnSync(this.path, [...args, ...ext_args], option ?? {}),
    );
  }
}

type MisoCommandFunc = (
  args: string[],
  option?: SpawnSyncOptions,
) => MisoCommandResult;

type MisoCommand<T extends string> = {
  [key in T]: MisoCommandFunc;
};

interface IMisoCommandBuilder<T extends string> {
  build: () => MisoCommand<T> | undefined;
  command: <T2 extends string>(
    name: T2,
    args?: string[],
  ) => IMisoCommandBuilder<T | T2>;
}

function createMisoCommand<T extends string>(
  name: T,
  args: string[],
  executor: MisoCommandExecutor,
): MisoCommand<T> {
  const obj: Record<string, MisoCommandFunc> = {};
  obj[name] = (ext_args: string[], option?: SpawnSyncOptions) => {
    return executor.execute(args, ext_args, option);
  };
  return obj as MisoCommand<T>;
}

function combineMisoCommand<T extends string, T2 extends string>(
  c1: MisoCommand<T>,
  c2: MisoCommand<T2>,
): MisoCommand<T | T2> {
  const obj = {};
  Object.assign(obj, c1);
  Object.assign(obj, c2);
  return obj as MisoCommand<T | T2>;
}

function appendMisoCommand<T extends string>(
  obj: MisoCommand<T>,
  executor: MisoCommandExecutor,
): IMisoCommandBuilder<T> {
  return {
    build: () => {
      return obj;
    },
    command: <T2 extends string>(name2: T2, args2?: string[]) => {
      return appendMisoCommand(
        combineMisoCommand(
          obj,
          createMisoCommand(name2, args2 ?? [], executor),
        ),
        executor,
      );
    },
  };
}

export function buildMisoCommand(path: string, option?: IMisoBuildOption) {
  const executor = new MisoCommandExecutor(path, option);
  return appendMisoCommand(createMisoCommand("", [], executor), executor);
}
