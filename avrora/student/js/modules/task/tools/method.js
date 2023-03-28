DS.ready(function(){
	DS.page.registerTaskTool('method', function(){
		
		this.getTitle = function(){
			return('Метод решения'); // tab title
		};
		
		DS.page.toolMCE.call(this, 'method_description');
	});
});
