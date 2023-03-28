DS.ready(function(){
	DS.page.registerTaskTool('intro', function(){
		
		this.getTitle = function(){
			return('Введение'); // tab title
		};
		
		DS.page.toolMCE.call(this, 'intro_text');
	});
});
