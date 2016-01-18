angular.module('app', ['ngRoute','ngResource','monospaced.qrcode'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.
      when('/polls', { templateUrl: 'partials/list.html', controller: 'PollListCtrl' }).
      when('/poll/:pollId', { templateUrl: 'partials/item.html', controller: 'PollItemCtrl' }).
      when('/new', { templateUrl: 'partials/new.html', controller: 'PollNewCtrl' }).
      // If invalid route, just redirect to the main list view
      otherwise({ redirectTo: '/polls' });
  }])

  .controller('MainCtrl', ['$scope', 'socket', function ($scope, socket) {
    console.log('ola');
    socket.on('connection', function() {
        console.log('Connected!!');
    });

    socket.on('onlineUsers', function(data) {
        console.log(data);
    });

  }])

  // Controller for the poll list
  .controller('PollListCtrl',function ($scope, Poll) {
    $scope.polls = Poll.query();
  })

// Controller for an individual poll
  .controller('PollItemCtrl', function ($scope, $routeParams, $window, socket, Poll) { 
    $scope.poll = Poll.get({pollId: $routeParams.pollId});
  
    socket.on('myvote', function(data) {
      console.dir(data);
      if(data._id === $routeParams.pollId) {
        $scope.poll = data;
      }
    });
  
    socket.on('vote', function(data) {
      console.dir(data);
      if(data._id === $routeParams.pollId) {
        $scope.poll.choices = data.choices;
        $scope.poll.totalVotes = data.totalVotes;
      }   
    });
    
    $scope.vote = function() {
      var pollId = $scope.poll._id,
          choiceId = $scope.poll.userVote;
      
      if(choiceId) {
        var voteObj = { poll_id: pollId, choice: choiceId };
        socket.emit('send:vote', voteObj);
      } else {
        alert('You must select an option to vote for');
      }
    };

    $scope.bar= $window.location.href;
    $scope.v= 4;
    $scope.e= 'M';
    $scope.s= 274;
  })

  // Controller for creating a new poll
  .controller('PollNewCtrl', function ($scope, $location, Poll) {
    // Define an empty poll model object
    $scope.poll = {
      question: '',
      choices: [ { text: '' }, { text: '' }, { text: '' }]
    };
    
    // Method to add an additional choice option
    $scope.addChoice = function() {
      $scope.poll.choices.push({ text: '' });
    };
    
    // Validate and save the new poll to the database
    $scope.createPoll = function() {
      var poll = $scope.poll;
      
      // Check that a question was provided
      if(poll.question.length > 0) {
        var choiceCount = 0;
        
        // Loop through the choices, make sure at least two provided
        for(var i = 0, ln = poll.choices.length; i < ln; i++) {
          var choice = poll.choices[i];
          
          if(choice.text.length > 0) {
            choiceCount++
          }
        }
      
        if(choiceCount > 1) {
          // Create a new poll from the model
          var newPoll = new Poll(poll);
          
          // Call API to save poll to the database
          newPoll.$save(function(p, resp) {
            if(!p.error) {
              // If there is no error, redirect to the main view
              $location.path('polls');
            } else {
              alert('Could not create poll');
            }
          });
        } else {
          alert('You must enter at least two choices');
        }
      } else {
        alert('You must enter a question');
      }
    };
  })

  .factory('socket', function ($rootScope) {
    var socket = io.connect();
    return {
      on: function (eventName, callback) {
        socket.on(eventName, function () {  
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      }
    };
  })
  .factory('Poll', function($resource) {
    return $resource('polls/:pollId', {}, {
      // Use this method for getting a list of polls
      query: { method: 'GET', params: { pollId: 'polls' }, isArray: true }
    })
  })
  ;