const express = require("express");
const router = express.Router();
const response = require("../../components/response");

const index = function (req, res, next) {
  response.res404(res);
};

const predictCovid = require("./predictCovid");

router.use("/predictCovid", predictCovid);

router.all("*", index);
router.all("/", index);

module.exports = router;
