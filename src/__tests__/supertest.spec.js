import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { log } from "@jaypie/core";
import { restoreLog, spyLog } from "@jaypie/testkit";
import express from "express";
import request from "supertest";

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
  spyLog(log);
});

afterEach(() => {
  restoreLog(log);
  vi.clearAllMocks();
});

//
//
// Run tests
//

describe("Project handler function", () => {
  describe("In an express context", () => {
    it("Works and logs GET requests with no body", async () => {
      // Set up our mock function
      const mockFunction = vi.fn(() => ({
        goose: "honk",
      }));
      const handler = expressHandler(mockFunction, {
        name: "handler",
      });
      // Set up our mock express app
      const app = express();
      app.use(handler);
      // Make a request
      const res = await request(app).get("/");
      expect(res.body).toEqual({ goose: "honk" });
      // Check the log was called twice: once for the request, once for the response
      expect(log.var).toBeCalledTimes(2);
      // Both calls should be an object with a single key: "req" or "res"
      expect(log.info.var.mock.calls[0][0]).toHaveProperty("req");
      expect(log.info.var.mock.calls[1][0]).toHaveProperty("res");
      expect(log.info.var.mock.calls[1][0].res.body).toEqual({ goose: "honk" });
      // The count of keys in each call should be 1
      expect(Object.keys(log.info.var.mock.calls[0][0]).length).toEqual(1);
      expect(Object.keys(log.info.var.mock.calls[1][0]).length).toEqual(1);
      expect(decorateResponse).toBeCalledTimes(1);
    });
    it("POST requests with a body", async () => {
      // Set up our mock function
      const mockFunction = vi.fn(() => ({
        goose: "honk",
      }));
      const handler = expressHandler(mockFunction, {
        name: "handler",
      });
      // Set up our mock express app
      const app = express();
      app.use(express.json());
      app.use(handler);
      // Make a request
      const res = await request(app).post("/").send({ cat: "meow" });
      expect(res.body).toEqual({ goose: "honk" });
      // Check the log was called twice: once for the request, once for the response
      expect(log.var).toBeCalledTimes(2);
      // Both calls should be an object with a single key: "req" or "res"
      expect(log.info.var.mock.calls[0][0]).toHaveProperty("req");
      expect(log.info.var.mock.calls[0][0].req.body).toEqual({ cat: "meow" });
      expect(log.info.var.mock.calls[1][0]).toHaveProperty("res");
      expect(log.info.var.mock.calls[1][0].res.body).toEqual({ goose: "honk" });
      // The count of keys in each call should be 1
      expect(Object.keys(log.info.var.mock.calls[0][0]).length).toEqual(1);
      expect(Object.keys(log.info.var.mock.calls[1][0]).length).toEqual(1);
      expect(decorateResponse).toBeCalledTimes(1);
    });
  });
});
