"use strict";

const tf = require("@tensorflow/tfjs");
const tfnode = require("@tensorflow/tfjs-node");

const ExcelJS = require("exceljs");
const csv = require("csv-parser");
const moment = require("moment");
var momentTZ = require("moment-timezone");
const fs = require("fs"); //file stream

const response = require("../components/response");

const basedDays = 7;
let finalResult = [];
let covid_data = [];

fs.createReadStream("resource/covid_data.csv") //lakukan pembacaan terhadap data CSV
  .pipe(csv()) //memanggil library csv-parser
  .on("data", (data) => covid_data.push(data)) //melakukan push data yang telah dibaca
  .on("end", () => {}); //selesaikan operasi pembacaan file

function filterCSV(dataArray) {
  let filteredData = [];
  let valueOnly = [];

  let startDate = moment("01/01/2021", "DD/MM/YYYY");
  let endDate = moment("01/01/2022", "DD/MM/YYYY");

  dataArray.forEach((element) => {
    if (
      moment(element.Tanggal, "DD/MM/YYYY").isBetween(
        startDate,
        endDate,
        "days",
        "[]"
      )
    ) {
      filteredData.push({
        Tanggal: moment(element.Tanggal, "DD/MM/YYYY").local().format(),
        Meninggal: parseInt(element.Meninggal),
        Positif_Harian: parseInt(element["Positif Harian"]),
      });

      valueOnly.push([
        parseInt(element.Meninggal),
        parseInt(element["Positif Harian"]),
      ]);
    }
  });

  // console.log("filtered: ", filteredData[0]);
  // console.log("value: ", valueOnly);

  return [filteredData, valueOnly];
}

function floatToInteger(dataArray) {
  for (let i = 0; i < dataArray.length; i++) {
    dataArray[i] = parseInt(dataArray[i]);
  }

  return dataArray;
}

function dataNormalization(dataArray, maxInputValue, minInputValue) {
  const inputMax = maxInputValue ? maxInputValue : dataArray.max();
  const inputMin = minInputValue ? minInputValue : dataArray.min();
  const normalizedInputs = dataArray.sub(inputMin).div(inputMax.sub(inputMin));

  return {
    inputs: normalizedInputs,
    // Return the min/max bounds so we can use them later.
    inputMax,
    inputMin,
  };
}

function dataUnNormalization(pred, inputMin, inputMax) {
  // console.log("pred: ", pred);
  const unNorm = pred.mul(inputMax.sub(inputMin)).add(inputMin);

  let result = unNorm.dataSync();
  // console.log("unNorm: ", result);

  result = floatToInteger(result);

  return result;
}

async function runModel(days) {
  const handler = tfnode.io.fileSystem("public/machineLearning/model.json");
  const model_lstm = await tf.loadLayersModel(handler); //load model yang telah dilakukan di python sebelumnya
  let predictTemp = [];
  let [filteredData, valueOnly] = await filterCSV(covid_data); //lakukan filter pada objek & tanggal yang sesuai
  valueOnly = [valueOnly.slice(Math.max(valueOnly.length - basedDays, 0))]; //reshape data to (1,7,2)

  let firstInput3D = tf.tensor3d(valueOnly);

  let scaled_inputTensor = dataNormalization(firstInput3D); //lakukan scaling data 0-1 terlebih dahulu

  console.log("data before: ", valueOnly);
  console.log("data scaled: ", scaled_inputTensor.inputs.dataSync());

  finalResult = []; //hapus hasil prediksi yang lama

  try {
    for (let i = 0; i < days; i++) {
      let inputTensor = tf.tensor3d(valueOnly);

      let scaled_current = dataNormalization(
        inputTensor,
        scaled_inputTensor.inputMax,
        scaled_inputTensor.inputMin
      ); //lakukan scaling data 0-1 terlebih dahulu

      let resultPrediction = model_lstm.predict(scaled_current.inputs); //lakukan prediksi dengan data yang di scaling

      let x = dataUnNormalization(
        resultPrediction,
        scaled_inputTensor.inputMin,
        scaled_inputTensor.inputMax
      ); //kembalikan lagi data yang telah di scaling sebelumnya

      predictTemp.push({
        Tanggal: moment("01/01/2022", "DD/MM/YYYY")
          .local()
          .add(i + 1, "days")
          .format(),
        Meninggal: x[0],
        Positif_Harian: x[1],
        isPredicted: true,
      }); //masukan data ke variabel sementara

      console.log("value only: ", valueOnly);

      valueOnly[0].push(x); //menambahkan array prediksi pada index terakhir
      valueOnly[0].shift(); //menghapus index pertama

      //prediksi dilakukan lagi melalui looping tetapi dengan
      //tambahan 1 index nilai prediksi yang paling baru
      //dan membuang 1 index data yang paling lama
    }

    finalResult = [...filteredData, ...predictTemp]; //menggabungkan array prediksi dan data aktual
    // console.log("last: ", finalResult.reverse().slice(0, 5));

    finalResult.forEach(function (element, index) {
      element.key = index;
      element.unix = moment(element.Tanggal).unix() * 1000;

      // console.log("time: ", element.Tanggal);
      // console.log(
      //   "unix: ",
      //   momentTZ
      //     .tz(element.Tanggal, "DD/MM/YYYY HH:mm:ss", "Asia/Jakarta")
      //     .unix()
      // );
    });

    return finalResult;
  } catch (error) {
    console.log("error: ", error);
  }
}

exports.predicts = async (req, res, next) => {
  if (req.body.numOfDays <= 0 || req.body.numOfDays == null) {
    return response.res403(res);
  } else {
    try {
      await runModel(req.body.numOfDays);
      response.res200(res, finalResult);
    } catch (error) {
      console.log("error: ", error);
      response.res500();
    }
  }
};
