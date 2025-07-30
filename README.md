## Overview

Wrap `spawnSync` to handle commands.

## Install

See. [JSR Repo](https://jsr.io/@misogohei/misocmd)

## Example

```typescript
import { buildMisoCommand } from "@misogohei/misocmd";

const deno = buildMisoCommand("deno")
  .command("compile")
  .command("run", ["-A"])
  .command("test")
  .build();

deno.compile(["file.ts"]); // deno compile file.ts
deno.run(["file.ts"]); // deno run -A file.ts
deno.test(); // deno test
```

```typescript
import { buildMisoCommand } from "@misogohei/misocmd";

const cat = buildMisoCommand("cat")
  .command("do")
  .build();

const result = cat.do([], { input: "Hello World!" });
console.log(result.asText()); // Hello World!

const result2 = cat.do([], { input: '{ "key": "val" }' });
console.log(result2.asObject()); // { key: "val" }

const result3 = cat.do([], { input: "line1\nline2" });
console.log(result3.asLines()); // ["line1", "line2"]
```
