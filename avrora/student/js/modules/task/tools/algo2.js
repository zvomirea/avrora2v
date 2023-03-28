DS.ready(function(){
	DS.page.registerTaskTool('algo2', function(){
		
		this.getTitle = function(){
			return('Алгоритм'); // tab title
		};
		
		// DS.page.toolMCE.call(this, 'algo_text');
		
		var table = null;
		var tbody = null;
			
		var listAlgos = [];
		var rootEl = null;
		var addButton = null;
		var isValid = false;
		var errors = [];
		
		var btnTopGenScheme = null;
		
		var _skipChanged = false;
		
		var stopList = [
			'если', 
			'иначе', 
			'пока', 
			'проверка', 
			'if', 
			'while', 
			'for', 
			'case', 
			'else', 
			'switch', 
			'default', 
			'\\+\\+', 
			'\\-\\-'
		];
		for(var i = 0, l = stopList.length; i < l; ++i){
			stopList[i] = new RegExp(stopList[i], 'i');
		}
		
		var onChanged = function(){
			if(_skipChanged){
				return;
			}
			
			isValid = true;
			
			var newErrors = [];
			
			var algoData = [];
			for(var i = 0, l = listAlgos.length; i < l; ++i){
				var form = listAlgos[i];
				if(form){
					var hlErrors = {};
					
					// {"name": [{code:'required', message:'asd'}]}
					
					form.ErrsClear();
					
					var data = form.getFields();
					
					data['class'] = data['class'].trim();
					data.func = data.func.trim();
					data.ret = data.ret.trim();
					data.name = data.name.trim();
					data.access = data.access.trim();
					
					if(data.kind == 2){
						data.name = data['class'];
					}
					else if(data.kind == 3){
						data.name = '~'+data['class'];
					}
					else if(data.kind == 1 && data.name.length > 0){
						if(data.name == data['class']){
							data.kind = 2;
							form.setFields({kind: data.kind});
						}
						else if(data.name == '~'+data['class']){
							data.kind = 3;
							form.setFields({kind: data.kind});
						}
					}
					
					algoData.push(data);
					
					var algoNo = algoData.length;
					
					if(!data.name){
						hlErrors.name = [{code: 'required', message: 'Это поле нужно заполнить'}];
						isValid = false;
					}
					if(!data.func){
						hlErrors.func = [{code: 'required', message: 'Это поле нужно заполнить'}];
						isValid = false;
					}
					else if(data.func.length < 10){
						hlErrors.func = [{code: 'invalid', message: 'Некорректное значение'}];
						isValid = false;
					}
					if(data.kind <= 1){
						if(!data.ret){
							hlErrors.ret = [{code: 'required', message: 'Это поле нужно заполнить'}];
							isValid = false;
						}
						else if(data.ret.indexOf("0") >= 0){
							hlErrors.ret = [{code: 'invalid', message: 'Нужно указать тип и описание содержания'}];
							isValid = false;
						}
					}
					
					if(data.params.trim() == '-'){
						hlErrors.params = [{code: 'invalid', message: 'Недопустимое значение'}];
						isValid = false;
					}
					
					/* else if(data.name == data['class']){
						var val = data.ret.toLowerCase();
						if(val.indexOf('адрес') < 0 && val.indexOf('ссылк') < 0 && val.indexOf('указатель') < 0){
							hlErrors.ret = [{code: 'invalid', message: 'После отработки конструктора остается <strong>адрес созданного объекта</strong>'}];
							isValid = false;
						}
					} */
					
					if(data.kind >= 1 && data.kind <= 3 && !data['class']){
						hlErrors['class'] = [{code: 'required', message: 'Это поле нужно заполнить'}];
						isValid = false;
					}
					if(data.kind >= 1 && data.kind <= 3 == 1 && ['public', 'private', 'protected'].indexOf(data.access) < 0){
						hlErrors.access = [{code: 'required', message: 'Некорректное значение'}];
						isValid = false;
					}
					
					if(data.kind >= 1 && data.kind <= 3){
						for(var j = 0; j < data['class'].length; ++j){
							var ch = data['class'][j];
							if(!(ch >= 'a' && ch <= 'z' ||
								ch >= 'A' && ch <= 'Z' ||
								ch >= '0' && ch <= '9' ||
								ch == '_')
							){
								if(!('class' in hlErrors)){
									hlErrors['class'] = [];
								}
								hlErrors['class'].push({code: 'invalid', message: 'Недопустимые символы. Нет ли русской буквы C?'});
								isValid = false;
								break;
							}
						}
					}
					
					try{
						DS.q('.algo-title', form.getObject())[0].innerText = data.name ? ((['Функция ', 'Метод '+data['class']+'::', 'Конструктор '+data['class']+'::', 'Деструктор '+data['class']+'::'][data.kind])+data.name+'()') : 'Новый алгоритм';
					}
					catch(e){}
					
					form.ErrsHighlite(hlErrors);
					
					
					// isInvalid
					
					var grid = form.find('=algo')[0];
					
					for(var k = 0, kl = grid.config.store.length; k < kl; ++k){
						var row = grid.config.store[k];
						delete row.isInvalid;
						delete row.next_invalid;
						delete row.predicate_invalid;
					}
					
					// if(isValid){
					var no = -1;
					var ec = 0;
					var rc = 0;
					var listRefs = {};
					for(var j = 0, jl = data.algo.length; j < jl; ++j){
						var row = data.algo[j];
						
						row.next = row.next.toString().trim();
						row.predicate = row.predicate.trim();
						
						if(row.next === '' || parseInt(row.next) != row.next){
							// console.info('algo2: Wrong next');
							// newErrors.push(algoNo+': Проверь переходы');
							grid.config.store[j].next_invalid = true;
							isValid = false;
							// break;
						}
						
						listRefs[row.next] = 1;
						
						if(row.no != no){
							
							if(rc == 1 && ec == 0){
								grid.config.store[j - 1].predicate_invalid = true;
								// console.info('algo2: Wrong predicate 1');
								// newErrors.push(algoNo+': Проверь предикаты');
								isValid = false;
							// break;
							}
							
							no = row.no;
							ec = 0;
							rc = 0;
						}
						
						if(!row.predicate && ++ec > 1){
							grid.config.store[j].predicate_invalid = true;
							// console.info('algo2: Wrong predicate 2');
							// newErrors.push(algoNo+': Проверь предикаты');
							isValid = false;
							// break;
						}
						
						for(var k = 0, kl = stopList.length; k < kl; ++k){
							if(row.predicate.match(stopList[k])){
								grid.config.store[j].predicate_invalid = true;
								isValid = false;
							}
						}
						
						
						++rc;
					}
					
					for(var j = 0, jl = data.algo.length; j < jl; ++j){
						var row = data.algo[j];
						if(row.next > no || row.next < 0){
							// console.info('algo2: Wrong next 2');
							// newErrors.push(algoNo+': Проверь переходы');
							grid.config.store[j].next_invalid = true;
							isValid = false;
							// break;
						}
					}
					// console.warn(listRefs);
					for(var j = 2; j <= no; ++j){
						if(!(j in listRefs)){
							
							for(var k = 0, kl = grid.config.store.length; k < kl; ++k){
								var row = grid.config.store[k];
								if(row.no == j){
									row.isInvalid = true;
									break;
								}
							}
							
							isValid = false;
						}
					}
				
					// }
					_skipChanged = true;
					grid.render();
					_skipChanged = false;
				}
			}
			
			errors = [];
			for(var i = 0, l = newErrors.length; i < l; ++i){
				var e = newErrors[i];
				if(errors.indexOf(e) < 0){
					errors.push(e);
				}
			}
			
			DS.page.setTaskField('algo2', algoData);
		};
		
		var delAlgo = function(id){
			if(listAlgos[id]){
				listAlgos[id].remove();
				listAlgos[id] = null;
			}
			onChanged();
		};
		
		var copyAlgo = function(id){
			if(listAlgos[id]){
				var el = addAlgo();
				el.setFields(listAlgos[id].getFields());
			}
			onChanged();
		};
		
		var drawTable = function(pageNo){
			if(!pageNo){
				pageNo = 1;
			}
			var algoHtml = [];
			for(var i = 0, l = listAlgos.length; i < l; ++i){
				if(listAlgos[i]){
					var data = listAlgos[i].getFields();
					
					algoHtml.push('<div>');
					
					if(data.kind >= 1 && data.kind <= 3){ // method
						switch(parseInt(data.kind)){
						case 1:
							algoHtml.push('<p>Класс объекта: ');
							break;
						case 2:
							algoHtml.push('<p>Конструктор класса: ');
							break;
						case 3:
							algoHtml.push('<p>Деструктор класса: ');
							break;
						}
						algoHtml.push(DS.util.htmlescape(data['class']));
						algoHtml.push('</p>');
						
						algoHtml.push('<p>Модификатор доступа: ');
						algoHtml.push(DS.util.htmlescape(data.access));
						algoHtml.push('</p>');
						
						if(data.kind == 1){
							algoHtml.push('<p>Метод: ');
							algoHtml.push(DS.util.htmlescape(data.name));
							algoHtml.push('</p>');
						}
					}
					else{
						algoHtml.push('<p>Функция: ');
						algoHtml.push(DS.util.htmlescape(data.name));
						algoHtml.push('</p>');
					}
					
					algoHtml.push('<p>Функционал: ');
					algoHtml.push(DS.util.htmlescape(data.func));
					algoHtml.push('</p>');
					
					algoHtml.push('<p>Параметры: ');
					algoHtml.push(data.params ? DS.util.htmlescape(data.params) : 'нет');
					algoHtml.push('</p>');
					
					if(data.kind < 2){
						algoHtml.push('<p>Возвращаемое значение: ');
						algoHtml.push(DS.util.htmlescape(data.ret));
						algoHtml.push('</p>');
					}
					
					algoHtml.push('<p>Алгоритм '+(['функции', 'метода', 'конструктора', 'деструктора'][data.kind])+' представлен в таблице '+pageNo+'.</p>');
					
					algoHtml.push('<div><i>Таблица '+(pageNo++)+' &mdash; Алгоритм '+(['функции '+DS.util.htmlescape(data.name), 'метода '+DS.util.htmlescape(data.name)+' класса '+DS.util.htmlescape(data['class']), 'конструктора класса '+DS.util.htmlescape(data['class']), 'деструктора класса '+DS.util.htmlescape(data['class'])][data.kind])+'</i></div>');
					
					algoHtml.push('<table border="1" width="100%">');
					algoHtml.push('<tr>');
					algoHtml.push('<th>№</th><th>Предикат</th><th>Действия</th><th>№ перехода</th><th>Комментарий</th>');
					algoHtml.push('</tr>');
					var skipNo = 0;
					for(var j = 0, jl = data.algo.length; j < jl; ++j){
						var row = data.algo[j];
						algoHtml.push('<tr>');
						
						if(skipNo){
							--skipNo;
						}
						else{
							if(('__rowspan' in row) && row.__rowspan.no > 1){
								algoHtml.push('<td rowspan="'+row.__rowspan.no+'">');
								skipNo = row.__rowspan.no - 1;
							}
							else{
								algoHtml.push('<td>');
							}
							algoHtml.push(row.no);
							algoHtml.push('</td>');
						}
						
						algoHtml.push('<td>');
						algoHtml.push(/* DS.util.htmlescape( */row.predicate/* ) */);
						algoHtml.push('</td>');
						
						algoHtml.push('<td>');
						algoHtml.push(/* DS.util.htmlescape( */row.actions/* ) */);
						algoHtml.push('</td>');
						
						algoHtml.push('<td>');
						algoHtml.push(row.next == 0 ? '∅' : DS.util.htmlescape(row.next));
						algoHtml.push('</td>');
						
						algoHtml.push('<td>');
						algoHtml.push(/* DS.util.htmlescape( */row.comment/* ) */);
						algoHtml.push('</td>');
						
						algoHtml.push('</tr>');
					}
					
					algoHtml.push('</table>');
					
					algoHtml.push('</div>');
				}
			}
			DS.page.setTaskField('algo_text', algoHtml.join(''));
		};
		
		var addAlgo = function(startCollapsed){
			var editor = {
				DStype: 'textarea'
				,editor: false
				,preCommit: function(val){
					return(DS.util.htmlescape(val).replace(/\n/g, '<br/>'));
				}
				,preEdit: function(val){
					return(val.replace(/<br\/>/g, '\n'));
				}
				,listeners: {
					keyup: function(){
						var td = this.config.renderTd;
						
						for(var i = 0, l = td.childNodes.length - 1; i < l; ++i){
							td.removeChild(td.childNodes[0]);
						}
						var span = document.createElement('span');
						span.innerHTML = this.config.preCommit(this.value())+'&nbsp;';
						
						td.insertBefore(span, td.childNodes[0]);
					}
				}
				// ,renderer: true
			};
			
			var edListeners = {
				change: function(){
					onChanged();
				}
			};
			
			var idAlgo = listAlgos.length;
			var el = DS.create({
				DStype: 'form-panel'
				,renderTo: rootEl
				,displaystyle: 'block'
				,'class': 'algo-el'
				,items: [
					{
						DStype: 'panel'
						,title: '<span class="algo-title"></span>'
						,opened: !startCollapsed
						,items: [
							{
								DStype: 'button'
								,label: '📄<span style="position: absolute;top: -2px;left: 8px;">📄</span>'
								,'class': 'algo-copy'
								,type: 'button'
								,listeners: {
									click: function(){
										DS.confirm('Скопировать алгоритм '+idAlgo+'?', function(){
											copyAlgo(idAlgo);
										});
									}
								}
							}
							,{
								DStype: 'button'
								,label: '❌'
								,'class': 'algo-del'
								,type: 'button'
								,listeners: {
									click: function(){
										DS.confirm('Удалить алгоритм '+idAlgo+'? Отменить нельзя', function(){
											delAlgo(idAlgo);
										}, null, true);
									}
								}
							}
							,{
								DStype: 'list-layout'
								,blockstyle: 'max-width: 600px;'
								,items: [
									{
										DStype: 'combo'
										,label: 'Метод/функция'
										,name: 'kind'
										,value: 1
										,listeners: {
											change: function(){
												if(this.value() == 1){
													var form = this.getForm();
													var data = form.getFields();
													if(data.name == data['class']){
														form.setFields({name: ''});
													}
												}
												onChanged();
											}
										}
										,items: [
											{text: 'Метод', value: 1}
											,{text: 'Функция', value: 0}
											,{text: 'Конструктор', value: 2}
											,{text: 'Деструктор', value: 3}
										]
									}
									,{
										DStype: 'textfield'
										,label: 'Класс объекта'
										,display: DS.RA('parent.=kind', 'value', function(set){return(set != 0);})
										,name: 'class'
										,listeners: edListeners
										,required: true
									}
									,{
										DStype: 'textfield'
										,label: 'Модификатор доступа'
										,display: DS.RA('parent.=kind', 'value', function(set){return(set != 0);})
										,name: 'access'
										,listeners: edListeners
										,required: true
										,description: 'public/private/protected'
									}
									,{
										DStype: 'textfield'
										,label: 'Имя'
										,name: 'name'
										,listeners: edListeners
										,required: true
										,display: DS.RA('parent.=kind', 'value', function(set){return(set <= 1);})
									}
									,{
										DStype: 'textfield'
										,label: 'Параметры'
										,name: 'params'
										,listeners: edListeners
										,description: 'тип, наименование, описание назначения'
									}
									,{
										DStype: 'textfield'
										,label: 'Возвращаемое значение'
										,name: 'ret'
										,listeners: edListeners
										,description: 'тип и описание содержания'
										,required: true
										,display: DS.RA('parent.=kind', 'value', function(set){return(set <= 1);})
									}
									,{
										DStype: 'textfield'
										,label: 'Функционал'
										,name: 'func'
										,listeners: edListeners
										,description: 'описание назначения'
										,required: true
									}
								]
							}
							,'<h3>Алгоритм:</h3>'
							,{
								DStype: 'grid'
								,name: 'algo'
								,store: [
									{id: 0, no: 1, predicate: '', actions: '', next: ''/* , __rowspan: {no: 2} */, comment: ''}
									// ,{id: 1, no: 1, predicate: '', actions: '', next: ''}
								]
								,getRowClass: function(j, row){
									if(row.isInvalid){
										return('-test-failed');
									}
									return('');
								}
								,autoSave: false
								,fields: [
									{
										dataIndex: 'no'
										,header: '#'
										,width: '50px'
									}
									,{
										dataIndex: 'predicate'
										,header: 'Предикат'
										,editable: true
										,editor: editor
										,getClass: function(d, s){
											if(s.predicate_invalid){
												return('-test-failed');
											}
											return('');
										}
									}
									,{
										dataIndex: 'actions'
										,header: 'Действия'
										,editable: true
										,editor: editor
									}
									,{
										dataIndex: 'next'
										,header: '# перехода'
										,editable: true
										,width: '100px'
										,editor: {
											DStype: 'textfield'
											// ,renderer: true
										}
										,getClass: function(d, s){
											if(s.next_invalid){
												return('-test-failed');
											}
											return('');
										}
									}
									,{
										dataIndex: 'comment'
										,header: 'Комментарий'
										,editable: true
										,editor: editor
									}
									,{
										dataIndex: 'id'
										,header: ''
										,width: '100px'
										,renderer: function(d, row, j){
											var store = this.config.store;
											var grid = this;
											var div = document.createElement('div');
											var btn = document.createElement('button');
											btn.type = 'button';
											btn.innerText = '▲';
											btn.disabled = d == 0;
											DS.addEvent(btn, 'click', function(){
												if('__rowspan' in row && row.__rowspan.no > 1){
													store[j + 1].__rowspan = {no: row.__rowspan.no - 1};
													delete store[j].__rowspan;
																								
													// shift numbers
													var shiftList = {};
													for(var i = j + 1, l = store.length; i < l; ++i){
														shiftList[store[i].no] = store[i].no + 1;
														++store[i].no;
													}
													grid.shiftNexts(shiftList);
												}
												else if(j > 0 && store[j - 1].no == row.no){
													var tmp = store[j - 1];
													store[j - 1] = store[j];
													store[j] = tmp;
													if('__rowspan' in store[j]){
														store[j - 1].__rowspan = store[j].__rowspan;
														delete store[j].__rowspan;
													}
												}
												else{
													--row.no;
													var lastIdx = j - 1;
													for(var i = j - 1; i >= 0; --i){
														if(grid.getRow(i).no == row.no){
															lastIdx = i;
														}
													}
													row2 = grid.getRow(lastIdx);
													if('__rowspan' in row2){
														++row2.__rowspan.no;
													}
													else{
														row2.__rowspan = {no: 2};
													}
													
													// shift numbers
													var shiftList = {};
													for(var i = j + 1, l = store.length; i < l; ++i){
														shiftList[store[i].no] = store[i].no - 1;
														--store[i].no;
													}
													grid.shiftNexts(shiftList);
												}
												
												grid.fixOrder();
												grid.render();
											});
											div.appendChild(btn);
											
											
											btn = document.createElement('button');
											btn.type = 'button';
											btn.innerText = '▼';
											btn.disabled = d == store.length - 1 && (j <= 0 || row.no != this.getRow(j - 1).no);
											DS.addEvent(btn, 'click', function(){
												if('__rowspan' in row && row.__rowspan.no > 1){
													store[j + 1].__rowspan = {no: row.__rowspan.no};
													delete store[j].__rowspan;
													var tmp = store[j + 1];
													store[j + 1] = store[j];
													store[j] = tmp;
												}
												else if(j < store.length - 1 && store[j + 1].no == row.no){
													var tmp = store[j + 1];
													store[j + 1] = store[j];
													store[j] = tmp;
												}
												else if(j > 0 && store[j - 1].no == row.no){
													var lastIdx = j;
													for(var i = j - 1; i >= 0; --i){
														if(grid.getRow(i).no == row.no){
															lastIdx = i;
														}
													}
													row2 = grid.getRow(lastIdx);
													if('__rowspan' in row2){
														--row2.__rowspan.no;
													}
													
													++row.no;
													
													// shift numbers
													var shiftList = {};
													for(var i = j + 1, l = store.length; i < l; ++i){
														shiftList[store[i].no] = store[i].no + 1;
														++store[i].no;
													}
													grid.shiftNexts(shiftList);
												}
												else if(j == 0 || store[j - 1].no != row.no){
													row.__rowspan = {no: ('__rowspan' in store[j + 1]) ? store[j + 1].__rowspan.no + 1 : 2};
													delete store[j + 1].__rowspan;
													
													// shift numbers
													var shiftList = {};
													for(var i = j + 1, l = store.length; i < l; ++i){
														shiftList[store[i].no] = store[i].no - 1;
														--store[i].no;
													}
													grid.shiftNexts(shiftList);
												}
												else{
													DS.msg('Error 13104. Please report to teacher!', 'red');
												}
												
												grid.fixOrder();
												grid.render();
											});
											div.appendChild(btn);
											
											btn = document.createElement('button');
											btn.type = 'button';
											btn.innerText = '❌';
											btn.disabled = store.length == 1;
											DS.addEvent(btn, 'click', function(){
												if('__rowspan' in row && row.__rowspan.no > 1){
													store[j + 1].__rowspan = {no: row.__rowspan.no - 1};
												}
												
												if(!(j > 0 && store[j - 1].no == row.no || j < store.length - 1 && store[j + 1].no == row.no)){
													// shift numbers
													var shiftList = {};
													for(var i = j + 1, l = store.length; i < l; ++i){
														shiftList[store[i].no] = store[i].no - 1;
														--store[i].no;
													}
													grid.shiftNexts(shiftList);
												}
												else{
													var lastIdx = j;
													for(var i = j; i >= 0; --i){
														if(grid.getRow(i).no == row.no){
															lastIdx = i;
														}
													}
													row = grid.getRow(lastIdx);
													if('__rowspan' in row){
														--row.__rowspan.no;
													}
													
												}
												
												store.splice(j, 1);
												grid.fixOrder();
												grid.render();
											});
											div.appendChild(btn);
											
											btn = document.createElement('button');
											btn.type = 'button';
											btn.innerText = '＋';
											DS.addEvent(btn, 'click', function(){
												// store
												if(j != store.length - 1 && store[j + 1].no == row.no){
													// insert subrow
													var rowNew = {id: 0, no: row.no, predicate: '', actions: '', next: '', comment: ''};
													store.splice(j + 1, 0, rowNew);
													
													var lastIdx = j;
													for(var i = j; i >= 0; --i){
														if(grid.getRow(i).no == row.no){
															lastIdx = i;
														}
													}
													row = grid.getRow(lastIdx);
													if('__rowspan' in row){
														++row.__rowspan.no;
													}
													else{
														row.__rowspan = {no: 2};
													}
												}
												else{
													// insert full row
													var rowNew = {id: 0, no: row.no + 1, predicate: '', actions: '', next: '', comment: ''};
													store.splice(j + 1, 0, rowNew);
													
													// shift numbers
													var shiftList = {};
													for(var i = j + 2, l = store.length; i < l; ++i){
														shiftList[store[i].no] = store[i].no + 1;
														++store[i].no;
													}
													grid.shiftNexts(shiftList);
												}
												grid.fixOrder();
												grid.render();
											});
											div.appendChild(btn);
											
											div.style.display = 'flex';
											return(div);
										}
									}
								]
								,listeners: {
									change: function(data){
										var row = this.getRow(data.row);
										var rowNext = this.getRow(data.row + 1);
										
										if(data.value){
											if(data.field == 'predicate' && (!rowNext || rowNext.no != row.no)){
												var rowNew = {id: 0, no: row.no, predicate: '', actions: '', next: '', comment: ''};
												this.config.store.splice(data.row + 1, 0, rowNew);
												
												var lastIdx = data.row;
												for(var i = data.row; i >= 0; --i){
													if(this.getRow(i).no == row.no){
														lastIdx = i;
													}
												}
												row = this.getRow(lastIdx);
												if('__rowspan' in row){
													++row.__rowspan.no;
												}
												else{
													row.__rowspan = {no: 2};
												}
												// __rowspan: {no: 2}
												this.fixOrder();
												this.render();
											}
											else if(data.field == 'actions' && !rowNext){
												if(row.next === ''){
													row.next = row.no + 1;
												}
												var rowNew = {id: 0, no: row.no + 1, predicate: '', actions: '', next: '', comment: ''};
												this.config.store.splice(data.row + 1, 0, rowNew);
												this.fixOrder();
												this.render();
											}
										}
										
										// data.row;
										// data.field;
										// data.value;
									}
									,init: function(){
										this.config.declareMethod('fixOrder', function(){
											for(var i = 0, l = this.config.store.length; i < l; ++i){
												this.config.store[i].id = i;
											}
										});
										this.config.declareMethod('shiftNexts', function(shiftList){
											var store = this.config.store;
											for(var i = 0, l = store.length; i < l; ++i){
												if(store[i].next in shiftList){
													store[i].next = shiftList[store[i].next];
												}
											}
										});
									}
									,render: function(){
										onChanged();
									}
								}
							}
							,'<div>* Для редактирования текста используйте двойной клик по ячейке</div>'
							,'<div>* Для обозначения конца алгоритма используйте 0</div>'
						]
					}
				]
			});
			listAlgos.push(el);
			return(el);
		};
		
		var CreateGraph = function(){
			var schemeTool = DS.page.getTaskTool('algo-scheme');
			var oldXml = DS.page.getTaskField('algo_graph');
			
			var wnd = DS.create({
				DStype: 'window'
				,destroyOnClose: true
				,reqWidth: 300
				,items: [
					[
						'title'
						,'Сгенерировать блок-схему'
						,'->'
						,{DStype: 'window-button-close'}
					]
					,{
						DStype: 'list-layout'
						,items: [
							'Вы можете сгенерировать блок-схему на основе вашего алгоритма. Для генерации нажмите "Сгенерировать", для отмены нажмите "Отменить". После закрытия данного окна отменить будет невозможно.'
							,{
								DStype: 'button'
								,label: 'Сгенерировать'
								,listeners: {
									'click': function(){
										var btn = this;
										btn.loadLock();
										onChanged();
										DS.page.taskSave(function(){
											DS.ARM.buildSchemeFromAlgo2(DS.page.getTaskField('id'), function(d){
												btn.unLock();
												
												if(d.success){
													schemeTool.setXml(d.data.algo_graph);
												}
											});	
										});
									}
								}
							}
							,{
								DStype: 'button'
								,label: 'Отменить'
								,listeners: {
									'click': function(){
										schemeTool.setXml(oldXml);
									}
								}
							}
						]
					}
				]
			}).open();
			
			// wnd.find('form-panel')[0].setFields({xml: mxUtils.getXml(mxGraph.editor.getGraphXml())});
		};
		
		// Initialize all required stuff, use `element` as render root
		this.initialize = function(element){
			// idTask = DS.page.getTaskField('id');
			
			rootEl = document.createElement('div');
			rootEl.style.padding = '10px';
			element.appendChild(rootEl);
			
			addButton = DS.create({
				DStype: 'button'
				,label: 'Добавить'
				,renderTo: element
				,type: 'button'
				,listeners: {
					click: function(){
						addAlgo();
						onChanged();
					}
				}
			});
			
			var data = DS.page.getTaskField('algo2');
			if(data){
				for(var i = 0, l = data.length; i < l; ++i){
					var el = addAlgo(true);
					
					for(var j = 0, jl = data[i].algo.length; j < jl; ++j){
						if(!('comment' in data[i].algo[j])){
							data[i].algo[j].comment = '';
						}
					}
					
					if(!data[i].access){
						data[i].access = '';
					}
					
					el.setFields(data[i]);
				}
			}
		};
		
		// close task, finish all tasks and network queries, then run callback
		this.shutdown = function(callback){
			onChanged();
			drawTable(DS.page.getTaskField('method_description').split('<table').length);
			
			if(addButton){
				addButton.remove();
				addButton = null;
			}
			
			for(var i = 0, l = listAlgos.length; i < l; ++i){
				if(listAlgos[i]){
					listAlgos[i].remove();
					listAlgos[i] = null;
				}
			}
			listAlgos = [];
			
			rootEl.parentNode.removeChild(rootEl);
			rootEl = null;
			
			if(btnTopGenScheme){
				DS.page.topMenu.removeButton(btnTopGenScheme);
				btnTopGenScheme = null;
			}
			
			callback();
		};
		
		// called after page show
		this.show = function(){
			btnTopGenScheme = DS.page.topMenu.addButton('Сгенерировать схему');
			
			DS.addEvent(btnTopGenScheme, 'click', CreateGraph);
		};
		
		// called before page hide
		this.hide = function(){
			onChanged();
			drawTable(DS.page.getTaskField('method_description').split('<table').length);
			
			if(btnTopGenScheme){
				DS.page.topMenu.removeButton(btnTopGenScheme);
				btnTopGenScheme = null;
			}
			// render table
		};
		
		this.forceSave = function(callback){
			onChanged();
			drawTable(DS.page.getTaskField('method_description').split('<table').length);
			callback();
		};
		
		this.getScripts = function(){
			return([]);
		};
		
		this.getError = function(){
			return(isValid ? null : 'Обнаружены ошибки в алгоритме: <br/>'+errors.join('<br/>'));
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
