import { HTTP, NotImplementedError } from "@jaypie/core";
import expressHandler from "./expressHandler.js";
import httpHandler from "./http.handler.js";
import echoHandler from "./echo.handler.js";

//
//
// Functions
//

const routes = {
  echoRoute: echoHandler(),
  forbiddenRoute: httpHandler(HTTP.CODE.FORBIDDEN, { name: "_forbidden" }),
  goneRoute: httpHandler(HTTP.CODE.GONE, { name: "_gone" }),
  noContentRoute: httpHandler(HTTP.CODE.NO_CONTENT, { name: "_noContent" }),
  notFoundRoute: httpHandler(HTTP.CODE.NOT_FOUND, { name: "_notFound" }),
  notImplementedRoute: expressHandler(
    () => {
      throw new NotImplementedError();
    },
    { name: "_notImplemented" },
  ),
};

//
//
// Export
//

export const {
  echoRoute,
  forbiddenRoute,
  goneRoute,
  noContentRoute,
  notFoundRoute,
  notImplementedRoute,
} = routes;
