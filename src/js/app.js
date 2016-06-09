  // establish a firebase object to store and read data from

  var myFirebaseRef = new Firebase('https://squarefall.firebaseio.com/');
  document.addEventListener('DOMContentLoaded', function() {
    var playerObject;
    var updateBoardInterval;
    var platforms = [];
    var score = 0;
    var scoreBox = document.getElementById('score');
    var topScores = document.getElementById('topScores');
    var button = document.getElementById('reset');
    var jsonDataArrayToBeSorted = [];
    var topTen;
    var playerName = prompt('Enter your name!');
    var stopped = false;


    // my game area object which includes some properties with values
    // that are functions to start and end the game

    var myGameArea = {
      canvas: document.createElement('canvas'),
      startTheGame: function() {
        this.canvas.width = 300;
        this.canvas.height = 350;
        this.context = this.canvas.getContext('2d');
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.ticker = 0;
        updateBoardInterval = setInterval(updateGameArea, 20);
        window.addEventListener('keydown', function (e) {
          // a property of .keys is checked to see if it exists or if it should be set to
          // an empty array
          myGameArea.keys = (myGameArea.keys || []);

          // the keydown event is passed as a value to the keys property

          myGameArea.keys[e.keyCode] = true;
        });
        window.addEventListener('keyup', function (e) {
          // when the key is released it is removed from the myGameArea
          myGameArea.keys[e.keyCode] = false;
        });
      },
      clear: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    };

    var firebaseInteraction = function() {
      myFirebaseRef.child(playerName).set({
        score: score,
        player: playerName
      });
    };

    var leaderBoardDisplay = function() {
      myFirebaseRef.on('value', function(snapshot) {
        var fireData = snapshot.val();
        for (var key in fireData) {
          jsonDataArrayToBeSorted.push(fireData[key]);
        }
        var sortedJson = jsonDataArrayToBeSorted.sort(function(obj1, obj2) {
          return obj2.score - obj1.score;
        });
        console.log(sortedJson);
        for (var l = 0; l < 10; l++) {
          document.write(l + 1 + ' ' + sortedJson[l].player + ' got '
            + sortedJson[l].score + ' points!' + '</br>');
        }
      }, function (errorObject) {
        console.log('The read failed: ' + errorObject.code);
      });
    };

    // stop game function, the 'stopped' flag is set to true to allow the
    // following functions to run in the if statement

    var stopGame = function() {
      clearInterval(updateBoardInterval);
      if (!stopped) {
        stopped = true;
        scoreBox.innerHTML = 'You got ' + score + ' points!';
        button.className = ('');
        firebaseInteraction();
        leaderBoardDisplay();
      }
    };

    // constructor function; this function is a template for all my objects

    var PieceConstructor = function(width, height, color, x, y) {
      // sets these params to properties of the object
      this.width = width;
      this.height = height;
      this.x = x;
      this.y = y;
      this.sideSpeed = 0;
      this.verticalSpeed = 0;

      // these properties contain functions that describe how
      // these objects will be drawn on the canvas

      this.update = function() {
        var ctx = myGameArea.context;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
      };

      // this function describes the speed and direction

      this.position = function() {
        this.x += this.sideSpeed;
        this.y += this.verticalSpeed;
      };

      // this function covers hit detection

      this.collideCheck = function(otherobj) {
        var left = this.x;
        var right = this.x + (this.width);
        var top = this.y;
        var bottom = this.y + (this.height);
        var otherleft = otherobj.x;
        var otherright = otherobj.x + (otherobj.width);
        var othertop = otherobj.y;
        var otherbottom = otherobj.y + (otherobj.height);
        var hitDetect = true;

        // this if statement detects hits vs other objects

        if ((bottom < othertop) || (top > otherbottom) || (right < otherleft) ||
         (left > otherright)) {
          hitDetect = false;
        }

        // this if statement detects hits vs walls

        if ((bottom > myGameArea.canvas.height + 30) || (top < -100) ||
        (right > myGameArea.canvas.width) || (left < 0)) {
          stopGame();
        }
        return hitDetect;
      };
    };

    // start game function that makes a player object and sets up the stopped
    // flag for later use in our stopgame function

    var startGame = function() {
      stopped = false;
      playerObject = new PieceConstructor(15, 15, 'lightgray', 120, 10);
      myGameArea.startTheGame();
    };

    // checks if the ticker and the time are equal
    // if they are equal, this timeForObstacleRelease runs
    // the code that creates new objects and draws them

    var timerForObstacleRelease = function(time) {
      if ((myGameArea.ticker / time) % 1 === 0) {
        return true;
      }
      return false;
    };

    // controls player movement, checks for hits

    var updateGameArea = function() {
      var width;
      var gap;
      var minWidth;
      var maxWidth;
      var minGap;
      var maxGap;

      for (var j = 0; j < platforms.length; j += 1) {
        if (playerObject.collideCheck(platforms[j])) {
          stopGame();
        }
      }

      // this clears the 'old' objects

      myGameArea.clear();


      // display message until an arrow is pressed

      if (!myGameArea.keys) {
        scoreBox.innerHTML = 'Use the arrow keys to dodge the platforms';
      } else if (myGameArea.keys[37]) {
        playerObject.sideSpeed = -0.5;
        playerObject.x = playerObject.x - 2.5;
      } else if (myGameArea.keys[39]) {
        playerObject.sideSpeed = 0.5;
        playerObject.x = playerObject.x + 2.5;
      } else if (myGameArea.keys[38]) {
        playerObject.verticalSpeed = -0.5;
        playerObject.y = playerObject.y - 2.5;
      } else if (myGameArea.keys[40]) {
        playerObject.verticalSpeed = 0.5;
        playerObject.y = playerObject.y + 2.5;
      }

      // game ticker iterates by one every time the game area refreshes
      // the game area refreshes based on the param passed to timeforobstacle--

      myGameArea.ticker += 1;
      // if statement that makes randomly sized obstacles
      // every second
      if (myGameArea.ticker === 1 || timerForObstacleRelease(60)) {
        score += 20;
        scoreBox.innerHTML = score;

        // allows for random obstacle length

        minWidth = 20;
        maxWidth = 200;
        width = Math.floor(Math.random() * (maxWidth - minWidth) + minWidth);

        // allows for random gap between obstacles

        minGap = 100;
        maxGap = 200;
        gap = Math.floor(Math.random() * (maxGap - minGap + 1));

        // obstacles being pushed to an array

        platforms.push(new PieceConstructor((width - gap), 4, 'red', 260, 330));
        platforms.push(new PieceConstructor(width, 4, 'red', 0, 430));

        // obstacle that appears every 100 points

        if (score % 100 === 0) {
          platforms.push(new PieceConstructor((width / 4), 10, 'red', (width - gap), 530));
        }
      }

      // for loop that iterates through array of objects and brings them to the top of the

      for (var i = 0; i < platforms.length; i += 1) {
        // they are brought towards the top of the canvas because their
        // 'y' property is decremented by 2 pixes every time the game area is refreshed
        platforms[i].y += -2;
        platforms[i].update();
      }

      playerObject.position();
      playerObject.update();
    };

    startGame();
    button.addEventListener('click', function() {
      window.location.reload();
    });
  });