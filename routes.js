var express = require('express');
var router = express.Router();
var DirectoryStructureJSON = require('directory-structure-json');
var fs = require('fs');
var path = require('path');
var jwt = require('jsonwebtoken');


router.get('/',function(request,response){
    response.sendFile('./public/KT.html', {"root": __dirname});
});

router.get('/download',function(request,response){
    console.log("Request for file received.");
    console.log(request);
    console.log(request.query.path);
    var filepath = ( __dirname + String(request.query.path));
    var filename = path.basename(filepath);
    console.log(filepath);
    response.setHeader('Content-disposition','attachment; filename='+filename);
    response.setHeader('Content-type','application/docx');
    var filestream = fs.createReadStream(filepath);
    filestream.pipe(response);
});

router.get('/imports/libraries',function(request,response){
    var basepath = './public/libraries';
    DirectoryStructureJSON.getStructure(fs, basepath, function (err, structure, total) {
        if (err) console.log(err);
        response.send(structure);
    });
});

router.get('/imports/cards',function(request,response){
    var basepath = './public/cards';
    DirectoryStructureJSON.getStructure(fs, basepath, function (err, structure, total) {
        if (err) console.log(err);
        response.send(structure);
    });
});

router.get('/imports/panels',function(request,response){
    var basepath = './public/panels';
    DirectoryStructureJSON.getStructure(fs, basepath, function (err, structure, total) {
        if (err) console.log(err);
        response.send(structure);
    });
});

module.exports = router;
