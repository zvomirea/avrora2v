DS.ready(function(){
	DS.mod(['tinymce', 'TMCEInit']);
	
	var mceInitSkin = null;
	
	var _saveInterval = null;
	
	var fn = function(){
		var isDark = DS.page.userPrefs.get('arm/darkMode');
		var link = DS.gid('u0');
		if(link){			
			if(isDark){
				link.href = link.href.replace('/lightgray/', '/ds/');
			}
			else{
				link.href = link.href.replace('/ds/', '/lightgray/');
			}
		}
		for(var i = 0, l = tinymce.editors.length; i < l; ++i){
			var tinyMCE = tinymce.editors[i];
			try{
				var innerWindow = document.getElementById(tinyMCE.id+'_ifr').contentWindow;
				var list = innerWindow.document.getElementsByTagName('link');
				for(var j = 0, jl = list.length; j < jl; ++j){
					var link = list[j];
					var basename = link.href.split('/').pop();
					console.log(basename);
					if(basename == 'mce-dark.css' || basename == 'mce-light.css'){
						if(isDark){
							link.href = link.href.replace('mce-light.css', 'mce-dark.css');
						}
						else{
							link.href = link.href.replace('mce-dark.css', 'mce-light.css');
						}
						break;
					}
				}
			}
			catch(e){
				console.error(e);
			}
		}
	};
	DS.addEvent(DS, 'darkmode/deactivate', fn);
	DS.addEvent(DS, 'darkmode/activate', fn);
	
	DS.page.toolMCE = function(taskField){
		var tinyMCE = null;
		var elTextarea = null;
						
		this.initialize = function(element){
			// Initialize all required stuff, use `element` as render root
			
			elTextarea = document.createElement('textarea');
			element.appendChild(elTextarea);
			elTextarea.value = DS.page.getTaskField(taskField) || '';
			
			DS.mod(['tinymce', 'TMCEInit'], function(){
				
				if(!mceInitSkin){
					mceInitSkin = DS.page.userPrefs.get('arm/darkMode') ? 'ds' : 'lightgray';
				}
				
				DS.TMCEInit({
					mode: 'exact',
					target: elTextarea,
					resize: false,
					skin: mceInitSkin,
					save_onsavecallback: function(){
						DS.page.taskSave();
					},
					content_css: 'css/modules/mce-'+(DS.page.userPrefs.get('arm/darkMode') ? 'dark' : 'light')+'.css'
				}).then(function(e){
					tinyMCE = e[0];
					
					tinyMCE.on('BeforeGetContent', function(){
						try{
							var innerWindow = document.getElementById(tinyMCE.id+'_ifr').contentWindow;
							var list = innerWindow.document.getElementsByTagName('table');
							for(var i = 0, l = list.length; i < l; ++i){
								list[i].setAttribute('border', '1');
							}
							for(var i = 0, l = list.length; i < l; ++i){
								var list2 = list[i].getElementsByTagName('table');
								for(var j = 0, jl = list2.length; j < jl; ++j){
									list2[j].parentNode.removeChild(list2[j]);
								}
							}
							
						}
						catch(e){
							console.error(e);
						}
					});
				});
			});
		};
		
		// close task, finish all tasks and network queries, then run callback
		this.shutdown = function(callback){
			tinyMCE && tinyMCE.remove();
			tinyMCE = null;
			
			if(_saveInterval){
				clearInterval(_saveInterval);
				_saveInterval = null;
			}
			
			DS.page.setTaskField(taskField, elTextarea.value);
			callback();
		};
		
		// called after page show
		this.show = function(){
			tinyMCE && tinyMCE.execCommand('dsResize');
			
			// console.warn('setInterval');
			_saveInterval = setInterval(function(){
				if(tinyMCE.isDirty()){
					DS.page.setTaskField(taskField, tinyMCE.getContent());
					tinyMCE.setDirty(false);
				}
			}, 1000);
		};
		
		this.hide = function(){
			// called before page hide
			if(tinyMCE){
				DS.page.setTaskField(taskField, tinyMCE.getContent());
			}
			// console.warn('clearInterval');
			if(_saveInterval){
				clearInterval(_saveInterval);
				_saveInterval = null;
			}
		};
		
		this.forceSave = function(callback){
			if(tinyMCE){
				DS.page.setTaskField(taskField, tinyMCE.getContent());
			}
			callback();
		};
		
		this.getError = function(){
			if(tinyMCE && tinyMCE.getContent().trim() == ''){
				return('Раздел '+this.getTitle()+' должен быть заполнен');
			}
			return(null);
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
	};
});
