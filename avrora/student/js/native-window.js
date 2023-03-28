DS.ready(function(){
	if(DS.util.urlParam('ArmUserId') != 526){
		// return;
	}
	
	var _listWindows = [];
	
	var oldProcess = DS.classes.window.process;
	DS.classes.window.process = function(c, o){
		oldProcess.call(this, c, o);
		if(!c.reqNative){
			return;
		}
		
		o._oldClose = o.close;
		o.close = function(){
			// oldClose.call(this);
			
			if(o._nativeWindow){
				o._nativeWindow.close();
			}
		};
		// wnd.
		// o.open
		// o.close
	};
	var oldOnLoadElement = DS.classes.window.onLoadElement;
	DS.classes.window.onLoadElement = function(o){
		oldOnLoadElement.call(this, o);
		if(!o.config.reqNative){
			return;
		}
		
		var w = parseInt(o.config.reqWidth) || 100;
		var h = parseInt(o.config.height) || 100;
		
		var wnd = window.open(/*'', '', 'popup,width='+w+',height='+h*/);
		
		wnd.DS = DS;
		
		wnd.document.body.id = 'element-'+o.config.id;
		
		var base = window.document.createElement('base');
		base.href = location.protocol+'//'+location.hostname+location.pathname;
		wnd.document.head.appendChild(base);
		var list = DS.q('style, link[rel=stylesheet]');
		for(var i = 0, l = list.length; i < l; ++i){
			var n = list[i].cloneNode();
			if(n.nodeName == 'STYLE'){
				n.innerText = list[i].innerText;
			}
			wnd.document.head.appendChild(n);
		}
		
		var div = document.createElement('div');
		div.innerHTML = o.config.title;
		wnd.document.title = div.textContent;
		
		var el = DS.q('.ds-wnd-cont', o.getObject())[0];
		while(el.firstChild){
			wnd.document.body.appendChild(el.firstChild);
		}
		
		o._nativeWindow = wnd;
		
		wnd.onunload = function(){
			_listWindows.splice(_listWindows.indexOf(wnd), 1);
			o._oldClose.call(o);
			
		};
		
		DS.invokeEvent('newWindow', wnd);
		_listWindows.push(wnd);
		
		o.getObjectSelf().style.display = 'none';
	};
	
	var oldGid = DS.gid;
	DS.gid = function(id){
		var el = oldGid.call(this, id);
		if(el){
			return(el);
		}
		for(var i = 0, l = _listWindows.length; i < l; ++i){
			el = _listWindows[i].document.getElementById(id);
			if(el){
				return(el);
			}
		}
		return(null);
	};
});
