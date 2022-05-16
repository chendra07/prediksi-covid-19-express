const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3300;
const cors = require("cors");

const routes = require("./routes");

app.use(cors());
app.use(express.json());

// app.post("/a", (req, res) => {
//   console.log(req.body);
//   res.send(`Bonjour World! ${req.body}`);
// });

app.use(routes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});