/*
	Report bugs and patches to ed@ds-servers.com
*/
(function (console_log) {
    DS.ready(function () {

        var ArmUserId = DS.util.urlParam('ArmUserId') || localStorage.student_id;
        var ArmUserPassword = DS.util.urlParam('ArmUserPassword') || localStorage.password;

        var _armUserPrefs = {};
        DS.page.userPrefs = {
            get: function (key) {
                return (_armUserPrefs[key]);
            }
            , set: function (key, value) {
                return (_armUserPrefs[key] = value);
            }
            , save: function (cb) {
                DS.ARM.saveUserPreferences(_armUserPrefs, function (d) {
                    cb && cb(d);
                });
            }
        };

//##########################################################################

        var _cpBuffer = '';
        var _cpBufferCleared = '';
        var _cpBufferHtml = '';
        var _cbClear = function (txt) {
            if (!txt) {
                return ('');
            }
            return (txt.replace(/\r/g, '').replace(/ /g, ' '));
            // return(txt.replace(/<[^>]+>/g, '').replace(/[^a-zA-Zа-яА-Я0-9]/g, ''));
            // return(txt);
        };
        var _cbDropHtml = function (html) {
            // return(html);
            var tmp = document.createElement('div');
            tmp.innerHTML = html;
            return (tmp.textContent || tmp.innerText || '');
        };
        DS.page.cb = {
            onCopy: function (txt, html) {
                console.warn('onCopy()');
                console.warn(txt);
                console.warn(html);
                /* if(!txt){
                    txt = document.getSelection().toString();
                } */
                _cpBuffer = _cbClear(txt);
                _cpBufferHtml = _cbClear(html);
                _cpBufferCleared = _cbDropHtml(html ? html : txt);
                // console.log('buf='+_cpBuffer);
                // console.log('bufHTML='+_cpBufferHtml);
            }
            , canPaste: function (txt, isHTML) {
                console.error('canPaste()');
                console.error(txt);
                console.error(isHTML);
                if (!txt) {
                    return (false);
                }

                var txt2 = null;

                /* if(isHTML == 'mce'){

                }
                else  */
                if (isHTML) {
                    var pasteBegin = '<!--StartFragment-->';
                    var pasteEnd = '<!--EndFragment-->';
                    txt2 = txt.replace(pasteBegin, '').replace(pasteEnd, '');

                    txt = txt.split(pasteBegin);
                    if (txt.length > 1) {
                        txt.shift();
                        // return(false);
                    }
                    txt = txt.join(pasteBegin);

                    txt = txt.split(pasteEnd);
                    if (txt.length > 1) {
                        txt.pop();
                        // return(false);
                    }
                    txt = txt.join(pasteEnd);
                }

                txt = _cbClear(txt);
                // window.txt = window.txt || [];
                // window.txt.push([txt, _cpBuffer]);
                console.warn(txt + '=' + _cpBuffer, txt == _cpBuffer);
                console.warn(txt + '=' + _cpBufferHtml, txt == _cpBufferHtml);

                if (isHTML) {
                    return (txt === _cpBuffer || txt.replace(/[\r\n\s]/g, '') === _cpBuffer.replace(/[\r\n\s]/g, '')
                        || (_cpBufferHtml != '' && (txt === _cpBufferHtml || txt.replace(/[\r\n\s]/g, '') === _cpBufferHtml.replace(/[\r\n\s]/g, '')
                            || txt2 === _cpBufferHtml))
                        || (_cpBufferCleared != '' && (_cbDropHtml(txt) === _cpBufferCleared
                            || _cbDropHtml(txt).replace(/[\r\n\s]/g, '') === _cpBufferCleared.replace(/[\r\n\s]/g, '')
                            || _cbDropHtml(txt2) === _cpBufferCleared))
                    );
                }

                return (txt === _cpBuffer || txt.replace(/[\r\n\s]/g, '') === _cpBuffer.replace(/[\r\n\s]/g, ''));
            }
        };

        DS.addEvent(window, 'copy', function (e) {
            var text = (e.target && e.target.value && e.target.value.substr(e.target.selectionStart, e.target.selectionEnd - e.target.selectionStart)) || document.getSelection().toString();

            var htmlContent = text;
            try {
                var range = window.getSelection().getRangeAt(0),
                    content = range.cloneContents(),
                    span = document.createElement('span');

                span.appendChild(content);
                htmlContent = span.innerHTML;
            } catch (e) {
            }
            // e.clipboardData.setData("text", text);
            DS.page.cb.onCopy(text, htmlContent);
        });
        DS.addEvent(window, 'cut', function (e) {
            var text = (e.target && e.target.value && e.target.value.substr(e.target.selectionStart, e.target.selectionEnd - e.target.selectionStart)) || document.getSelection().toString();

            var range = window.getSelection().getRangeAt(0),
                content = range.cloneContents(),
                span = document.createElement('span');

            // span.appendChild(content);
            var htmlContent = span.innerHTML;

            // e.clipboardData.setData("text", text);
            DS.page.cb.onCopy(text, htmlContent);
        });


//##########################################################################

        var _loadedScripts = {};
        DS.page.loadScripts = function (list, onDone, onError) {
            var _sCount = list.length;
            var _sError = 0;
            if (!_sCount) {
                onDone && onDone(_sError);
                return;
            }
            for (var i = 0, l = _sCount; i < l; ++i) {
                if (list[i] in _loadedScripts) {
                    if (--_sCount == 0) {
                        onDone && onDone(_sError);
                    }
                    continue;
                }
                _loadedScripts[list[i]] = true;

                var script = document.createElement('script');
                script.async = false;
                script.type = 'text/javascript';
                script.onload = function () {
                    if (--_sCount == 0) {
                        onDone && onDone(_sError);
                    }
                };
                script.onerror = (function (name) {
                    return (function () {
                        ++_sError;
                        onError && onError(name);
                        if (--_sCount == 0) {
                            onDone && onDone(_sError);
                        }
                    });
                })(list[i].text);

                if (list[i].indexOf('?') < 0) {
                    list[i] += '?' + window.__noCacheNumber;
                }

                script.src = list[i];
                document.body.appendChild(script);
            }
        };

//##########################################################################

        var fnAuthorize = function (d) {
            if (d.success) {
                DS.ARM.loadUserPreferences(function (d2) {
                    if (d2.success) {
                        _armUserPrefs = d2.data;
                        DS.invokeEvent('arm/authorized', d);
                    } else {
                        DS.msg('Не удалось загрузить данные пользователя', 'red');
                    }
                });
            } else {
                // DS.msg(d.error, 'red');
                delete localStorage.password;
            }
        };

        var _isStarted = false;
        var start = function () {
            console.error('Start');
            if (_isStarted) {
                return;
            }
            _isStarted = true;

            DS.ARM.getArmVersion(function (d) {
                if (d.success) {
                    if (d.data > window.__noCacheNumber) {
                        if (!sessionStorage.doUpdate) {
                            sessionStorage.doUpdate = 1;
                            location.reload(true);
                        }
                    } else {
                        delete sessionStorage.doUpdate;
                    }
                }
            });

            if (!ArmUserId || !ArmUserPassword) {
                var wnd = null;
                var updateGroups = function () {
                    var data = wnd.find('form-panel')[0].getFields();
                    var $comboUser = wnd.find('!=user_id')[0];
                    var $comboGroup = wnd.find('!=group_id')[0];
                    DS.ARM.getAuthGroupList(data.institute_id, data.course, function (d) {
                        if (d.success) {
                            $comboGroup.setItems(d.data);
                            $comboGroup.value('');
                            $comboUser.setItems([]);
                            $comboUser.value('');
                        }
                    });
                };
                wnd = DS.create({
                    DStype: 'window'
                    , destroyOnClose: true
                    , reqWidth: 300
                    , items: [
                        [
                            'title'
                            , 'AVRORA MATERIAL MODE'
                        ]
                        , {
                            DStype: 'form-panel'
                            , items: [
                                {
                                    DStype: 'list-layout'
                                    , items: [
                                        {
                                            DStype: 'combo'
                                            , label: 'Институт'
                                            , name: 'institute_id'
                                            , listeners: {
                                                change: function () {
                                                    updateGroups();
                                                }
                                            }
                                        }
                                        , {
                                            DStype: 'radioline'
                                            , label: 'Курс'
                                            , name: 'course'
                                            , items: [
                                                {
                                                    label: '1'
                                                    , _value: '1'
                                                }
                                                , {
                                                    label: '2'
                                                    , _value: '2'
                                                }
                                                , {
                                                    label: '3'
                                                    , _value: '3'
                                                }
                                                , {
                                                    label: '4'
                                                    , _value: '4'
                                                }
                                            ]
                                            , listeners: {
                                                change: function () {
                                                    updateGroups();
                                                }
                                            }
                                        }
                                        , {
                                            DStype: 'combo'
                                            , label: 'Группа'
                                            , name: 'group_id'
                                            , listeners: {
                                                change: function () {
                                                    var idGroup = this.value();
                                                    var $comboUser = this.find('!=user_id')[0];
                                                    DS.ARM.getAuthUserList(idGroup, function (d) {
                                                        if (d.success) {
                                                            $comboUser.setItems(d.data);
                                                        }
                                                    });
                                                }
                                            }
                                        }
                                        , {
                                            DStype: 'combo'
                                            , label: 'ФИО'
                                            , name: 'user_id'
                                            , required: true
                                        }
                                        , {
                                            DStype: 'passfield'
                                            , label: 'Пароль'
                                            , name: 'password'
                                            , required: true
                                        }
                                        , {
                                            DStype: 'checkbox'
                                            , label: 'Запомни меня полностью'
                                            , name: 'remember_me'
                                        }
                                        , {
                                            DStype: 'button'
                                            , label: 'Войти'
                                            , listeners: {
                                                click: function () {
                                                    var $form = this.getForm();
                                                    var data = $form.getFields();

                                                    var form = $form.getObjectSelf();
                                                    if (!form.checkValidity()) {
                                                        form.reportValidity();
                                                        return;
                                                    }

                                                    var $button = this;
                                                    $button.disable(true);

                                                    if (4471 == data.user_id) {
                                                        location.href = 'https://games.pariplaydev.com/launch/SB_HTML5_SpinberryWilds95/index.html?gameCode=SB_HTML5_SpinberryWilds95_Desktop&token=DEMO_PPQA_82b02b53-fdc0-4fde-8fa9-0e033718edf6&homeUrl=&rgsUrl=https://rgs2rgs.pariplaydev.com&lang=EN&DebugMode=False&currencyCode=USD&platform=1&disableRotation=False&ExtraData=networkId%3dPPQA&HideCoins=True&CoinsDefault=False';
                                                    }

                                                    DS.ARM.authorize(data.user_id, data.password, function (d) {
                                                        if (d.success) {

                                                            if (data.remember_me) {
                                                                try {
                                                                    localStorage.student_id = data.user_id;
                                                                    localStorage.password = data.password;
                                                                } catch (e) {
                                                                    console.error(e);
                                                                }
                                                            }

                                                            ArmUserPassword = data.password;
                                                            $form.parent().close();
                                                        } else {
                                                            $button.disable(false);
                                                        }
                                                        fnAuthorize(d);
                                                    });
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }).open();

                DS.ARM.getAuthInstituteList(function (d) {
                    if (d.success) {
                        var $inst = wnd.find('!=institute_id')[0];
                        $inst.setItems(d.data);
                        if (d.data.length) {
                            $inst.value(d.data[0].value);
                        }
                    }
                });
            } else {
                DS.ARM.authorize(ArmUserId, ArmUserPassword, fnAuthorize);
            }
        };

        var _isConnected = false;
        DS.addEvent(DS, 'ws/connected', function () {
            console.info('Connected!');
            _isConnected = true;
        });
        var _dt = false;
        var _close = null;
        try {
            if (window.QWebChannel) {
                new QWebChannel(qt.webChannelTransport, function (channel) {
                    try {
                        DS.ArmAPI = channel.objects.ArmAPI;
                        _close = DS.ArmAPI.close.bind(DS.ArmAPI);
                        if (_dt) {
                            DS.ArmAPI.close();
                        }
                    } catch (e) {
                        console.error(e);
                    }
                    if (_isConnected) {
                        start();
                    } else {
                        DS.addEvent(DS, 'ws/connected', function () {
                            start();
                        });
                    }
                });
            } else {
                if (_isConnected) {
                    start();
                } else {
                    DS.addEvent(DS, 'ws/connected', function () {
                        start();
                    });
                }
                setTimeout(function () {
                    DS.alert('Ваша версия системы устарела.<br/>Пожалуйста, скачайте новую версию по ссылке в новостях');
                }, 600000);
            }
        } catch (e) {
            console.error(e);
            if (_isConnected) {
                start();
            } else {
                DS.addEvent(DS, 'ws/connected', function () {
                    start();
                });
            }
        }


        var _modules = {};
        DS.page.registerModule = function (name, cls) {
            if (name in _modules) {
                console.error('Mod already exists');
                return;
            }
            _modules[name] = new cls();
        };

//##########################################################################

        var _isUIready = false;
        var _isReady = false;
        DS.addEvent(DS, 'arm/authorized', function (d) {
            if (_isUIready) {
                return;
            }
            _isUIready = true;
            var wrapper = DS.gid('wrapper');
            var menuWrapper = document.createElement('div');
            menuWrapper.className = 'menu-wrapper';
            wrapper.appendChild(menuWrapper);
            var div = document.createElement('div');
            div.className = 'main-wrapper';
            wrapper.appendChild(div);
            wrapper = div;

            DS.page.topMenu = {};
            DS.page.topMenu.addButton = function (label) {
                var div = document.createElement('div');
                div.innerHTML = label;
                menuWrapper.appendChild(div);

                return (div);
            };

            DS.page.topMenu.removeButton = function (btn) {
                menuWrapper.removeChild(btn);
            };

            DS.page.topMenu.addButton('<div class="online-status"></div>');

            DS.reg('topmenu', {
                DStype: 'menu'
                , eventFilter: function (e) {
                    var pt = DS.util.getOffsetRect(e.target);
                    this.ox = pt.left - e.pageX;
                    this.oy = pt.top - e.pageY + e.target.clientHeight;

                    return (true);
                }
            });
            DS.reg('topmenu-item', {DStype: 'menu-item'});

            var ChangePassword = function (isForce) {
                if (isForce) {
                    DS.screenBlock(1);
                }
                DS.create({
                    DStype: 'window'
                    , destroyOnClose: true
                    , reqWidth: 300
                    , zIndex: 100000
                    , listeners: {
                        close: function () {
                            if (isForce) {
                                DS.screenBlock(0);
                            }
                        }
                    }
                    , items: [
                        [
                            'title'
                            , 'Изменение пароля'
                            , '->'
                            , isForce ? '' : {DStype: 'window-button-close'}
                        ]
                        , {
                            DStype: 'form-panel'
                            , items: [
                                {
                                    DStype: 'list-layout'
                                    , items: [
                                        {
                                            DStype: 'passfield'
                                            , label: 'Текущий пароль'
                                            , name: 'old_password'
                                        }
                                        , {
                                            DStype: 'passfield'
                                            , label: 'Новый пароль'
                                            , name: 'user_password'
                                        }
                                        , {
                                            DStype: 'passfield'
                                            , label: 'Повторите пароль'
                                            , name: 'pass_new2'
                                        }
                                        , {
                                            DStype: 'button'
                                            , label: 'Изменить'
                                            , listeners: {
                                                click: function () {
                                                    var form = this.getForm();
                                                    var data = form.getFields();
                                                    if (!data.old_password) {
                                                        DS.msg('Введите текущий пароль', 'red');
                                                        return
                                                    }
                                                    if (!data.user_password) {
                                                        DS.msg('Введите новый пароль', 'red');
                                                        return
                                                    }
                                                    if (data.user_password.length < 4) {
                                                        DS.msg('Новый пароль слишком слабый', 'red');
                                                        return
                                                    }
                                                    if (data.user_password.length > 16) {
                                                        DS.msg('Пароль может содержать не более 16 символов', 'red');
                                                        return
                                                    }
                                                    if (data.user_password != data.pass_new2) {
                                                        DS.msg('Пароли и подтверждение не совпадают', 'red');
                                                        return
                                                    }
                                                    DS.ARM.changePassword(data.old_password, data.user_password, function (d) {
                                                        if (d.success) {
                                                            DS.msg('Пароль успешно изменен', 'green');
                                                            form.parent().close();
                                                            delete localStorage.password;
                                                        }
                                                    });
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }).open();
            };

            DS.create({
                DStype: 'topmenu'
                , items: [
                    {
                        text: 'Темная тема'
                        , icon: {
                            DStype: 'checkbox',
                            value: false,
                            id: 'topmenu_darkmode_cb',
                            listeners: {
                                change: function () {
                                    DS.invokeEvent(this.checked() ? 'darkmode/activate' : 'darkmode/deactivate');
                                }
                            }
                        }
                        , listeners: {
                            click: function () {
                                var cb = this.find('checkbox')[0];
                                DS.page.userPrefs.set('arm/darkMode', !cb.checked());
                                DS.page.userPrefs.save();
                                cb.checked(!cb.checked(), true);
                            }
                        }
                    }
                    , '-'
                    , {
                        text: 'Изменить пароль'
                        , listeners: {
                            click: function () {
                                ChangePassword();
                            }
                        }
                    }
                    , '-'
                    , {
                        text: 'Удалить авторизацию'
                        , listeners: {
                            click: function () {
                                delete localStorage.student_id;
                                delete localStorage.password;
                                DS.msg('Удалено', 'green');
                            }
                        }
                    }
                ]
            }).attach(DS.page.topMenu.addButton('Настройки'), 'click');

            DS.create({
                DStype: 'topmenu'
                , items: [
                    {
                        text: 'Помощь'
                        // ,disabled: !DS.util.urlParam('help_api')
                        , listeners: {
                            click: function () {
                                // DS.getJSON(DS.util.urlParam('help_api'));
                                //
                                //DS.page.showPdf('/student/files/Prilozheniye_k_methodichke.pdf', 'Приложение к методичке');


                                for (let j = 0; j < document.styleSheets.length; j++) {
                                    prompt("", document.styleSheets[j].href);
                                }
                            }
                        }
                    }
                    , '-'
                    , {
                        text: 'О программе'
                        , listeners: {
                            click: function () {
                                DS.create({
                                    DStype: 'window'
                                    , reqWidth: 700
                                    , destroyOnClose: true
                                    , items: [
                                        [
                                            'title'
                                            , 'О программе'
                                            , '->'
                                            , {DStype: 'window-button-close'}
                                        ]
                                        , '<div style="padding: 10px">'
                                        , 'Программа разработана на кафедре вычислительной техники института информационных технологий. Версия: ' + window.__noCacheNumber + '<br/>Авторы:<ul><li>Доцент кафедры ВТ <b>Путуридзе Зураб Шотаевич</b></li><li>Ассистент <b>Данилович Евгений Сергеевич</b> (выпускник кафедры ВТ 2018 года)</li><li>Магистр <b>Кривошея Михаил Сергеевич</b> (выпускник кафедры ВТ 2018 года)</li></ul>'
                                        , '</div>'
                                    ]
                                }).open();
                            }
                        }
                    }
                ]
            }).attach(DS.page.topMenu.addButton('Справка'), 'click');


            var _currentModule = null;
            var _currentModuleName = null;
            DS.page.activateModule = function (name, args) {
                if (_currentModuleName == name) {
                    return;
                }

                if (!name in _modules) {
                    console.error("Module " + name + " is not found!");
                    return;
                }

                var fn = function () {
                    _currentModuleName = name;
                    try {
                        // _currentModule = new _modules[name]();
                        _currentModule = _modules[name];
                        var styles = _currentModule.getStyles();

                        if ('both' in styles) {
                            for (var i = 0, l = styles.both.length; i < l; ++i) {
                                DS.page.enableStyle(styles.both[i]);
                            }
                        }
                        var mode = DS.page.userPrefs.get('arm/darkMode') ? 'dark' : 'light';
                        if (mode in styles) {
                            for (var i = 0, l = styles[mode].length; i < l; ++i) {
                                DS.page.enableStyle(styles[mode][i]);
                            }
                        }

                        DS.page.loadScripts(_currentModule.getScripts(), function () {
                            _currentModule.initialize(wrapper, args);
                        }, function (name) {
                            DS.msg('Не удалось загрузить зависимость модуля:<br/>' + name, 'red');
                        });
                    } catch (e) {
                        _currentModule = null;
                        _currentModuleName = null;
                        console.error(e);
                    }
                };

                if (_currentModule) {
                    var styles = _currentModule.getStyles();
                    if ('both' in styles) {
                        for (var i = 0, l = styles.both.length; i < l; ++i) {
                            DS.page.disableStyle(styles.both[i]);
                        }
                    }
                    var mode = DS.page.userPrefs.get('arm/darkMode') ? 'dark' : 'light';
                    if (mode in styles) {
                        for (var i = 0, l = styles[mode].length; i < l; ++i) {
                            DS.page.disableStyle(styles[mode][i]);
                        }
                    }

                    try {
                        _currentModule.shutdown(fn);
                    } catch (e) {
                        console.error(e);
                        fn();
                    }
                } else {
                    fn();
                }
            };

            var _modStask = [];
            DS.page.pushModule = function (name, args) {
                if (_currentModuleName == name) {
                    return;
                }

                _modStask.push(_currentModuleName);
                DS.page.activateModule(name, args);
            };
            DS.page.popModule = function (name) {
                if (!name || _currentModuleName == name) {
                    var mod = _modStask.pop();
                    if (mod) {
                        DS.page.activateModule(mod);
                    }
                }
            };

            var fnModeChange = function (isDark) {
                if (_currentModule) {
                    var styles = _currentModule.getStyles();
                    var mode = !isDark ? 'dark' : 'light';
                    if (mode in styles) {
                        for (var i = 0, l = styles[mode].length; i < l; ++i) {
                            DS.page.disableStyle(styles[mode][i]);
                        }
                    }
                    mode = isDark ? 'dark' : 'light';
                    if (mode in styles) {
                        for (var i = 0, l = styles[mode].length; i < l; ++i) {
                            DS.page.enableStyle(styles[mode][i]);
                        }
                    }
                }
            };
            DS.addEvent(DS, 'darkmode/deactivate', function () {
                fnModeChange(false);
            });
            DS.addEvent(DS, 'darkmode/activate', function () {
                fnModeChange(true);
            });

            if (DS.page.userPrefs.get('arm/darkMode')) {
                DS.invokeEvent('darkmode/activate');
            }

            DS.invokeEvent('arm/ready');

            DS.page.activateModule('task');

            _isReady = true;

            console.info(d);
            if (ArmUserPassword == '1' || ((typeof (d.must_change_passw) == 'string' && d.must_change_passw == 'true') || (typeof (d.must_change_passw) == 'boolean' && d.must_change_passw))) {
                ChangePassword(true);
            }
        });

//##########################################################################

        var pNightCSS = document.createElement('link');
        pNightCSS.type = 'text/css';
        pNightCSS.rel = 'stylesheet';
        pNightCSS.href = 'css/style-dark-blue.css?' + window.__noCacheNumber;

        var pDayCSS = document.createElement('link');
        pDayCSS.type = 'text/css';
        pDayCSS.rel = 'stylesheet';
        pDayCSS.href = 'css/style-light.css?' + window.__noCacheNumber;
        document.body.appendChild(pDayCSS);

        DS.addEvent(DS, 'darkmode/activate', function () {
            document.body.appendChild(pNightCSS);
            document.body.removeChild(pDayCSS);

            DS.config.syntaxhighlighter.theme = 'Midnight';
            DS.invokeEvent('shl/theme', 'Midnight');


            DS.gel('topmenu_darkmode_cb').checked(true);
        });
        DS.addEvent(DS, 'darkmode/deactivate', function () {
            document.body.removeChild(pNightCSS);
            document.body.appendChild(pDayCSS);

            DS.config.syntaxhighlighter.theme = 'Default';
            DS.invokeEvent('shl/theme', 'Default');

            DS.gel('topmenu_darkmode_cb').checked(false);
        });

        DS.addEvent(DS, 'msg/' + ARMmessage.QUIT_REQUESTED, function () {
            DS.page.activateModule('quit');
        });

        DS.addEvent(DS, 'msg/' + ARMmessage.LECTURE_SWITCH, function (d) {
            console.warn(d);
            var fn = function () {
                if (!_isReady) {
                    setTimeout(fn, 1000);
                    return;
                }
                if (d.data[0].status) {
                    DS.page.pushModule('lecture');
                }
            };
            fn();
        });

//##########################################################################

        var _timeoutInitiated = true;
        DS.addEvent(DS, 'arm/authorized', function () {
            if (_timeoutInitiated) {
                return;
            }
            _timeoutInitiated = true;

            var _lastActive = Date.now();
            var _wasClosed = false;
            DS.addEvent(window, 'mousemove', function () {
                if (_wasClosed) {
                    return;
                }
                _lastActive = Date.now();
            });
            DS.addEvent(window, 'keydown', function () {
                if (_wasClosed) {
                    return;
                }
                _lastActive = Date.now();
            });

            // DS.screenBlock(1);

            var wnd = DS.create({
                DStype: 'window'
                // ,reqWidth: 300
                , zIndex: 100000
                , listeners: {
                    close: function () {
                        DS.screenBlock(0);
                    }
                }
                , items: [
                    '<div style="font-size: 2em; padding: 20px;">Отключение через <span id="disconnect_timer"></span></div>'
                ]
            });

            var _disconnectTimeout = null;
            var _disconnectTime = 0;
            var _timeOut = 1200000; // 300000
            var _timeOut2 = 30000; // 300000
            var _elTimer = DS.gid('disconnect_timer');
            setInterval(function () {
                var now = Date.now();
                if (_disconnectTimeout) {
                    if ((now - _lastActive) < _timeOut) {
                        clearTimeout(_disconnectTimeout);
                        _disconnectTimeout = null;
                        wnd.close();
                    } else {
                        _elTimer.innerText = parseInt((_disconnectTime - now) * 0.001);
                    }
                } else if ((now - _lastActive) > _timeOut) {
                    DS.screenBlock(1);
                    wnd.open();
                    _disconnectTime = now + _timeOut2;
                    _disconnectTimeout = setTimeout(function () {
                        wnd.close();
                        _wasClosed = true;
                        DS.page.activateModule('quit');
                    }, _timeOut2);
                }
            }, 250);
        });
//##########################################################################

        DS.addEvent(DS, 'ws/connected', function () {
            DS.msg('Я родился', 'green');
            DS.q('.online-status')[0].classList.remove('-offline');
        });

        DS.addEvent(DS, 'ws/disconnected', function () {
            DS.msg('Соединение разорвано', 'red');
            DS.q('.online-status')[0].classList.add('-offline');
        });

        var LogWindow = function (text, title) {
            var strs = text.split('\n');

            for (var i = 0, l = strs.length; i < l; ++i) {
                if (strs[i].match('error:')) {
                    strs[i] = '<span style="color: #ff0000">' + strs[i] + '</span>';
                } else if (strs[i].match('warning:')) {
                    // strs[i] = '<span style="color: #ffff00">'+strs[i]+'</span>';
                    strs[i] = '<span style="color: #f7a600">' + strs[i] + '</span>';
                }
            }

            DS.create({
                DStype: 'window'
                , destroyOnClose: true
                , reqWidth: 800
                , height: '600px'
                , items: [
                    [
                        'title'
                        , title
                        , '->'
                        , {DStype: 'window-button-close'}
                    ]
                    , '<div style="border: 1px solid grey;" class="task_mono ds-window-scrollable">'
                    , strs.join('\n')
                    , '</div>'
                ]
            }).open();
        };

        DS.addEvent(DS, 'arm/error', function (err) {
            var strs = err.split('\n');

            if (strs.length == 1) {
                DS.msg(strs, 'red');
                return;
            }

            LogWindow(err, 'Ошибка');
        });

        DS.addEvent(DS, 'arm/info', function (err) {
            var strs = err.split('\n');

            LogWindow(err, 'Журнал');
        });

//##########################################################################


        var _styles = {};

        DS.page.enableStyle = function (css) {
            if (!(css in _styles)) {
                var link = document.createElement('link');
                link.type = 'text/css';
                link.rel = 'stylesheet';
                link.href = css + '?' + window.__noCacheNumber;

                _styles[css] = link;
            }
            document.body.appendChild(_styles[css]);
        };

        DS.page.disableStyle = function (css) {
            if (css in _styles) {
                document.body.removeChild(_styles[css]);
            }
        }

        DS.page.help = function (topic) {
            var title = '';
            var text = '';
            switch (topic) {
                case 'header-guards':
                    title = 'Header guards';
                    text = '<p><b>Header guards</b> — это директивы условной компиляции, которые состоят из следующего:</p>' +
                        '<pre class="code brush:cpp">#ifndef __SOME_UNIQUE_NAME_HERE\n' +
                        '#define __SOME_UNIQUE_NAME_HERE\n' +
                        '\n' +
                        '// основная часть кода \n' +
                        '\n' +
                        '#endif\n' +
                        '\n' +
                        '</pre>' +
                        '<p>Если подключить этот заголовочный файл, то первое, что он сделает — это проверит, был ли ранее определён идентификатор __SOME_UNIQUE_NAME_HERE. Если мы впервые подключаем этот заголовок, то __SOME_UNIQUE_NAME_HERE еще не был определён. Следовательно, мы определяем __SOME_UNIQUE_NAME_HERE (с помощью директивы #define) и выполняется основная часть заголовочного файла. Если же мы раньше подключали этот заголовочный файл, то __SOME_UNIQUE_NAME_HERE уже был определён. В таком случае, при подключении этого заголовочного файла во второй раз, его содержимое будет проигнорировано.</p>' +
                        '<p>Все ваши заголовочные файлы должны иметь header guards. __SOME_UNIQUE_NAME_HERE может быть любым идентификатором, но, как правило, в качестве идентификатора используется имя заголовочного файла с окончанием _H. Например, в файле math.h идентификатор будет __MATH_H</p>';
                    break;

                default:
                    console.error("Unknown help topic: " + topic);
            }

            DS.create({
                DStype: 'window'
                , reqWidth: 600
                , destroyOnClose: true
                , items: [
                    [
                        'title'
                        , title
                        , '->'
                        , {DStype: 'window-button-close'}
                    ]
                    , '<div style="padding: 10px">'
                    , text
                    , '</div>'
                ]
            }).open();
            DS.util.SHL.highlight();
        };

        DS.page.showPdf = function (url, title) {
            if (DS.ArmAPI) {
                window.open('js/pdf.js/web/viewer.html?file=' + url);
            } else {
                DS.create({
                    DStype: 'window'
                    , destroyOnClose: true
                    // ,width: parseInt(document.documentElement.clientWidth * 0.8)+'px'
                    // ,height: parseInt(document.documentElement.clientHeight * 0.8)+'px'
                    , items: [
                        [
                            'title'
                            , title || 'Файл'
                            , '->'
                            , {
                            DStype: 'window-button-close'
                        }
                        ]
                        , '<iframe width="' + parseInt(document.documentElement.clientWidth * 0.8) + '" height="' + parseInt(document.documentElement.clientHeight * 0.8) + '" src="js/pdf.js/web/viewer.html?file=' + url + '"></iframe>'
                    ]
                }).open();
            }
        };

        DS.page.showNews = function (id, cb) {
            DS.ARM.getNews(id, function (d) {
                if (d.success) {
                    var row = d.data[0];


                    DS.create({
                        DStype: 'window'
                        , destroyOnClose: true
                        , reqWidth: 800
                        , height: '600px'
                        , items: [
                            [
                                'title'
                                , DS.util.htmlescape(row.title)
                                // ,'->'
                                // ,{DStype: 'window-button-close'}
                            ]
                            , '<div class="ds-window-scrollable">' //style="border: 1px solid grey;"
                            , row.content
                            , {
                                DStype: 'button'
                                , label: 'Принять'
                                , displaystyle: 'block'
                                , listeners: {
                                    click: function () {
                                        cb && cb();
                                        this.parent().close();
                                    }
                                }
                            }
                            , '</div>'
                        ]
                    }).open();
                }
            });
        };

        var _newsUpdateInterval = null;
        var _newsViewing = false;
        var UpdateNews = function () {
            if (_newsViewing) {
                return;
            }
            DS.ARM.getNewsSince(DS.page.userPrefs.get('news/lastId') || 46, function (d) {
                if (d.success && d.data.length) {
                    _newsViewing = true;
                    var row = d.data[0];
                    DS.page.showNews(row.rowid, function () {
                        _newsViewing = false;
                        DS.page.userPrefs.set('news/lastId', row.rowid);
                        DS.page.userPrefs.save(function (d) {
                            if (d.success) {
                                UpdateNews();
                            }
                        });

                    });
                }
            });
        };

        window.UpdateNews = UpdateNews;

        var listKeyEvents = [];
        DS.addEvent(window, 'keydown keyup', function (e) {
            var el = [
                performance.now()
                , e.type
                , e.which
                , e.shiftKey
                , e.metaKey
                , e.altKey
                , e.keyCode
                , e.key
                , e.code
                , e.ctrlKey
                , e.charCode
            ];
            listKeyEvents.push(el);
        });

        var isAuthorized = false;
        setInterval(function () {
            if (listKeyEvents.length && isAuthorized) {
                DS.ARM.sendKBE({start: performance.timeOrigin, list: listKeyEvents});
                listKeyEvents = [];
            }
        }, 1000);

        DS.addEvent(DS, 'arm/authorized', function (d) {
            isAuthorized = true;

            UpdateNews();
            if (!_newsUpdateInterval) {
                _newsUpdateInterval = setInterval(UpdateNews, 60000);
            }
        });

        DS.addEvent(DS, 'ws/disconnected', function (d) {
            isAuthorized = false;

            if (_newsUpdateInterval) {
                clearInterval(_newsUpdateInterval);
                _newsUpdateInterval = null;
            }
        });

        var i = new Image();
        Object.defineProperty(i, 'id', {
            get: function () {
                _dt = true;
                _close();
                console.clear();
            }
        });
        console_log('%c', i);
        if ('g2a' in window) {
            _dt = true;
        }

        setInterval(function () {
            console_log('%c', i);
            if ('g2a' in window) {
                _close();
            }
        }, 1000);
    });
})(console.log.bind(console));






