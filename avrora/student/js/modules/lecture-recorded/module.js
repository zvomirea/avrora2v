DS.ready(function(){
	DS.page.registerModule('lecture-recorded', function(){
		var elWrapper = null;
		var elMainScreen = null;
		var $videoPlayer = null;
		
		var initMainScreen = function(idFile){
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
			
			DS.ARM.getAttachmentInfo(idFile, function(d){
				if(d.success){
					$videoPlayer.setSrc([{url:d.data.url, ctype: 'video/webm; codecs="vp8, opus"', pri: 0}]);
					$videoPlayer.play();
					$videoPlayer.SetTime(0);
				}
			});
		};
				
//##########################################################################
		
		var elButtonFinish = null;
		
		// Initialize all required stuff, use `element` as render root
		this.initialize = function(element, args){
			console.warn("Module init!");
			elWrapper = element;
			
			
			initMainScreen(args);
			
			elButtonFinish = DS.page.topMenu.addButton('Закрыть');
			DS.css(elButtonFinish, 'float', 'right');
			DS.addEvent(elButtonFinish, 'click', function(){
				DS.page.popModule();
			});
		};
		
		// destroy module, finish all tasks and network queries, then run callback
		this.shutdown = function(callback){
			DS.page.topMenu.removeButton(elButtonFinish);
			
			$videoPlayer.remove();
			elWrapper.removeChild(elMainScreen);
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
					'css/modules/lecture-recorded.css'
					,'css/modules/video.ui.css'
				]
				/* ,light: [
					'css/modules/task-light.css'
				] */
				// ,dark: [
					// 'css/modules/lecture-dark-recorded.css'
				// ]
			});
		};
	});
});
