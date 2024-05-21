import { validate } from "@jaypie/core";

import expressHandler from "./expressHandler.js";
import summarizeRequest from "./summarizeRequest.helper.js";

//
//
// Main
//

const echo = (context = {}) => {
  validate.object(context);
  // Give a default name if there isn't one
  if (!context.name) {
    context.name = "_echo";
  }

  // Return a function that will be used as an express route
  return expressHandler(async (req) => {
    console.log("req.body :>> ", req.body);
    return {
      req: summarizeRequest(req),
    };
  }, context);
};

//
//
// Export
//

export default echo;
