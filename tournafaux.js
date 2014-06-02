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


	

	var User = Backbone.Model.extend({

		localStorage: new Backbone.LocalStorage("tournafaux-user"),	

	});


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
		},

		updateName: function() {
			console.log(this.$("#rounds").val());
			this.$("#userName").html("New user: " + this.$("#rounds").val());
			this.user.set('name', this.$("#rounds").val());
			this.user.save();
		},
		
		render: function(options) {
			this.user = new User({id: "1", name: ""});
			this.user.fetch();
			var template = _.template($('#tournament-settings-template').html(), {players: Players.where({type: "primary"}), name: this.user.get('name')});
	      	this.$el.html(template);
	      	this.newPlayer = this.$("#new-player");
		},

		createOnEnter: function(e) {
			if (e.keyCode != 13) return;
			if (!this.newPlayer.val()) return;
			Players.create({name: this.newPlayer.val(), type:"primary"});
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

	var DesiredSkillsView = TournamentSettingsView.extend({

		el: '.secondary',

		render: function(options) {
			
			var template = _.template($('#desired-skills-template').html(), {players: Players.where({type: "desired"})});
	      	this.$el.html(template);
	      	this.newPlayer = this.$("#new-player");
		},

		createOnEnter: function(e) {
			if (e.keyCode != 13) return;
			if (!this.newPlayer.val()) return;
			Players.create({name: this.newPlayer.val(), type:"desired"});
			this.newPlayer.val('');
			this.newPlayer.focus();
		},

	});

	var desiredSkillsView = new DesiredSkillsView();

	var Router = Backbone.Router.extend({
	    routes: {
	      "": "settings",
	      "round/:number": "round",
	    }
	});

	var router = new Router;
	router.on('route:settings', function() {
	  tournamentSettingsView.render({});
	  desiredSkillsView.render();
	});
	router.on('route:round', function(number) {
		tournamentRoundView.render(number);
		tournamentRoundView.registerListeners(number);
	});

    Backbone.history.start();
  
});