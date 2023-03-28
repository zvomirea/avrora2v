DS.ready(function(){
	DS.page.registerModule('quit', function(){
		
		// Initialize all required stuff, use `element` as render root
		this.initialize = function(element, args){
			console.warn("Module init!");
			
			DS.util.websocket.disconnect();
			DS.getJSON(DS.util.urlParam('api')+'/api/quit');
			
			DS.screenBlock(1);
			
			DS.create({
				DStype: 'window'
				// ,reqWidth: 300
				,zIndex: 100000
				,items: [
					'<div style="font-size: 2em; padding: 20px;">Соединение закрыто</div>'
				]
			}).open();
		};
		
		// destroy module, finish all tasks and network queries, then run callback
		this.shutdown = function(callback){
			
			callback && callback();
		};
		
		this.getScripts = function(){
			return([
				// 'js/modules/task/tinyMce.js'
			]);
		};
		this.getStyles = function(){
			return({
				/* both: [
					'css/modules/test.css'
				] */
				/* ,light: [
					'css/modules/task-light.css'
				] */
				/* ,dark: [
					'css/modules/test-dark.css'
				] */
			});
		};
	});
});
