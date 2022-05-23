"use strict";

const tf = require("@tensorflow/tfjs");
const tfnode = require("@tensorflow/tfjs-node");

const ExcelJS = require("exceljs");
const csv = require("csv-parser");
const moment = require("moment");
var momentTZ = require("moment-timezone");
const fs = require("fs"); //file stream

const response = require("../../components/response");

const { dataScaler } = require("../../utils/scaler");
const { dataUnScaler } = require("../../utils/unscaler");

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

async function runModel(days) {
  const handler = tfnode.io.fileSystem("public/machineLearning/model.json");
  const model_lstm = await tf.loadLayersModel(handler); //load model yang telah dilakukan di python sebelumnya
  let predictTemp = [];
  let [filteredData, valueOnly] = await filterCSV(covid_data); //lakukan filter pada objek & tanggal yang sesuai
  valueOnly = [valueOnly.slice(Math.max(valueOnly.length - basedDays, 0))]; //reshape data to (1,7,2)

  let scaled_data = dataScaler(valueOnly);

  finalResult = []; //hapus hasil prediksi yang lama

  try {
    for (let i = 0; i < days; i++) {
      let scaled_current_data = dataScaler(
        valueOnly,
        scaled_data.max_ph,
        scaled_data.min_ph,
        scaled_data.max_m,
        scaled_data.min_m
      );
      // console.log("scaled_data: ", scaled_current_data);

      let inputTensor = tf.tensor3d([scaled_current_data.data]);

      let resultPrediction = model_lstm.predict(inputTensor);
      //lakukan prediksi dengan data yang di scaling

      let x = dataUnScaler(
        resultPrediction.dataSync(),
        scaled_data.max_ph,
        scaled_data.min_ph,
        scaled_data.max_m,
        scaled_data.min_m
      );

      predictTemp.push({
        Tanggal: moment("01/01/2022", "DD/MM/YYYY") //data tanggal
          .local()
          .add(i + 1, "days")
          .format(),
        Meninggal: parseInt(x[0]), //data meninggal
        Positif_Harian: parseInt(x[1]), //data positif harian
        isPredicted: true, // properti untuk membedakan data aktual dan prediksi
      });

      //   console.log("value only: ", valueOnly);

      valueOnly[0].push(x); //menambahkan array prediksi pada index terakhir
      valueOnly[0].shift(); //menghapus index pertama
    }

    finalResult = [...filteredData, ...predictTemp]; //menggabungkan array prediksi dan data aktual

    finalResult.forEach(function (element, index) {
      element.key = index;
      element.unix = moment(element.Tanggal).unix() * 1000;
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
