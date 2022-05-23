exports.customDataSplitter = (data) => {
  let split_m = [];
  let split_ph = [];

  for (let i = 0; i < data[0].length; i++) {
    split_m.push(data[0][i][0]);
    split_ph.push(data[0][i][1]);
  }

  return {
    length: data[0].length,
    split_m: {
      data: split_m,
      min: Math.min(...split_m),
      max: Math.max(...split_m),
    },
    split_ph: {
      data: split_ph,
      min: Math.min(...split_ph),
      max: Math.max(...split_ph),
    },
  };
};
