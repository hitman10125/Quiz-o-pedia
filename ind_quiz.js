ThisQuiz = new Mongo.Collection("quizzes");
ThisResponse = new Mongo.Collection("responses");
var q=0;
Router.configure({
  layoutTemplate: 'navigation'
});
if (Meteor.isClient) {
      var updateTimeLeft;

      Template.signupForm.events({
        // user sign up
    'submit #signup-form': function(e,t){
     
     e.preventDefault();
        var username = $('#signup-username').val();
        var email = $('#signup-email').val();
        var password = $('#signup-password').val();
        var confirm = $('#signup-confirm').val();
        if(Meteor.users.findOne({username: username})) {
          alert('Username already exists');
        }
        else  {
          //alert('Email already exists');
          Meteor.call('getUserByEmail', email, function(error,result) {
              if(result) {
                alert('Email already exists');
              }
              else {
                if(password.length < 4 || password.length > 15) {
                  alert('Please enter a password of length 4-15 characters');
                }
              else if(password !== confirm) {
                  alert('Passwords do not match');
              }
              else {
              Accounts.createUser({
              username:$('#signup-username').val(),
              password:$('#signup-password').val(),
              email:$('#signup-email').val(),
              stats: {},
              profile:{
                confirm:$('#signup-confirm').val(),
                current_response_id:""
              },
              stats:[]
              });

              alert('Check your email to confirm your registration');
              }
               $('#signup-username').val('');
              $('#signup-password').val('');
              $('#signup-email').val('');
              $('#signup-confirm').val('');
              }
               $('#signup-username').val('');
              $('#signup-password').val('');
              $('#signup-email').val('');
              $('#signup-confirm').val('');
          });
        }
      }
  });


  var quizQuestions = [];

  // show saved answer on html
  changeAnswer = function(question){
     Meteor.call("getResponse", question, function(error, result){
      if (error){

      }
      else {
        if (result) {
          $('input[name=questionAnswer][value="' + result + '"]').prop('checked',true);          
        }
        else
          $('input[name=questionAnswer]').prop('checked',false);
      }
    });
  }

  /* **************************************************************************************************** */

Template.addquiz.onRendered(function() {
$(document).ready(function() {
$('#quizTimeDiv').hide();   
        $("input[name=conductQuiz]").click(function() {
            var val = $(this).val();
            if (val == 'yes'){
              $('#quizTimeDiv').show();
              $('#quizTime').prop('required',true);
            }
            else{
              $('#quizTimeDiv').hide();
              $('#quizTime').removeAttr('required');
            }
        });
      });
});


  Template.addquiz.events({
    // save quiz
    "submit .quizEntry": function (event) {
      event.preventDefault();
      var que_array = new Array();
      var creater =  event.target.creater.value;
      var category =  event.target.category.value;
      var conductQuiz = event.target.conductQuiz.value;
      var quizTime = event.target.quizTime.value + ':00+05:30';

      for (var i = 1; i <= 10; i++) {
        eval("var que" + "= event.target.question" + i + ".value");
        eval("var ans" + "= event.target.question" + i + "_answer.value");
        for (var op = 1; op <= 4; op++) {
          eval("var opt" + op + "= event.target.question" + i + "_option" + op + ".value");
        }
        que_array.push({number: i, question: que, option1: opt1, option2: opt2, option3: opt3, option4: opt4, answer: ans});
      }

      Meteor.call("addQuizFunction", creater, category, que_array, conductQuiz, quizTime);
      event.target.reset();
    }
  });


  Template.questionSelect.onCreated( function() {
    this.time_left = new ReactiveVar(1200);
    Session.clear('updateTimeLeft');
  });

  Template.scoreCard.onCreated(function() {
    this.time_left = new ReactiveVar(ThisResponse.findOne(Meteor.user().profile.current_response_id).time_left);
  });
  Template.waiting_time.onCreated( function() {
    this.time_left = new ReactiveVar(300);
    Session.clear('updateWaitingTimeLeft');
  });

  Template.scoreCard.onRendered(function() {
    if(Session.get('selectedType') === 'Individual') {
      $('#home').click(function() {
        Meteor.users.update( Meteor.userId(), {$set: {"profile.current_response_id" : ''}});
        Session.clear('final_answer');
        Meteor.clearInterval(Session.get('updateWaitingTimeLeft'));
        Meteor.clearInterval(Session.get('updateTimeLeft'));
        Session.clear('subscribed');
      });
    }
  });

  Template.ranking.onRendered(function() {
    $('#home').click(function() {
        Meteor.users.update( Meteor.userId(), {$set: {"profile.current_response_id" : ''}});
        Meteor.clearInterval(Session.get('updateWaitingTimeLeft'));
        Meteor.clearInterval(Session.get('updateTimeLeft'));
        Session.clear('final_answer');
        Session.clear('subscribed');
      });
  });
  Template.questionSelect.onRendered( function() {
    Meteor.clearInterval(Session.get('updateTimeLeft'));
    var self = this;

    Meteor.call("getQuiz", function(error, result){
      if (error){

      }
      else {
        quizQuestions = result;
        Session.set('selectedQuestion', '1');
        changeAnswer('1');
      }
    });



    Meteor.call("getTimer", function(error, result){
      if (error){

      }
      else {
        self.time_left.set(result);
      }
    });

    updateTimeLeft = Meteor.setInterval( function() {
      self.time_left.set(self.time_left.get() - 1);
      Meteor.call('setTimer', self.time_left.get());
    } , 1000 );
    Session.setPersistent('updateTimeLeft', updateTimeLeft);
  
  });

  Template.questionSelect.onDestroyed(function() {
 
    
    Meteor.clearInterval('updateTimeLeft');
  });

  Template.waiting_time.onDestroyed(function() {
  
    Meteor.clearInterval('updateWaitingTimeLeft');
    Session.clear('subscribed');
  });

  Template.waiting_time.onRendered( function() {
    Meteor.clearInterval(Session.get('updateWaitingTimeLeft'));
    var self = this;

    Meteor.call("getWaitingTimer", function(error, result){
      if (error){

      }
      else {
        self.time_left.set(result);
      }
    });

    updateWaitingTimeLeft = Meteor.setInterval( function() {
      self.time_left.set(self.time_left.get() - 1);
      Meteor.call('setWaitingTimer', self.time_left.get());
    } , 1000 );
    Session.set('updateWaitingTimeLeft', updateWaitingTimeLeft);
    

  });
  

  Template.questionSelect.events({
    // user selects different question
    'click input[name=questionNumber]': function( event,template ) {
      Session.set('selectedQuestion', event.target.value);
      $('input[name=questionNumber]').attr("style", "background-color:blue");
      $(event.target).attr("style", "background-color:red");
      changeAnswer(event.target.value);
    }
  });

  Template.online.helpers({

    'totalHeadrushQuizzes': function(){
      var groupQuizzes = ThisResponse.find({type: 'Group'}).fetch();
      var time = new Date();
      for(i = 0; i < groupQuizzes.length; i++) {
        
        if(!groupQuizzes[i].conductedByHeadRush || groupQuizzes[i].waiting_time <= 0 || (groupQuizzes[i].conductedAt - new Date()) < 0) {
          groupQuizzes.splice(i, 1);
          i=-1;   
        }
    }
    return groupQuizzes.length > 0;
    },

    'showHeadRushQuizzes': function() {
      var groupQuizzes = ThisResponse.find({type: 'Group'}).fetch();
      var time = new Date();
      for(i = 0; i < groupQuizzes.length; i++) {
       
        if(!groupQuizzes[i].conductedByHeadRush || groupQuizzes[i].waiting_time <= 0 || (groupQuizzes[i].conductedAt - new Date()) < 0) {
          groupQuizzes.splice(i, 1);
          i=-1;   
        }else {
        groupQuizzes[i].date = groupQuizzes[i].conductedAt.toDateString();
        groupQuizzes[i].time = groupQuizzes[i].conductedAt.toLocaleTimeString();
        groupQuizzes[i].subscribe = Math.abs(groupQuizzes[i].conductedAt - new Date())/(1000*60) < 10;
      }
    }
    return groupQuizzes;
  },

    'getUserName': function(userID) {
      return Meteor.users.findOne(userID).username;
    },

    'showGroupQuizzes': function() {
      var groupQuizzes = ThisResponse.find({type: 'Group'}).fetch();
      var time = new Date();
      for(i = 0; i < groupQuizzes.length; i++) {
       
        if(groupQuizzes[i].waiting_time <= 0 || groupQuizzes[i].conductedByHeadRush) {
          groupQuizzes.splice(i, 1);
          i=-1;
         
        }
        else {
          groupQuizzes[i].username = Meteor.users.findOne(groupQuizzes[i].userID[0]).username;
        }
        
    }
    return groupQuizzes;
  },
    'totalGroupQuizzes': function() {
      var groupQuizzes = ThisResponse.find({type: 'Group'}).fetch();
      var time = new Date();
      for(i = 0; i < groupQuizzes.length; i++) {
        
        if(groupQuizzes[i].waiting_time <= 0 || groupQuizzes[i].conductedByHeadRush) {
          groupQuizzes.splice(i, 1);
          i=-1;
         
        }
    }
    return groupQuizzes.length > 0;
    }
});

  Template.online.events({
    // group quiz subscribe
    'click input': function() {
      event.preventDefault();
     
      var responseID = $(event.target).attr('id');
      var subscribed = $(event.target).attr('value');
      Session.setPersistent('subscribed', subscribed);
     
      Meteor.call('setGroupResponseId', responseID);
    }
  });

  Template.questionSelect.helpers({
    time_left: function() {
      var time = Template.instance().time_left.get();
      Session.set('timeLeft', time);
      var minutes = ((Math.floor(time/60) < 10) ? '0' : '') + Math.floor(time/60);
      var seconds = ((time%60 < 10) ? '0' : '') + (time%60);
      if(time <= 0) {
     Meteor.clearInterval(Session.get('updateWaitingTimeLeft'));
     Meteor.clearInterval(Session.get('updateTimeLeft'));
     Session.clear('final_answer');
     Session.clear('subscribed');
     $('.scoreCard').trigger('click');
      }
      Session.update('quiz_time_left',minutes+":"+seconds);
      Session.makePersistent('quiz_time_left');
      return minutes+":"+seconds;
    },
     'ended': function() {
       return Session.get('timeLeft') <= 0;
     }
  }); 

  Template.waiting_time.helpers({
    time_left: function() {
      var time = Template.instance().time_left.get();
      Session.set('timeLeft', time);
      var minutes = ((Math.floor(time/60) < 10) ? '0' : '') + Math.floor(time/60);
      var seconds = ((time%60 < 10) ? '0' : '') + (time%60);
      if(time <= 0) {
     Meteor.clearInterval(Session.get('updateWaitingTimeLeft'));
     Meteor.clearInterval(Session.get('updateTimeLeft'));
     Session.clear('final_answer');
     Session.clear('subscribed');
      }
      return minutes+":"+seconds;
    }
  }); 

  Template.navigation.helpers({
    'user': function() {
        return Meteor.users.find({_id: Meteor.userId()});
    },

    'isAdmin': function() {
      return Meteor.users.findOne(Meteor.userId()).username === 'admin';
    }
  });

  Template.navigation.events({
    // user logout
    'click #logoutbtn': function() {
     Meteor.call('endquiz',Meteor.userId());
     Meteor.clearInterval(Session.get('updateWaitingTimeLeft'));
     Meteor.clearInterval(Session.get('updateTimeLeft'));
     Session.clear('final_answer');
     Session.clear('subscribed');
      Meteor.logout();
    },

    'click #loginbtn' : function(e, t){
     

      e.preventDefault();
      var unam=$('#login-username').val();
      var password=$('#login-password').val();
     

      if(unam === ''){
        alert('Username is empty. Enter valid username');
      }

      else if(password === ''){
        alert('Password is empty. Enter password for the User');
      }

      else{
      Meteor.loginWithPassword(unam, password, function(error, result) {
        if(error) {
          if(error.reason === 'Incorrect password')alert('Incorrect Password');
          else if(error.reason === 'User not found')alert('User not Found');
        }
        else {
          Router.go('/quiz');
        }
      });
    }

    },
     
     'keypress input': function(e, t) {
      if(e.which === 13) {
      $('#loginbtn').trigger('click');  
      }
    },

     'click #profileButton': function(){
      Meteor.call("getProfileData", function(error, result){
      if (error){
        
        
      }
      else {
        Session.set('profileData', result);
        Router.go('profile');
       
       $('#links li').removeClass('active');
       $(this).parent().addClass('active');
      }
    });
},

    'click #ruleButton': function() {
       $('#links li').removeClass('active');
       $(this).parent().addClass('active');
      Router.go('rules');

    },

    'click #home': function(){
      $('#links li').removeClass('active');
       $(this).parent().addClass('active');
      Router.go('quiz');
    },

    'click #addquiz': function(){
      $('#links li').removeClass('active');
       $(this).parent().addClass('active');
      Router.go('addquiz');

    }

      });

   Template.profile1.helpers({
    'getProfileData': function(){
      return Session.get('profileData');
    },

    'getStatsIndividual': function(){
      var statistics = Session.get('profileData').stats;
      var count=0;
      var arr1 = [];
      var arr2 = [];
      var arr3 = [];
      var array = [];

      for(var i=0;i<statistics.length;i++){
        if(statistics[i].type === 'Individual'){
          arr1[count] = statistics[i].category;
          arr2[count] = statistics[i].score;
          arr3[count] = statistics[i].takenOn;
          var obj = {arr1: arr1[count], arr2: arr2[count], arr3: arr3[count]};
          array.push(obj);
          count++;
        }
      }
      Session.setPersistent('arrayIndLen',array.length);
      return array;
    },

    'getStatsGroup': function(){
      var statistics = Session.get('profileData').stats;
      var count=0;
      var arr1 = [];
      var arr2 = [];
      var arr3 = [];
      var array = [];

      for(var i=0;i<statistics.length;i++){
        if(statistics[i].type === 'Group'){
          arr1[count] = statistics[i].category;
          arr2[count] = statistics[i].score;
          arr3[count] = statistics[i].takenOn;
          var obj = {arr1: arr1[count], arr2: arr2[count], arr3: arr3[count]};
          array.push(obj);
          count++;
        }
      }
      Session.setPersistent('arrayGrpLen',array.length);
      return array;
    },

    'getLengths' : function(){
        var obj = {a1: Session.get('arrayIndLen')>0, a2: Session.get('arrayGrpLen')>0};
        return obj;
    }
  });

  /* **************************************************************************************************** */
  
  Template.questionShow.events({
    'click input': function( event,template ) {
      Meteor.call('setResponse', parseInt(Session.get('selectedQuestion')) , event.target.value );
    },
   
     'click #onsubmitbutton' :function(){

      var final_answer = $('#onsubmitbutton').attr('value');
      Session.setPersistent('final_answer',final_answer);
      Meteor.call("getQuestionSet", function(error, result){
      if (error){
       
        
      }
      else {
      
        Session.setPersistent('selectedScore', result);
      }
    });

      Meteor.call("getResponseSet", function(error, result){
      if (error){
        
        
      }
      else {
        Session.setPersistent('selectedScore1', result);
      }
    });

      Meteor.call("getActualScore", function(error, result){
      if (error){
        
        
      }
      else {
      
        Session.setPersistent('selectedScore2', result);
        
      }
    });
      Router.go('scoreCard');
  }
  }); 

  Template.questionShow.helpers({
    questionData: function() {

      return quizQuestions[parseInt(Session.get('selectedQuestion')) - 1];
    },

   'showSubmitButton': function() {
    return Session.get('selectedType') === 'Individual' || ThisResponse.findOne(Meteor.users.findOne(Meteor.user()).profile.current_response_id).time_left <= 0;  
   }
  });   

  /* **************************************************************************************************** */

  Template.quizSelect.events({  
    // on new quiz  
    "submit .quizParameters": function (event) {
      event.preventDefault();
      var selectedType =  event.target.quizType.value;
      var selectedCategory =  event.target.quizCategory.value;
      if (selectedType === 'Individual' || selectedType === 'Group'){

        Session.setPersistent('selectedType', selectedType);
      Meteor.call("createResponse", selectedType, selectedCategory);
      }
        
      else{
      alert("Select quiz type.");
    }
    }

  });

  Template.quizSelect.onRendered(function() {
    Session.setPersistent('selectedType', 'Individual');
  });

 Template.scoreCard.events({  
   
   
    // show ranking
    'click #onsubmitbutton' :function(event){
      if(ThisResponse.findOne(Meteor.user().profile.current_response_id).time_left > 0) {
        event.preventDefault();
        alert('Please wait for the quiz to complete to see the leaderboard');
      }
      else {
        Meteor.call("getRanking", function(error, result){
          if (error){
             
        
          }
          else {
        
            Session.set('rank', result);
            Router.go('ranking');
          }
        });
      }
      },

      'click #home1': function(){
        $("#home").trigger('click');
      }

  });


Template.ranking.events({
  'click #home2': function(){
        $("#home").trigger('click');
      }  
});

 Template.ranking.helpers({
  'userRanking' : function(){
   return Session.get('rank');
  }  
});

  Template.scoreCard.helpers({

    compareString: function(a ,b){
      return a==b;
    },
 
  questionData: function(){
   
     var arr1=[];
    var arr2=[];
    var arr3=[];
    var arr4=[];
    var arr5=[];
     var arr6=[];
     var arr7 = [];
     var arr8=[];
     var arrayFinal = [];
    for(var i=0;i<10;i++)
    {
      arr1[i]=Session.get('selectedScore')[i].question;
 
      arr2[i]=Session.get('selectedScore')[i].option1;
      arr3[i]=Session.get('selectedScore')[i].option2;
      arr4[i]=Session.get('selectedScore')[i].option3;
      arr5[i]=Session.get('selectedScore')[i].option4;
      var ans = parseInt(Session.get('selectedScore')[i].answer);
      if(ans==1){
        arr6[i] = arr2[i];
      }

      else if(ans==2){
        arr6[i] = arr3[i];
      }

      else if(ans==3){
        arr6[i] = arr4[i];
      }

      else{
        arr6[i] = arr5[i];
      }
  
       arr7[i]=Session.get('selectedScore1')[i+1];

       arr8[i]=Session.get('selectedScore2')[i];

       var obj  = {arr1: arr1[i] , arr2: arr2[i], arr3: arr3[i], arr4: arr4[i], arr5: arr5[i], arr6: arr6[i], arr7: arr7[i], arr8: arr8[i]};
       arrayFinal.push(obj);


     }

     
     return arrayFinal;
   
  },

  'getTotalScore': function() {
    return Session.get('selectedScore2')[10];
  },

  'Group': function() {
    return ThisResponse.findOne(Meteor.user().profile.current_response_id).type === 'Group';
  },
  'quizTimeLeft' : function(){
    //return Session.get('quiz_time_left');
    Tracker.autorun(function() {
      return Session.get('quiz_time_left');
    });
  },

  getIndex: function(index) {
    return index + 1;
  }

  }); 
Accounts.ui.config({
    passwordSignupFields:"USERNAME_AND_OPTIONAL_EMAIL"
  });
  /* **************************************************************************************************** */
}


