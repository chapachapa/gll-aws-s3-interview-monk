// apparently this is only for chrome.

var mediaConstraints = {
    audio: true,
    video: true
};

navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);

var btn_record = document.getElementById('recRecord');
var btn_stop = document.getElementById('recStop');
var btn_view = document.getElementById('recView');
var videoURL = '';
var videoBlob;
var btn_upload = document.getElementById('finalSubmit');

function onMediaSuccess(stream) {
    var mediaRecorder = new MultiStreamRecorder(stream);
    mediaRecorder.mimeType = 'video/webm';
    //mediaRecorder.video = yourVideoElement; // to get maximum accuracy
    mediaRecorder.audioChannels = 2;
    mediaRecorder.ondataavailable = function (blobs) {
        // POST/PUT "Blob" using FormData/XHR2
        console.log(blobs);
        console.log('done recording ... ');
        videoURL = URL.createObjectURL(blobs.video);       // url is a <a> tag
        videoBlob = blobs.video;
        // document.write('<a href="' + blobURL + '">' + blobURL + '</a>');
    };

    btn_record.addEventListener('click', function(){
        mediaRecorder.start(30000);
        enableButton(btn_stop);
        disableButton(btn_record);
    });
    btn_stop.addEventListener('click', function(){
        disableButton(btn_stop);
        enableButton(btn_view);
        enableButton(btn_upload, 'final');
        mediaRecorder.stop();
    });
    btn_view.addEventListener('click', function(){
        window.open(videoURL);
    });
    btn_upload.addEventListener('click', function(){
         var vidFormData = new FormData();
         vidFormData.append('file', videoBlob);
        requestURL(videoBlob);
        //uploadFile(videoBlob);
    });
}

function onMediaError(e) {
    console.error('media error', e);
}

function enableButton(element, add){
    element.className = 'actionButton' + ' '+add;
}
function disableButton(element){
    element.className = 'disabledButton';
}