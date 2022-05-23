const { customDataSplitter } = require("../dataSplitter");
const { customDataMerger } = require("../dataMerger");

exports.dataScaler = (input, max_ph, min_ph, max_m, min_m) => {
  input = customDataSplitter(input);
  let data_m = input.split_m.data;
  let data_ph = input.split_ph.data;
  let scaled_m = [];
  let scaled_ph = [];

  if (max_ph == null && min_ph == null && max_m == null && min_m == null) {
    max_m = input.split_m.max;
    min_m = input.split_m.min;
    max_ph = input.split_ph.max;
    min_ph = input.split_ph.min;
  }

  //Formula: https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.MinMaxScaler.html

  for (let i = 0; i < input.length; i++) {
    scaled_m.push((data_m[i] - min_m) / (max_m - min_m));
    scaled_ph.push((data_ph[i] - min_ph) / (max_ph - min_ph));
  }

  return {
    data: customDataMerger(scaled_m, scaled_ph, input.length),
    max_ph,
    min_ph,
    max_m,
    min_m,
  };
};
