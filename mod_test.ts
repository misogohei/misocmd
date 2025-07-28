import { assertEquals, assertExists } from "@std/assert";
import { buildMisoCommand } from "@misogohei/misocmd";

Deno.test(function commandLS() {
  const lsCmd = buildMisoCommand("ls")
    .command("list")
    .build();

  assertExists(lsCmd);
  assertExists(lsCmd.list);
  const result = lsCmd.list();
  assertEquals(result.asText().length > 0, true);
});

Deno.test(function commandCATJson() {
  const catCmd = buildMisoCommand("cat", { timeout: 10 })
    .command("json_test")
    .build();

  assertExists(catCmd);
  assertExists(catCmd.json_test);

  const result = catCmd.json_test([], {
    input: '{"name1": 1, "name2": "value2"}',
  });

  assertEquals(result.asObject(), {
    name1: 1,
    name2: "value2",
  });
});

Deno.test(function commandCATlines() {
  const catCmd = buildMisoCommand("cat")
    .command("lines")
    .build();

  assertExists(catCmd);
  assertExists(catCmd.lines);

  const result = catCmd.lines([], {
    input: "line1\nline2\nline3",
  });

  assertEquals(result.asLines(), ["line1", "line2", "line3"]);
});
