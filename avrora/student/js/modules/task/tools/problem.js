DS.ready(function(){
	DS.page.registerTaskTool('problem', function(){
		this.getTitle = function(){
			return('Постановка задачи'); // tab title
		};
		
		var elTheory;
		var elText;
		var elInput;
		var elOutput;
		
		var cmStyle = document.createElement('style');
		cmStyle.type = 'text/css';
		
		var btnToWindow;
		var topMenuSize;
		var $menuSize;

		var canSwitchNow = true;
		var canSwitchTimeout = null;
		this.canSwitchNow = function(){
			return(canSwitchNow);
		};
		
		var sInfoHtml = '<p>При решении задачи необходимо руководствоваться <span style="text-decoration: underline dashed; cursor: pointer" onclick="DS.page.showPdf(\'/student/files/methodichescoe_posobie_dlya_laboratornyh_rabot_3.pdf\', \'Методическое пособие\');">методическим пособием</span> и <span style="text-decoration: underline dashed; cursor: pointer" onclick="DS.page.showPdf(\'/student/files/Prilozheniye_k_methodichke.pdf\', \'Приложение к методическому пособию\');">приложением к методическому пособию</span></p>';
		
		var HighlightQuote = function(html){
			var fn = function(x){
				return(x.replace(/(«|\&laquo\;)/g, '<code style="background-color: rgba(0,255,0,0.3);border-radius: 5px;padding: 3px;font-size: inherit;margin: 0">').replace(/(»|\&raquo\;)/g, '</code>'));
			};
			var list = html.split('<pre');
			list[0] = fn(list[0]);
			for(var i = 1, l = list.length; i < l; ++i){
				var pre = list[i].split('</pre>');
				if(pre.length > 1){
					pre[1] = fn(pre[1]);
				}
				list[i] = pre.join('</pre>');
			}
			html = list.join('<pre');
			
			return(html);
		};
		
		this.initialize = function(element){
			// Initialize all required stuff, use `element` as render root
			
			document.body.appendChild(cmStyle);
			
			var userSize = DS.page.userPrefs.get('task/taskProblem/size') || 12;
			cmStyle.innerHTML = '.task-problem-wrapper{font-size: '+userSize+'pt}';
			menuItems = [];
			for(var i = 12; i <= 36; ++i){
				menuItems.push({
					text: i
					,icon: {
						DStype: 'checkbox'
						,value: userSize == i
					}
					,listeners: {
						click: function(){
							var list = this.find('!checkbox');
							for(var j = 0, jl = list.length; j < jl; ++j){
								list[j].checked(false);
							}
							var cb = this.find('checkbox')[0];
							DS.page.userPrefs.set('task/taskProblem/size', this.config.text);
							DS.page.userPrefs.save();
							cb.checked(true);
							
							cmStyle.innerHTML = '.task-problem-wrapper{font-size: '+this.config.text+'pt}';
						}
					}
				});
			}
			$menuSize = DS.create({
				DStype: 'topmenu'
				,items: menuItems
			});
			
			
			
			
			var div = document.createElement('div');
			div.style.cssText = 'padding: 20px;overflow-y: auto;position: absolute;top: 0;left: 0;right: 0;bottom: 0;';
			div.className = 'task-problem-wrapper';
			
			var talert = document.createElement('div');
			talert.innerHTML = 'Твоя программа не прошла контрольное тестирование. Это значит, программа работает не так, как того требует постановка задачи. Поэтому, читаем постановку задачи еще раз, внимательно. Ты не сможешь перейти к другому инструменту, пока эта надпись не исчезнет. ';
			talert.className = 'task_alert';
			talert.style.display = 'none';
			div.appendChild(talert);
			
			var palert = document.createElement('div');
			palert.innerHTML = 'В данной задаче предоставляется код из предыдущей работы, его нужно <strong>доработать</strong> согласно требованиям постановки задачи. Метод решения, алгоритм и блок-схему нужно составить только для того, что было <strong>добавлено/изменено</strong> в данной задаче, повторно описывать предыдущую не нужно.';
			palert.className = 'task_alert good';
			palert.style.display = 'none';
			div.appendChild(palert);
			
			var tmp = document.createElement('h2');
			tmp.innerHTML = 'Введение';
			div.appendChild(tmp);
			
			elTheory = document.createElement('div');
			// elTheory.className = 'task_mono';
			div.appendChild(elTheory);
			
			tmp = document.createElement('h2');
			tmp.innerHTML = 'Постановка задачи';
			div.appendChild(tmp);
			
			elText = document.createElement('div');
			// elText.className = 'task_mono';
			div.appendChild(elText);
			
			tmp = document.createElement('h2');
			tmp.innerHTML = 'Входные данные';
			div.appendChild(tmp);
			
			elInput = document.createElement('div');
			// elInput.className = 'task_mono';
			div.appendChild(elInput);
			
			tmp = document.createElement('h2');
			tmp.innerHTML = 'Выходные данные';
			div.appendChild(tmp);
			
			elOutput = document.createElement('div');
			// elOutput.className = 'task_mono';
			div.appendChild(elOutput);
			
			
			
			element.appendChild(div);
			
			btnToWindow = DS.page.topMenu.addButton('Задачу в окно');
			DS.addEvent(btnToWindow, 'click', function(e){
				DS.create({
					DStype: 'window'
					,destroyOnClose: true
					,reqWidth: 600
					,reqNative: !e.shiftKey
					,height: '400px'
					,items: [
						[
							'title'
							,DS.util.htmlescape(DS.page.getTaskField('name'))
							,'->'
							,{DStype: 'window-button-close'}
						]
						,'<div class="ds-window-scrollable task-problem-wrapper">'
						,'<div class="task_mono1">',DS.page.getTaskField('task_text'),sInfoHtml,'</div>'
						,'<h2>Входные данные</h2>'
						,'<div class="task_mono1">',HighlightQuote(DS.page.getTaskField('task_input')),'</div>'
						,'<h2>Выходные данные</h2>'
						,'<div class="task_mono1">',HighlightQuote(DS.page.getTaskField('task_output')),'</div>'
						,'<h2>Пояснение</h2>'
						,'<div class="task_mono1">',HighlightQuote(DS.page.getTaskField('theory_text')),'</div>'
						,'</div>'
					]
				}).open();
				DS.util.SHL.highlight();
			});
		
			if(DS.page.getTaskField('comment') == 'Ошибки при контрольном тестировании'){
				canSwitchNow = false;
				talert.style.display = '';
				canSwitchTimeout = setTimeout(function(){
					canSwitchNow = true;
					canSwitchTimeout = null;
					talert.style.display = 'none';
				}, 0.5 * 60000);
				
				var elTimer = document.createElement('time');
				elTimer.setAttribute('data-precision', 'seconds');
				elTimer.setAttribute('data-mode', 'timeleft');
				elTimer.setAttribute('data-format', 'words');
				elTimer.setAttribute('data-unixtime', parseInt(Date.now() / 1000 + 0.5 * 60));
				talert.appendChild(elTimer);
				DS.util.initTimers();
			}
		
			if(DS.page.getTaskField('parent_id') > 0){
				palert.style.display = '';
			}
		};
		
		this.shutdown = function(callback){
			if(canSwitchTimeout){
				clearTimeout(canSwitchTimeout);
				canSwitchTimeout = null;
			}
			DS.page.topMenu.removeButton(btnToWindow);
			// close task, finish all tasks and network queries, then run callback
			callback();
		};
		
		this.show = function(){
			// called after page show]
			
			topMenuSize = DS.page.topMenu.addButton('Шрифт');
			$menuSize.attach(topMenuSize, 'click');
			
			var sTheory = DS.page.getTaskField('theory_text') || '';
			elTheory.innerHTML = DS.page.getTaskField('theory_text');
			if(sTheory.length){
				// elTheory.parentElement.style.display = '';
			}
			else{
				// elTheory.parentElement.style.display = 'none';
			}
			elText.innerHTML = DS.page.getTaskField('task_text')+sInfoHtml;
			elInput.innerHTML = HighlightQuote(DS.page.getTaskField('task_input'));
			elOutput.innerHTML = HighlightQuote(DS.page.getTaskField('task_output'));
			
			DS.util.SHL.highlight();
		};
		
		this.hide = function(){
			// called before page hide
			DS.page.topMenu.removeButton(topMenuSize);
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
