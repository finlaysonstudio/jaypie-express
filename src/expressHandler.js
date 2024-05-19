import {
  force,
  HTTP,
  JAYPIE,
  jaypieHandler,
  log as publicLogger,
  UnhandledError,
  validate as validateIs,
} from "@jaypie/core";

import getCurrentInvokeUuid from "./getCurrentInvokeUuid.adapter.js";
import decorateResponse from "./decorateResponse.helper.js";
import summarizeRequest from "./summarizeRequest.helper.js";
import summarizeResponse from "./summarizeResponse.helper.js";

//
//
// Main
//

const expressHandler = (
  handler,
  { locals, name, setup = [], teardown = [], unavailable, validate } = {},
) => {
  //
  //
  // Validate
  //
  validateIs.function(handler);
  validateIs.optional.object(locals);
  setup = force.array(setup); // allows a single item
  teardown = force.array(teardown); // allows a single item

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

    // Set req.locals if it doesn't exist
    if (!req.locals) req.locals = {};
    if (!req.locals._jaypie) req.locals._jaypie = {};

    // Set res.locals if it doesn't exist
    if (!res.locals) res.locals = {};
    if (!res.locals._jaypie) res.locals._jaypie = {};

    // TODO: Intercept the original res.json, res.send, and res.end
    // TODO: Warn if they are used

    //
    //
    // Preprocess
    //

    if (locals) {
      // Locals
      const keys = Object.keys(locals);
      if (keys.length > 0) {
        log.trace(`Handler locals`);
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i];
          if (typeof locals[key] === "function") {
            // eslint-disable-next-line no-await-in-loop
            req.locals[key] = await locals[key](req, res);
          } else {
            req.locals[key] = locals[key];
          }
        }
      }
    }

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

    let response;
    let status;

    try {
      libLogger.trace("[jaypie] Lambda execution");
      log.info.var({ req: summarizeRequest(req) });

      //
      //
      // Process
      //

      response = await jaypieFunction(req, res, ...params);

      //
      //
      // Error Handling
      //
    } catch (error) {
      // In theory jaypieFunction has handled all errors
      if (error.status) {
        status = error.status;
      }
      if (typeof error.json === "function") {
        response = error.json();
      } else {
        // This should never happen
        const unhandledError = new UnhandledError();
        response = unhandledError.json();
        status = unhandledError.status;
      }
    }

    //
    //
    // Postprocess
    //

    decorateResponse(res, { handler: name });

    try {
      // Status
      if (status) {
        res.status(status);
      }

      // Body
      if (response) {
        if (typeof response === "object") {
          if (typeof response.json === "function") {
            res.json(response.json());
          } else {
            res.json(response);
          }
        } else if (typeof response === "string") {
          try {
            res.json(JSON.parse(response));
          } catch (error) {
            res.send(response);
          }
        } else if (response === true) {
          res.status(HTTP.CODE.CREATED);
          res.send();
        } else {
          res.send(response);
        }
      } else {
        // No response
        res.status(HTTP.CODE.NO_CONTENT).send();
      }
    } catch (error) {
      log.fatal("Express encountered an error while sending the response");
      log.var({ responseError: error });
    }

    // Log response
    const extras = {};
    if (response) extras.body = response;
    log.info.var({
      res: summarizeResponse(res, extras),
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
