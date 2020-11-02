/************* CONSTANT VARIABLES DECLARATION *************/
const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const favicon = require('express-favicon');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const MongoStore = require('connect-mongo')(session);
const urlDb = 'mongodb+srv://Alex:Dominique1@cluster0.erqrs.mongodb.net/test';
const dbName = 'projet-back-end';
const collectionName = 'projet-back-end';
const PORT = process.env.PORT || 8080;

/************* MIDDLEWARES *************/

app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/js', express.static(__dirname + '/public/script'));
app.use('/css', express.static(__dirname + '/public/style'));
// app.use('/img', express.static(__dirname + 'public/images'));

app.use(favicon(__dirname + '/public/images/favicon.png'));

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: '12345',
  cookie: {
    MaxAge: 99,
  },
  store: new MongoStore({
    url: urlDb,
    dbName: dbName,
    collection: collectionName,
  })
}));



/*****************Déclaration Routes et Redirections********************/



app.get('/', (req, res, next) => {
  if (req.session.login) {
    res.redirect('/Game');
  } else {
    res.render('login', { pageTitle: 'Accueil' });
  }
});

app.get('/login', (req, res, next) => {
  console.log(req.session)
  res.render('login', { pageTitle: 'Accueil' });
});

app.get('/registration', (req, res, next) => {
  console.log(req.session)
  res.render('registration', { pageTitle: 'Créer un compte' });
});

app.get('/Game', (req, res, next) => {
  if (req.session.login) {
    res.render('Game', {
      _id: req.session._id,
      login: req.session.login,
      pageTitle: 'Game',
    });
  } else {
    res.redirect('/login');
  }

});

app.post('/login', (req, res, next) => {
  if (!req.body.login || !req.body.password) {
    res.redirect('/login');
    app.locals.message = `Identifiant ou mot de passe non renseigné`

  } else {
    MongoClient.connect(urlDb, { useUnifiedTopology: true }, (err, client) => {
      if (err) {
        next(new Error(err));

      } else {
        const collection = client.db(dbName).collection(collectionName);
        collection.find({ login: req.body.login }).toArray((err, data) => {
          client.close();
          if (err) {
            next(new Error(err));

          } else {
            if (!data.length) {
              res.redirect('/login');
              app.locals.message = 'Identifiant introuvable';

            } else {
              if (req.body.password === data[0].password) {
                req.session._id = data[0]._id;
                req.session.login = data[0].login;
                res.redirect('/Game');

              } else {
                res.redirect('/login');
                app.locals.message = `Mot de passe incorrect`;
              }
            }
          }
        });
      }
    });
  }
});

app.post('/processing', (req, res, next) => {
  MongoClient.connect(urlDb, { useUnifiedTopology: true }, (err, client) => {
    if (err) {
      next(new Error(err));

    } else {
      const collection = client.db(dbName).collection(collectionName);
      collection.find({ login: req.body.login }).toArray((err, data) => {
        console.log('data : ', data);
        if (err) {
          next(new Error(err));
        }
        if (data[0] === undefined) {
          collection.insertOne({
            login: req.body.login,
            password: req.body.password
          }, (err, data) => {
            if (err) return;
            client.close();
            app.locals.message = `Compte créé avec succès`
            res.redirect('/login');
          })
        } else {
          if (req.body.login === data[0].login) {
            app.locals.message = `Compte existant`;
            res.redirect('/login');
          }
        }
      });
    };
  });
});

const server = app.listen(PORT, () => {
  console.log(`Ecoute sur le Port ${PORT}.`)
});

/************* SOCKET *************/

const io = require('socket.io')(server);

const Playersonline = [];

const AllPlayers = {};

io.on('connect', socket => {
  console.log(`Le client ${socket.id} est connecté`);

  socket.on('playerPseudo', pseudo => {
    socket.login = pseudo;
    if (!Playersonline.includes(socket.login)) {
      Playersonline.push(socket.login);
    };

    const Player = {
      position: 'absolute',
      height: '50px',
      width: '150px',
      top: 200,
      left: Math.random() * 600 + 50,
      border: '1px solid black',
      id: socket.id,
      innerText: socket.login,
      backgroundColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      color: 'black',
      score: 0,
      upDateS: function () {
        if (this.top > 250) {
          this.score += 10;
          this.score = 10;
        }
        // if (this.top >= 500) {
        //   this.score += 10;
        //   this.score = 20;
        // }


        // console.log(this.score);
      }
    };

    AllPlayers[Player.id] = Player;

    io.emit('createPlayer', Player);

    /** MOVE PLAYERS **/

    socket.on('keypress', movement => {
      if (movement.down && Playersonline.length >= 2) {
        if (AllPlayers[Player.id].top <= 800) {
          AllPlayers[Player.id].top += 20;
          AllPlayers[Player.id].score += 20;

          console.log(AllPlayers[Player.id].score);
        }
        if (AllPlayers[Player.id].top >= 800) {
          AllPlayers[Player.id].top = 800;
          AllPlayers[Player.id].score = 600;

          // AllPlayers[Player.id].top += 0;
          // AllPlayers[Player.id].score++;//si retiré n'affiche plus ma div win pas trouvé mieux (arrivé dans la piscine ajoute +1 d'ou le +1 en score)
        }
      }
      io.emit('createPlayer', Player);
    });
    //parti test
    var message = [];
    (function updatePlayers() {
      for (const Player in AllPlayers) {

        AllPlayers[Player].upDateS();
        message.push(AllPlayers[Player]);
      }
      //
      io.emit('displayAllPlayers', message);
    }());

    // io.emit('displayScores', score);
    // console.log(score);

    //déconnexion des joueurs
    socket.on('disconnect', (reason) => {
      delete AllPlayers[Player.id];

      io.emit('removePlayer', Player);
    });
  });
});