$(function() {

	var Player = Backbone.Model.extend({

		initialize: function() {

      		if (!this.get("name")) {
        		this.set({"name": "No name?"});
      		}
    	}

	});

	var PlayerList = Backbone.Collection.extend({

		model: Player,
	
		localStorage: new Backbone.LocalStorage("tournafaux-players"),

	});

	var Players = new PlayerList;


	

	var User = Backbone.Model.extend({

		localStorage: new Backbone.LocalStorage("tournafaux-user"),	

	});

	var Wanted = Backbone.Model.extend({});

	var WantedList = Backbone.Collection.extend({

		model: Wanted,
		localStorage: new Backbone.LocalStorage("tournafaux-wanted"),	
	});

	var Wanteds = new WantedList();

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

		},

		updateName: function() {
			console.log(this.$("#rounds").val());
			this.$("#userName").html(this.$("#rounds").val());
			this.user.set('name', this.$("#rounds").val());
			this.user.save();
		},
		
		render: function(options) {
			this.user = new User({id: "1", name: ""});
			this.user.fetch();
			var template = _.template($('#tournament-settings-template').html(), {players: Players.where({type: "primary"}), name: this.user.get('name')});
	      	this.$el.html(template);
	      	this.newPlayer = this.$("#new-player");
	      	var that = this;
	      	_.each(Players.where({type: "primary"}), function(skill) {
	      		that.$("#" + skill.id + "-wanted").change(function(e){
	      			Wanteds.create({name: that.$("#" + skill.id + "-wanted").val(), skill: skill.get('name')});
	      			that.$("#" + skill.id + "-wanted").val("");
	      		});
	      	});

		},

		createOnEnter: function(e) {
			if (e.keyCode != 13) return;
			if (!this.newPlayer.val()) return;
			Players.create({name: this.newPlayer.val(), type:"primary"});
			this.newPlayer.val('');
			this.newPlayer.focus();
		},

		removePlayer: function(e) {
			
				Players.get(e.currentTarget.id).destroy();

			return false;
		},

		
	});

	var tournamentSettingsView = new TournamentSettingsView();

	var DesiredSkillsView = TournamentSettingsView.extend({

		el: '.desired',

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

	var SecondarySkillsView = TournamentSettingsView.extend({

		el: '.secondary',

		render: function(options) {
			
			var template = _.template($('#secondary-skills-template').html(), {players: Players.where({type: "secondary"})});
	      	this.$el.html(template);
	      	this.newPlayer = this.$("#new-player");
		},

		createOnEnter: function(e) {
			if (e.keyCode != 13) return;
			if (!this.newPlayer.val()) return;
			Players.create({name: this.newPlayer.val(), type:"secondary"});
			this.newPlayer.val('');
			this.newPlayer.focus();
		},

	});

	var secondarySkillsView = new SecondarySkillsView();

	var Router = Backbone.Router.extend({
	    routes: {
	      "": "settings",
	      "round/:number": "round",
	    }
	});

	var router = new Router;
	router.on('route:settings', function() {
	  tournamentSettingsView.render({userId: "1"});
	  desiredSkillsView.render({userId: "1"});
	  secondarySkillsView.render({userId: "1"});
	});
	router.on('route:round', function(number) {
		tournamentRoundView.render(number);
		tournamentRoundView.registerListeners(number);
	});

    Backbone.history.start();
  
});