// routes
Router.route('/', {
  name: 'home',
  template: 'appBody'
});
Router.route('/profile', {
  name: 'profile1',
  template: 'profile1',
  onBeforeAction: function() {
    if(!Meteor.userId()) {
      alert('Please Log In First');
      Router.go('home');
    }
    else {
      this.next();
    }
  }
});

Router.route('/rules', {
  name: 'rules',
  template: 'rules'
});

Router.route('/addquiz', {
  name: 'addquiz',
  template: 'addquiz',
  onBeforeAction: function() {
    if(!Meteor.userId()) {
      alert('Please Log In First');
      Router.go('home');
    }
    else if(Meteor.user().username === 'admin'){
      this.next();
    }
    else {
      alert('You are not admin, login with admin account');
      Router.go('home');
    }
  }
});

Router.route('/quiz',{
  name: 'quiz',
  template: 'ApplicationLayout',
  onBeforeAction: function() {
  if (! Meteor.user()) {
    //alert('Please Log in First');
    this.next(); 
    this.render('appBody', {to:"template1"});
    this.render('emptyTemplate', {to:"template2"}); 
  }
  else if (Meteor.user().profile.current_response_id == '') {
    this.next();
    this.render('emptyTemplate', {to:"template1"});
    this.render('quizSelect', {to:"template2"});
  }
  else if((Session.get('subscribed') === 'Subscribe' || (Session.get('selectedType') === 'Group')) && ThisResponse.findOne(Meteor.users.findOne(Meteor.user()).profile.current_response_id).waiting_time > 0)  {
       this.next();
       this.render('emptyTemplate', {to:"template1"});
       this.render('waiting_time', {to:"template2"});
        
  }

  else if(ThisResponse.findOne(Meteor.users.findOne(Meteor.user()).profile.current_response_id).time_left <= 0 || Session.get('final_answer')==='submit'){
    this.next();
    if(Session.get('final_answer')==='submit') {
      this.render('scoreCard',{to:"template1"});
      this.render('emptyTemplate', {to:"template2"});
   }
   
     clearInterval('updateTimeLeft');    
     clearInterval('updateWaitingTimeLeft');
  }
  else{
      this.next();
    this.render('questionSelect', {to:"template1"});
     this.render('questionShow', {to:"template2"});

  }
 }
});

