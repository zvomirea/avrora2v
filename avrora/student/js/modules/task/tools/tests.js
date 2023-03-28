DS.ready(function(){
	DS.page.registerTaskTool('tests', function(){
		this.getTitle = function(){
			return('Тестирование'); // tab title
		};
		var $grid;
		var _testResult = {};
		var menuAddTest;
		var menuRun;
		var idTask;
		var _listWindows = [];
		var isAllTestsPassed = false;
	
		var loadTests = function(){
			DS.ARM.getTaskTests(idTask, function(d){
				if(d.success){
					for(var i = 0, l = d.data.length; i < l; ++i){
						d.data[i].no = i + 1;
					}
					$grid.config.store = d.data;
					$grid.render();
				}
			});
		};
		
		var testEditWindow = function(data){
			var isEdit = data ? true : false;
			var wnd = DS.create({
				DStype: 'window'
				,position: 'auto'
				,destroyOnClose: true
				,reqWidth: 600
				,listeners: {
					close: function(){
						for(var i = 0, l = _listWindows.length; i < l; ++i){
							if(_listWindows[i] == this){
								_listWindows.splice(i, 1);
								break;
							}
						}
					}
				}
				,items: [
					[
						'title'
						,(isEdit ? 'Редактировать тест' : 'Создать тест')
						,'->'
						,{
							DStype: 'window-button-close'
						}
					]
					,{
						DStype: 'form-panel'
						,items: [
							{
								DStype: 'list-layout'
								,items: [
									{
										DStype: 'textarea'
										,editor: false
										,label: 'Входные данные'
										,'class': 'monotype code'
										,name: 'test_input_data'
									}
									,{
										DStype: 'textarea'
										,editor: false
										,label: 'Выходные данные'
										,'class': 'monotype code'
										,name: 'test_output_data'
									}
									,{
										DStype: 'textarea'
										,editor: false
										,label: 'Комментарий'
										// ,'class': 'monotype'
										,name: 'test_comment'
									}
									,{
										DStype: 'button'
										,label: isEdit ? 'Сохранить' : 'Добавить'
										,listeners: {
											click: function(){
												var $form = this.getForm();
												var form = $form.getFields();
												if(isEdit){
													DS.ARM.editTaskTest(idTask, data.rowid, form, function(d){
														if(d.success){
															loadTests();
															$form.parent().close();
														}
													});
												}
												else{
													DS.ARM.addTaskTest(idTask, form, function(d){
														if(d.success){
															loadTests();
															$form.parent().close();
														}
													});
												}
											}
										}
									}
								]
							}
						]
					}
				]
			}).open();
			
			_listWindows.push(wnd);
			
			if(isEdit){
				wnd.find('form-panel')[0].setFields(data);
			}
		};
		
		var testRun = function(){
			var grid = $grid;
			if(!grid.config.store.length){
				DS.msg('Сначала надо создать тест', 'red');
				return;
			}
			
			DS.progressWindow('Выполнение...');
			
			var run = function(){
				
				
				var test = tool.testCode();
				if(test){
					var msg = [];
					for(var i = 0, l = test.length; i < l; ++i){
						msg.push(test[i][1]+':'+test[i][2]+' - '+test[i][0]);
					}
					DS.invokeEvent('arm/error', msg.join("\n"));
					
					DS.progressWindow();
					DS.msg('Найдены ошибки оформления кода', 'red');
					return;
				}
				
				DS.ARM.runTaskTests(idTask, function(d){
					DS.progressWindow();
					if(d.success){
						// _testResult = {};
						isAllTestsPassed = d.data.length != 0;
						for(var i = 0, l = d.data.length; i < l; ++i){
							var item = d.data[i];
							_testResult[item.test_id] = item;
							isAllTestsPassed = isAllTestsPassed && item.status;
						}
						grid.render();
					}
				});
			};
			
			var tool = DS.page.getTaskTool('code');
						
			if(tool){
				tool.saveAll(run);
			}
			else{
				run();
			}
			
			/*
			
			var task = DS.page.taskList[DS.page.currentTask];
			// DS.util.websocket.send(ARMcommand.TEST_RUN, {
			DS.util.websocket.send(ARMcommand.lang[task.language_id].TEST_RUN, {
				student_task_id: DS.page.currentTask
			}, function(d){
				if(d.success){
					// console.warn(d.data);
					/ * 
comparison: "-"
​​
exit_code: "0"
​​
required: ""
​​
score: ""
​​
test_order: "55"
					* /
					_testResult = {};
					bAllTestsPassed = true;
					for(var i = 0, l = d.data.length; i < l; ++i){
						var item = d.data[i];
						_testResult[item.test_order] = {
							status: item.comparison == '+'
							,status_text: item.comparison
							,exit_code: item.exit_code
							,comparison_text: item.comparison_text
							,test_run_text: item.test_run_text
						};
						bAllTestsPassed = bAllTestsPassed && item.comparison == '+';
					}
					grid.render();
				}
				grid.unLock();
				button.disable(false);
			});
			*/
		};
		
		var $menu = DS.create({
			DStype: 'menu'
			,items: [
				{
					text: 'Изменить'
					,listeners: {
						click: function(o){
							var d = DS.gel(this.parent().obj).getRow(this.parent().data);
							testEditWindow(d);
						}
					}
				}
			]
		});
		
		var VisualizeSpaces = function(d){
			d = d.replace(/\n/g, '↵\n');
			d = d.replace(/ /g, '˽');
			return(d);
		};
		
		// Initialize all required stuff, use `element` as render root
		this.initialize = function(element){
			idTask = DS.page.getTaskField('id');
			
			$grid = DS.create({
				DStype: 'grid'
				,renderTo: element
				,remoteSort: false
				,getRowClass: function(j, row){
					if(row.rowid in _testResult){
						return(_testResult[row.rowid].status ? '-test-passed' : '-test-failed');
					}
					return('');
				}
				,menuObj: $menu
				,fields: [
					{
						header: '#'
						,dataIndex: 'no'
					}
					,{
						header: 'Статус'
						,dataIndex: 'rowid'
						,renderer: function(d){
							if(d in _testResult){
								switch(_testResult[d].status_text){
								case '+': return('<span style="color: #00cc00;">Успех</span>');
								case '-': return('<span style="color: #cc0000;">Отказ</span>');
								case 'Time out': return('<span style="color: #cc0000;">Превышен лимит времени</span>');
								case 'Output limit': return('<span style="color: #cc0000;">Превышен лимит вывода</span>');
								case 'Error limit': return('<span style="color: #cc0000;">Превышен лимит ошибок</span>');
								case 'Error': return('<span style="color: #cc0000;">Неопознанная ошибка</span>');
								}
								return('<span style="color: #cc0000;">'+DS.util.htmlescape(_testResult[d].status_text)+'</span>');
								// return(_testResult[d].status ? '<span style="color: #00cc00;">Успех</span>' : '<span style="color: #cc0000;">Отказ</span>');
							}
							else{
								return('н/д');
							}
						}
					}
					/* ,{
						header: 'Подробности'
						,dataIndex: 'rowid'
					} */
					,{
						header: 'Комментарий'
						,dataIndex: 'test_comment'
					}
				]
				,extended: {
					dataIndex: 'rowid'
					,collapsible: true
					,display: false
					,renderer: function(d, s){
						
									
						
						var html = [];
						
						html.push('<table style="width: 100%; border-collapse: collapse;" border="1">');
						html.push('<tr><td>Входные данные теста</td><td>Выходные данные теста</td></tr>');
						html.push('<tr><td style="vertical-align: top;"><pre class="code" style="margin: 0;border: 0;">'+DS.util.htmlescape(VisualizeSpaces(s.test_input_data))+'</pre></td><td style="vertical-align: top;"><pre class="code" style="margin: 0;border: 0;">'+DS.util.htmlescape(VisualizeSpaces(s.test_output_data))+'</pre></td></tr>');
						if(d in _testResult && (_testResult[d].comparison_text || _testResult[d].test_run_text)){
							html.push('<tr><td>Результат</td><td>Вывод программы</td></tr>');
							html.push('<tr><td style="vertical-align: top;"><pre style="margin: 0;border: 0;">'+DS.util.htmlescape(_testResult[d].comparison_text || '')+'</pre></td><td style="vertical-align: top;"><pre class="code" style="margin: 0;border: 0;">'+DS.util.htmlescape(VisualizeSpaces(_testResult[d].test_run_text || ''))+'</pre></td></tr>');
						}
						html.push('</table>');
						
						return(html.join(''));
					}
				}
			});
			
			loadTests();
		};
		
		// close task, finish all tasks and network queries, then run callback
		this.shutdown = function(callback){
			$grid.remove();
			
			for(var i = 0, l = _listWindows.length; i < l; ++i){
				_listWindows[i].close();
			}
			
			callback();
		};
		
		// called after page show
		this.show = function(){
			menuAddTest = DS.page.topMenu.addButton('Добавить тест');
			DS.addEvent(menuAddTest, 'click', function(){
				testEditWindow();
			});
			
			menuRun = DS.page.topMenu.addButton('Запуск!');
			DS.addEvent(menuRun, 'click', function(){
				testRun();
			});
		};
		
		// called before page hide
		this.hide = function(){
			DS.page.topMenu.removeButton(menuRun);
			DS.page.topMenu.removeButton(menuAddTest);
		};
		
		this.getScripts = function(){
			return([]);
		};
		
		this.getError = function(){
			if(!isAllTestsPassed){
				return('Не все ваши тесты пройдены');
			}
			return(null);
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
