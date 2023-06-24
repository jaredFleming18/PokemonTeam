process.stdin.setEncoding("utf8")
const portNumber = 3425
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const path = require("path")
app.set("views", path.resolve(__dirname, "templates"))
app.set("view engine", "ejs")
app.use("/templates", express.static("templates"))
app.get("/", (request, response) => {
    response.render("index2")
})
app.listen(portNumber)