Router.route('/ranking',{
  template: 'ranking',
  name : 'ranking'

});




  /* **************************************************************************************************** */

if(Meteor.isServer){

  Meteor.startup(function () {
   process.env.MAIL_URL="smtp://jaygohil15@gmail.com:jgohilay10125@smtp.gmail.com:465/"
   Accounts.config({sendVerificationEmail: true, forbidClientAccountCreation: false});
    
  });
  Accounts.validateLoginAttempt(function(options) {
  
  if (!options.allowed) {
        return false;
  }
  if (options.user.emails[0].verified === true) {
        return true;
  } 
  else {
        alert('email-not-verified. You must verify your email address before you can log in');
  }
});

var previousValue = 0;
Meteor.methods({

  getUserByEmail: function(email) {
    return Accounts.findUserByEmail(email) !== undefined;
  },

  getResponseSet: function (){
    

  var responseID = Meteor.user().profile.current_response_id;
 
  var response = ThisResponse.findOne(responseID);
 
  var userId = Meteor.userId();
 
  
  var answer = eval('response.answers.' + userId);

  return answer;


  },

  getQuestionSet: function(){
  
   var responseID = Meteor.user().profile.current_response_id;

  var response = ThisResponse.findOne(responseID);
  var userId = Meteor.userId();
  
 
   var currentQuiz=response.quizID;

  var correctOption=(ThisQuiz.findOne(currentQuiz));
  var quizQuestions = correctOption.quiz;
  return quizQuestions;
  
},

  getActualScore: function(){
  var responseID = Meteor.user().profile.current_response_id;
  var eachScore = [];
  
  var response = ThisResponse.findOne(responseID);
  var userId = Meteor.userId();
  
  var answer = eval('response.answers.' + userId);

   var currentQuiz = response.quizID;

  var correctOption= ThisQuiz.findOne(currentQuiz);
  var quizQuestions = correctOption.quiz;
 
  var cor_array=[];
  var score=0;

  for(var i=0;i<10;i++){
    var correct=correctOption.quiz[i];
    var cor=correct.answer;
    var p='option'+cor;
  
    var cor='option'+cor;
    cor_array[i]=eval('correct.'+p);

  
  }
 
  for(var i=0;i<10;i++)
  {
    if(answer[i+1]===cor_array[i])
    {
      eachScore[i] = 10;
      score+=10;
    
    }

    else{
      eachScore[i] = 0;
    }
  }

  ThisResponse.update({_id: response._id}, {$set: {['score.' + userId]: score} });
  eachScore[10] = score;

  Meteor.call('saveStats');
 

  return eachScore;
},

 saveStats: function(){
    var responseID = Meteor.user().profile.current_response_id;
    var response_doc = ThisResponse.findOne(responseID);
    
    var category = ThisQuiz.findOne(response_doc.quizID).category;
   

      var new_stat = {quizID: response_doc.quizID, category: category, score: eval('response_doc.score.' + Meteor.userId()), takenOn: response_doc.conductedAt, type: response_doc.type, responseID: responseID};
    
      if (Meteor.user().stats)
      Meteor.users.update(Meteor.user(), { $push: { stats: new_stat }});
      else
        Meteor.users.update(Meteor.user(), {$set: {stats: [new_stat]} });
      
  },




  getQuiz: function (){
      if(Meteor.user()) {
      if(Meteor.user().profile.current_response_id !== "") {
    var responseID = Meteor.user().profile.current_response_id;
    var quizID = ThisResponse.findOne(responseID).quizID;
    var randomQuiz = ThisQuiz.findOne(quizID);
    var quizQuestions = randomQuiz.quiz;
    for (var i=0 ; i<quizQuestions.length ; i++){
      delete quizQuestions[i]["answer"];
    }
       return quizQuestions;
  }
}
 
  },

  getRandomQuizID: function(category){
    var randomQuiz = ThisQuiz.find({category:category}).fetch();
    var index = Math.floor(Math.random() * randomQuiz.length);
    if(index === previousValue) {
      index = (index + 1) % randomQuiz.length;
      previousValue = index;
    }
   
    randomQuiz = randomQuiz[index];
    return randomQuiz._id;
  },

  createResponse: function(type, category){
  
    if (! Meteor.userId()) { throw new Meteor.Error('not-authorized'); }

    var quizID = Meteor.call('getRandomQuizID', category);

    var responseID = ThisResponse.insert({
      userID: [Meteor.userId()],
      category:category,
      quizID: quizID,
      type: type,
      answers: {[Meteor.userId()]: {}},
      time_left: 60,
      waiting_time: 60,
      score: {},
      conductedAt: new Date()
    });

    Meteor.users.update(Meteor.user(), {$set: {"profile.current_response_id": responseID }});
  },

  setResponse: function (question, answer){
    var responseID = Meteor.user().profile.current_response_id;
    var user = Meteor.userId();
    ThisResponse.update(responseID, {$set: {['answers.' + user + '.' + question]: answer}});
  },

  getResponse: function(question){
      if(Meteor.user()) {
      if(Meteor.user().profile.current_response_id !== "") {
    var responseID = Meteor.user().profile.current_response_id;
    var user = Meteor.userId();
    var response = ThisResponse.findOne(responseID).answers;
    var answer = eval('response.' + user + '[' + question + ']');
    return answer;
  }
}
  },

  setTimer: function(new_time){
    if(Meteor.user()) {
      if(Meteor.user().profile.current_response_id !== "") {
        var responseID = Meteor.user().profile.current_response_id;
        var response = ThisResponse.findOne(responseID);
        if (response.time_left > new_time)
          ThisResponse.update(response._id, {$set: {time_left: new_time}});
      }
    }
  },

  getTimer: function(){
      if(Meteor.user()) {
      if(Meteor.user().profile.current_response_id !== "") {
    var responseID = Meteor.user().profile.current_response_id;
    return ThisResponse.findOne(responseID).time_left;

  }
}
  },
  endquiz:function(id){
   Meteor.users.update({ _id:id},{$set:{"profile.current_response_id":""}});
  },

  setWaitingTimer: function(new_time){
    var responseID = Meteor.user().profile.current_response_id;
    var response = ThisResponse.findOne(responseID);
    if (response.waiting_time > new_time)
      ThisResponse.update(response._id, {$set: {waiting_time: new_time}});
  },

  getWaitingTimer: function(){
    var responseID = Meteor.user().profile.current_response_id;
    return ThisResponse.findOne(responseID).waiting_time;
  },

  'setGroupResponseId': function(responseID) {
    Meteor.users.update(Meteor.user(), {$set: {"profile.current_response_id": responseID }});      
  },

  getRanking: function(){
    
    var responseID = Meteor.user().profile.current_response_id;
    var response = ThisResponse.findOne(responseID);
    var scores = ThisResponse.findOne(response._id).score;
    var temp = {};


    for (var key in scores) {
      temp[Meteor.users.findOne(key).username] = scores[key];
    }

    scores = temp;

    var sortable = [];
    for (var entry in scores)
      sortable.push([entry, scores[entry]]);
    sortable.sort(function(a, b) {return b[1] - a[1]})
   

    var ranks = [];
    var arr1 = [];
    var arr2 = [];
    var arr3 = [];
    arr1[0] = 1;
    var count = 1;
    for(var i=0;i<sortable.length;i++){
      arr2[i] = sortable[i][0];
      arr3[i] = sortable[i][1];
      if(i>0){
        if(arr3[i]===arr3[i-1]){
          arr1[i] = count;
        }

        else{
          count = i+1;
          arr1[i] = count;  
        }
      }

      var obj = {arr1: arr1[i], arr2: arr2[i], arr3: arr3[i]};
      ranks.push(obj);
    }

    return ranks;
    
  },
   getProfileData: function(){
    var userId = Meteor.userId();
    var user = Meteor.users.findOne(userId);
    var username = user.username;
    var email = user.emails[0].address;
    var created = user.createdAt;
    var stats = user.stats;
    var obj = {username: username, email: email, created: created, stats: stats};
    return obj;
  },

  addQuizFunction: function (creater, category, que_array, conductQuiz, quizTime) {

    
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    var quizID = ThisQuiz.insert({
      quizCreater: creater,
      category: category,
      createdAt: new Date(),
      quiz: que_array
    });

    if (conductQuiz == 'yes')
      Meteor.call('createHeadrushResponse', quizID, quizTime, category);
  },

  createHeadrushResponse: function(quizID, quizTime, category){
    ThisResponse.insert({
      userID: [],
      quizID: quizID,
      type: 'Group',
      category: category,
      answers: {},
      time_left: 1200,
      waiting_time: 600,
      score: {},
      conductedByHeadRush: true,
      conductedAt: new Date(quizTime)
    });
  }

});
}