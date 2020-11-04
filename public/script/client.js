const socket = io('https://alexandre-leclercq.herokuapp.com');
var Player;
var Score;
var Win = document.getElementById('win');
const greeting = document.getElementById('greeting');

socket.on('connect', () => {
  socket.login = greeting.innerText;
  socket.emit('playerPseudo', socket.login);

  /*PLAYER ET SCORE **/
  const UpdatePlayer = (players) => {
    Player = window.document.getElementById(players.id);
    if (!Player) {
      Player = window.document.createElement('div');
      window.document.body.append(Player);
    };
    Player.id = players.id;
    //background-color Aléatoire a chaque Update
    Player.style.backgroundColor = players.backgroundColor;
    //position Aléatoire du left a chaque Update
    Player.style.left = players.left + 'px';
    //
    Player.style.position = players.position;
    //Prend en compte les positions de la div//
    Player.style.top = players.top + 'px';
    Player.style.width = players.width;
    //Affiche l'id dans la div//
    Player.innerText = `${players.innerText.charAt(0).toUpperCase()}${players.innerText.slice(1)} score: ${players.score}`;
    //Div win avec ID quand on win
    Player.score = players.score;
    console.log(players.score);
  };

  const createScores = score => {
    Score = window.document.getElementById(score.id);
    if (!Score) {
      Score = window.document.createElement('div');
      window.document.body.append(Score);
    }
  };
  socket.on('displayScores', score => {
    createScores(score);
  });

  socket.on('displayAllPlayers', allPlayers => {
    for (const onePlayer of allPlayers) {
      UpdatePlayer(onePlayer);
    }
  });

  socket.on('createPlayer', players => {
    UpdatePlayer(players);
    //affichage message de victoire 
    if (Player.score >= 600) {
      Win.style.display = "flex";
      Win.innerText = `${Player.innerText} Win...Press F5 to restart !`;
    }
  });
  /** EVENT MOVE ET REMOVE PLAYERS **/
  const move = {
    down: false,
  };
  window.addEventListener('keyup', keyupEvent => {
    switch (keyupEvent.key) {
      case 'ArrowDown':
        keyupEvent.preventDefault();
        socket.emit('keypress', move);
        move.down = false;
        break;
    }
  });
  window.addEventListener('keydown', keydownEvent => {
    switch (keydownEvent.key) {
      case 'ArrowDown':
        keydownEvent.preventDefault();
        move.down = true;
        break;
    }
  });

  socket.on('removePlayer', players => {
    const Player = window.document.getElementById(players.id);
    if (Player) {
      Player.parentNode.removeChild(Player);
    };
  });
});