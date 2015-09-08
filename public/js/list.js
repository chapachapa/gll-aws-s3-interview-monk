function interviewRecordItem(){
    this.name = '';
    this.email = '';
    this.uuid = '';
    this.signedURL = '';
}

angular.module('listApp', []).controller('mainController', function($scope){
    //$scope.intervieweeList = ['Charles Park', 'Charles Pork', 'Charle Spark'];
    $scope.loadFile = loadFile;

    sendAJAX('GET', '/getList', '', function(response, err){
        var parsedData = JSON.parse(response);
        $scope.intervieweeList = parsedData.data;
        console.log(parsedData);
        console.log(parsedData.data);
        $scope.$digest();           // $apply - not this one because we just want to update this scope.
    });
});

function loadFile(id){
    sendAJAX ('GET', '/aws/request/get', '?id='+id);
    var getTimer;
    var returnedData = {};
    var promise = new Promise(function(resolve, reject){
        getTimer = setInterval(function(){
            sendAJAX('GET', '/aws/getURL/get', '?id='+id , function(response, status){
                //console.log('loop: '+ status);
                //console.log('type of status: '+ typeof status);   // status is a Number.
                if(status === 200){
                    console.log('success! - we got the SignedURL for GET');
                    console.log(response);
                    returnedData = JSON.parse(response);
                    clearInterval(getTimer);
                    resolve();
                } else if (status === 404){
                    console.log('ERROR - failed to grab data');
                    clearInterval(getTimer);
                    reject();
                } else {
                    console.log('nothing. please wait.');
                }
            });
        }, 1500);
    });

    promise.then(function(){
        // nothing for now
        console.log('promise complete');
        console.log(returnedData);
        window.open(returnedData.signedURL, '_blank');
        // the URL you got is a get request to the file itself, so you can just open the address in the new window.
        /*sendAJAX('GET',returnedData.signedURL, '', function(response, status){
            if (status === 200){
                var a = document.createElement('a');

            } else {
                console.log('ERROR - failed to get image from AWS')
            }
        });*/
    });
}

function sendAJAX (verb, url, q, cb, data) {
    xhr = new XMLHttpRequest();
    xhr.open(verb, url + q);
    xhr.addEventListener('readystatechange', function(){
        if(xhr.readyState === 4){
            console.log(xhr.status);
            if(typeof cb !== 'undefined'){
                cb(xhr.responseText, xhr.status);
            } else {
                console.log(xhr.responseText);
            }
        }
    });
    if(verb === 'PUT' && typeof data !== 'undefined'){
        xhr.send(data);
    }else {
        xhr.send();
    }
}