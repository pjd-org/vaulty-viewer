import { describe, expect, it } from "vitest";
import { codPageStyle } from "./cod-status-logic";

describe("codPageStyle", () => {
  it("returns gradient background and full height", () => {
    const style = codPageStyle();
    expect(style.background).toContain("linear-gradient");
    expect(style.minHeight).toBe("100vh");
  });
});
