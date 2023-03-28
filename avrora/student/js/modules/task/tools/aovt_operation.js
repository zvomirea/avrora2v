DS.ready(function(){
	DS.page.registerTaskTool('aovt_operation', function(){
		this.getTitle = function(){
			return('New tool'); // tab title
		};
		
		// Initialize all required stuff, use `element` as render root
		this.initialize = function(element){
		};
		
		// close task, finish all tasks and network queries, then run callback
		this.shutdown = function(callback){
			callback();
		};
		
		// called after page show
		this.show = function(){
		};
		
		// called before page hide
		this.hide = function(){
		};
		
		this.getScripts = function(){
			return([]);
		};
		
		this.getStyles = function(){
			return({
				both: [
					// 'css/modules/task.css'
				]
				,light: [
					// 'css/modules/task-light.css'
				]
				,dark: [
					// 'css/modules/task-dark.css'
				]
			});
		};
	});
});
