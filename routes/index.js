var express = require('express');
var router = express.Router();

// includes for AWS
var AWS = require('aws-sdk');
//var config = require('../config');
AWS.config.loadFromPath('./config.json');
var s3 = new AWS.S3();

var mongoose = require('mongoose');
var mongoHelper = require('../modules/mongoHelper');

var uuid = require('uuid');

//localCache
function RequestItem() {
    this.error = false;  // is bucket ready?
    this.errorMessage = [];
    this.ready = false;    // is the CORS set?
    this.signed = false;  // is the signed address ready? - NOT used?
    this.addr = '';
}

var reqBatch = {};
var reqGetBatch = {};

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

// deletes all buckets with "gll_" on the front
// watchout for API limits - there doesn't seem to be any
// ========DO NOT RUN THIS======= (unless you want gll-interviewmonk go kaboom)
/*router.get('/aws/clean', function(req, res){
    s3.listBuckets(function(err, data){
        //console.log(data);
        var bArray = data.Buckets;
        //console.log(bArray);
        for(var i = 0; i < bArray.length; i++){
            //console.log(typeof bArray[i].Name);
            console.log(bArray[i].Name.substring(0,4));
            if (bArray[i].Name.substring(0,4) === 'gll_'){
                //console.log(bArray[i].Name + ' is marked for deletion');
                s3.deleteBucket({Bucket:bArray[i].Name}, function(err, data){
                    if(err){
                        console.log('error has occurred: ', err);
                    } else {
                        console.log('success!', data);
                    }
                });
            } else {
                console.log('won\'t delete ' + bArray[i].Name);
            }
        }
    });
    res.status(200).json({});
});*/


/*router.get('/upload/list', function (req, res, next) {
    res.render('index', {title: 'Express'});
});*/

// getListFrom Mongo
router.get('/getList', function(req, res){
    mongoHelper.requestList();
    var newList;
    var timerPromise = new Promise(function(resolve, reject){
        var timer = setInterval(function(){
            newList = mongoHelper.getList();
            if(typeof newList.ready !== 'undefined' ){
                clearInterval(timer);
                resolve();
            }
        }, 500);
    });

    timerPromise.then(function(){
        console.log('promise.then called!');
        //console.log(newList);
        if(typeof newList !== 'undefined' && typeof newList.err === 'undefined'){
            res.status(200).json({
                message: 'success!',
                data: newList.data
            });
        } else {
            res.status(400).json({message: 'failed!'});
        }
    });
});

//get bucket from aws
router.get('/aws/getFile', function(req,res){
    if(typeof req.query.id === 'undefined'){
        res.status(404).json({message: 'id needs to be provided via query'})
    }
    s3.getObject({
        Bucket: 'gll-interviewmonk',
        Key: req.query.id+'.jpg'
    }, function(err, data){
        console.log(data);
        res.status(200).json({err:err, data: data});
    })
});

// user will request aws to setup
router.get('/aws/request', function (req, res) {
    var id = 'gll_' + uuid.v4();            // bucket names have to be unique on all existing buckets on Amazon
    //id = id.substr(0, 10);     // because I don't want to type it out 10 times
    console.log('requesting: ', id);        // NOT just on your account. Thus, I'm giving a unique identifier in the front.
    reqBatch[id] = new RequestItem;
    console.log(reqBatch);
    //createBucket(id);         // NOTE: we are not using different buckets, we'll put all in the same bucket
    getSignedURL('gll-interviewmonk', id, 'putObject');
    mongoHelper.newInterviewee('Charles Park', 'chapa@chapa.kr', [{uuid: id}]);
    res.status(202).json({message: 'Accepted. Attempting to request AWS for signed URL', id: id});
});

router.get('/aws/getURL', function (req, res){
    console.log('looking up request with ID: ', req.query.id);
    if(typeof reqBatch[req.query.id] === 'undefined') {
        res.status(404).json({message: 'Unable to locate the bucket'});
    } else if (reqBatch[req.query.id].ready){
        res.status(200).json({signedURL: reqBatch[req.query.id].addr});
    } else {
        res.status(204);   // bucket is is not ready tp fetch signed URL
    }
});

//todo: also change the one above to be '/aws/request/put'
// make the request to grab your signed URL
// when we actually do this, it'll need to get several signed URL,
// so we must make this a request and have the front end wait for it.
// we want signed URL again because we don't want to route this through this server
router.get('/aws/request/get', function(req, res){
    var id = req.query.id;
    reqGetBatch[id] = new RequestItem;
    getSignedURL('gll-interviewmonk', id, 'getObject');
    res.status(200).json({message: 'nothing to do'});
});

// todo: change the one above to be "/aws/getURL/put" for consistency
router.get('/aws/getURL/get', function (req, res){
    console.log('looking up request with ID: ', req.query.id);
    //console.log(reqGetBatch);
    if(typeof reqGetBatch[req.query.id] === 'undefined') {
        res.status(404).json({message: 'Unable to locate the bucket'});
    } else if (reqGetBatch[req.query.id].ready){
        res.status(200).json({signedURL: reqGetBatch[req.query.id].addr});
    } else {
        res.status(204);   // bucket is is not ready tp fetch signed URL
    }
});

// AWS helper function

//creates a bucket with the name bName
function createBucket(bucketId) {
    s3.createBucket({Bucket: bucketId}, function (err, data) {
        if (err) {
            console.log('ERROR: ', err);
            reqBatch[bucketId].errorMessage.push('failed to create a bucket');
            reqBatch[bucketId].error = true;
        } else {
            console.log('success!', data);
            setCors(bucketId);
        }
    });
}

var CORS_Rules = {
    CORSRules: [
        {
            AllowedOrigins: [
                '*'
            ],
            AllowedMethods: [
                'GET',
                'PUT'
            ],
            ExposeHeaders: [
                'Access-Control-Allow-Origin',
                'content-type'
            ],
            AllowedHeaders: [
                '*'
            ],
            MaxAgeSeconds: 3000
        }
    ]
};

function setCors(bucketId) {
    /*s3.getBucketCors({Bucket: 'new_chapa'}, function(err, data){
        if (err){
            console.log(err);
        } else {
            console.log(data);
        }
    });*/

    s3.putBucketCors({
        Bucket: bucketId,
        CORSConfiguration: CORS_Rules
    }, function (err, data){
        if (err){
            console.log('Error setting up CORS / Detail: ', err);
            reqBatch[bucketId].errorMessage.push('failed to update CORS settings');
            reqBatch[bucketId].error = true;
        } else {
            console.log('Success! - CORS has been seen ... ', data);
            getSignedURL(bucketId);
        }
    });
}

function getSignedURL(bucketId, id, verb){
    var fileName = '';
    if(typeof id === 'undefined'){
        fileName = 'upload.mp4';
    } else {
        fileName = id + '.mp4';
    }
    console.log ( '...............' + fileName);
    var param = {
        Bucket: bucketId,
        Key: fileName
    };
    if (verb === 'putObject'){
        param.ContentType = 'video/webm';
    }
    s3.getSignedUrl(verb, param, function(err, data){
        console.log(this.response);
        var batch;
        if (verb === 'getObject'){
            batch = reqGetBatch;
        } else {
            batch = reqBatch;
        }
        if (err){
            console.log('ERROR - ', err);
            batch[id].errorMessage.push('failed to get signed URL');
            batch[id].error = true;
        } else {
            console.log('got back the url! ... ', data);
            batch[id].ready = true;
            batch[id].addr = data;
        }
    });
}

module.exports = router;
