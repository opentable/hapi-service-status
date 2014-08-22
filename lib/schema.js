var joi = require("joi");

module.exports = {
  monitors: joi.array().includes(
      joi.object({
        monitorname: joi.string().required(),
        path: joi.string().required(),
        headers: joi.object(),
        timeout: joi.number().integer(),
        compare: joi.func(),
        selfTest: joi.boolean().default(true)
      }).xor("timeout", "compare")
    ).min(1),
  default: joi.number().integer().min(0)
};
