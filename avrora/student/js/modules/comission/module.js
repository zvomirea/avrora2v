'use strict';
DS.ready(function(){
	DS.page.registerModule('comission', function(){
		var elWrapper = null;
		var elMainScreen = null;
		var elChatScreen = null;
			
		var elQueueLen = null;
		
		var conference = null;
		
		var listMembers = null;
		var elPanelLeftBottom = null;
		var $videoPlayer = null;
		var idPlayingAttachment = null;
		
		var idStream = null;
		var isStreamRunning = false;
		
		var insertChatMessage = null;
		var elChatLog = null;
		var elChatText = null;
		var elChatButton = null;
		
		var _onlineStudents = [];
		var _currentGroups = [];
		
	
		//DS.ARM.syncLecture
		var iFrame = null;
		
		var initMainScreen = function(){
			elMainScreen = document.createElement('div');
			elMainScreen.className = 'task_mod_wrap';
			
			var elPanelLeft = document.createElement('div');
			elPanelLeft.className = 'task_mod_left';
			elMainScreen.appendChild(elPanelLeft);
			
			var elPanelLeftTop = document.createElement('div');
			elPanelLeftTop.className = 'task_mod_left_top';
			elPanelLeftTop.innerHTML = 'Участники';
			elPanelLeft.appendChild(elPanelLeftTop);
			
			elPanelLeftBottom = document.createElement('div');
			elPanelLeftBottom.className = 'task_mod_left_bottom';
			elPanelLeft.appendChild(elPanelLeftBottom);
			
			listMembers = document.createElement('div');
			listMembers.className = 'task_group';
			elPanelLeftBottom.appendChild(listMembers);
			
			var elPanelRight = document.createElement('div');
			elPanelRight.className = 'task_mod_right';
			elMainScreen.appendChild(elPanelRight);
			
			var elPanRightHdr = document.createElement('div');
			elPanRightHdr.className = 'task_mod_right_hdr';
			elPanelRight.appendChild(elPanRightHdr);
			
			elQueueLen = document.createElement('div');
			elQueueLen.className = 'hdr_queue_len';
			elQueueLen.innerText = '';
			elPanRightHdr.appendChild(elQueueLen);
			
			var elPanRightContent = document.createElement('div');
			elPanRightContent.className = 'task_mod_right_content';
			elPanelRight.appendChild(elPanRightContent);
			
			iFrame = document.createElement('iframe');
			iFrame.style.cssText = 'border: 0; width: 100%; height: 100%;';
			elPanRightContent.appendChild(iFrame);
			
			elWrapper.appendChild(elMainScreen);
		};
		
				
		var _listMessages = [];
		var _lastChatMessage = null;
		insertChatMessage = function(data){
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
			elChatButton.disabled = true;
			elChatButton.innerText = 'Отправить';
			div.appendChild(elChatButton);
			
			DS.addEvent(elChatButton, 'click', function(){
				if(elChatText.value.trim() && !elChatText.disabled){
					elChatText.disabled = true;
					DS.ARM.addChatMessage(elChatText.value.trim(), function(d){
						elChatText.disabled = false;
						if(d.success){
							elChatText.value = '';
						}
					});
				}
			});
			
			elWrapper.appendChild(elChatScreen);
			
			
			/* DS.ARM.loadChatPrevN(150, 0, function(d){
				if(d.success){
					for(var i = 0, l = d.data.length; i < l; ++i){
						insertChatMessage(d.data[i]);
					}
				}
			}); */
		};
				
//##########################################################################
		
		var addMember = function(id, name){
			var div = document.createElement('div');
			div.className = 'task_item';
			div.id = 'member_'+id;
			
			
			var tmp;
			// tmp = document.createElement('div');
			// tmp.className = 'task_item_name';
			// tmp.innerHTML = name;
			// div.appendChild(tmp);
			
			// tmp = document.createElement('div');
			// tmp.style.cssText = 'clear: both;';
			// div.appendChild(tmp);
			
			// if(row.preview_url){
				tmp = document.createElement('video');
				tmp.className = 'task_item_preview';
				// tmp.src = row.preview_url;
				tmp.autoplay = true;
				tmp.id = 'player_'+id;
				div.appendChild(tmp);
			// }
			
			tmp = document.createElement('div');
			tmp.className = 'task_item_description';
			tmp.innerHTML = name;
			div.appendChild(tmp);
			
			/* DS.addEvent(div, 'click', (function(idFile){return(function(){
				showFile(idFile);
			});})(row.rowid)); */
			
			listMembers.appendChild(div);
		};
		
		var _oldMembers = {};
		var updateMembers = function(){
			DS.ARM.getComissionMembers(function(d){
				if(d.success){
					
					for(var i in _oldMembers){
						_oldMembers[i] = false;
					}
					
					
					for(var i = 0, l = d.data.length; i < l; ++i){
						var mbr = d.data[i];
						
						if(!(mbr.rowid in _oldMembers)){
							addMember('user_3_'+mbr.rowid, mbr.teacher_suname+' '+mbr.teacher_name+' '+mbr.teacher_patronymic);
						}
						_oldMembers[mbr.rowid] = true;
					}
					
					for(var i in _oldMembers){
						if(!_oldMembers[i]){
							var el = DS.gid('member_user_3_'+i);
							el.parentNode.removeChild(el);
							delete _oldMembers[i];
						}
					}
				}
			});
		};
		
		var clearMembers = function(){
			_oldMembers = {};
			
			listMembers.innerHTML = '';
		};

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
		// var onWSconnected = function(){
			/* if(isStreamRunning){
				if(_lastChatMessage){
					DS.ARM.loadChatSince(_lastChatMessage, function(d){
						if(d.success){
							for(var i = 0, l = d.data.length; i < l; ++i){
								insertChatMessage(d.data[i]);
							}
						}
					});
				}
			
				DS.ARM.toggleLecture(idStream, isStreamRunning, null, function(d){
					if(d.success){
						SyncLecture();
					}
				});
				
				DS.ARM.getStudentsOnline(function(d){
					if(d.success){
						_onlineStudents = d.data;
						UpdateStudentCounter();
					}
				}, _currentGroups)
			} */
		
			
		// };
		var publicationGlobal = null;
		
		var timerUpdateQueueLength = null;
		var SetupQueueTimer = function(){
			if(!timerUpdateQueueLength){
				timerUpdateQueueLength = setInterval(function(){
					DS.ARM.getComissionQueueLength(function(d){
						if(d.success){
							UpdateQueueLength(d.data);
						}
					});
				}, 10000);
			}
		};
		var ClearQueueTimer = function(){
			if(timerUpdateQueueLength){
				clearInterval(timerUpdateQueueLength);
				timerUpdateQueueLength = null;
			}
		};
		
		var PlayStream = function(stream){
			DS.ARM.getComissionStreamInfo(stream.origin, function(d){
				if(d.success){
					console.log('A new stream is added: '+stream.id+'; user: '+d.data.user);
					
					if(d.data.user.substr(0, 7) == 'user_4_'){
						d.data.user = 'user_student';
					}
					
					var player;
					if(stream.source.video == 'screen-cast'){
						player = DS.gid('player_screencast');
					}
					else{
						player = DS.gid('player_'+d.data.user);
					}
					if(!player){
						return;
					}
					
					
					var targetWidth = player.clientWidth;
					
					var bestWidth = -1;
					var bestHeight = -1;
					
					for(var i = 0, l = stream.settings.video.length; i < l; ++i){
						var item = stream.settings.video[i].resolution;
						if(item.width > targetWidth && (item.width < bestWidth || bestWidth < 0)){
							bestWidth = item.width;
							bestHeight = item.height;
						}
					}
					
					for(var i = 0, l = stream.extraCapabilities.video.resolutions.length; i < l; ++i){
						var item = stream.extraCapabilities.video.resolutions[i];
						if(item.width > targetWidth && (item.width < bestWidth || bestWidth < 0)){
							bestWidth = item.width;
							bestHeight = item.height;
						}
					}
					
					var isMe = d.data.user == 'user_student';
					
					var videoOptions = {};
					if(bestWidth > 0){
						videoOptions.resolution = {
							width: bestWidth
							,height: bestHeight
						};
					}
					
					conference.subscribe(stream, {
						audio: !isMe,
						video: videoOptions
					}).then(function(subscription){
						player.srcObject = stream.mediaStream;
						
						stream.addEventListener('ended', function(){
							console.log(stream.id + ' is ended.');
							
							player.srcObject = null;
						});
						
						stream.addEventListener('updated', function(){
							console.log(stream.id + ' is updated.');
						});
						
						DS.addEvent(subscription, 'mute', function(e){
							DS.util.removeClass(player, 'player-speaking');
							if(!isMe && DS.q('.player-speaking').length == 0){
								publicationGlobal.unmute('audio');
							}
						});
						DS.addEvent(subscription, 'unmute', function(e){
							DS.util.addClass(player, 'player-speaking');
							if(!isMe){
								publicationGlobal.mute('audio');
							}
						});
					}, function(err){
						console.log('subscribe failed', err);
					});
				}
			});
		};
		
		var timerScreenShot = null;
		
		var connectConference = function(){
			if(!conference){
				conference = new Owt.Conference.ConferenceClient({
					rtcConfiguration: {
						iceServers: [
							{
								urls: "stun:stun.services.mozilla.com"
							}
						]
					}
				});
			
				addMember('user_student', 'Я');
			
				conference.addEventListener('streamadded', function(event){
					PlayStream(event.stream);
				});
				
				DS.ARM.getComissionDetails(function(d){
					if(d.success){
						for(var i in d.data.members){
							addMember(i, d.data.members[i]);
						}
						
						conference.join(d.data.token).then(function(resp){
							var myId = resp.self.id;
							var myRoom = resp.id;
							
							// audioConstraintsForMic
							var audioConstraints = new Owt.Base.AudioTrackConstraints(Owt.Base.AudioSourceInfo.MIC);
							// videoConstraintsForCamera
							var videoConstraints = new Owt.Base.VideoTrackConstraints(Owt.Base.VideoSourceInfo.CAMERA);
							
							// audioConstraints = new Owt.Base.AudioTrackConstraints(Owt.Base.AudioSourceInfo.SCREENCAST);
							// videoConstraints = new Owt.Base.VideoTrackConstraints(Owt.Base.VideoSourceInfo.SCREENCAST);
							
						 	// var mediaStream;
							Owt.Base.MediaStreamFactory.createMediaStream(new Owt.Base.StreamConstraints(audioConstraints, videoConstraints)).then(function(stream){
								var publishOption;
								// mediaStream = stream;
								var localStream = new Owt.Base.LocalStream(stream, new Owt.Base.StreamSourceInfo('mic', 'camera'));
								
								// DS.q('video')[0].srcObject = stream;
								// console.log(stream);
								// window.localStream = localStream;
								conference.publish(localStream, publishOption).then(function(publication){
									// publication.mute('audio');
									publicationGlobal = publication;
									window.publicationGlobal = publicationGlobal;
			//						mixStream(myRoom, publication.id, 'common')
									publication.addEventListener('error', function(err){
										console.log('Publication error: ' + err.error.message);
									});
									publication.addEventListener('ended', function(){
										var tracks = localStream.mediaStream.getTracks();
										for(var i = 0, l = tracks.length; i < l; ++i){
											tracks[i].stop();
										}
									});
								});
							}, function(err){
								console.error('Failed to create MediaStream, '+err);
							});
							
							var startSceenCast = function(cvs){
								var shareStream = cvs.captureStream();
								shareStream.getVideoTracks()[0].getSettings = function(){return({width: cvs.width, height: cvs.height})}
								var localStream = new Owt.Base.LocalStream(shareStream, new Owt.Base.StreamSourceInfo('screen-cast', 'screen-cast'));
								var publishOption;
								conference.publish(localStream, publishOption).then(function(publication){
									publication.addEventListener('error', function(err){
										console.log('Publication error: ' + err.error.message);
									});
									publication.addEventListener('ended', function(){
										var tracks = localStream.mediaStream.getTracks();
										for(var i = 0, l = tracks.length; i < l; ++i){
											tracks[i].stop();
										}
									});
								});
							};
							
							if(DS.ArmAPI){
								DS.ArmAPI.takeScreenShot(false, function(d){
									var img = new Image();
									img.onload = function(){
										var cvs = document.createElement('canvas');
										cvs.width = img.width;
										cvs.height = img.height;
										var ctx = cvs.getContext('2d');
										ctx.drawImage(img, 0, 0);
										startSceenCast(cvs);
										// DS.q('.task_mod_right_content')[0].appendChild(cvs);
										
										var targetFps = 12;
										
										var doFrame = function(){
											// var timeStart = Date.now();
											// console.log('DS.ArmAPI.takeScreenShot()');
											DS.ArmAPI.takeScreenShot(true, function(d){
												// console.log(d, Date.now() - timeStart);
												// console.log(Date.now() - timeStart);
												if(d.type == 'delta'){
													// var images = [];
													var countDone = 0;
													for(var i = 0, l = d.data.length; i < l; ++i){
														var rgn = d.data[i];
														rgn.img = new Image();
														rgn.img.onload = function(){
															if(++countDone == d.data.length){
																for(var i = 0, l = d.data.length; i < l; ++i){
																	var rgn = d.data[i];
																	ctx.drawImage(rgn.img, rgn.x, rgn.y);
																}
																if(conference){
																	setTimeout(doFrame, 1000 / targetFps);
																}
															}
														};
														rgn.img.src = 'data:image/png;base64,'+rgn.data;
													}
													
													if(!d.data.length && conference){
														setTimeout(doFrame, 1000 / targetFps);
													}
												}
												else{
													var img1 = new Image();
													img1.onload = function(){
														// console.log('begin', Date.now());
														ctx.drawImage(img1, 0, 0);
														// console.log('end', Date.now());
														
														if(conference){
															setTimeout(doFrame, 1000 / targetFps);
														}
													};
													img1.src = 'data:image/png;base64,'+d.data;
												}
											});
										}
										
										doFrame();
									};
									img.src = 'data:image/png;base64,'+d.data;
								});
							}
							else{
								var cvs = document.createElement('canvas');
								cvs.width = 800;
								cvs.height = 600;
								var ctx = cvs.getContext('2d');
								ctx.fillRect(0, 0, cvs.width, cvs.height);
								ctx.strokeStyle = '#FF0000';
								ctx.lineWidth = 10;
								startSceenCast(cvs);
								
								timerScreenShot = setInterval(function(){
									ctx.beginPath();
									ctx.moveTo(0, 0);
									ctx.lineTo(cvs.width - 1, cvs.height - 1);
									ctx.moveTo(cvs.width - 1, 0);
									ctx.lineTo(0, cvs.height - 1);
									ctx.stroke(); 
								}, 1000);
								
								// DS.q('.task_mod_right_content')[0].appendChild(cvs);
							}
								
							for(var i = 0, l = resp.remoteStreams.length; i < l; ++i){
								PlayStream(resp.remoteStreams[i]);
							}						
							
							console.log('Streams in conference:', resp.remoteStreams.length);
							var participants = resp.participants;
							console.log('Participants in conference: ' + participants.length);
						}, function(err){
							console.error('server connection failed:', err);
							if(err.message.indexOf('connect_error:') >= 0){
								var signalingHost = err.message.replace('connect_error:', '');
								var signalingUi = 'signaling';
								removeUi(signalingUi);
								var $p = $(`<div id=${signalingUi}> </div>`);
								var anchor = $('<a/>', {
									text: 'Click this for testing certificate and refresh',
									target: '_blank',
									href: `${signalingHost}/socket.io/`
								});
								anchor.appendTo($p);
								$p.appendTo($('body'));
							}
						});
					}
				});
			}
		
			
			ClearQueueTimer();
		};
		
		var disconnectConference = function(){
			if(conference){
				conference.leave()
				conference = null;
			}
			if(publicationGlobal){
				publicationGlobal.stop();
				publicationGlobal = null;
			}
			if(timerScreenShot){
				clearInterval(timerScreenShot);
				timerScreenShot = null;
			}
			ClearQueueTimer();
		};
		
		var onComissionLoaded = function(){
			var comission = DS.page.comission;
			if(comission){
				connectConference();
				
				updateMembers();
			}
			else{
				disconnectConference();
				
				clearMembers();
			}
		};
		
		var onBeforeUnload = function(){
			disconnectConference();
		};
		
		var onKeyDown = function(e){
			// console.log(e);
			if(publicationGlobal && e.code == 'KeyK' && !e.repeat){
				publicationGlobal.unmute('audio');
			}
		};
		var onKeyUp = function(e){
			// console.log(e);
			if(publicationGlobal && e.code == 'KeyK'){
				publicationGlobal.mute('audio');
			}
		};
		
		var UpdateQueueLength = function(len){
			elQueueLen.innerText = 'Место в очереди: '+len+'. Ожидайте приглашения';
		};
		
		var JoinComission = function(){
			DS.ARM.joinComission(function(d){
				if(d.success){
					if(d.data.isActive){
						connectConference();
					}
					else{
						UpdateQueueLength(d.data.queueLen);
					}
				}
			});
		};
		
		var onAuthorized = function(){
			JoinComission();
		};
		
		var onDisconnected = function(){
			disconnectConference();
		};
		
		var onQueueAccepted = function(){
			connectConference();
		};
		
		var onEnd = function(){
			DS.page.popModule('comission');
		};
		
		(function(){
			var _connectButton = null;
			var _comissionCount = 0;
			
			var setComissionCount = function(c){
				_comissionCount = c;
				if(c){
					if(!_connectButton){
						_connectButton = DS.page.topMenu.addButton('<span style="color: #0c0;">Подключиться к комиссии</span>');
						DS.addEvent(_connectButton, 'click', function(){
							if(DS.ArmAPI && 'takeScreenShot' in DS.ArmAPI){
								DS.confirm('Вы подключаетесь к комиссии.<br/>Когда вас пригласят, включится камера, микрофон, и начнется демонстрация рабочего стола комиссии.<br/>Заблаговременно закройте все лишние приложения.<br/>Вы подтверждаете согласие со всем вышеописанным?', function(){
									DS.page.pushModule('comission');
								});
							}
							else{
								DS.msg('Ваша версия системы устарела', 'red');
							}
						});
					}
				}
				else{
					if(_connectButton){
						DS.page.topMenu.removeButton(_connectButton);
						_connectButton = null;
						DS.page.popModule('comission');
					}
				}
			};
			
			DS.addEvent(DS, 'msg/'+ARMmessage.COMISSION_GROUP_ADDED, function(){
				setComissionCount(_comissionCount + 1);
			});
			DS.addEvent(DS, 'msg/'+ARMmessage.COMISSION_GROUP_REMOVED, function(){
				setComissionCount(_comissionCount - 1);
			});
			DS.addEvent(DS, 'arm/authorized', function(){
				DS.ARM.getComissionCount(function(d){
					if(d.success){
						setComissionCount(parseInt(d.data));
					}
				});
			});
		})();
		
		var reportUrl = null;
		var DOMURL = window.URL || window.webkitURL || window;
		var onTaskOpenRequest = function(d){
			// iFrame
			DS.ARM.getTaskReport(d.data[0].student_task_id, function(d){
				if(d.success){
					if(reportUrl){
						DOMURL.revokeObjectURL(reportUrl);
						reportUrl = null;
					}
					
					var pdf = new Blob([DS.base64.decode(d.data.report_pdf, true)], {type: 'application/pdf'});
					reportUrl = DOMURL.createObjectURL(pdf);
					iFrame.src = 'js/pdf.js/web/viewer.html?file='+reportUrl;
				}
			});
		};
		
		// Initialize all required stuff, use `element` as render root
		this.initialize = function(element){
			console.warn("Module init!");
			elWrapper = element;
			
			// DS.progressWindow('Загрузка данных');
			
			initMainScreen();
			initChatScreen();
			/* DS.ARM.getCurrentTeacherId(function(d){
				if(d.success){
					DS.page._currentTeacherId = d.data;
					initChatScreen();
				}
			}); */
			
			
			JoinComission();
			
		//	DS.addEvent(DS, 'arm/comission/info/loaded', onComissionLoaded);
			
		//	DS.addEvent(DS, 'msg/'+ARMmessage.CHAT_MESSAGE_STREAM, onChatMessage);
			DS.addEvent(DS, 'arm/authorized', onAuthorized);
			DS.addEvent(DS, 'ws/disconnected', onDisconnected);
			
			DS.addEvent(DS, 'msg/'+ARMmessage.COMISSION_QUEUE_STUDENT_ACCEPTED, onQueueAccepted);
			DS.addEvent(DS, 'msg/'+ARMmessage.COMISSION_STUDENT_END, onEnd);
			DS.addEvent(DS, 'msg/'+ARMmessage.COMISSION_STUDENT_OPEN_TASK, onTaskOpenRequest);
		//	DS.addEvent(DS, 'msg/'+ARMmessage.COMISSION_MEMBER_ADDED, updateMembers);
		//	DS.addEvent(DS, 'msg/'+ARMmessage.COMISSION_MEMBER_REMOVED, updateMembers);
			DS.addEvent(window, 'beforeunload', onBeforeUnload);
			
			DS.addEvent(window, 'keydown', onKeyDown);
			DS.addEvent(window, 'keyup', onKeyUp);
			
			SetupQueueTimer();
			
			onComissionLoaded();
		};
		
		// destroy module, finish all tasks and network queries, then run callback
		this.shutdown = function(callback){
		//	DS.removeEvent(DS, 'arm/comission/info/loaded', onComissionLoaded);
			DS.page.topMenu.removeButton(topMenuSize);
		//	DS.removeEvent(DS, 'msg/'+ARMmessage.CHAT_MESSAGE_STREAM, onChatMessage);
			DS.removeEvent(DS, 'arm/authorized', onAuthorized);
			DS.removeEvent(DS, 'ws/disconnected', onDisconnected);
			
			DS.removeEvent(DS, 'msg/'+ARMmessage.COMISSION_QUEUE_STUDENT_ACCEPTED, onQueueAccepted);
			DS.removeEvent(DS, 'msg/'+ARMmessage.COMISSION_STUDENT_END, onEnd);
			DS.removeEvent(DS, 'msg/'+ARMmessage.COMISSION_STUDENT_OPEN_TASK, onTaskOpenRequest);
			
		//	DS.removeEvent(DS, 'msg/'+ARMmessage.COMISSION_MEMBER_ADDED, updateMembers);
		//	DS.removeEvent(DS, 'msg/'+ARMmessage.COMISSION_MEMBER_REMOVED, updateMembers);
			
			
			disconnectConference();
			
			ClearQueueTimer();
			
			DS.removeEvent(window, 'beforeunload', onBeforeUnload);
			
			DS.removeEvent(window, 'keydown', onKeyDown);
			DS.removeEvent(window, 'keyup', onKeyUp);
			
			elWrapper.removeChild(elMainScreen);
			elWrapper.removeChild(elChatScreen);
			callback();
		};
		
		this.getScripts = function(){
			return([
				'js/modules/comission/socket.io.js',
				'js/modules/comission/owt.js'
			]);
		};
		this.getStyles = function(){
			return({
				both: [
					'css/modules/comission.css'
				]
				/* ,light: [
					'css/modules/task-light.css'
				] */
				,dark: [
					'css/modules/comission-dark.css'
				]
			});
		};
	});
});
