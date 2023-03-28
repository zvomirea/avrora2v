DS.ready(function(){
	DS.page.registerModule('lecture', function(){
		var elWrapper = null;
		var elMainScreen = null;
		var elChatScreen = null;
		var $videoPlayer = null;
		
		var initMainScreen = function(){
			elMainScreen = document.createElement('div');
			elMainScreen.className = 'lecture_mod_wrap';
			
			var elPanelContent = document.createElement('div');
			elPanelContent.className = 'lecture_mod_content';
			elMainScreen.appendChild(elPanelContent);
			
			
			elWrapper.appendChild(elMainScreen);
			
			$videoPlayer = DS.create({
				DStype: 'videoplayer',
				renderTo: elPanelContent,
				width: '100%',
				displaystyle: 'block; height: 100%',
				embed: false,
				height: '100%',
				title: 'Лекция',
				controls: false
			});
		};
		
		var _isSyncinc = true;
		var _syncQueue = [];
		var ExecuteSync = function(ev){
			if(_isSyncinc){
				_syncQueue.push(ev);
				return;
			}
			switch(ev.a){
			case 'open':
				_isSyncinc = true;
				DS.ARM.getAttachmentInfo(ev.id, function(d){
					if(d.success){
						$videoPlayer.setSrc([
							// {url:d.data.url, ctype: 'video/mp4', pri: 0}
							{url:d.data.url, ctype: 'video/webm; codecs="vp8, opus"', pri: 0}
							//
						]);
						// $videoPlayer.play();
						// $videoPlayer.SetTime(0);
					}
					_isSyncinc = false;
					var oldQueue = _syncQueue;
					_syncQueue = [];
					for(var i = 0, l = oldQueue.length; i < l; ++i){
						ExecuteSync(oldQueue[i]);
					}
				});
				break;
			case 'play':
				$videoPlayer.play();
				break;
			case 'pause':
				$videoPlayer.stop();
				break;
			case 'seek':
				$videoPlayer.SetTime(ev.t);
				break;
			}
		};
				
		var elChatLog = null;
		var elChatText = null;
		var elChatButton = null;
		var _listMessages = [];
		var _lastChatMessage = null;
		var insertChatMessage = function(data){
			var time = data.date_added = parseInt(data.date_added);
			var div = document.createElement('div');
			div.className = 'chat_message_wrap';
			var msg = document.createElement('div');
			msg.className = '-text';
			var title = document.createElement('div');
			title.className = '-title';
			var titleText = (new Date(time * 1000)).toLocaleFormat('%d.%m в %H:%M ');
			if(data.student_id > 0){
				msg.innerText = data.message_text;
				titleText += data.student_name;
				if(ARMconfig.userId == data.student_id){
					div.className += ' -mine';
				}
			}
			else{
				msg.innerHTML = data.message_text;
				div.className += ' -teacher';
				titleText += data.teacher_name;
			}
			title.innerText = titleText;
			div.appendChild(title);
			div.appendChild(msg);
			
			data._el = div;
			
			var f = elChatLog.scrollTop == (elChatLog.scrollTopMax || elChatLog.scrollHeight - elChatLog.clientHeight);
			
			var nextItem = null;
			var i = 0;
			for(l = _listMessages.length; i < l; ++i){
				var msg = _listMessages[i];
				if(msg.rowid == data.rowid){
					return;
				}
				if(msg.date_added > time){
					nextItem = msg;
					break;
				}
			}
			if(nextItem){
				elChatLog.insertBefore(div, msg._el);
				_listMessages.splice(i, 0, data);
			}
			else{
				elChatLog.appendChild(div);
				_listMessages.push(data);
			}
			
			if(f){
				elChatLog.scrollTop = (elChatLog.scrollTopMax || elChatLog.scrollHeight - elChatLog.clientHeight);
			}
			
			if(!_lastChatMessage || _lastChatMessage < time){
				_lastChatMessage = time;
			}
		};
		
		var initChatScreen = function(){			
			elChatScreen = document.createElement('div');
			elChatScreen.className = 'task_chat_wrap';
			
			elChatLog = document.createElement('div');
			elChatLog.className = 'task_chat_log';
			elChatScreen.appendChild(elChatLog);
			
			var div = document.createElement('div');
			div.className = 'task_chat_input_box';
			elChatScreen.appendChild(div);
			
			elChatText = document.createElement('textarea');
			// elChatText.disabled = !DS.page._currentTeacherId;
			div.appendChild(elChatText);
			
			elChatButton = document.createElement('button');
			// elChatButton.disabled = !DS.page._currentTeacherId;
			elChatButton.innerText = 'Отправить';
			div.appendChild(elChatButton);
			
			DS.addEvent(elChatButton, 'click', function(){
				if(elChatText.value.trim() && !elChatText.disabled){
					elChatText.disabled = true;
					DS.ARM.addChatMessageStream(elChatText.value.trim(), function(d){
						elChatText.disabled = false;
						if(d.success){
							elChatText.value = '';
						}
					});
				}
			});
			
			elWrapper.appendChild(elChatScreen);
			
			
			DS.ARM.loadChatPrevNStream(150, 0, function(d){
				if(d.success){
					for(var i = 0, l = d.data.length; i < l; ++i){
						insertChatMessage(d.data[i]);
					}
				}
			});
		};
		
//##########################################################################
		
		
//##########################################################################
				
		var _sndBellTeacher = new Audio('sound/bell.wav');
		var _sndBellStudent = new Audio('sound/talk.wav');
		var onChatMessage = function(data){
			insertChatMessage(data.data[0]);
			if(data.data[0].student_id > 0){
				_sndBellStudent.play();
			}
			else{
				_sndBellTeacher.play();
			}
		};
		var onWSconnected = function(){
			if(_lastChatMessage){
				DS.ARM.loadChatSinceStream(_lastChatMessage, function(d){
					if(d.success){
						for(var i = 0, l = d.data.length; i < l; ++i){
							insertChatMessage(d.data[i]);
						}
					}
				});
			}
		};
		
		var onLectureSwitched = function(d){
			if(!d.data[0].status){
				DS.page.popModule();
			}
		};
		var onLectureSync = function(d){
			for(var i = 0, l = d.data[0].length; i < l; ++i){
				var ev = d.data[0][i];
				console.warn(ev);
				ExecuteSync(ev);
			}
		};
		
		DS.addEvent(DS, 'msg/'+ARMmessage.LECTURE_SYNC, onLectureSync);
		
		// Initialize all required stuff, use `element` as render root
		this.initialize = function(element){
			console.warn("Module init!");
			elWrapper = element;
			
			_isSyncinc = false;
			var oldQueue = _syncQueue;
			_syncQueue = [];
			for(var i = 0, l = oldQueue.length; i < l; ++i){
				ExecuteSync(oldQueue[i]);
			}
			
			// DS.progressWindow('Загрузка данных');
			
			initMainScreen();
			
			initChatScreen();
			
			DS.addEvent(DS, 'msg/'+ARMmessage.CHAT_MESSAGE_STREAM, onChatMessage);
			DS.addEvent(DS, 'arm/authorized', onWSconnected);
			DS.addEvent(DS, 'msg/'+ARMmessage.LECTURE_SWITCH, onLectureSwitched);
			// DS.addEvent(DS, 'msg/'+ARMmessage.LECTURE_SYNC, onLectureSync);
		};
		
		// destroy module, finish all tasks and network queries, then run callback
		this.shutdown = function(callback){
			_isSyncinc = true;
			
			DS.removeEvent(DS, 'msg/'+ARMmessage.CHAT_MESSAGE_STREAM, onChatMessage);
			DS.removeEvent(DS, 'arm/authorized', onWSconnected);
			DS.removeEvent(DS, 'msg/'+ARMmessage.LECTURE_SWITCH, onLectureSwitched);
			// DS.removeEvent(DS, 'msg/'+ARMmessage.LECTURE_SYNC, onLectureSync);
			
			$videoPlayer.remove();
			elWrapper.removeChild(elMainScreen);
			elWrapper.removeChild(elChatScreen);
			callback();
		};
		
		this.getScripts = function(){
			return([
				'js/modules/lecture/video.ui.js'
			]);
		};
		this.getStyles = function(){
			return({
				both: [
					'css/modules/lecture.css'
					,'css/modules/video.ui.css'
				]
				/* ,light: [
					'css/modules/task-light.css'
				] */
				,dark: [
					'css/modules/lecture-dark.css'
				]
			});
		};
	});
});
