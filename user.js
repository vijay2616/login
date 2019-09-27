const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require("../model/user");
const checkAuth = require("../verifyToken/check-auth");

//----------------------------------------------- signUp --------------------------------------------------------//
router.post("/signup", (req, res, next) => {

    User.find({ email: req.body.email })
        .exec()
        .then(user => {
            if (user.length >= 1) {
                return res.status(409).json({
                    message: ' message exists'
                });

            } else {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).json({
                            error: err
                        });
                    } else {
                        const user = new User({
                            _id: new mongoose.Types.ObjectId(),
                            email: req.body.email,
                            password: hash,
                            DOB: req.body.DOB,
                            username: req.body.username,
                            role: req.body.role
                        });
                        user.save()
                            .then(result => {
                                console.log(result);
                                res.status(201).json({
                                    message: 'user created successfully'
                                });
                            })
                            .catch(err => {
                                console.log(err);
                                res.status(500).json({
                                    error: err
                                });
                            });

                    }
                });

           
            }
        })
  
});



//-------------------------------------------------------------login --------------------------------------------------------------//
router.post("/login",  (req, res, next) => {
    User.find({ $or: [{ email: req.body.email }, { username: req.body.username }] })

        .exec()
        .then(user => {
            if (user.length < 1) {
                return res.status(401).json({
                    message: "Auth failed"
                });
            }
            bcrypt.compare(req.body.password, user[0].password, (err, result) => {
                if (err) {
                    return res.status(401).json({
                        message: "Auth failed"
                    });
                }
                if (result) {
                    const token = jwt.sign(
                        {
                            email: user[0].email,
                            userId: user[0]._id
                        },
                        process.env.JWT_KEY,
                        {
                            expiresIn: "30min"
                        }
                    );
                    return res.status(200).json({
                        message: "Auth successful",
                        token: token
                    });
                }
                res.status(401).json({
                    message: "Auth failed"
                });
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});
////////////////////////////////////// delete ////////////////////////////////////
router.delete("/:userId", checkAuth ,(req, res, next) => {
    User.remove({ _id: req.params.userId })
        .exec()
        .then(result => {
            res.status(200).json({
                message: "user delete"
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

/////////find all user //////////////////////
router.get('/', checkAuth, async (req, res) => {
    const user = await User.find().sort('name');
    res.send(user);
});

////////////////////////////// balanced //////////////////////////////////////

router.put('/count/:id', checkAuth,  (req, res ,next ) => {
    User.findById({ _id: req.params.id })   
        .exec()
        .then(result => {
            const id = req.params.id;
            let paranthesis = req.body.paranthesis;
            if (paranthesis === '{[]}' || paranthesis === '({[]})') {
                User.findByIdAndUpdate({ _id: id }, {
                    $inc: { __v: 1 },
                    $set: { __v: id }
                }, { upsert: true })
                res.status(200).json({

                    message: "balanced"
                });
                console.log('balance');
            }
            else if (paranthesis === '{[]') {
                console.log('} is missing');
                res.status(404).json({
                    message: "} is missing"
                });
            }

            else if (paranthesis === '({]})') {
                console.log('[ is missing');
                res.status(404).json({
                    message: "[ is missing"
                });
            }
            else {
                console.log('wrong inout');
                res.status(404).json({
                    message: "wrong inout"
                });
            }
        })
        .catch (err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});



module.exports = router;