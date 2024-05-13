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

describe("Express Handler", () => {
  describe("Base Cases", () => {
    it("Works", async () => {
      expect(expressHandler).toBeDefined();
      expect(expressHandler).toBeFunction();
    });
    it("Will call a function I pass it", () => {
      const mockFunction = vi.fn();
      const handler = expressHandler(mockFunction);
      const req = {};
      const res = {
        on: vi.fn(),
      };
      const next = () => {};
      handler(req, res, next);
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });
    it("Passes req, res, and anything else to the handler", () => {
      // Set up four mock variables
      const req = {};
      const res = {
        on: vi.fn(),
      };
      const three = "THREE";
      const four = "FOUR";
      // Set up our mock function
      const mockFunction = vi.fn();
      const handler = expressHandler(mockFunction);
      // Call the handler with our mock variables
      handler(req, res, three, four);
      // Expect the mock function to have been called with our mock variables
      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(mockFunction).toHaveBeenCalledWith(req, res, three, four);
    });
  });
  describe("Error Conditions", () => {
    it("Throws if not passed a function", () => {
      // Arrange
      // Act
      // Assert
      expect(() => expressHandler()).toThrow();
      expect(() => expressHandler(42)).toThrow();
      expect(() => expressHandler("string")).toThrow();
      expect(() => expressHandler({})).toThrow();
      expect(() => expressHandler([])).toThrow();
      expect(() => expressHandler(null)).toThrow();
      expect(() => expressHandler(undefined)).toThrow();
    });
  });
});
