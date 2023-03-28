DS.ready(function(){
	DS.page.registerTaskTool('acmas_p1_t1', function(){
		this.getTitle = function(){
			return('Решение'); // tab title
		};
		
		this.initialize = function(element){
			// Initialize all required stuff, use `element` as render root
			var div = document.createElement('div');
			div.style.cssText = 'padding: 20px;overflow-y: auto;position: absolute;top: 0;left: 0;right: 0;bottom: 0;';
			element.appendChild(div);
			/* 
			var tmp = document.createElement('h1');
			tmp.innerHTML = 'Задача';
			div.appendChild(tmp);
			
			elText = document.createElement('div');
			elText.className = 'task_mono';
			div.appendChild(elText);
			
			tmp = document.createElement('h2');
			tmp.innerHTML = 'Входные данные';
			div.appendChild(tmp);
			
			elInput = document.createElement('div');
			elInput.className = 'task_mono';
			div.appendChild(elInput);
			
			tmp = document.createElement('h2');
			tmp.innerHTML = 'Выходные данные';
			div.appendChild(tmp);
			
			elOutput = document.createElement('div');
			elOutput.className = 'task_mono';
			div.appendChild(elOutput); */
			
			var listeners = {change: function(){
				DS.page.setTaskField('acmas_'+this.config.name, this.value().trim());
			}};
			
			DS.create({
				DStype: 'form-panel'
				,renderTo: div
				,items: [
					'<table>'
					,'<tr><th colspan="3">MSA</th><th colspan="3">MSB</th><th colspan="4">АЛУ</th><th colspan="4">DC</th><th>MSM</th><th>WR</th></tr>'
					,'<tr><th>a2</th><th>a1</th><th>a0</th><th>a2</th><th>a1</th><th>a0</th><th>M</th><th>S1</th><th>S0</th><th>C0</th><th>E</th><th>X3</th><th>X2</th><th>X1</th><th>a0</th><th>WR</th></tr>'
					,'<tr>'
					,'<td colspan="3">',{DStype: 'textfield', name: 'MSA', listeners: listeners, value: DS.page.getTaskField('acmas_MSA')},'</td>'
					,'<td colspan="3">',{DStype: 'textfield', name: 'MSB', listeners: listeners, value: DS.page.getTaskField('acmas_MSB')},'</td>'
					,'<td colspan="4">',{DStype: 'textfield', name: 'ALU', listeners: listeners, value: DS.page.getTaskField('acmas_ALU')},'</td>'
					,'<td colspan="4">',{DStype: 'textfield', name: 'DC', listeners: listeners, value: DS.page.getTaskField('acmas_DC')},'</td>'
					,'<td>',{DStype: 'textfield', name: 'MSM', listeners: listeners, value: DS.page.getTaskField('acmas_MSM')},'</td>'
					,'<td>',{DStype: 'textfield', name: 'WR', listeners: listeners, value: DS.page.getTaskField('acmas_WR')},'</td>'
					,'</tr>'
					,'</table>'
					,{DStype: 'button', label: 'Завершить', listeners: {
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
