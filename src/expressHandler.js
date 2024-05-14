import {
  JAYPIE,
  jaypieHandler,
  log as publicLogger,
  ConfigurationError,
  UnhandledError,
} from "@jaypie/core";

import getCurrentInvokeUuid from "./getCurrentInvokeUuid.adapter.js";
import summarizeRequest from "./summarizeRequest.helper.js";
import summarizeResponse from "./summarizeResponse.helper.js";

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

  let jaypieFunction;

  return async (req, res, ...params) => {
    // * This is the first line of code that runs when a request is received

    // Update the public logger with the request ID
    publicLogger.tag({ invoke: getCurrentInvokeUuid() });

    // Very low-level, internal sub-trace details
    const libLogger = publicLogger.lib({
      lib: JAYPIE.LIB.EXPRESS,
    });
    libLogger.trace("[jaypie] Express init");

    // Top-level, important details that run at the same level as the main logger
    const log = publicLogger.lib({
      level: publicLogger.level,
      lib: JAYPIE.LIB.EXPRESS,
    });

    //
    //
    // Preprocess
    //

    // TODO: pass locals setup to jaypieHandler

    if (!jaypieFunction) {
      // Initialize after logging is set up
      jaypieFunction = jaypieHandler(handler, {
        name,
        setup,
        teardown,
        unavailable,
        validate,
      });
    }

    // Set req.locals if it doesn't exist
    if (!req.locals) req.locals = {};
    if (!req.locals._jaypie) req.locals._jaypie = {};

    // Set res.locals if it doesn't exist
    if (!res.locals) res.locals = {};
    if (!res.locals._jaypie) res.locals._jaypie = {};

    // TODO: Intercept the original res.json, res.send, and res.end
    // TODO: Warn if they are used

    let response;

    try {
      libLogger.trace("[jaypie] Lambda execution");
      log.info.var({ req: summarizeRequest(req) });

      //
      //
      // Process
      //

      response = await jaypieFunction(req, res, ...params);

      // JSONate
      if (response) {
        if (typeof response === "object") {
          if (typeof response.json === "function") {
            res.json(response.json());
          } else {
            res.json(response);
          }
        }
        if (typeof response === "string") {
          try {
            res.json(JSON.parse(response));
          } catch (error) {
            res.send(response);
          }
        }
      } else {
        //
      }

      //
      //
      // Error Handling
      //
    } catch (error) {
      // In theory jaypieFunction has handled all errors
      if (error.status) {
        res.status(error.status);
      }
      if (typeof error.json === "function") {
        res.json(error.json());
        response = error.json();
      } else {
        // This should never happen
        const unhandledError = new UnhandledError();
        res.json(unhandledError.json());
        response = unhandledError.json();
      }
    }

    //
    //
    // Postprocess
    //

    // TODO: Decorate response headers

    // Log response
    log.info.var({
      res: summarizeResponse(res),
    });

    // Clean up the public logger
    publicLogger.untag("handler");

    //
    //
    // Return
    //

    return response;
  };
};

//
//
// Export
//

export default expressHandler;
