var xhr;

function requestURL(){
    // prepare upload
    console.log('entering requestURL()');
    sendAJAX('GET', '/aws/request', '', function(data, status){
        if(status === 202){
            userId = JSON.parse(data).id;
            console.log(userId);
            acquireURL()
        } else {
            console.log('AJAX error: server returned with unexpected code: '+status);
        }
    });
    document.getElementById('initContainer').style.display = 'none';
    document.getElementById('loadingContainer').style.display = 'flex';
}

function acquireURL(){
    console.log('entering acquireURL()');
    var intForURL = setInterval(function() {
        if(typeof xhr !== 'undefined'){
            xhr.abort();
            console.log('xhr request has been aborted in order to start a new one.');
        }

        sendAJAX('GET', '/aws/getURL', '?id='+userId, function(data, status){
            if(status === 200){
                clearInterval(intForURL);
                console.log('request successful! clearing interval!');
                signedURL = JSON.parse(data).signedURL;
                console.log('the URL is: ', signedURL);
                // next function
                document.getElementById('loadingContainer').style.display = 'none';
                document.getElementById('fileInputContainer').style.display = 'flex';
                uploadFile();
            } else if (status === 204) {
                console.log('request not ready!');
            } else {
                console.log('error? - ',status);
            }
        });
    }, 1500);
}

function uploadFile(){
    document.getElementById('submitImageButton').addEventListener('click', function(){
        var file = document.querySelector('input').files[0];
        //console.log(file);
        if (typeof file !== 'undefined'){
            sendAJAX('PUT', signedURL, '', function(data, status){
                if (status === 200){
                    console.log('successfully uploaded the file!');
                    document.getElementById('fileInputContainer').style.display = 'none';
                    document.getElementById('completeContainer').style.display = 'flex';
                } else {
                    console.log('something went wrong: ', status, ' / ', data);
                }
            }, file);
        }
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