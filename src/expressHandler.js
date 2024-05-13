import {
  JAYPIE,
  jaypieHandler,
  log as publicLogger,
  ConfigurationError,
  UnhandledError,
} from "@jaypie/core";

//
//
// Main
//

const expressHandler = (
  handler,
  { locals, name, setup, teardown, unavailable, validate } = {},
) => {
  //
  //
  // Validate
  //

  if (typeof handler !== "function") {
    throw new ConfigurationError(
      "The handler responding to the request encountered a configuration error",
    );
  }

  //
  //
  // Setup
  //

  return async (req, res, ...params) => {
    // * This is the first line of code that runs when a request is received

    // Set req.locals if it doesn't exist
    if (!req.locals) req.locals = {};
    if (!req.locals._jaypie) req.locals._jaypie = {};

    // Set res.locals if it doesn't exist
    if (!res.locals) res.locals = {};
    if (!res.locals._jaypie) res.locals._jaypie = {};

    // - Set up the logger
    // - Log request

    // - Intercept the original res.json, res.send, and res.end

    const response = await handler(req, res, ...params);
  };
};

//
//
// Export
//

export default expressHandler;
