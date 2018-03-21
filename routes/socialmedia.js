var express=require('express');
var expressserver = express();
const https= require('https');
const fs = require('fs');
var graph=require('fbgraph');
var {google}=require('googleapis');
var OAuth2 = google.auth.OAuth2;
var plus = google.plus('v1');
var gmail = google.gmail('v1');
var jwt = require('jsonwebtoken');



//**********************************restful api**********************************************************/
expressserver.use(function(req,resp,next){
    resp.header("Access-Control-Allow-Origin","*");
    resp.header("Access-Control-Allow-Headers","Content-Type,Authorization");
    resp.header("Access-Control-Allow-Methods","GET,POST,PUT,DELETE")
    next();
  });
  //****************************** make server request https******************************** */

var options = {
    key: fs.readFileSync("../server.key"),
    cert: fs.readFileSync("../server.crt")
  };

  var server = https.createServer(options, expressserver);

//**************************************App id****************************************** */

        var authclient=new OAuth2(
            '448503575381-qc1f0852ir0m5vb43ic4066g8f03155k.apps.googleusercontent.com','p_qMifEKigRyY2hb1lr8e1NX','https://localhost:9010/goback'
        )

//*********************************FaceBook******************************************* */

 expressserver.get('/fburl',function(request,response){

        // get authorization url
        var authUrl = graph.getOauthUrl({
            "client_id":  '1612080208881297'
        , "redirect_uri":  'https://localhost:9010/fbcallback',
        scope:['public_profile','email']
        });

    response.send(authUrl);
});

//*************************************Facebook Callback******************************** */
expressserver.get('/fbcallback',function(request,response){
        var user={};    
        // get Code from QueryString and send new request to get AccessToken
            graph.authorize({
                "client_id":      "1612080208881297"
            , "redirect_uri":   "https://localhost:9010/fbcallback"
            , "client_secret":  "a95cf2ac98bc976e0e21841ad3f6cb91"
            , "code":           request.query.code
            },function (err, facebookRes) {
            
                user.token=facebookRes.access_token;
                // Set Access Token
                graph.setAccessToken(user.token);
                // GET User Profile Data -- URI /user_id
                graph.get("/me?fields=id,name,picture.width(300),email",function(err,result){
            
                    user.image=result.picture.data.url;
                    user.name=result.name;
                    user.email=result.email;
                //**********save user in database************************ */
                    response.send(user);

        });

        });
    
    
});


//*****************************************Get Google Url****************************** */ 
   expressserver.get('/gourl',function(req,resp){
            // generate a url that asks permissions for Google+ and Google Calendar scopes
            var scopes = [
                'https://www.googleapis.com/auth/plus.me',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/gmail.readonly'
            
            ];
            
            var url=authclient.generateAuthUrl({
                access_type:'offline',
                scope:scopes
            });

      resp.send(url);
});

//*******************************************Google Callback******************************** */
  expressserver.get('/goback',function(request,response){

      var user={};
    //*******************************Get Acess Token************************* */
    authclient.getToken(request.query.code,function(err,token){
    
          if(!err)
            {    
                    //setcredentails on access token and save it in file
                    authclient.setCredentials(token);
                    // user.token=JSON.stringify(token);
                    user.token=token.access_token;
                    user.expiredata=token.expiry_date;
                    user.refreshtoken=token.refresh_token;

                //get user
                plus.people.get({
                        userId: 'me',
                        auth: authclient

                        }, function (err, res) {
                             console.log(res);
                    
                            //***********************add use to db*****************
                            user.name=res.data.displayName;
                            user.image=res.data.image.url;
                            user.email=res.data.emails[0].value;                  

                                jwt.sign({user:user},'secretkey',function(err,token){
                                
                                    response.json({token:token});

                                });

                        });
            }
        });



});


/*
function verifyToken(req,res,next){
    //get auth header value
    const bearerheader=req.headers['authorization'];
    if(typeof(bearerheader !== undefined)){
        
        // const bearer=bearerheader.split(' ');
        // //get token from array
        // const bearertoken=bearer[1];
        const bearertoken=bearerheader;
        //set token
        req.token=bearertoken;
        next();
    }else{
        res.send("unauthorized");
    }

}
*/

// expressserver.post('/test',verifyToken,function(req,res){
//   jwt.verify(req.token,'secretkey',function(err,authdata){
//       if(err)
//       {
//           res.send(err);
//       }else{
//           res.json({authdata});
//       }
//   })
//     res.json();

// });



// expressserver.post('/login',function(req,res){

//     user={
//         id:122,
//         name:'gogo'
//     }

//     jwt.sign({user:user},'secretkey',function(err,token){
       
//         res.json({token:token});

//     });

//   });
  



module.exports=expressserver;
