const express = require("express");
const path = require("path");
const port = 9000;

const app = express();

app.use(express.static(path.join(__dirname, "src")));

app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname , "index.html"));
});

app.listen(port , () => console.log(`Server started on port : ${port}`))