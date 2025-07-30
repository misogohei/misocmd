import type { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import type { SpawnSyncOptions, SpawnSyncReturns } from "node:child_process";

/**
 * Command result wrapped SpawnSyncReturns
 */
export class MisoCommandResult {
  /**
   * Raw result of spawnSync
   */
  public readonly spawnResult: SpawnSyncReturns<
    Buffer<ArrayBufferLike> | string
  >;

  constructor(result: SpawnSyncReturns<Buffer<ArrayBufferLike> | string>) {
    this.spawnResult = result;
  }

  /**
   * Exit code of executed command.
   */
  public get exitCode(): number | null {
    return this.spawnResult.status;
  }

  /**
   * @returns The text of the stdout output of the executed command.
   */
  public asText(): string {
    return this.spawnResult.stdout.toString();
  }

  /**
   * @returns The stdout output text of the executed command parsed as JSON.
   */
  public asObject(): object | null {
    return JSON.parse(this.asText());
  }

  /**
   * @param type MIME type of blob
   * @returns The stdout output of the executed command converted to a BLOB.
   */
  public asBlob(type?: string): Blob {
    return new Blob([this.spawnResult.stdout], { type });
  }

  /**
   * @returns The text lines of the stdout output of the executed command.
   */
  public asLines(): string[] {
    return this.asText().split("\n");
  }
}

class MisoCommandExecutor {
  private path: string;
  private option?: SpawnSyncOptions;

  constructor(path: string, option?: SpawnSyncOptions) {
    this.path = path;
    this.option = option;
  }

  public execute(
    args: string[],
    extraArgs: string[],
    option?: SpawnSyncOptions,
  ): MisoCommandResult {
    const _option = Object.assign({}, this.option, option);
    return new MisoCommandResult(
      spawnSync(this.path, [...args, ...extraArgs], _option),
    );
  }
}

type MisoCommandFunc = (
  /** additional arguments */
  args?: string[],
  /** option for spawnSync
   * This option override and merge buildMisoCommand's option.
   */
  option?: SpawnSyncOptions,
) => MisoCommandResult;

type MisoCommand<T extends string> = {
  [key in T]: MisoCommandFunc;
};

interface IMisoCommandBuilder<T extends string> {
  /** complete to build command */
  build: () => MisoCommand<Exclude<T, "">>;
  /** add command with preset arguments  */
  command: <T2 extends string>(
    /** name of command */
    name: T2,
    /** preset arguments */
    args?: string[],
  ) => IMisoCommandBuilder<T | T2>;
}

function createMisoCommand<T extends string>(
  name: T,
  args: string[],
  executor: MisoCommandExecutor,
): MisoCommand<T> {
  const obj: Record<string, MisoCommandFunc> = {};
  obj[name] = (extraArgs?: string[], option?: SpawnSyncOptions) => {
    return executor.execute(args, extraArgs ?? [], option);
  };
  return obj as MisoCommand<T>;
}

function combineMisoCommand<T extends string, T2 extends string>(
  c1: MisoCommand<T>,
  c2: MisoCommand<T2>,
): MisoCommand<T | T2> {
  const obj = {};
  Object.assign(obj, c1, c2);
  return obj as MisoCommand<T | T2>;
}

function appendMisoCommand<T extends string>(
  obj: MisoCommand<T>,
  executor: MisoCommandExecutor,
): IMisoCommandBuilder<T> {
  return {
    build: (): MisoCommand<Exclude<T, "">> => {
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

/**
 * Start to build MisoCommand
 * @param path file path to executable command
 * @param option common option to each commands.
 * @returns instance of building interface
 */
export function buildMisoCommand(
  path: string,
  option?: SpawnSyncOptions,
): IMisoCommandBuilder<""> {
  const executor = new MisoCommandExecutor(path, option);
  return appendMisoCommand(createMisoCommand("", [], executor), executor);
}
