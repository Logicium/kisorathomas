var express = require('express');
var fs = require('fs-extra');
var mkdirp = require('mkdirp');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');
var DirectoryStructureJSON = require('directory-structure-json');
var Databases = require('./Databases');
var _ = require('lodash');

var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'webadmin@ascensionfactory.com',
    pass: 'superSecret'
  }
});

router.get('/list', function(request, response) {
    var json = JSON.parse(fs.readFileSync('./server/Config.json'));
    response.send(json);
});

function ucfirst(str) {
  var firstLetter = str.substr(0, 1);
  return firstLetter.toUpperCase() + str.substr(1);
}

router.post('/newFolder', function(request, response) {

  Databases.Users.findOne({loginToken: request.body.token}, function(err, doc) {
    if(doc){
      var dir = request.body.path;
      var dirDot = request.body.pathDot.slice(1);
      var folderName = request.body.name;

      var db = Databases.Folders.findOne({user: doc.created }, function(err2, folders) {

        console.log(folders, dirDot,folderName);

        var updatedFolders = _.set( folders.filesystem, dirDot, {type: 'folder', name: folderName, children:{} } );

        //console.log(updatedFolders);

        Databases.Folders.findAndModify({user: doc.created},[],{$set:{filesystem:updatedFolders}},{},function(err,result){
          //console.log(folders);
          response.end(JSON.stringify({message: "Folder is Created",type: 'success'}));
        });
      });
    }
    else { response.send({ message: 'User not Found', type: 'error' }) }
  });
});

router.post('/uploadFiles', function(request, response) {

    const now = new Date().getUTCMilliseconds();
    var storage = require('multer-gridfs-storage')({
       url:process.env.MONGODB_URI,
       file: function(req, file) {
         return { filename:(now.toString() + '-' + file.originalname) }
       }
    });

    var upload = multer({storage: storage }).array('file');
    upload(request, response, function(err) {
      if (err) { return response.end(JSON.stringify({ message: "Error uploading file.", type: 'error', err: err })); }
      //console.log(request.body);
      Databases.Users.findOne({loginToken: request.body.token}, function(err, doc) {
        if(doc){
          //console.log('Upload Body: '+JSON.stringify(request.body));
          //console.log('Upload Files: '+JSON.stringify(request.files));

          var dir = request.body.path;
          var dirDot = request.body.pathDot;

          var updateFolder = function(folders,complete) {

              function go(i){
                if(i>=folders.length){ complete(); }
                else{
                  var fileName = folders[i].filename;
                  var extension = path.extname(fileName);
                  console.log('File ' + fileName);

                  var db = Databases.Folders.findOne({user: doc.created }, function(err2, folders) {

                    //console.log(folders, dirDot);

                    var updatedFolders = _.set(
                      folders.filesystem, (doc.created + '-' + fileName.substring(0, fileName.lastIndexOf(extension))),
                      { type: 'file', name: fileName, extension: extension, path: './public/temp/' + fileName}
                    );

                    //console.log(updatedFolders);

                    Databases.Folders.findAndModify({user: doc.created},[],
                      {$set:{filesystem:updatedFolders}},{},function(err,result){
                        console.log(folders);
                        return go(i+1);
                      }
                    );
                  });
                }
              }
              go(0);
            }

          updateFolder(request.files,function(){
            response.end(JSON.stringify({message: "File is Uploaded",filename: request.files.filename,type: 'success'}));
          });
        }
        else { response.send({ message: 'User not Found', type: 'error' }) }
      });
    });

});

router.post('/signup', function(request, response) {
  console.log("New user signup request.");
  var incomingUser = JSON.parse(request.body.user);
  console.log(incomingUser['email']);

  Databases.Users.count({
    email: incomingUser['email']
  }, function(err, count) {
    if (count > 0) {
      response.send({ message: 'Username is taken', type: 'warning' });
    } else {

      const now = new Date().getUTCMilliseconds();
      var userFolder = './public/folders/'+incomingUser.email+'-'+now;
      incomingUser.userFolder = userFolder;
      incomingUser.created = now.toString();
      incomingUser.verified = 'false';
      incomingUser.username = incomingUser.email;

      mkdirp(userFolder, function(err) {
        if (err) console.error(err);
        else {
          console.log('User folder created');
          Databases.Users.insert(incomingUser, function(err,newUser) {
            if (err) return console.log('err');
            Databases.Folders.insert({ user: incomingUser.created, filesystem: {} }, function(err, docs) {
              if (err) return console.log('err');
              console.log(docs);
              var verifyLink = '<a href="http://' + request.get('host') + '/verifyEmail?id=' + newUser._id + '">Verify your email here</a>';
              var mailOptions = {
                from: '"Files3D Team" <webadmin@files3d.herokuapp.com>', // sender address
                to: newUser['email'], // list of receivers as string
                subject: 'Files3D Email Verification',
                html: 'Verify your email for Files3d<br><br>' +
                  verifyLink + '<br><pre>' + JSON.stringify(
                    newUser, null, 2).toString() +
                  '</pre>'
              };
              response.send({
                message: 'New User Added',
                doc: newUser,
                type: 'success'
              });
              // transporter.sendMail(mailOptions, function(error, info) {
              //     if (error) return console.log(error);
              //     //console.log('Message %s sent: %s', info.messageId, info.response);
              // });
            });
          });
        }
      });
    }
  });
});

