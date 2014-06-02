$(function() {

	var Player = Backbone.Model.extend({

		initialize: function() {

      		if (!this.get("name")) {
        		this.set({"name": "No name?"});
      		}
    	},

    	getPreviousOpponents: function() {
    		var i = 1;
    		var opponents = [];
    		while (this.get("opponent"+i)) {
    			opponents.push(this.get("opponent"+i))
    			i++;
    		}
    		return opponents;
    	},

    	countPointsWithBye: function(pointType, byeScore) {
    		var i = 1;
			var total = 0;
    		var bye = false;
    		var realGames = 0;
    		while(this.get(pointType+i)) {
    			if (this.get(pointType+i) === "-") {
    				bye = true;
    			} else {
    				total += parseInt(this.get(pointType+i));
    				realGames += 1;
    			}
    			i++;
    		}
    		if (bye) {
    			if (realGames == 0)
    				total = byeScore;
    			else
    				total += (total / realGames);
    		}
    		return total;
    	},

    	getTotalTp: function() {
    		return this.countPointsWithBye("tp", 3);
    	},

    	getTotalVp: function() {
    		return this.countPointsWithBye("vp", 5);
    	},

    	getVpDiff: function() {
    		return this.countPointsWithBye("vpdiff", 1);
    	},

	});

	var PlayerList = Backbone.Collection.extend({

		model: Player,
	
		localStorage: new Backbone.LocalStorage("tournafaux-players"),

	});

	var Players = new PlayerList;


	var Round = Backbone.Model.extend({
		
		initialize: function() {
      		if (!this.get("number")) {
        		this.set({"number": "666"});
      		}
    	},
	});

	var RoundList = Backbone.Collection.extend({

		model: Round,

		localStorage: new Backbone.LocalStorage("tournafaux-rounds"),

		newRound: function(number, maxNumber) {



			var round = _.find(this.models, function(round){ return round.get("number") == ""+number});
			
			if (!round) {
				round = this.create({number: ""+number, maxNumber: maxNumber});
			} else {
				_.each(Players.models, function(p) {p.unset("opponent"+number)});
			}

			

			// Create bye if needed
			if (Players.models.length % 2 == 1)
				Players.create({id:"0", name:"-"});


			var players = Players.models;

			players = _.shuffle(players);

			players = _.sortBy(players, function(p) {return p.getTotalVp()});
			players = _.sortBy(players, function(p) {return p.getVpDiff()});
			players = _.sortBy(players, function(p) {return p.getTotalTp()});

			var table = 1;
			while(players.length > 0) {
				var p1 = players.pop();
				var p2 = players.pop();
				
				var prevOpps = [];

				while(_.indexOf(p1.getPreviousOpponents(), p2.id) >= 0) {
					prevOpps.push(p2);
					p2 = players.pop();
				}
				while(prevOpps.length > 0)
					players.push(prevOpps.pop());

				p1.set("opponent" + number, p2.id);
				p1.save();
				p2.set("opponent" + number, p1.id);
				p2.save();
				round.set("table"+table+"player1", p1.id);
				round.set("table"+table+"player2", p2.id);
				round.save();
				table ++;
			}

		},
	});

	var User = Backbone.Model.extend({

	

	});

	var UserList = Backbone.Collection.extend({

		model: User,

		localStorage: new Backbone.LocalStorage("tournafaux-user"),
	});

	var Users = new UserList();

	var Rounds = new RoundList();

	var TournamentSettingsView = Backbone.View.extend({
		
		el: '.page',

		events: {
			"change #rounds": "updateName",

			"keypress #new-player": "createOnEnter",
			"click button.removePlayer": "removePlayer",
			"click #generate-round": "generateRound"
		},

		model: User,
		
		initialize: function() {
			this.listenTo(Players, 'add', this.render);
			this.listenTo(Players, 'remove', this.render);
			this.listenTo(Players, 'reset', this.render);
			// this.listenTo(router, 'route:settings', this.render);
		
			Players.fetch();
			Rounds.fetch();
			Users.fetch();
			

			

		},

		updateName: function() {
			console.log(this.$("#rounds").val());
			this.$("#userName").html("New user: " + this.$("#rounds").val());
			this.user.set('name', this.$("#rounds").val());
		},
		
		render: function(options) {
			var user;
			// if (Users.models.length > 0)
			// 	user = Users.models.get();
			// else
			// 	user = Users.create({name: ""});
			var template = _.template($('#tournament-settings-template').html(), {players: Players.models});
	      	this.$el.html(template);
	      	this.newPlayer = this.$("#new-player");
		},

		createOnEnter: function(e) {
			if (e.keyCode != 13) return;
			if (!this.newPlayer.val()) return;
			Players.create({name: this.newPlayer.val()});
			this.newPlayer.val('');
			this.newPlayer.focus();
		},

		removePlayer: function(e) {
			if (Rounds.models.length > 0) {
				if (confirm("This will destroy all generated rounds!")) {
					Players.get(e.currentTarget.id).destroy();
					_.each(Rounds.models, function(round) { round.destroy(); });
				}
			} else 
				Players.get(e.currentTarget.id).destroy();

			return false;
		},

		generateRound: function() {
			//TODO validation
			Rounds.newRound(1, this.$("#rounds").val());
			router.navigate("#/round/1");
			return false;
		}
	});

	var tournamentSettingsView = new TournamentSettingsView();

	var TournamentRoundView = Backbone.View.extend({

		el: '.page',

		initialize: function() {
		},

		events: {
			"click #generate-round": "generateRound"
		},

		render: function(number) {
			Players.fetch();
			Rounds.fetch();

			this.round = _.find(Rounds.models, function(round){ return round.get("number") == "" + number});
			
			if (this.round) {
				var tables = [];
				var i = 1;

				while (this.round.get('table'+i+'player1')) {
					var player1 = Players.get(this.round.get('table'+i+'player1'));
					var player2 = Players.get(this.round.get('table'+i+'player2'));
					tables.push({number: ""+i,
						player1name: player1.get('name'),
						player1vp: player1.get('vp'+number) ? player1.get('vp'+number) : "",
						player1id: player1.id,
						player2name: player2.get('name'),
						player2vp: player2.get('vp'+number) ? player2.get('vp'+number) : "",
						player2id: player2.id});
					++i;
				};

				var template = _.template($('#tournament-round-template').html(), {number: this.round.get('number'), tables: tables});
		      	this.$el.html(template);
			} else {
				var template = _.template($('#tournament-no-round-template').html(), {number: number});
		      	this.$el.html(template);
			}
		},

		registerListeners: function(number) {
			this.round = _.find(Rounds.models, function(round){ return round.get("number") == "" + number});

			if (this.round) {
				_.each(Players.models, function(player) {
					this.$("#" + player.id).change(function(event) {
						player.set("vp"+number, event.currentTarget.value);
						player.save();
					});
				});
				
			}
		},

		generateRound: function() {
			//TODO validation
			var number = parseInt(this.round.get('number')) + 1;
			Rounds.newRound(number, this.$("#rounds").val());
			router.navigate("#/round/"+ number);
			return false;
		},

	});

	var tournamentRoundView = new TournamentRoundView();

	var Router = Backbone.Router.extend({
	    routes: {
	      "": "settings",
	      "round/:number": "round",
	    }
	});

	var router = new Router;
	router.on('route:settings', function() {
	  tournamentSettingsView.render({});
	});
	router.on('route:round', function(number) {
		tournamentRoundView.render(number);
		tournamentRoundView.registerListeners(number);
	});

    Backbone.history.start();
  
});