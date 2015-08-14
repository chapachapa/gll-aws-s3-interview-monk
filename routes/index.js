var express = require('express');
var router = express.Router();

// includes for AWS
var AWS = require('aws-sdk');
//var config = require('../config');
AWS.config.loadFromPath('./config.json');
var s3 = new AWS.S3();

var uuid = require('uuid');

function requestItem() {
    this.error = false;  // is bucket ready?
    this.errorMessage = [];
    this.ready = false;    // is the CORS set?
    this.signed = false;  // is the signed address ready?
    this.addr = '';
}

var reqBatch = {};

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

// deletes all buckets with "gll_" on the front
// watchout for API limits
/*router.get('/aws/clean', function(req, res){
    s3.listBuckets({})
});*/

// user will request aws to setup
router.get('/aws/request', function (req, res) {
    var id = 'gll_' + uuid.v4();            // bucket names have to be unique on all existing buckets on Amazon
    id = id.substr(0, 10);     // because I don't want to type it out 10 times
    console.log('requesting: ', id);        // NOT just on your account. Thus, I'm giving a unique identifier in the front.
    reqBatch[id] = new requestItem;
    console.log(reqBatch);
    createBucket(id);
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

function getSignedURL(bucketId){
    s3.getSignedUrl('putObject',{
        Bucket: bucketId,
        Key: 'upload.jpg',
        ContentType: 'image/jpeg'
    }, function(err, data){
        if (err){
            console.log('ERROR - ', err);
            reqBatch[bucketId].errorMessage.push('failed to get signed URL');
            reqBatch[bucketId].error = true;
        } else {
            console.log('got back the url! ... ', data);
            reqBatch[bucketId].ready = true;
            reqBatch[bucketId].addr = data;
        }
    });
}

module.exports = router;
