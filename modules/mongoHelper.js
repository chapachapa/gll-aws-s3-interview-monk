var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/interview-monk');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log('MONGOOSE IS READY :D');
});

var intervieweeSchema = mongoose.Schema({
    name: String,
    email: String,
    responses:[{    // just one for now.
        uuid: String
    }]
});

// responses should be an array of uuids
function newInterviewee(name, email, responses){
    var interviewee = mongoose.model('interviewee', intervieweeSchema);
    /*responses.forEach(function(elem, i){
        elem.getObject = {
            ready: false,
            signedURL: ''
        };
        elem.putObject = {
            ready: false,
            signedURL: ''
        };
    });*/

    var intRecord = new interviewee({
        name: name,
        email: email,
        responses: responses
    });

    intRecord.save();
}

function setSignedGet(id){
    //console.log(mongoose.find({uuid:id}));
}

function setSignedPut(){

}

var returnData;
function requestList(){
    returnData = {ready: false};
    var interviewee = mongoose.model('interviewee', intervieweeSchema);
    interviewee.find(function(err, data){
        if (err){
            console.log('failed!');
            returnData.err = 'FAILED';
            returnData.ready='true';
        }else {
            console.log('mongoose data - success!');
            returnData.data = data;
            returnData.ready='true';
        }
    });

    //console.log(returnData);
    //console.log('is it sync?');     // it's not. tough luck.
    //return returnData;
}

function getList(){
    if(returnData.ready){
        return returnData;
    } else{
        return {message: 'data not ready'};
    }
}

module.exports = {
    newInterviewee: newInterviewee,
    requestList: requestList,
    getList: getList,
    setSignedGet: setSignedGet,
    setSignedPut: setSignedPut
};