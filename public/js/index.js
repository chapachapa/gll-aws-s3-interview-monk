document.addEventListener('DOMContentLoaded', function(){
    var userId = '';
    var signedURL;
    document.getElementById('initContainer').style.display = 'flex';

    document.getElementById('initButton').addEventListener('click', function(){
        requestURL();
    });
});