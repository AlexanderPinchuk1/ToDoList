require('dotenv').config();

const jwt = require('jsonwebtoken');
const sha256 = require('js-sha256').sha256;
const multer  = require("multer");
const path = require('path');

const { MongoClient } = require("mongodb");
const ObjectID = require('mongodb').ObjectID;

const url ="mongodb+srv://Alex:<password>@cluster.tioyo.mongodb.net/ToDoListDB?retryWrites=true&w=majority";

let users;
let notes;
MongoClient.connect(url,{ useUnifiedTopology: true }, function(err, db) {
    if (err) throw err;
    const dbo = db.db("ToDoListDB");
    users = dbo.collection("users");
    notes = dbo.collection("notes");
    console.log("Connected...");
});


const cookieParser = require('cookie-parser')

let appDir = path.dirname(require.main.filename);

const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "uploads");
    },
    filename: (req, file, cb) =>{
        let date = new Date().getMilliseconds();
        let fileName =  date + "-" + file.originalname;
        cb(null, fileName);
    }
});

const upload = multer({storage:storageConfig});

function authenticateToken(request,response,next){
    const token = request.cookies?.token;

    if (token == null) {
        return response.sendStatus(401);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,userInfoInToken)=>
    {
        request.userInfoInToken = userInfoInToken;

        const findInDB = JSON.parse(JSON.stringify({_id: userInfoInToken._id, login: userInfoInToken.login}))
        users.find(findInDB, function(err, result) {
            if (err) throw err;

            if (result == null){
                return response.sendStatus(401);
            }

            next();
        })
    })
}

module.exports = function(app) {

    app.use(cookieParser());
    app.use(jsonParser);

    app.get('/', (request, response) => {
        response.sendFile("views/");
    });

    app.get('/reg', (request,response)=>{
        response.sendFile("views/reg/");
    })

    app.post('/reg', (request,response)=>{
        if(!request.body)
            return response.sendStatus(400);

        const login = request.body.login;
        const password = request.body.password;

        if ((login == null) || (password == null))
            return  response.sendStatus(404);

        const user = { login: login, password: sha256(password)};

        users.findOne(user, function(err, result) {
            if (err) throw err;

            if (result == null) {
                users.insertOne(user, function (err, result) {
                    if (err) throw err;
                });
            }else {
                return response.sendStatus(403);
            }

            return response.send(JSON.stringify(user));
        });
    })

    app.get('/views/pic/:picture', (request, response) => {
        response.sendFile(appDir + request.path);
    });

    app.get('/auth', (request, response) => {
        response.sendFile("views/auth/");
    });

    app.get('/api/uploads/:file',authenticateToken, function(request, response){
        response.download("./uploads/" + request.params.file);
    });

    app.post('/login', (request,response)=> {

        const login = request.body.login;
        const password = request.body.password;

        const user = {login: login, password: sha256(password)};

        users.findOne(user, function(err, result) {
            if (err) throw err;

            if (result == null) {
                return response.sendStatus(404);
            }

            const userInfoForToken = {_id: result._id, login: result.login};
            const token = jwt.sign(userInfoForToken,process.env.ACCESS_TOKEN_SECRET);
            const maxAge = 30 * 1000;
            response.cookie('token',token,{maxAge: maxAge,httpOnly: true});

            return response.sendStatus(200);
        });

    })

    app.post("/api/notes",authenticateToken, upload.single("file"), function (request, response) {
        if(!request.body)
            return response.sendStatus(400);

        let file = request.file?.filename;
        if (file == undefined)
             file = "";

        const note = request.body.note;
        const time = request.body.time;

        const data = JSON.parse(JSON.stringify({user_id: request.userInfoInToken._id, complete: false,
                                                      note: note,time: time, file:file }))
        notes.insertOne(data, function(err, result) {
            if (err) throw err;
            const id = result["ops"][0]["_id"]
            response.send(JSON.stringify({id: id, complete: false,note: note, time: time, file: file}));
        });
    });

    app.get('/api/notes',authenticateToken, function(request, response) {

        notes.find({user_id: request.userInfoInToken._id},
            { projection: { _id: 1, complete: 1, note: 1, time: 1, file: 1 } })
            .toArray(function (error, result) {
            if (error) throw error;

            response.send(JSON.stringify(result));
        });
    })

    app.put('/api/notes/:id',authenticateToken, (request, response) => {
        notes.findOne({_id: ObjectID(request.params.id)}, function(err, result) {
            if (err) throw err;

            if (result == null) {
                return response.sendStatus(401);
            }

            let complete;
            if (result.complete == false){
                complete = true;
            }else{
                complete = false;
            }

            const updateValue = { $set: {complete: complete} };
            notes.updateOne(result, updateValue, function(error) {
                if (error) throw error;
                notes.findOne({_id: ObjectID(request.params.id)}, function(err, result) {
                    if (err) throw err;

                    response.send(JSON.stringify({_id: result._id, complete: result.complete,
                                                        note: result.note, time: result.time, file: result.file}));
                });
            });
        });
    });

    app.delete('/api/notes/:id',authenticateToken, (request, response) => {
        notes.deleteOne({_id: ObjectID(request.params.id)}, function(err, result) {
            if (err) throw err;

            response.send(JSON.stringify({_id: request.params.id}));
        });
    });

    app.put('/api/sort',authenticateToken,(request, response) => {
        if (!request.body)
            return response.sendStatus(400);

        const sortParam = request.body.sortParam;
        let sortArg;
        if (sortParam == "complete")
            sortArg = {complete: -1};
        else
            sortArg = {time: 1};

        notes.find({user_id: request.userInfoInToken._id},
            {projection: {_id: 1, complete: 1, note: 1, time: 1, file: 1}}).sort(sortArg)
            .toArray(function (error, result) {
                if (error) throw error;

                response.send(JSON.stringify(result));
            });
    });
};


