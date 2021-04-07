const express = require("express");
let path = require('path');
let appDir = path.dirname(require.main.filename);


const app = express();

app.use(express.json());
app.use(express.static(appDir + '/views'));

require('./app/routes')(app);

let port = 8080;
app.listen(port);
