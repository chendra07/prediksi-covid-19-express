exports.customDataMerger = (splitted_m, splitted_ph, length) => {
  let result = [];

  for (let i = 0; i < length; i++) {
    result.push([splitted_m[i], splitted_ph[i]]);
  }

  console.log("res: ", result);
  return result;
};
