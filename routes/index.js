const express = require("express");
const response = require("../components/response");
const router = express.Router();

const index = function (req, res, next) {
  response.res404(res);
};

router.use(
  "/v1",
  function (req, res, next) {
    next();
  },
  require("./v1")
);

router.all("/", index);
router.all("*", index);

module.exports = router;
