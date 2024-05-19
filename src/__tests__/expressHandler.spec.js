import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HTTP, NotFoundError } from "@jaypie/core";

import getCurrentInvokeUuid from "../getCurrentInvokeUuid.adapter.js";
import decorateResponse from "../decorateResponse.helper.js";

// Subject
import expressHandler from "../expressHandler.js";

//
//
// Mock modules
//

vi.mock("../getCurrentInvokeUuid.adapter.js");
vi.mock("../decorateResponse.helper.js");

beforeEach(() => {
  getCurrentInvokeUuid.mockReturnValue("MOCK_UUID");
});

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
    it("Will call a function I pass it", async () => {
      const mockFunction = vi.fn();
      const handler = expressHandler(mockFunction);
      const req = {};
      const res = {
        on: vi.fn(),
      };
      const next = () => {};
      await handler(req, res, next);
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });
    it("Passes req, res, and anything else to the handler", async () => {
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
      await handler(req, res, three, four);
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
    it("Will catch an unhandled thrown error", async () => {
      const mockFunction = vi.fn(() => {
        throw new Error("Sorpresa!");
      });
      const handler = expressHandler(mockFunction);
      const req = {};
      const mockResJson = vi.fn();
      const res = {
        json: mockResJson,
        on: vi.fn(),
        status: vi.fn(() => res),
      };
      const next = () => {};
      await handler(req, res, next);
      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(mockResJson).toHaveBeenCalledTimes(1);
      const response = mockResJson.mock.calls[0][0];
      expect(response).toBeJaypieError();
      expect(response.errors[0].status).toBe(500);
      // The response title will be "Internal Application Error" but we don't want to test that here
      // expect(response.errors[0].title).toBe("Internal Application Error");
    });
    it("Will catch an unhandled thrown async error", async () => {
      const mockFunction = vi
        .fn()
        .mockRejectedValueOnce(new Error("Sorpresa!"));
      const handler = expressHandler(mockFunction);
      const req = {};
      const mockResJson = vi.fn();
      const mockResStatus = vi.fn(() => ({ json: mockResJson }));
      const res = {
        json: mockResJson,
        on: vi.fn(),
        status: mockResStatus,
      };
      const next = () => {};
      await handler(req, res, next);
      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(mockResStatus).toHaveBeenCalledTimes(1);
      expect(mockResJson).toHaveBeenCalledTimes(1);
      // Expect mockResStatus' first call to be internal error
      expect(mockResStatus.mock.calls[0][0]).toBe(HTTP.CODE.INTERNAL_ERROR);
      const response = mockResJson.mock.calls[0][0];
      expect(response).toBeJaypieError();
      expect(response.errors[0].status).toBe(HTTP.CODE.INTERNAL_ERROR);
      // The response title will be "Internal Application Error" but we don't want to test that here
      // expect(response.errors[0].title).toBe("Internal Application Error");
    });
    it("Will catch a thrown ProjectError and respond with the correct status code", async () => {
      // Mock a function that throws NotFoundError
      const mockFunction = vi.fn(() => {
        throw new NotFoundError();
      });
      const handler = expressHandler(mockFunction);
      const req = {};
      const mockResJson = vi.fn();
      const res = {
        json: mockResJson,
        on: vi.fn(),
        status: vi.fn(() => res),
      };
      const next = () => {};
      await handler(req, res, next);
      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(mockResJson).toHaveBeenCalledTimes(1);
      const response = mockResJson.mock.calls[0][0];
      expect(response).toBeJaypieError();
      expect(response.errors[0].status).toBe(404);
    });
  });
  describe("Features", () => {
    it.todo("Sets the name of the name of the handler");
    it.todo("Tags the public logger with the handler name");
    describe("Automatic response", () => {
      it("Responds as JSON if the response is a pure object", async () => {
        // Arrange
        const mockFunction = vi.fn(() => ({ key: "value" }));
        const handler = expressHandler(mockFunction);
        const req = {};
        const mockResJson = vi.fn();
        const res = {
          json: mockResJson,
          on: vi.fn(),
          status: vi.fn(() => res),
        };
        const next = () => {};
        // Act
        await handler(req, res, next);
        // Assert
        expect(mockFunction).toHaveBeenCalledTimes(1);
        expect(mockResJson).toHaveBeenCalledTimes(1);
        expect(decorateResponse).toBeCalledTimes(1);
      });
      it("Responds as JSON if the response is an array", async () => {
        // Arrange
        const mockFunction = vi.fn(() => ["value"]);
        const handler = expressHandler(mockFunction);
        const req = {};
        const mockResJson = vi.fn();
        const res = {
          json: mockResJson,
          on: vi.fn(),
          status: vi.fn(() => res),
        };
        const next = () => {};
        // Act
        await handler(req, res, next);
        // Assert
        expect(mockFunction).toHaveBeenCalledTimes(1);
        expect(mockResJson).toHaveBeenCalledTimes(1);
        expect(decorateResponse).toBeCalledTimes(1);
      });
      it("Responds as JSON if the response is a string that casts to JSON", async () => {
        // Arrange
        const mockFunction = vi.fn(() => JSON.stringify({ key: "value" }));
        const handler = expressHandler(mockFunction);
        const req = {};
        const mockResJson = vi.fn();
        const res = {
          json: mockResJson,
          on: vi.fn(),
          status: vi.fn(() => res),
        };
        const next = () => {};
        // Act
        await handler(req, res, next);
        // Assert
        expect(mockFunction).toHaveBeenCalledTimes(1);
        expect(mockResJson).toHaveBeenCalledTimes(1);
        expect(decorateResponse).toBeCalledTimes(1);
      });
      it("Responds as JSON if the response has a .json() that returns an object", async () => {
        // Arrange
        const mockFunction = vi.fn(() => ({
          json: () => ({ key: "value" }),
        }));
        const handler = expressHandler(mockFunction);
        const req = {};
        const mockResJson = vi.fn();
        const res = {
          json: mockResJson,
          on: vi.fn(),
          status: vi.fn(() => res),
        };
        const next = () => {};
        // Act
        await handler(req, res, next);
        // Assert
        expect(mockFunction).toHaveBeenCalledTimes(1);
        expect(mockResJson).toHaveBeenCalledTimes(1);
        expect(decorateResponse).toBeCalledTimes(1);
      });
      it("Responds as HTML if the response is a string that starts with <", async () => {
        // Arrange
        const mockFunction = vi.fn(() => "<html></html>");
        const handler = expressHandler(mockFunction);
        const req = {};
        const mockResSend = vi.fn();
        const res = {
          send: mockResSend,
          on: vi.fn(),
          status: vi.fn(() => res),
        };
        const next = () => {};
        // Act
        await handler(req, res, next);
        // Assert
        expect(mockFunction).toHaveBeenCalledTimes(1);
        expect(mockResSend).toHaveBeenCalledTimes(1);
        expect(decorateResponse).toBeCalledTimes(1);
      });
      it("Responds as no content if the response is null", async () => {
        // Arrange
        const mockFunction = vi.fn(() => null);
        const handler = expressHandler(mockFunction);
        const req = {};
        const mockResSend = vi.fn();
        const res = {
          send: mockResSend,
          on: vi.fn(),
          status: vi.fn(() => res),
        };
        const next = () => {};
        // Act
        await handler(req, res, next);
        // Assert
        expect(res.status).toBeCalled();
        expect(res.status).toBeCalledWith(HTTP.CODE.NO_CONTENT);
        expect(res.send).toBeCalled();
        expect(res.send).toBeCalledWith(); // No arguments, which is different from undefined
      });
      it("Responds as no content if the response is undefined", async () => {
        // Arrange
        const mockFunction = vi.fn(() => undefined);
        const handler = expressHandler(mockFunction);
        const req = {};
        const mockResSend = vi.fn();
        const res = {
          send: mockResSend,
          on: vi.fn(),
          status: vi.fn(() => res),
        };
        const next = () => {};
        // Act
        await handler(req, res, next);
        // Assert
        expect(res.status).toBeCalled();
        expect(res.status).toBeCalledWith(HTTP.CODE.NO_CONTENT);
        expect(res.send).toBeCalled();
        expect(res.send).toBeCalledWith(); // No arguments, which is different from undefined
      });
      it("Responds as no content if the response is false", async () => {
        // Arrange
        const mockFunction = vi.fn(() => false);
        const handler = expressHandler(mockFunction);
        const req = {};
        const mockResSend = vi.fn();
        const res = {
          send: mockResSend,
          on: vi.fn(),
          status: vi.fn(() => res),
        };
        const next = () => {};
        // Act
        await handler(req, res, next);
        // Assert
        expect(res.status).toBeCalled();
        expect(res.status).toBeCalledWith(HTTP.CODE.NO_CONTENT);
        expect(res.send).toBeCalled();
        expect(res.send).toBeCalledWith(); // No arguments, which is different from undefined
      });
      it.todo("Responds as created if the response is true", async () => {
        //
      });
      it.todo(
        "Coerces everything else into string as responds as text",
        async () => {
          //
        },
      );
      it.todo("Will not override res.json() if it was sent", async () => {
        //
      });
      it.todo("Will not override res.send() if it was sent", async () => {
        //
      });
      it.todo("Will not override res.status() if it was sent", async () => {
        //
      });
    });
    describe("Unavailable mode", () => {
      it("Works as normal when process.env.PROJECT_UNAVAILABLE is set to false", async () => {
        process.env.PROJECT_UNAVAILABLE = "false";
        const mockFunction = vi.fn();
        const handler = expressHandler(mockFunction);
        const req = {};
        const mockResJson = vi.fn();
        const res = {
          json: mockResJson,
          on: vi.fn(),
          status: vi.fn(() => res),
        };
        const next = () => {};
        await handler(req, res, next);
        expect(mockFunction).toHaveBeenCalledTimes(1);
      });
      it("Will respond with a 503 if process.env.PROJECT_UNAVAILABLE is set to true", async () => {
        process.env.PROJECT_UNAVAILABLE = "true";
        const mockFunction = vi.fn();
        const handler = expressHandler(mockFunction);
        const req = {};
        const mockResJson = vi.fn();
        const res = {
          json: mockResJson,
          on: vi.fn(),
          status: vi.fn(() => res),
        };
        const next = () => {};
        await handler(req, res, next);
        expect(mockFunction).toHaveBeenCalledTimes(0);
        expect(mockResJson).toHaveBeenCalledTimes(1);
        const response = mockResJson.mock.calls[0][0];
        expect(response).toBeJaypieError();
        expect(response.errors[0].status).toBe(HTTP.CODE.UNAVAILABLE);
      });
      it("Will respond with a 503 if unavailable=true is passed to the handler", async () => {
        const mockFunction = vi.fn();
        const handler = expressHandler(mockFunction, { unavailable: true });
        const req = {};
        const mockResJson = vi.fn();
        const res = {
          json: mockResJson,
          on: vi.fn(),
          status: vi.fn(() => res),
        };
        const next = () => {};
        await handler(req, res, next);
        expect(mockFunction).toHaveBeenCalledTimes(0);
        expect(mockResJson).toHaveBeenCalledTimes(1);
        const response = mockResJson.mock.calls[0][0];
        expect(response).toBeJaypieError();
        expect(response.errors[0].status).toBe(HTTP.CODE.UNAVAILABLE);
      });
    });
  });
});
