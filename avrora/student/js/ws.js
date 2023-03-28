DS.ready(function(){
(function(DS, _util){
	
	var _cmdCache = [];
	var _sentCmds = {};
	var _sentCmdsUnauth = {};
	var _isAuth = false;
	
	DS.addEvent(DS, 'arm/authorized', function(){
		for(var i in _sentCmds){
			_util.websocket._regWs.send(_sentCmds[i]);
		}
		_isAuth = true;
	});
	
	_util.websocket = {
		_failCount: 0
		,_regWs: null
		,_ready: false
		,onInit: null
		,_nextMsg: 0
		,_fns: {}
		,_skipInit: false
		,disconnect: function(){
			_util.websocket._skipInit = true;
			_util.websocket._regWs.close();
		}
		,init: function(arg){
			if(_util.websocket._skipInit){
				return;
			}
			if(arg){
				_util.websocket.onInit = arg;
			}
			var ws = _util.websocket._regWs = new WebSocket(DS.config.websocket.registry_url);
			ws.onopen = function(){
				_isAuth = false;
				// console.warn('open');
				_util.websocket._ready = true;
				_util.websocket._failCount = 0;
				if(_util.websocket.onInit){
					_util.websocket.onInit();
				}
				/* for(var i in _sentCmds){
					_util.websocket._regWs.send(_sentCmds[i]);
				}
				for(var i = 0, l = _cmdCache.length; i < l; ++i){
					_util.websocket._regWs.send(_cmdCache[i]);
				}
				_cmdCache = []; */
				
				console.log(_sentCmdsUnauth);
				/* for(var i in _sentCmdsUnauth){
					_util.websocket._regWs.send(_sentCmdsUnauth[i]);
				} */
				
				DS.invokeEvent('ws/connected');
			};
			
			ws.onclose = function(){
				DS.invokeEvent('ws/disconnected');
				
				/* for(var i in _util.websocket._fns){
					_util.websocket._fns[i]({success: false, error: 'Connection lost!'});
				}
				_util.websocket._fns = {}; */
				
				// console.warn('close', _util.websocket._ready ? 'ready' : 'not');
				if(_util.websocket._ready){
					_util.websocket._ready = false;
					_util.websocket.init();
				}
				else{
					var to = 100;
					if(_util.websocket._failCount > 10){
						to = 1000;
					}
					if(_util.websocket._failCount > 60){
						to = 10000;
					}
					setTimeout(function(){
						_util.websocket.init();
					}, to);
				}
			};
			
			ws.onerror = function(e){
				// console.warn('error');
				if(_util.websocket._ready){
					console.error(e);
				}
				++_util.websocket._failCount;
			};
			
			ws.onmessage = function(evt){
				// console.error(evt.data.substr(0, 256));
				console.error(DS.util.formatSize(evt.data.length));
				
				//evt.data
				var str = [];
				for(var i = 0, l = evt.data.length; i < l; ++i){
					var c = evt.data[i];
					var d = c.charCodeAt(0);
					if(d == 10 || d == 13 || d == 9 || d >= 32){
						str.push(c);
					}
				}
				str = str.join('');
				console.warn(str);
				
				var json = DS.JSON.decode(str);
				
				if(!json.success && 'error' in json){
					DS.invokeEvent('arm/error', json.error);
				}
				
				switch(json._type){
				case 'rsp':
					var idMessage = json.arm_task_id;
					delete _sentCmds[idMessage];
					delete _sentCmdsUnauth[idMessage];
					if(_util.websocket._fns[idMessage]){
						_util.websocket._fns[idMessage](json);
						delete _util.websocket._fns[idMessage];
					}
					break;
				case 'msg':
					DS.invokeEvent('msg/'+json.mess_id, json);
					break;
				}
			};
		}
		,send: function($cmdid, $args, fn){
			var $msgid = _util.websocket._nextMsg++;
			$args = {data: $args}
			$args.ser_task = $cmdid;
			$args.arm_task_id = $msgid;
			$args.v = window.__noCacheNumber;
			
			if(fn){
				_util.websocket._fns[$msgid] = fn; 
			}
			
			var xml = DS.JSON.encode($args);
			
			console.warn("send("+xml+")");
			
			if(_isAuth){
				_sentCmds[$msgid] = xml;
			}
			else{
				_sentCmdsUnauth[$msgid] = xml;
			}
			if(_util.websocket._ready){
				_util.websocket._regWs.send(xml);
				setTimeout(function(){
					if(_util.websocket._fns[$msgid]){
						_util.websocket._fns[$msgid]({success: false, error: 'Request timed out (60s)!'});
						delete _util.websocket._fns[$msgid];
					}
				}, 60000);
			}
			/* else{
				_cmdCache.push(xml);
			} */
		}
	};
	
	DS.armCmd = _util.websocket.send;
	
})(DS, DS.util);
});
