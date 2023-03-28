DS.ready(function(){
	DS.page.registerModule('test', function(){
		var elWrapper = null;
		var elMainScreen = null;
		var elButtonFinish = null;
		var $grid = null;
		var $wndExitConfirm = null;
		var _timeOut = null;
		var _idTest = null;
		var _challenge = null;
		var _timeStarted = null;
		
		var topMenuSize;
		var $menuSize;
		
		var endTest = function(){
			if($wndExitConfirm){
				$wndExitConfirm.close();
			}
			if(_timeOut){
				clearTimeout(_timeOut);
				_timeOut = null;
			}
			
			if($grid){
				// send result to server
				var s = $grid.config.store;
				var out = {};
				for(var i = 0, l = s.length; i < l; ++i){
					var row = s[i];
					out[row.value] = row.selected;
				}
				DS.ARM.doneTest({
					test_id: _idTest
					,answers: out
					,challenge: _challenge || null
					,time_started: _timeStarted
				}, function(d){
					if(d.success){
						DS.msg('Ошибок: '+d.data.errors, d.data.errors == 0 ? 'green' : 'red');
					}
					DS.page.popModule();
				});
				return;
			}
			
			DS.page.popModule();
		};
		
		var initMainScreen = function(args){			
			elMainScreen = document.createElement('div');
			elMainScreen.className = 'test_mod_wrap';
			
			var elPanelTop = document.createElement('div');
			elPanelTop.className = 'test_mod_top';
			elMainScreen.appendChild(elPanelTop);
			
			var elPanelBottom = document.createElement('div');
			elPanelBottom.className = 'test_mod_bottom';
			elMainScreen.appendChild(elPanelBottom);
			
			elWrapper.appendChild(elMainScreen);
			
			
			var elTitle = document.createElement('h3');
			elTitle.className = 'test_mod_title';
			elTitle.innerText = 'Загрузка...';
			elPanelTop.appendChild(elTitle);
			
			elButtonFinish = DS.page.topMenu.addButton('Завершить тест');
			DS.css(elButtonFinish, 'float', 'right');
			DS.addEvent(elButtonFinish, 'click', function(){
				$wndExitConfirm = DS.confirm('Завершить?', function(){
					$wndExitConfirm = null;
					endTest();
				}, function(){
					$wndExitConfirm = null;
				}, true);
			});
			
			DS.ARM.getTest(args.testId, function(d){
				if(d.success){
					elTitle.innerText = d.data.title;
					
					var store = [];
					for(var i = 0, l = d.data.questions.length; i < l; ++i){
						var row = d.data.questions[i];
						store.push({code: row.text, value: row.value, selected: '', is_skipped: row.is_skipped});
					}
					
					$grid = DS.create({
						DStype: 'grid'
						,renderTo: elPanelBottom
						,autoSave: false
						,'class': 'test_mod_table'
						,store: store
						,listeners: {
							render: function(){
								DS.util.SHL.highlight();
							}
						}
						,fields: [
							{
								header: 'Фрагмент кода'
								,dataIndex: 'code'
								,renderer: function(d){
									d = DS.util.htmlescape(d).replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
									return('<pre class="code brush:cpp">'+d+'</pre>');
								}
							}
							,{
								header: 'Выберите подходящий вариант'
								,dataIndex: 'selected'
								,editable: true
								,editor: function(d1, s){
									// console.warn(s);
									if(s.is_skipped == 'true'){
										return({});
									}
									return({
										DStype: 'combo'
										,displaystyle: 'block'
										,items: d.data.variants
										,renderer: true
									});
								}
							}
						]
					});
					
					
					_timeStarted = parseInt(Date.now() / 1000.0);
					
					if(args.timeLimit){
						var elTimer = document.createElement('time');
						elTimer.setAttribute('data-precision', 'seconds');
						elTimer.setAttribute('data-mode', 'timeleft');
						elTimer.setAttribute('data-format', 'words');
						elTimer.setAttribute('data-unixtime', parseInt(Date.now() / 1000 + args.timeLimit));
						elPanelTop.appendChild(elTimer);
						DS.util.initTimers();
						
						_timeOut = setTimeout(endTest, args.timeLimit * 1000);
					}
					//DS.page.popModule
				}
			});
		};
		
		var cmStyle = document.createElement('style');
		cmStyle.type = 'text/css';
		
//##########################################################################
		
		// Initialize all required stuff, use `element` as render root
		this.initialize = function(element, args){
			console.warn("Module init!");
			elWrapper = element;
			
			if(!args){
				args = {};
			}
			if(!args.testId){
				args.testId = 2;
			}
			_idTest = args.testId;
			_challenge = args.challenge;
			
			//timeLimit
			//testId
			
			// DS.progressWindow('Загрузка данных');
			
			initMainScreen(args);
			
			document.body.appendChild(cmStyle);
			
			var userSize = DS.page.userPrefs.get('test/textSize') || 12;
			cmStyle.innerHTML = '.test_mod_table .syntaxhighlighter{font-size: '+userSize+'px!important;}.test_mod_table .combo{height: '+(userSize+2)+'px!important;line-height: '+(userSize+2)+'px!important;}';
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
							DS.page.userPrefs.set('test/textSize', this.config.text);
							DS.page.userPrefs.save();
							cb.checked(true);
							
							cmStyle.innerHTML = '.test_mod_table .syntaxhighlighter{font-size: '+this.config.text+'px!important;}.test_mod_table .combo{height: '+(+this.config.text+2)+'px!important;line-height: '+(+this.config.text+2)+'px!important;}';
						}
					}
				});
			}
			$menuSize = DS.create({
				DStype: 'topmenu'
				,items: menuItems
			});
			
			topMenuSize = DS.page.topMenu.addButton('Шрифт');
			$menuSize.attach(topMenuSize, 'click');
		};
		
		// destroy module, finish all tasks and network queries, then run callback
		this.shutdown = function(callback){
			if($grid){
				$grid.remove();
				$grid = null;
			}
			
			if(_timeOut){
				clearTimeout(_timeOut);
				_timeOut = null;
			}
			
			DS.page.topMenu.removeButton(elButtonFinish);
			DS.page.topMenu.removeButton(topMenuSize);
			document.body.removeChild(cmStyle);
			$menuSize.remove();

			callback && callback();
		};
		
		this.getScripts = function(){
			return([
				// 'js/modules/task/tinyMce.js'
			]);
		};
		this.getStyles = function(){
			return({
				both: [
					'css/modules/test.css'
				]
				/* ,light: [
					'css/modules/task-light.css'
				] */
				,dark: [
					'css/modules/test-dark.css'
				]
			});
		};
	});
});
