DS.ready(function(){
	DS.page.registerTaskTool('acmas_send', function(){
		this.getTitle = function(){
			return('Отправить'); // tab title
		};
		
		this.initialize = function(element){
			// Initialize all required stuff, use `element` as render root
			var div = document.createElement('div');
			div.style.cssText = 'padding: 20px;overflow-y: auto;position: absolute;top: 0;left: 0;right: 0;bottom: 0;';
			element.appendChild(div);
		
			DS.create({
				DStype: 'form-panel'
				,renderTo: div
				,items: [
					{DStype: 'button', label: 'Завершить', listeners: {
						click: function(){
							DS.confirm('Вы действительно хотите отправить<br/>это задание на проверку?<br/>Вы не сможете вернуться<br/>к его редактированию.', function(){
								DS.page.taskSave(function(){
									DS.progressWindow('Обработка...');
									
									DS.ARM.taskControlRun(DS.page.getTaskField('id'), function(d){
										DS.progressWindow();
										
										if(d.success){
											DS.page.endTask(function(){
												DS.msg('Отправлено', 'green');
											});
										}
										else{
											DS.msg('Произошла ошибка. Попробуйте снова', 'red');
										}
									});
								});
							}, null, true);
						}
					}}
				]
			});
			
			// DS.page.getTaskField('comment')
			
		};
		
		this.shutdown = function(callback){
			
			// close task, finish all tasks and network queries, then run callback
			callback();
		};
		
		this.show = function(){
			// called after page show
		};
		
		this.hide = function(){
			// called before page hide
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
