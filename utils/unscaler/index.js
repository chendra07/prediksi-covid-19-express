exports.dataUnScaler = (input, max_ph, min_ph, max_m, min_m) => {
  let result = [];
  console.log("input: ", input);

  let unScaled_m = input[0] * (max_m - min_m) + min_m;
  let unScaled_ph = input[1] * (max_ph - min_ph) + min_ph;

  result.push(unScaled_m, unScaled_ph);

  //   console.log("res inverse: ", result);
  return result;
};
