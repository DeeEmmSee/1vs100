var socket = null;

var vue_home_app = new Vue({
	el: '#home',
	data: {
		question: '',
		answers: [],
		playerName: '',
		nameSet: false,
		correctAnswers: 0,
		incorrectAnswers: 0,
	},
	methods: {
		sendAnswer: function(answerID) {
			socket.emit("answer", {player: this.playerName, answer: answerID});
		},
		start: function(){
			if (this.playerName != undefined && this.playerName != '') {
				this.nameSet = true;
				socket.emit("start", {player: this.playerName});
			}
			else {
				this.nameSet = false;
			}
		}
	},
	created: function() {
		//socket = io.connect('http://localhost:3000');
		socket = io();
	},
	mounted: function() {
		// Socket responses from server
		socket.on('question', function(data){
			console.log(data);
			vue_home_app.question = data.question;
			vue_home_app.answers = data.answers;
		});

		socket.on('answer', function(data){
			if (data.correct) {
				vue_home_app.correctAnswers++;
			}
			else {
				vue_home_app.incorrectAnswers++;
			}
		});
	}
});
