/* (function(){
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = 'mxgraph/javascript/examples/grapheditor/www/../../../src/js/mxClient.min.js';
	document.body.appendChild(script);
})(); */

DS.ready(function(){
	
	window.RESOURCES_PATH = 'mxgraph/javascript/examples/grapheditor/www/resources';
	window.STENCIL_PATH = 'mxgraph/javascript/examples/grapheditor/www/stencils';
	window.IMAGE_PATH = 'mxgraph/javascript/examples/grapheditor/www/images';
	window.STYLE_PATH = 'mxgraph/javascript/examples/grapheditor/www/styles';
	window.CSS_PATH = 'mxgraph/javascript/examples/grapheditor/www/styles';
	
	window.mxBasePath = 'mxgraph/javascript/examples/grapheditor/www/../../../src';
	//window.mxLanguage = window.mxLanguage || urlParams['lang'];
	//window.mxLanguages = window.mxLanguages || ['de'];

	window.mxDefaultLanguage = 'ru';
	
	// Default resources are included in grapheditor resources
	window.mxLoadResources = false;
	
	var _isIntersecting = false;
	var _errorList = [];
	
	window.urlParams = window.urlParams || {};

	// Public global variables
	window.MAX_REQUEST_SIZE = window.MAX_REQUEST_SIZE  || 10485760;
	window.MAX_AREA = window.MAX_AREA || 15000 * 15000;

	// URLs for save and export
	window.EXPORT_URL = window.EXPORT_URL || '/export';
	window.SAVE_URL = window.SAVE_URL || '/save';
	window.OPEN_URL = window.OPEN_URL || '/open';
	window.RESOURCES_PATH = window.RESOURCES_PATH || 'resources';
	window.RESOURCE_BASE = window.RESOURCE_BASE || window.RESOURCES_PATH + '/grapheditor';
	window.STENCIL_PATH = window.STENCIL_PATH || 'stencils';
	window.IMAGE_PATH = window.IMAGE_PATH || 'images';
	window.STYLE_PATH = window.STYLE_PATH || 'styles';
	window.CSS_PATH = window.CSS_PATH || 'styles';
	window.OPEN_FORM = window.OPEN_FORM || 'open.html';

	// Sets the base path, the UI language via URL param and configures the
	// supported languages to avoid 404s. The loading of all core language
	// resources is disabled as all required resources are in grapheditor.
	// properties. Note that in this example the loading of two resource
	// files (the special bundle and the default bundle) is disabled to
	// save a GET request. This requires that all resources be present in
	// each properties file since only one file is loaded.
	window.mxBasePath = window.mxBasePath || '../../../src';
	window.mxLanguage = window.mxLanguage || urlParams['lang'];
	window.mxLanguages = window.mxLanguages || ['de'];

	
	DS.page.registerTaskTool('algo-scheme', function(){
		
		var mxGraph;
		var mxThemes = null;
		var isSaving = false;
		var topMenuEdit = null;
		
		this.getTitle = function(){
			return('Блок-схема'); // tab title
		};
		
		var _saveInterval = null;
		
		var initGraph = function(element){
			// Main
			mxGraph = new EditorUi(new Editor(false, mxThemes), element);
			
			mxGraph.editor.graph.setEnabled(false);
			mxGraph.keyHandler.setEnabled(false);
			
			window._mxGraph = mxGraph;
			
			var xml = DS.page.getTaskField('algo_graph');
			
			console.info(xml);
			
			if(!xml){
				xml = '<mxGraphModel dx="846" dy="347" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="640" pageHeight="750" background="#ffffff"><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>';
			}
			
			xml = xml.replace('pageWidth="850" pageHeight="1100"', 'pageWidth="640" pageHeight="920"');
			xml = xml.replace('pageWidth="640" pageHeight="920"', 'pageWidth="640" pageHeight="800"');
			xml = xml.replace('pageWidth="640" pageHeight="800"', 'pageWidth="640" pageHeight="750"');
			xml = xml.replace('pageWidth="827" pageHeight="1169"', 'pageWidth="640" pageHeight="750"');
			var doc = mxUtils.parseXml(xml);
			var node = doc.documentElement;
			mxGraph.editor.graph.setAllowDanglingEdges(false);
			mxGraph.editor.graph.setDisconnectOnMove(false);
			mxGraph.editor.setGraphXml(node);
			mxGraph.editor.undoManager.clear();
		};
		
		var cvsSubRect = function(cvs, top, left, width, height){
			var ctx = cvs.getContext('2d'),
				copy = document.createElement('canvas').getContext('2d');
				
			var trimmed = ctx.getImageData(top, left, width, height);

			copy.canvas.width = width;
			copy.canvas.height = height;
			copy.putImageData(trimmed, 0, 0);
				
			return(copy.canvas);
		};
		
		var _warnCells = [];
		var warnCell = function(graph, cell, msg){
			var isFound = false;
			for(var i = 0, l = _warnCells.length; i < l; ++i){
				if(_warnCells[i].cell == cell){
					if(_warnCells[i].msg == msg){
						_warnCells[i].warn = true;
						isFound = true;
					}
					else{
						_warnCells.splice(i, 1);
					}
					break;
				}
			}
			
			if(!isFound){
				_warnCells.push({cell: cell, msg: msg, warn: true});
				cell.setStyle(cell.getStyle().replace(/[;]?(strokeColor=[^;]+)|$/, ';strokeColor=#FF0000'));
				graph.setCellWarning(cell, msg);
				graph.refresh();
			}
		};
		var clearUnwarned = function(graph){
			var doRefresh = false;
			for(var i = 0, l = _warnCells.length; i < l; ++i){
				if(_warnCells[i].warn){
					_warnCells[i].warn = false;
				}
				else{
					try{
						doRefresh = true;
						if(_warnCells[i].cell.getStyle().split(';')[0] == 'text'){
							_warnCells[i].cell.setStyle(_warnCells[i].cell.getStyle().replace(/(strokeColor)=[^;]+/, ''));
						}
						else{
							_warnCells[i].cell.setStyle(_warnCells[i].cell.getStyle().replace(/(strokeColor)=[^;]+/, '$1=#000000'));
						}
						
						graph.setCellWarning(_warnCells[i].cell, null);
						
					}
					catch(e){
						console.error(e);
					}
					
					_warnCells.splice(i, 1);
					--i; --l;
				}
			}
			if(doRefresh){
				graph.refresh();
			}
		};
		
		var testGraph = function(graph){
			console.warn('testGraph');
			// root.children[1].edges[0].getTerminal().edges[1].getTerminal().edges[2].getTerminal().edges[0].getTerminal()
			// root=graph.getDefaultParent()
			var root = graph.getDefaultParent();
			var begin = null;
			if(!root.children){
				return(['Блок "Начало" не найден', null]);
			}
			var end = null;
			var roots = [];
			for(var i = 0, l = root.children.length; i < l; ++i){
				var val = root.children[i].value;
				// if(root.children[i].getStyle().split(';')[0] == 'text'){
					// root.children[i].setStyle(root.children[i].getStyle().replace(/(strokeColor)=[^;]+/, ''));
				// }
				// else{
					// root.children[i].setStyle(root.children[i].getStyle().replace(/(strokeColor)=[^;]+/, '$1=#000000'));
				// }
				// graph.setCellWarning(root.children[i], null);
				
				if(val && val.trim && val.replace(/<[^>]+>/g, '').trim() == 'Начало'){
					if(begin){
						warnCell(graph, root.children[i], 'Найдено больше одного блока начало');
						// root.children[i].setStyle(root.children[i].getStyle().replace(/[;]?(strokeColor=[^;]+)|$/, ';strokeColor=#FF0000'));
						// graph.setCellWarning(root.children[i], 'Найдено больше одного блока начало');
						// graph.refresh();
						return(['Найдено больше одного блока начало', root.children[i]]);
					}
					else{
						begin = root.children[i];
						if(begin.getStyle().split(';')[0] != 'ellipse'){
							warnCell(graph, root.children[i], 'Блок начала должен быть эллипсом');
							// root.children[i].setStyle(root.children[i].getStyle().replace(/[;]?(strokeColor=[^;]+)|$/, ';strokeColor=#FF0000'));
							// graph.setCellWarning(root.children[i], 'Блок начала должен быть эллипсом');
							// graph.refresh();
							return(['Блок начала должен быть эллипсом', begin]);
						}
					}
				}
				else if(!root.children[i].isEdge() && root.children[i].getStyle().split(';')[0] != 'text'){
					var isRoot = true;
					if(root.children[i].edges){
						for(var j = 0, jl = root.children[i].edges.length; j < jl; ++j){
							if(root.children[i].edges[j].target == root.children[i]){
								isRoot = false;
								break;
							}
						}
					}
					
					if(isRoot){
						roots.push(root.children[i]);
					}
				}
				
				if(val && val.trim && val.replace(/<[^>]+>/g, '').trim() == 'Конец'){
					if(end){
						warnCell(graph, root.children[i], 'Найдено больше одного блока конец');
						// root.children[i].setStyle(root.children[i].getStyle().replace(/[;]?(strokeColor=[^;]+)|$/, ';strokeColor=#FF0000'));
						// graph.setCellWarning(root.children[i], 'Найдено больше одного блока конец');
						// graph.refresh();
						return(['Найдено больше одного блока конец', root.children[i]]);
					}
					end = root.children[i];
				}
				
				if(root.children[i].isEdge()){
					if(!root.children[i].source || !root.children[i].target){
						graph.getModel().remove(root.children[i]);
						--i; --l;
						// warnCell(graph, root.children[i], 'Бездомная стрелка');
						// root.children[i].setStyle(root.children[i].getStyle().replace(/[;]?(strokeColor=[^;]+)|$/, ';strokeColor=#FF0000'));
						// graph.setCellWarning(root.children[i], 'Бездомная стрелка');
						// graph.refresh();
						// return(['Бездомная стрелка', root.children[i]]);
					}
				}
			}
			if(!begin){
				return(['Блок "Начало" не найден', null]);
			}
			var tested = {};
			var testCell = function(cell, isMain){
				if(tested[cell.getId()]){
					return(false);
				}
				tested[cell.getId()] = true;
				if(!cell.edges || !cell.edges.length){
					// warnCell(graph, cell, 'У блока нет соединений');
					// graph.setCellWarning(cell, 'У блока нет соединений');
					return(['У блока нет соединений', cell]);
				}
				var outEdges = 0;
				var inEdges = 0;
				var targets = [];
				for(var i = 0, l = cell.edges.length; i < l; ++i){
					var target = cell.edges[i].target;
					if(target != cell){
						if(targets.indexOf(target) >= 0){
							// warnCell(graph, cell, 'Из блока выходит несколько стрелок в один целевой блок');
							// graph.setCellWarning(cell, 'Из блока выходит несколько стрелок в один целевой блок');
							return(['Из блока выходит несколько стрелок в один целевой блок', cell]);
						}
						targets.push(target);
						++outEdges;
					}
					else{
						++inEdges;
					}
				}
				// if(begin != cell && inEdges == 0){
				if(cell.getStyle().split(';')[0] != 'ellipse' && inEdges == 0){
					// warnCell(graph, cell, 'У блока должно быть хотя бы одно входящее соединение');
					// graph.setCellWarning(cell, 'У блока должно быть хотя бы одно входящее соединение');
					return(['У блока должно быть хотя бы одно входящее соединение', cell]);
				}
				var style = cell.getStyle().split(';');
				var txt = (cell.getValue() || '').toLowerCase().replace(/<[^>]+>/g, '');
				if(txt == ''){
					// warnCell(graph, cell, 'Нет текста в блоке');
					return(['Нет текста в блоке', cell]);
				}
				switch(style[0]){
				case 'shape=switch':
					if(outEdges < 2){
						// warnCell(graph, cell, 'У свитча должно быть хотя бы два выхода');
						return(['У свитча должно быть хотя бы два выхода', cell]);
					}
					break;
				case 'rhombus':
					if(outEdges != 2){
						// warnCell(graph, cell, 'У условия должно быть ровно два выхода');
						return(['У условия должно быть ровно два выхода', cell]);
					}
					// if(inEdges < 2){
					//	return(['Похоже, в этот цикл нет возврата', cell]);
					// }
					break;
				case 'ellipse':
					if(outEdges > 1){
						// warnCell(graph, cell, 'У эллипса должно быть не больше одного выхода');
						return(['У эллипса должно быть не больше одного выхода', cell]);
					}
					break;
				case 'shape=hexagon':
					if(outEdges != 2){
						// warnCell(graph, cell, 'У цикла for должно быть ровно 2 выхода');
						return(['У цикла for должно быть ровно 2 выхода', cell]);
					}
					if(inEdges < 2){
						// warnCell(graph, cell, 'Похоже, в этот цикл нет возврата');
						return(['Похоже, в этот цикл нет возврата', cell]);
					}
					break;
				case 'rounded=0':
					if(outEdges != 1){
						// warnCell(graph, cell, 'У обычного блока должен быть ровно один выход');
						return(['У обычного блока должен быть ровно один выход', cell]);
					}
					var txt = (cell.getValue() || '').toLowerCase().replace(/<[^>]+>/g, '');
					if(txt.indexOf('cin') >= 0 || txt.indexOf('cout') >= 0 || txt.indexOf('printf') >= 0 || txt.indexOf('scanf') >= 0 || txt.indexOf('вывод') >= 0 || txt.indexOf('ввод') >= 0 || txt.indexOf('ввести') >= 0){
						// warnCell(graph, cell, 'Ввод/вывод изображается в паралелограмме');
						return(['Ввод/вывод изображается в паралелограмме', cell]);
					}
					break;
				default:
					if(outEdges != 1){
						// warnCell(graph, cell, 'У обычного блока должен быть ровно один выход');
						return(['У обычного блока должен быть ровно один выход', cell]);
					}
					// if(style[0] != 'rounded=0' && style[0] != 'shape=cycle_begin' && cell.getValue().replace(/<[^>]+>/g, '').replace(/"[^"]+"/g, '').indexOf('=') != -1){
						// return(['Присваивание изображается в прямоугольнике <span style="font-size: 0.8em;">('+style[0]+')</span>', cell]);
					// }
					break;
				}
				
				
				for(var i = 0, l = cell.edges.length; i < l; ++i){
					var edge = cell.edges[i];
					var cell2 = edge.getTerminal();
					if(!cell2){
						return(['Оборванное соединение', cell]);
					}
					var res = testCell(cell2, isMain);
					if(res){
						return(res);
					}
				}
				
				return(false);
			};
			var result = testCell(begin, true);
			
			if(result){
				var cell = result[1];
				if(cell){
					warnCell(graph, cell, result[0]);
					// cell.setStyle(cell.getStyle().replace(/[;]?(strokeColor=[^;]+)|$/, ';strokeColor=#FF0000'));
				}
			}
			
			console.log(roots);
			var outResult = result;
			for(var i = 0, l = roots.length; i < l; ++i){
				result = testCell(roots[i], false);
				if(result){
					outResult = result;
					var cell = result[1];
					if(cell){
						warnCell(graph, cell, result[0]);
						// cell.setStyle(cell.getStyle().replace(/[;]?(strokeColor=[^;]+)|$/, ';strokeColor=#FF0000'));
					}
				}
			}
			
			clearUnwarned(graph);
			
			return(outResult);
		};
		
		var graphAsData = function(callback){
			console.warn('Graph requested');
			mxGraph.editor.graph.clearSelection();
			try{
				mxGraph.editor.graph.cellEditor && mxGraph.editor.graph.cellEditor.focusLost();
			}
			catch(e){
				console.error(e);
			}
			var oldScale = mxGraph.editor.graph.view.scale;
			mxGraph.editor.graph.view.setScale(1);
			mxGraph.editor.graph.refresh();
			
			var svg = DS.q('svg', mxGraph.editor.graph.container)[0];
			var divBg = DS.q('.geBackgroundPage', mxGraph.editor.graph.container)[0];
			
	
			var fnUpdateSvg = function(el, isInsideFO){
				var isFO = el.nodeName == 'foreignObject';
				
				if(isInsideFO && el.nodeName != '#text' && !el.hasAttribute('xmlns')){
					el.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
				}
				
				for(var i = 0, l = el.childNodes.length; i < l; ++i){
					fnUpdateSvg(el.childNodes[i], isFO);
				}
			};
			fnUpdateSvg(svg);
			
			
			var pageSizeX = 640;
			// var pageSizeY = 920;
			var pageSizeY = 750;
			
			var pageLeft = parseInt(DS.css(divBg, 'left'));
			var pageTop = parseInt(DS.css(divBg, 'top'));
			var pageWidth = parseInt(DS.css(divBg, 'width'));
			var pageHeight = parseInt(DS.css(divBg, 'height'));
			
			var pageCountX = Math.round(pageWidth / pageSizeX);
			var pageCountY = Math.round(pageHeight / pageSizeY);
			
			console.log('pageCount', pageCountX, pageCountY);
			
			var w = svg.width.baseVal.value.toFixed(0);
			var h = svg.height.baseVal.value.toFixed(0);
			if(w == 0){
				w = pageWidth + 1 + pageLeft;
			}
			if(h == 0){
				h = pageHeight + 1 + pageTop;
			}
			console.info('size', w, h);
			
			/* var tab3 = DS.gid('tab3');
			var to = 10;
			
			
			if(w == 0 || h == 0){
				tab3.style.display = '';
				setTimeout(function(){
					console.warn('w == 0 || h == 0');
					DS.page.graphAsData(callback);
					tab3.style.display = 'none';
					to += 10;
				}, to);
				return;
			} */
			
			DS.page.setTaskField('graph_svg', DS.JSON.encode({
				w: w
				,h: h
				,pageLeft: pageLeft
				,pageTop: pageTop
				,pageWidth: pageWidth
				,pageHeight: pageHeight
				,svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+w+'" height="'+h+'">'+svg.innerHTML.replace(/<br[^>]*>/g, '<br />').replace(/&nbsp;/g, ' ')+'</svg>'
			}));
			
			var cvs = document.createElement('canvas');
			cvs.width = w;
			cvs.height = h;
			
			console.log(cvs);
			
			/* document.body.appendChild(cvs);
			canvg(cvs, svg.outerHTML);
			var png = cvs.toDataURL('image/png');
			document.body.removeChild(cvs);
			
			return(png); */
			
			var ctx = cvs.getContext('2d');

			var DOMURL = window.URL || window.webkitURL || window;

			var img = new Image();
			svg2 = new Blob(['<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+w+'" height="'+h+'">'+svg.innerHTML.replace(/<br[^>]*>/g, '<br />').replace(/&nbsp;/g, ' ')+'</svg>'], {type: 'image/svg+xml'});
			// var url = DOMURL.createObjectURL(svg2);
			
			
			mxGraph.editor.graph.view.setScale(oldScale);
			mxGraph.editor.graph.refresh();
			
			var reader = new FileReader();
			reader.readAsDataURL(svg2);
			// console.warn('1041');
			img.onload = function(){
				console.warn('img.onload()');
				// console.warn('1043');
				ctx.drawImage(img, 0, 0);
				// cvs2 = cvs_trim(cvs);
				cvs2 = cvsSubRect(cvs, pageLeft, pageTop, pageWidth, pageHeight);
				// cvs2 = cvs;
				
				var out = [];
				
				_isIntersecting = false;
				
				var n = 1;
				
				for(var y = 0; y < pageCountY; ++y){
					for(var x = 0; x < pageCountX; ++x){
						var pageCvs = cvsSubRect(cvs2, pageSizeX * x + (x ? 1 : 0), pageSizeY * y + (y ? 1 : 0), pageSizeX - (x ? 1 : 0), pageSizeY - (y ? 1 : 0));
						
						var ctx2 = pageCvs.getContext('2d');
						
						var data = ctx2.getImageData(0,0,pageCvs.width, pageCvs.height).data;
						var isEmpty = !Array.prototype.some.call(data, function(p){return p>0;});
						
						if(!isEmpty){
							var text = 'Рисунок '+n+' — Блок-схема алгоритма';
							ctx2.font = '14px "Times New Roman", "Liberation Serif", Serif';
							var tm = ctx2.measureText(text);
							
							var yPos = pageCvs.height - 1 - tm.actualBoundingBoxDescent;
							for(var i = pageCvs.height - 1; i > 0; i -= 20){
								data = ctx2.getImageData(0, i, pageCvs.width, 20).data;
								if(Array.prototype.some.call(data, function(p){return p>0;})){
									var newY = i + 20 + tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent;
									if(newY < yPos){
										yPos = newY;
									}
									break;
								}
							}
							
							var rects = [
								[0, 0, pageCvs.width, 1]
								,[0, 0, 1, pageCvs.height]
								,[pageCvs.width - 1, 0, 1, pageCvs.height]
								,[0, pageCvs.height - 1, pageCvs.width, 1]
							];
							
							for(var i = 0, l = rects.length; i < l; ++i){
								data = ctx2.getImageData.apply(ctx2, rects[i]).data;
								if(Array.prototype.some.call(data, function(p){return p>0;}))
								{
									_isIntersecting = true;
									break;
								}
							}
							
							// ctx2.fillText(text, (pageCvs.width - tm.width) / 2, yPos);

							if(n == 1){
								
								// ctx2.font = '14pt "Times New Roman", "Liberation Serif", Serif';
								// ctx2.fillText('Представим описание алгоритмов в графическом виде на рисунках ниже.', 40, 10);
							}
							
							++n;
							out.push(pageCvs.toDataURL('image/png'));
							
							
						}
					}
				}
				
				try{
					_errorList = [];
					var test = testGraph(mxGraph.editor.graph);
					if(test){
						console.info(test);
						_errorList.push(test[0]);
					}
				}
				catch(e){
					console.error(e);
				}
				
				try{
					callback(out);
				}
				catch(e){
					console.error(e);
				}
				// document.body.removeChild(cvs);
				// DOMURL.revokeObjectURL(url);
			}

			reader.onload = function(e){
				console.warn('reader.onload()');
				var svgDataURL = e.target.result;
				console.warn(svgDataURL);
				img.src = svgDataURL;
			}

			// img.src = url;
		};
		
		var savePng = function(callback){
			isSaving = true;
			graphAsData(function(data){
				DS.page.setTaskField('graph_png', DS.JSON.encode(data));
				DS.msg('Блок-схема отрисована', 'green');
				isSaving = false;
				callback && callback();
				
				/* var a = [];
				for(var i = 0, l = data.length; i < l; ++i){
					a.push('<img width="240" src="'+data[i]+'" />');
				}
				DS.alert(a.join('')); */
			});
		};
		
		this.getXml = function(){
			mxUtils.getXml(mxGraph.editor.getGraphXml())
		};
		this.setXml = function(xml, resetUndo){
			var doc = mxUtils.parseXml(xml);
			mxGraph.editor.graph.setAllowDanglingEdges(false);
			mxGraph.editor.graph.setDisconnectOnMove(false);
			mxGraph.editor.setGraphXml(doc.documentElement);
			if(resetUndo){
				mxGraph.editor.undoManager.clear();
			}
		};
		
		// Initialize all required stuff, use `element` as render root
		this.initialize = function(element){
			
			EditorUi.prototype.formatEnabled = false;
			// mxCellEditor.prototype.blurEnabled = true;
			
			// Adds required resources (disables loading of fallback properties, this can only
			// be used if we know that all keys are defined in the language specific file)
			mxResources.loadDefaultBundle = false;
			var bundle = mxResources.getDefaultBundle(RESOURCE_BASE, mxLanguage) ||
				mxResources.getSpecialBundle(RESOURCE_BASE, mxLanguage);

			// Fixes possible asynchronous requests
			
			if(!mxThemes){
				mxUtils.getAll([bundle, STYLE_PATH + '/default.xml'], function(xhr){
					// Adds bundle text to resources
					mxResources.parse(xhr[0].getText());
					
					// Configures the default graph theme
					mxThemes = new Object();
					mxThemes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement(); 
					
					initGraph(element);
				}, function(){
					document.body.innerHTML = '<center style="margin-top:10%;">Error loading resource files. Please check console.</center>';
				});
			}
			else{
				initGraph(element);
			}
			//DS.page.mxGraph.editor.getGraphXml()
			
			DS.page.editGraph = function(){
				var wnd = DS.create({
					DStype: 'window'
					,destroyOnClose: true
					,reqWidth: 600
					,items: [
						[
							'title'
							,'Редактировать разметку'
							,'->'
							,{DStype: 'window-button-close'}
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
											,name: 'xml'
											,label: 'XML разметка'
										}
										,{
											DStype: 'button'
											,label: 'Применить'
											,listeners: {
												'click': function(){
													var xml = this.getForm().getFields().xml;
													
													var doc = mxUtils.parseXml(xml);
													mxGraph.editor.graph.setAllowDanglingEdges(false);
													mxGraph.editor.graph.setDisconnectOnMove(false);
													mxGraph.editor.setGraphXml(doc.documentElement);
													mxGraph.editor.undoManager.clear();
												}
											}
										}
									]
								}
							]
						}
					]
				}).open();
				
				wnd.find('form-panel')[0].setFields({xml: mxUtils.getXml(mxGraph.editor.getGraphXml())});
			};
		
			if(DS.page.getTaskField('id') == '63606'){
				topMenuEdit = DS.page.topMenu.addButton('Редактировать разметку');
				DS.addEvent(topMenuEdit, 'click', function(){
					DS.page.editGraph();
				});
				DS.page.cb.canPaste = function(){return(true);}
			}
		};
		
		// close task, finish all tasks and network queries, then run callback
		this.shutdown = function(callback){
			if(_saveInterval){
				clearInterval(_saveInterval);
				_saveInterval = null;
			}
			
			if(isSaving){
				setTimeout(function(){
					this.shutdown(callback);
				}.bind(this), 100);
				return;
			}
			try{
				mxGraph.destroy();
			}
			catch(e){
				console.error(e);
			}
			
			if(topMenuEdit){
				DS.page.topMenu.removeButton(topMenuEdit);
				topMenuEdit = null;
			}
			
			callback();
		};
		
		this.forceSave = function(callback){
			mxGraph.editor.graph.clearSelection();
			mxGraph.editor.graph.setEnabled(false);
			mxGraph.keyHandler.setEnabled(false);
			
			var xml = mxUtils.getXml(mxGraph.editor.getGraphXml());
			DS.page.setTaskField('algo_graph', xml);
			
			savePng(callback);
		};
		
		this.getError = function(){
			if(!mxGraph.editor || mxUtils.getXml(mxGraph.editor.getGraphXml()).length < 270){
				return('Нарисуйте блок-схему алгоритма');
			}
			
			if(_isIntersecting){
				return('Блок-схема пересекает границы листа');
			}
			
			if(_errorList.length){
				return(_errorList.join('<br/>'));
			}
			
			return(null);
		};
		
		// called after page show
		this.show = function(){
			mxGraph.editor.graph.setEnabled(true);
			mxGraph.keyHandler.setEnabled(true);
			mxGraph.refresh();
			
			_saveInterval = setInterval(function(){
				var xml = mxUtils.getXml(mxGraph.editor.getGraphXml());
				DS.page.setTaskField('algo_graph', xml);
				try{
					console.info(testGraph(mxGraph.editor.graph));
				}
				catch(e){
					console.error(e);
				}
			}, 1000);
		};
		
		// called before page hide
		this.hide = function(){
			mxGraph.editor.graph.clearSelection();
			mxGraph.editor.graph.setEnabled(false);
			mxGraph.keyHandler.setEnabled(false);
			
			var xml = mxUtils.getXml(mxGraph.editor.getGraphXml());
			DS.page.setTaskField('algo_graph', xml);
			
			if(_saveInterval){
				clearInterval(_saveInterval);
				_saveInterval = null;
			}
			
			// savePng();
			/* graphAsData(function(imgs){
				var data = [];
				for(var i = 0, l = imgs.length; i < l; ++i){
					data.push('<img width="320" src="'+imgs[i]+'" />');
				}
				DS.alert(data.join(''));
			}); */
		};
		
		this.getScripts = function(){
			return([
				// 'mxgraph/javascript/examples/grapheditor/www/js/Init.js',
				'mxgraph/javascript/examples/grapheditor/www/deflate/pako.min.js',
				'mxgraph/javascript/examples/grapheditor/www/deflate/base64.js',
				'mxgraph/javascript/examples/grapheditor/www/jscolor/jscolor.js',
				'mxgraph/javascript/examples/grapheditor/www/sanitizer/sanitizer.min.js',
				'mxgraph/javascript/examples/grapheditor/www/../../../src/js/mxClient.min.js',
				
				// 'mxgraph/javascript/src/js/mxClient.js',
				// 'mxgraph/javascript/src/js/util/mxLog.js',
				// 'mxgraph/javascript/src/js/util/mxObjectIdentity.js',
				// 'mxgraph/javascript/src/js/util/mxDictionary.js',
				// 'mxgraph/javascript/src/js/util/mxResources.js',
				// 'mxgraph/javascript/src/js/util/mxPoint.js',
				// 'mxgraph/javascript/src/js/util/mxRectangle.js',
				// 'mxgraph/javascript/src/js/util/mxEffects.js',
				// 'mxgraph/javascript/src/js/util/mxUtils.js',
				// 'mxgraph/javascript/src/js/util/mxConstants.js',
				// 'mxgraph/javascript/src/js/util/mxEventObject.js',
				// 'mxgraph/javascript/src/js/util/mxMouseEvent.js',
				// 'mxgraph/javascript/src/js/util/mxEventSource.js',
				// 'mxgraph/javascript/src/js/util/mxEvent.js',
				// 'mxgraph/javascript/src/js/util/mxXmlRequest.js',
				// 'mxgraph/javascript/src/js/util/mxClipboard.js',
				// 'mxgraph/javascript/src/js/util/mxWindow.js',
				// 'mxgraph/javascript/src/js/util/mxForm.js',
				// 'mxgraph/javascript/src/js/util/mxImage.js',
				// 'mxgraph/javascript/src/js/util/mxDivResizer.js',
				// 'mxgraph/javascript/src/js/util/mxDragSource.js',
				// 'mxgraph/javascript/src/js/util/mxToolbar.js',
				// 'mxgraph/javascript/src/js/util/mxUndoableEdit.js',
				// 'mxgraph/javascript/src/js/util/mxUndoManager.js',
				// 'mxgraph/javascript/src/js/util/mxUrlConverter.js',
				// 'mxgraph/javascript/src/js/util/mxPanningManager.js',
				// 'mxgraph/javascript/src/js/util/mxPopupMenu.js',
				// 'mxgraph/javascript/src/js/util/mxAutoSaveManager.js',
				// 'mxgraph/javascript/src/js/util/mxAnimation.js',
				// 'mxgraph/javascript/src/js/util/mxMorphing.js',
				// 'mxgraph/javascript/src/js/util/mxImageBundle.js',
				// 'mxgraph/javascript/src/js/util/mxImageExport.js',
				// 'mxgraph/javascript/src/js/util/mxAbstractCanvas2D.js',
				// 'mxgraph/javascript/src/js/util/mxXmlCanvas2D.js',
				// 'mxgraph/javascript/src/js/util/mxSvgCanvas2D.js',
				// 'mxgraph/javascript/src/js/util/mxVmlCanvas2D.js',
				// 'mxgraph/javascript/src/js/util/mxGuide.js',
				// 'mxgraph/javascript/src/js/shape/mxStencil.js',
				// 'mxgraph/javascript/src/js/shape/mxShape.js',
				// 'mxgraph/javascript/src/js/shape/mxStencilRegistry.js',
				// 'mxgraph/javascript/src/js/shape/mxMarker.js',
				// 'mxgraph/javascript/src/js/shape/mxActor.js',
				// 'mxgraph/javascript/src/js/shape/mxCloud.js',
				// 'mxgraph/javascript/src/js/shape/mxRectangleShape.js',
				// 'mxgraph/javascript/src/js/shape/mxEllipse.js',
				// 'mxgraph/javascript/src/js/shape/mxDoubleEllipse.js',
				// 'mxgraph/javascript/src/js/shape/mxRhombus.js',
				// 'mxgraph/javascript/src/js/shape/mxPolyline.js',
				// 'mxgraph/javascript/src/js/shape/mxArrow.js',
				// 'mxgraph/javascript/src/js/shape/mxArrowConnector.js',
				// 'mxgraph/javascript/src/js/shape/mxText.js',
				// 'mxgraph/javascript/src/js/shape/mxTriangle.js',
				// 'mxgraph/javascript/src/js/shape/mxHexagon.js',
				// 'mxgraph/javascript/src/js/shape/mxLine.js',
				// 'mxgraph/javascript/src/js/shape/mxImageShape.js',
				// 'mxgraph/javascript/src/js/shape/mxLabel.js',
				// 'mxgraph/javascript/src/js/shape/mxCylinder.js',
				// 'mxgraph/javascript/src/js/shape/mxConnector.js',
				// 'mxgraph/javascript/src/js/shape/mxSwimlane.js',
				// 'mxgraph/javascript/src/js/layout/mxGraphLayout.js',
				// 'mxgraph/javascript/src/js/layout/mxStackLayout.js',
				// 'mxgraph/javascript/src/js/layout/mxPartitionLayout.js',
				// 'mxgraph/javascript/src/js/layout/mxCompactTreeLayout.js',
				// 'mxgraph/javascript/src/js/layout/mxRadialTreeLayout.js',
				// 'mxgraph/javascript/src/js/layout/mxFastOrganicLayout.js',
				// 'mxgraph/javascript/src/js/layout/mxCircleLayout.js',
				// 'mxgraph/javascript/src/js/layout/mxParallelEdgeLayout.js',
				// 'mxgraph/javascript/src/js/layout/mxCompositeLayout.js',
				// 'mxgraph/javascript/src/js/layout/mxEdgeLabelLayout.js',
				// 'mxgraph/javascript/src/js/layout/hierarchical/model/mxGraphAbstractHierarchyCell.js',
				// 'mxgraph/javascript/src/js/layout/hierarchical/model/mxGraphHierarchyNode.js',
				// 'mxgraph/javascript/src/js/layout/hierarchical/model/mxGraphHierarchyEdge.js',
				// 'mxgraph/javascript/src/js/layout/hierarchical/model/mxGraphHierarchyModel.js',
				// 'mxgraph/javascript/src/js/layout/hierarchical/model/mxSwimlaneModel.js',
				// 'mxgraph/javascript/src/js/layout/hierarchical/stage/mxHierarchicalLayoutStage.js',
				// 'mxgraph/javascript/src/js/layout/hierarchical/stage/mxMedianHybridCrossingReduction.js',
				// 'mxgraph/javascript/src/js/layout/hierarchical/stage/mxMinimumCycleRemover.js',
				// 'mxgraph/javascript/src/js/layout/hierarchical/stage/mxCoordinateAssignment.js',
				// 'mxgraph/javascript/src/js/layout/hierarchical/stage/mxSwimlaneOrdering.js',
				// 'mxgraph/javascript/src/js/layout/hierarchical/mxHierarchicalLayout.js',
				// 'mxgraph/javascript/src/js/layout/hierarchical/mxSwimlaneLayout.js',
				// 'mxgraph/javascript/src/js/model/mxGraphModel.js',
				// 'mxgraph/javascript/src/js/model/mxCell.js',
				// 'mxgraph/javascript/src/js/model/mxGeometry.js',
				// 'mxgraph/javascript/src/js/model/mxCellPath.js',
				// 'mxgraph/javascript/src/js/view/mxPerimeter.js',
				// 'mxgraph/javascript/src/js/view/mxPrintPreview.js',
				// 'mxgraph/javascript/src/js/view/mxStylesheet.js',
				// 'mxgraph/javascript/src/js/view/mxCellState.js',
				// 'mxgraph/javascript/src/js/view/mxGraphSelectionModel.js',
				// 'mxgraph/javascript/src/js/view/mxCellEditor.js',
				// 'mxgraph/javascript/src/js/view/mxCellRenderer.js',
				// 'mxgraph/javascript/src/js/view/mxEdgeStyle.js',
				// 'mxgraph/javascript/src/js/view/mxStyleRegistry.js',
				// 'mxgraph/javascript/src/js/view/mxGraphView.js',
				// 'mxgraph/javascript/src/js/view/mxGraph.js',
				// 'mxgraph/javascript/src/js/view/mxCellOverlay.js',
				// 'mxgraph/javascript/src/js/view/mxOutline.js',
				// 'mxgraph/javascript/src/js/view/mxMultiplicity.js',
				// 'mxgraph/javascript/src/js/view/mxLayoutManager.js',
				// 'mxgraph/javascript/src/js/view/mxSwimlaneManager.js',
				// 'mxgraph/javascript/src/js/view/mxTemporaryCellStates.js',
				// 'mxgraph/javascript/src/js/view/mxCellStatePreview.js',
				// 'mxgraph/javascript/src/js/view/mxConnectionConstraint.js',
				// 'mxgraph/javascript/src/js/handler/mxGraphHandler.js',
				// 'mxgraph/javascript/src/js/handler/mxPanningHandler.js',
				// 'mxgraph/javascript/src/js/handler/mxPopupMenuHandler.js',
				// 'mxgraph/javascript/src/js/handler/mxCellMarker.js',
				// 'mxgraph/javascript/src/js/handler/mxSelectionCellsHandler.js',
				// 'mxgraph/javascript/src/js/handler/mxConnectionHandler.js',
				// 'mxgraph/javascript/src/js/handler/mxConstraintHandler.js',
				// 'mxgraph/javascript/src/js/handler/mxRubberband.js',
				// 'mxgraph/javascript/src/js/handler/mxHandle.js',
				// 'mxgraph/javascript/src/js/handler/mxVertexHandler.js',
				// 'mxgraph/javascript/src/js/handler/mxEdgeHandler.js',
				// 'mxgraph/javascript/src/js/handler/mxElbowEdgeHandler.js',
				// 'mxgraph/javascript/src/js/handler/mxEdgeSegmentHandler.js',
				// 'mxgraph/javascript/src/js/handler/mxKeyHandler.js',
				// 'mxgraph/javascript/src/js/handler/mxTooltipHandler.js',
				// 'mxgraph/javascript/src/js/handler/mxCellTracker.js',
				// 'mxgraph/javascript/src/js/handler/mxCellHighlight.js',
				// 'mxgraph/javascript/src/js/editor/mxDefaultKeyHandler.js',
				// 'mxgraph/javascript/src/js/editor/mxDefaultPopupMenu.js',
				// 'mxgraph/javascript/src/js/editor/mxDefaultToolbar.js',
				// 'mxgraph/javascript/src/js/editor/mxEditor.js',
				// 'mxgraph/javascript/src/js/io/mxCodecRegistry.js',
				// 'mxgraph/javascript/src/js/io/mxCodec.js',
				// 'mxgraph/javascript/src/js/io/mxObjectCodec.js',
				// 'mxgraph/javascript/src/js/io/mxCellCodec.js',
				// 'mxgraph/javascript/src/js/io/mxModelCodec.js',
				// 'mxgraph/javascript/src/js/io/mxRootChangeCodec.js',
				// 'mxgraph/javascript/src/js/io/mxChildChangeCodec.js',
				// 'mxgraph/javascript/src/js/io/mxTerminalChangeCodec.js',
				// 'mxgraph/javascript/src/js/io/mxGenericChangeCodec.js',
				// 'mxgraph/javascript/src/js/io/mxGraphCodec.js',
				// 'mxgraph/javascript/src/js/io/mxGraphViewCodec.js',
				// 'mxgraph/javascript/src/js/io/mxStylesheetCodec.js',
				// 'mxgraph/javascript/src/js/io/mxDefaultKeyHandlerCodec.js',
				// 'mxgraph/javascript/src/js/io/mxDefaultToolbarCodec.js',
				// 'mxgraph/javascript/src/js/io/mxDefaultPopupMenuCodec.js',
				// 'mxgraph/javascript/src/js/io/mxEditorCodec.js',

				
				'mxgraph/javascript/examples/grapheditor/www/js/EditorUi.js',
				'mxgraph/javascript/examples/grapheditor/www/js/Editor.js',
				'mxgraph/javascript/examples/grapheditor/www/js/Sidebar.js',
				'mxgraph/javascript/examples/grapheditor/www/js/Graph.js',
				'mxgraph/javascript/examples/grapheditor/www/js/Format.js',
				'mxgraph/javascript/examples/grapheditor/www/js/Shapes.js',
				'mxgraph/javascript/examples/grapheditor/www/js/Actions.js',
				'mxgraph/javascript/examples/grapheditor/www/js/Menus.js',
				'mxgraph/javascript/examples/grapheditor/www/js/Toolbar.js',
				'mxgraph/javascript/examples/grapheditor/www/js/Dialogs.js'
			]);
		};
		
		this.getStyles = function(){
			return({
				both: [
					'mxgraph/javascript/src/css/common.css',
					'mxgraph/javascript/examples/grapheditor/www/styles/grapheditor.css'
				]
				,light: [
					// 'css/modules/task-light.css'
				]
				,dark: [
					'mxgraph/javascript/examples/grapheditor/www/styles/dark.css'
					,'css/modules/task-scheme-dark.css'
				]
			});
		};
	});
});
