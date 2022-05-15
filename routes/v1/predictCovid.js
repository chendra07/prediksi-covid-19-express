const response = require("../../components/response");
const express = require("express");
const lstm_prediction = require("../../controllers/lstm_prediction");
const router = express.Router();

const index = function (req, res, next) {
  response.res404(res);
};

router.route("/predict").post(async (req, res, next) => {
  console.log("here???2");
  await lstm_prediction.predicts(req, res, next);
});

router.all("*", index);

module.exports = router;
