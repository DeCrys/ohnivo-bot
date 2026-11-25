import { describe, expect, it } from "vitest";
import { moveArrayItem } from "./array-order";

describe("moveArrayItem", () => {
  it("moves an item to either end of the array without changing the source", () => {
    const items = ["first", "middle", "last"];

    expect(moveArrayItem(items, 0, 2)).toEqual(["middle", "last", "first"]);
    expect(moveArrayItem(items, 2, 0)).toEqual(["last", "first", "middle"]);
    expect(items).toEqual(["first", "middle", "last"]);
  });

  it("returns an unchanged copy for identical or invalid indices", () => {
    const items = ["first", "last"];

    expect(moveArrayItem(items, 0, 0)).toEqual(items);
    expect(moveArrayItem(items, -1, 1)).toEqual(items);
    expect(moveArrayItem(items, 0, 2)).toEqual(items);
    expect(moveArrayItem(items, 0.5, 1)).toEqual(items);
  });
});