router.post('/verifyEmail', function(request, response) {

  //Find user in database with token in email

  console.log(req.protocol + ":/" + req.get('host'));
  if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
    console.log("Domain is matched. Information is from Authentic email");
    if (req.query.id == rand) {
      console.log("email is verified");
      res.end("<h1>Email " + mailOptions.to +
        " is been Successfully verified");
    } else {
      console.log("email is not verified");
      res.end("<h1>Bad Request</h1>");
    }
  } else {
    res.end("<h1>Request is from unknown source");
  }


});

router.post('/login', function(request, response) {

  console.log("New user login request.");
  var incomingUser = request.body;
  console.log(incomingUser);

  var Users = Databases.Users.findOne({
    username: incomingUser.username,
    password: incomingUser.password
  }, function(err, doc) {
    console.log(doc);
    if (doc) {
      var token = jwt.sign({
        U: incomingUser.username
      }, 'superSecret', {
        expiresIn: '24h'
      });
      Databases.Users.findAndModify(
        {username:incomingUser.username},
        [],
        {$set:{loginToken:token}},
        {},
        function(err,doc){if(err) return console.log(err)}
      );
      //doc.loginToken = token;
      //doc.save(function(err) {});
      response.send({
        message: 'Login Success!',
        data: doc,
        success: true,
        token: token
      });
    } else {
      response.send({
        message: 'Login Fail',
        type: 'error'
      });
    }
  });
});

router.post('/image', function(request, response) {
  // console.log(request.body);
  Databases.Users.findOne({
    loginToken: request.body.token
  }, function(err, doc) {
    //var basepath = doc.userFolder;
    console.log(doc);
    if (doc) { //also check if that file is shared with user
      console.log(request.body.path);
      //var img = fs.readFileSync(request.body.path);

      var mongo = require('mongodb');
      var Grid = require('gridfs-stream');

      // create or use an existing mongodb-native db instance
      var db = Databases.db;
      var gfs = Grid(db, mongo);
      var buffer = [];
      gfs.createReadStream({filename:request.body.filename}).on('data', function (chunk) {
        buffer.push(chunk);
      }).on('error', function (err) {
        console.log('An error occurred!', err);
        throw err;
      }).on('end', function () {
        const fbuf = Buffer.concat(buffer);
        const base64 = fbuf.toString('base64');
        //console.log(base64);
        response.writeHead(200, {
          'Content-Type': 'image/' + (request.body.extension).slice(1),
          'Content-Length': base64.length
        });
        response.end(base64);
      });
    } else {
      response.send({
        message: 'User not Found',
        type: 'error'
      });
    }
  });
});

router.use(function(req, res, next) {
  console.log(req.file);

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers[
    'x-access-token'];

  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, 'superSecret', function(err, decoded) {
      if (err) {
        return res.json({
          success: false,
          message: 'Failed to authenticate token.'
        });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });
  }
});

router.post('/uploadFolder', function(request, response) {
  console.log(request.body);

  Databases.Users.findOne({
    loginToken: request.body.token
  }, function(err, doc) {
    if (doc) {
      var parentFolderPath = request.body.path;
      var storage = multer.diskStorage({
        destination: function(req, file, callback) {
          callback(null, './server' + parentFolderPath);
        },
        filename: function(req, file, callback) {
          callback(null, file.originalname);
        }
      });
      var upload = multer({
        storage: storage
      }).array('files');

      upload(request, response, function(err) {
        console.log(request.files);
        if (err) {
          return response.end(JSON.stringify({
            message: "Error uploading file.",
            type: 'error'
          }));
        }
        response.end(JSON.stringify({
          message: "Folder is Uploaded",
          filename: request.files.filename,
          type: 'success'
        }));
      });
    } else {
      response.send({
        message: 'User not Found',
        type: 'error'
      })
    }
  });
});

router.post('/find', function(request, response) {
  console.log(request.body);
  Databases.Users.find({
    id: request.body._id
  }, {}, function(err, doc) {
    response.send({
      message: "Updated successfully.",
      newDoc: doc
    })
  });
});

router.post('/delete', function(request, response) {
  //Delete
});

module.exports = router;
