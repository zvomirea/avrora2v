DS.ready(function(){
	DS.page.registerTaskTool('conclusion', function(){
		
		this.getTitle = function(){
			return('Заключение'); // tab title
		};
		
		DS.page.toolMCE.call(this, 'conclusion_text');
	});
});
