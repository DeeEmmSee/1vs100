const express = require('express');
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./1vs100.db', sqlite3.OPEN_READONLY, (err) => {
	if (err) {
	  console.error(err);
	}
	else {
		console.log('Connected to the database.');
	}
});

// Question: id, questionText, answerID
// Answer: answer

//App setup
var app = express();
var server = app.listen(4000, function() { 
	console.log('Listening on port 4000'); 
});

//Static files
app.use(express.static('public'));

// Socket setup
const io = require('socket.io').listen(server);

io.on('connection', function(socket){
	// On connect	
	//socket.emit('question', {question: '', answers: []});
	
	// Events
	socket.on('answer', function(data) {
		console.log(data.player + ': ' + data.answer);
		if (currentQuestion.answerID == data.answer) {
			console.log("RIGHT");
		}
		else {
			console.log("WRONG");
		}

		
		// Check answer

	});
	
	socket.on('start', function(data) {
		console.log(data.player + " has started");
		sockets[data.player] = socket;

		LoadQuestions().then(() => {

			var q = {'question': questions[0].questionText, 'answers': answers[questions[0].id]};
			currentQuestion = questions[0];

			console.log(q);
			socket.emit("question", q);
		})
		.catch ((err) => {
			console.log(err);
		});
    });
});

var sockets = {};
var questions = [];
var answers = {};
var currentQuestion = {};
const states = {
	'WAITING_FOR_PLAYERS': 0,
	'COUNTDOWN_TO_START': 1,
	'QUESTION': 2,
	'ANSWER': 3,
	'PROCESS_RESULTS': 4,
	'END_GAME': 5,
};
var currentState = states.WAITING_FOR_PLAYERS;

function SendToAll(command, data) {
	for (user in sockets) {
		socket.emit(command, data);
	}
}

function LoadQuestions(){
	return new Promise((success, fail) => {
		let sql = `SELECT ID, Question
					FROM Questions
					ORDER BY RANDOM()
					LIMIT 100`;
		db.serialize(() => {
			db.each(sql, (err, qRow) => {
				if (err) {
					console.error(err.message);
					fail(err.message);
				}
				else {
					questions.push({id: qRow.ID, questionText: qRow.Question, answerID: 0});
					answers[qRow.ID] = [];
				}
	
			}, (err, count) => {
				if (err) {
					fail(err);
				}
				else {
					console.log("Got questions");
					
					var qIDs = '';
					for (var i = 0; i < questions.length; i++) {
						qIDs += questions[i].id + ",";
					}
					
					qIDs = qIDs.substring(0, qIDs.length - 1);
					
					GetAnswers(qIDs)
					.then (() => {
						success();
					})
					.catch ((err) => {
						fail(err);
					});
				}
			});
		});
	});
}

function GetAnswers(qIDs){
	return new Promise((success, fail) => {
		let sqlAnswer = `SELECT ID, QuestionID, Answer, IsCorrect 
						FROM Answers
						WHERE QuestionID IN (` + qIDs + `)`;
		db.serialize(() => {
			db.each(sqlAnswer, (err, aRow) => {
				if (err) {
					console.error(err.message);
					fail(err);
				}
				else {
					// Go on string, that way if people tamper with the answer it'll be wrong
					answers[aRow.QuestionID].push({id: aRow.ID, answerText: aRow.Answer});

					if (aRow.IsCorrect == "1") {
						for (var i = 0; i < questions.length; i++) {
							if (questions[i].id == aRow.QuestionID) {
								questions[i].answerID = aRow.ID;
								break;
							}
						}
					}
					
					//row.ID
					//row.Answer
					//row.IsCorrect
				}
			}, (err, count) => {
				if (err) {
					fail(err);
				}
				else {
					success();
				}
			});
		});
	});
}

