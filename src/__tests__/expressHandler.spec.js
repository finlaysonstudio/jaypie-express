import { afterEach, describe, expect, it, vi } from "vitest";

// Subject
import expressHandler from "../expressHandler.js";

//
//
// Mock modules
//

// vi.mock("../file.js");
// vi.mock("module");

afterEach(() => {
  vi.clearAllMocks();
});

//
//
// Run tests
//

describe("ExpressHandler", () => {
  it("Works", async () => {
    const response = await expressHandler();
    console.log("response :>> ", response);
    expect(response).not.toBeUndefined();
  });
});
