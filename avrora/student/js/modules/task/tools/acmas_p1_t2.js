DS.ready(function(){
	DS.page.registerTaskTool('acmas_p1_t2', function(){
		
		this.getTitle = function(){
			return('Решение'); // tab title
		};
		
		DS.page.toolMCE.call(this, 'acmas_raw');
	});
});
