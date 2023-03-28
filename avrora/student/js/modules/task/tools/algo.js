DS.ready(function(){
	DS.page.registerTaskTool('algo', function(){
		
		this.getTitle = function(){
			return('Алгоритм'); // tab title
		};
		
		DS.page.toolMCE.call(this, 'algo_text');
	});
});
