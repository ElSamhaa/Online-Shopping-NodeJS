var express = require('express');
var fs = require("fs");
var User = require('../models/user');
var Seller = require('../models/seller');

var router = express.Router();


// get user info
/*!!!!!!!!!!!!!!!!!!!!!!!!
 * + req.userId expected
*/
router.get('/', function(req, res, next) {
    if (req.userId) {
    	User.find({ _id: req.userId }, function(err, result) {
            if (!err) {
                res.json({ result: result });
            } else {
                res.json(err);
            }
    	});
    } else
        res.status(403).json({ result: 'user is not authenticated' });
});

// add user info
/*!!!!!!!!!!!!!!!!!!!!!!!!
 * + need to add validation of names, password, email, etc..
 * + need to add req.facebookMail, req.accessToken and req.refreshToken to the request
*/
router.post('/add', function(req, res, next) {
    var userObj = {}
    for (field of Object.keys(req.body)) {
        userObj[field] = req.body[field];
    }
    if (req.file) {
        userObj.image = req.file.path;
    }    
    var user = new User(userObj);
    user.save(function(err, result) {
        if (!err) {
            res.json({ result: 'user added' });
        } else
            res.json(err);
    });
});

router.post('/add_seller', function(req, res, next) {
    var sellerObj = {}
    for (field of Object.keys(req.body)) {
        sellerObj[field] = req.body[field];
    }
    if (req.file) {
        sellerObj.image = req.file.path;
    }    
    var seller = new Seller(sellerObj);
    seller.save(function(err, result) {
        if (!err) {
            res.json({ result: 'seller added' });
        } else
            res.json(err);
    });
});

/* edit user info */
/*!!!!!!!!!!!!!!!!!!!!!
 * + need to add validation of names, password, email, etc..
 * + need to check for the match of access token and the sent id; to prevent any user
 *   from writing over other users info
*/
router.post('/edit', function(req, res, next) {
    if (req.userId) {
        var userObj = {}
        for (field of Object.keys(req.body)) {
            if (field != 'password') {
                userObj[field] = req.body[field];
            }
        }
        if (req.file) {
            var oldPicture = User.findOne({ _id: req.userId }, function(err, result) {
                if (!err) {
                    if (result.image) {
                        fs.unlinkSync(result.image);
                    }
                    userObj.image = req.file.path;
                } else
                    res.json(err);
            });
        }
        User.update(
            { _id: req.userId },
            { $set: userObj },
            function(err, result) {
                if (!err) {
                    res.json({ result: 'user edited' });
                } else
                    res.json(err);
            });
    } else
        res.status(403).json({ result: 'user is not authenticated' });
});

/* delete user */
router.get('/delete', function(req, res, next) {
    if (req.userId) {
        User.remove({ _id: userId }, function (err, result) {
            if (!err) {
                res.json({ result: 'user deleted' });
            } else
                res.json(err);
        });
    } else
        res.status(403).json({ result: 'user is not authenticated' });
});


module.exports = router;
