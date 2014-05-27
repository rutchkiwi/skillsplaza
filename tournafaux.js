	
	var TournamentSettingsView = Backbone.View.extend({
		el: '.page',
		render: function(options) {
			var template = _.template($('#tournament-settings-template').html(), {});
          	this.$el.html(template);
		}
	});
	
	var tournamentSettingsView = new TournamentSettingsView();

	var Router = Backbone.Router.extend({
        routes: {
          "": "home"
          
        }
    });

	var router = new Router;
    router.on('route:home', function() {
      tournamentSettingsView.render({});
    });
    
    Backbone.history.start();
  