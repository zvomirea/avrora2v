'use strict';
DS.ready(function(){
    DS.page.registerTaskTool('code', function(){

        var themes = [
            'vs',
            '3024-day',
            '3024-night',
            'abcdef',
            'ambiance',
            'base16-dark',
            'bespin',
            'base16-light',
            'blackboard',
            'cobalt',
            'colorforth',
            'dracula',
            'duotone-dark',
            'duotone-light',
            'eclipse',
            'elegant',
            'erlang-dark',
            // 'gruvbox-dark',
            'hopscotch',
            'icecoder',
            'isotope',
            'lesser-dark',
            'liquibyte',
            'material',
            'mbo',
            'mdn-like',
            'midnight',
            'monokai',
            'neat',
            'neo',
            'night',
            'oceanic-next',
            'panda-syntax',
            'paraiso-dark',
            'paraiso-light',
            'pastel-on-dark',
            'railscasts',
            'rubyblue',
            'seti',
            'shadowfox',
            'solarized',
            'the-matrix',

            'tmrw-night-bright',
            'tmrw-night-eighties',
            'ttcn',
            'twilight',
            'vibrant-ink',
            'xq-dark',
            'xq-light',
            'yeti',
            'zenburn',
        ];

        var self = this;

        var cmStyle = document.createElement('style');
        cmStyle.type = 'text/css';
        var rootWidget;
        var editor;
        var $menuTheme;
        var $menuSize;
        var topMenuTheme;
        var topMenuSize;
        var topMenuRun;
        var topMenuRunP;
        var idTask;
        var userTheme;

        var formatFragment = function(code, baseIndent){
            return(code);
        };

        var VisualizeSpaces = function(d){
            d = d.replace(/\n/g, '↵\n');
            d = d.replace(/ /g, '˽');
            return(d);
        };

        var folders = [
            'Header Files'
            ,'Source Files'
        ];

        this.testCode = function(){
            var err = [];
            editor.foreach(function(file){
                // console.log(file);
                if(
                    file.name.substr(-2) == '.c'
                    || file.name.substr(-2) == '.h'
                    || file.name.substr(-4) == '.cpp'
                    || file.name.substr(-4) == '.hpp'
                ){
                    var code = file.content.split('\n');

                    if(file.name.substr(-2) == '.h' || file.name.substr(-4) == '.hpp'){
                        if(code[0].substr(0, 7) != '#ifndef' || code[1].substr(0, 7) != '#define'){
                            err.push(['Ожидался <a href="#" onclick="DS.page.help(\'header-guards\');">Header guards</a>', file.name, 1]);
                        }
                    }

                    var tcPrev = 0;
                    for(var i = 0, l = code.length; i < l; ++i){
                        var str = code[i];

                        var pFound = false;
                        for(var j = 0, jl = str.length; j < jl; ++j){
                            if(/\s/.test(str[j])){
                                continue;
                            }
                            if(pFound){
                                if(str.substr(j, 7) == 'include' && /\.(c|cpp)["\>]/.test(str.substr(j + 7))){
                                    err.push(['Включать можно только заголовочные файлы', file.name, i + 1]);
                                }
                                break;
                            }
                            if(str[j] == '#'){
                                pFound = true;
                            }
                        }

                        var tc = 0;
                        for(var j = 0, jl = str.length; j < jl; ++j){
                            if(str[j] == '\t'){
                                ++tc;
                            }
                            else if(str[j] == ' '){
                                err.push(['Выравнивание должно выполняться табуляцией', file.name, i + 1]);
                                break;
                            }
                            else{
                                break;
                            }
                        }
                        // console.log(tc);
                        if(Math.abs(tc - tcPrev) > 1){
                            // err.push(['Количество отступов в соседних строках не должно отличаться больше чем на 1', file.name, i + 1]);
                        }
                        tcPrev = tc;

                        /* var bFound = false;
                        var cFound = false;
                        var inDC = false;
                        var inSC = false;
                        for(var j = 0, jl = str.length; j < jl; ++j){
                            if(str[j] == '"'){
                                inDC = !inDC;
                            }
                            if(inDC){
                                continue;
                            }
                            if(str[j] == '\''){
                                inSC = !inSC;
                            }
                            if(inSC){
                                continue;
                            }

                            if(!bFound && (str[j] == '{' || str[j] == '}')){
                                bFound = true;
                            }
                            else if(str[j] != '\t' && str[j] != ' '){
                                cFound = true;
                            }
                        }
                        if(bFound && cFound){
                            err.push(['Фигурная скобка должна быть на отдельной строке', file.name, i + 1]);
                        } */
                    }
                }
            });

            return(err.length ? err : null);
        };

        var PromptTestRun = function(reallyPrompt){
            var RunWithInput = function(input){
                DS.progressWindow('Выполнение...');
                editor.saveAll(function(){
                    var test = self.testCode();
                    if(test){
                        var msg = [];
                        for(var i = 0, l = test.length; i < l; ++i){
                            msg.push(test[i][1]+':'+test[i][2]+' - '+test[i][0]);
                        }
                        DS.invokeEvent('arm/error', msg.join("\n"));

                        DS.progressWindow();
                        DS.msg('Найдены ошибки оформления кода', 'red');
                        return;
                    }

                    DS.ARM.runTaskWithInput(idTask, input, function(d){
                        console.warn(d);
                        DS.progressWindow();
                        if(d.success){

                            DS.invokeEvent('arm/info',
                                'Вывод программы\n'+
                                '---------------\n'+
                                VisualizeSpaces(d.data.test_run_text)+'\n'+
                                '---------------\n'+
                                'Код возврата: '+d.data.exit_code+'\n'
                            );
                        }
                    });
                });
            };

            var input = DS.page.getTaskField('test-input') || '';

            if(input && !reallyPrompt){
                RunWithInput(input);
                DS.msg('Для установки входных данных, удерживайте Shift при нажатии');
                return;
            }

            var wnd = DS.create({
                DStype: 'window'
                ,position: 'auto'
                ,destroyOnClose: true
                ,reqWidth: 600
                ,items: [
                    [
                        'title'
                        ,'Запуск'
                        ,'->'
                        ,{
                        DStype: 'window-button-close'
                    }
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
                                        ,label: 'Входные данные'
                                        ,'class': 'monotype code'
                                        ,name: 'input_data'
                                    }
                                    ,{
                                        DStype: 'button'
                                        ,label: 'Запуск!'
                                        ,listeners: {
                                            click: function(){
                                                var $form = this.getForm();
                                                var data = $form.getFields();
                                                DS.page.setTaskField('test-input', data.input_data);
                                                $form.parent().close();

                                                RunWithInput(data.input_data);
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }).open();

            wnd.find('form-panel')[0].setFields({input_data: input});
        };

        var initWidget = function(element){
            rootWidget = DS.create({
                DStype: 'list-layout'
                ,renderTo: element
                ,blockstyle: 'position: relative;height: 100%;'
                ,items: [
                    {
                        DStype: 'div'
                        // ,blockstyle: 'position: absolute; top: 30px; left: 0; bottom: 30px; right: 0;'
                        ,blockstyle: 'position: absolute; top: 0; left: 0; bottom: 0px; right: 0;'
                        ,items: [
                            {
                                DStype: 'div'
                                // ,blockstyle: 'background-color: rgba(0,255,0,0.3);position: absolute;top: 0; left: 0; width: 300px; bottom: 0'
                                ,id: 'editor_area_left'
                                ,items: [
                                    {
                                        DStype: 'tree'
                                        ,root: 'Проект'
                                        // ,editable: true
                                        ,name: 'files_tree'
                                        ,items: []
                                        ,listeners: {
                                            click: function(data){
                                                data = DS.gel(data.object).getData();
                                                if(data.isFile){
                                                    editor.openFile(data.id);
                                                }
                                                // console.warn(data);
                                            }
                                        }
                                        ,menuObj: DS.create({
                                            DStype: 'menu',
                                            display: false,
                                            items: [
                                                {
                                                    text: _('Добавить новый файл')
                                                    ,name: 'add'
                                                    ,listeners: {
                                                        click: function(o){
                                                            var data = DS.gel(this.parent().obj).getData();
                                                            if(data.isFolder){
                                                                var folderId = data.id.substr(2);

                                                                DS.create({
                                                                    DStype: 'window',
                                                                    position: 'auto',
                                                                    destroyOnClose: true,
                                                                    reqWidth: 300,
                                                                    items: [
                                                                        [
                                                                            'title',
                                                                            {
                                                                                DStype: 'html',
                                                                                html: '<span style="cursor: default">Новый файл</span>'
                                                                            },
                                                                            '->',
                                                                            {
                                                                                DStype: 'window-button-close'
                                                                            }
                                                                        ],
                                                                        {
                                                                            DStype: 'form-panel'
                                                                            ,items: [
                                                                                {
                                                                                    DStype: 'list-layout'
                                                                                    ,items: [
                                                                                        {
                                                                                            DStype: 'combo'
                                                                                            ,label: 'Раздел'
                                                                                            ,items: (function(){
                                                                                                var items = [];
                                                                                                for(var i = 0, l = folders.length; i < l; ++i){
                                                                                                    items.push({
                                                                                                        text: folders[i]
                                                                                                        ,value: i
                                                                                                    });
                                                                                                }
                                                                                                return(items);
                                                                                            })()
                                                                                            ,value: folderId
                                                                                            ,name: 'folder'
                                                                                        },
                                                                                        {
                                                                                            DStype: 'textfield'
                                                                                            ,label: 'Имя файла'
                                                                                            ,name: 'filename'
                                                                                        }
                                                                                        ,{
                                                                                            DStype: 'button'
                                                                                            ,label: 'Добавить'
                                                                                            ,listeners: {
                                                                                                click: function(){
                                                                                                    var form = this.getForm();
                                                                                                    var data = form.getFields();
                                                                                                    var bad = false;
                                                                                                    data.filename = data.filename.trim();
                                                                                                    if(!data.filename){
                                                                                                        form.find('=filename')[0].AddError('Необходимо ввести имя файла');
                                                                                                        bad = true;
                                                                                                    }
                                                                                                    if(data.folder === ''){
                                                                                                        form.find('=folder')[0].AddError('Необходимо выбрать раздел');
                                                                                                        bad = true;
                                                                                                    }

                                                                                                    if(!bad){
                                                                                                        editor.createFile(data.filename, data.folder, '', true);
                                                                                                        form.parent().close();
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    ]
                                                                                }
                                                                            ]
                                                                        }
                                                                    ]
                                                                }).open();
                                                            }
                                                        }
                                                    }
                                                }
                                                ,'-'
                                                ,{
                                                    text: _('Копировать')
                                                    ,name: 'copy'
                                                    ,listeners: {
                                                        click: function(o){
                                                            var data = DS.gel(this.parent().obj).getData();
                                                            var fileId = data.id;
                                                            DS.create({
                                                                DStype: 'window',
                                                                position: 'auto',
                                                                destroyOnClose: true,
                                                                reqWidth: 300,
                                                                items: [
                                                                    [
                                                                        'title',
                                                                        {
                                                                            DStype: 'html',
                                                                            html: '<span style="cursor: default">Скопировать</span>'
                                                                        },
                                                                        '->',
                                                                        {
                                                                            DStype: 'window-button-close'
                                                                        }
                                                                    ],
                                                                    {
                                                                        DStype: 'form-panel'
                                                                        ,items: [
                                                                            {
                                                                                DStype: 'list-layout'
                                                                                ,items: [
                                                                                    {
                                                                                        DStype: 'textfield'
                                                                                        ,label: 'Имя файла'
                                                                                        ,name: 'filename'
                                                                                    }
                                                                                    ,{
                                                                                        DStype: 'button'
                                                                                        ,label: 'Сохранить'
                                                                                        ,listeners: {
                                                                                            click: function(){
                                                                                                var form = this.getForm();
                                                                                                var data = form.getFields();
                                                                                                var bad = false;
                                                                                                data.filename = data.filename.trim();
                                                                                                if(!data.filename){
                                                                                                    form.find('=filename')[0].AddError('Необходимо ввести имя файла');
                                                                                                    bad = true;
                                                                                                }

                                                                                                if(!editor.cloneFile(fileId, data.filename)){
                                                                                                    form.find('=filename')[0].AddError('Файл с таким именем уже существует');
                                                                                                    bad = true;
                                                                                                }

                                                                                                if(!bad){
                                                                                                    form.parent().close();
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                ]
                                                                            }
                                                                        ]
                                                                    }
                                                                ]
                                                            }).open().find('form-panel')[0].setFields({filename: editor.getFileName(fileId)});
                                                        }
                                                    }
                                                }
                                                ,{
                                                    text: _('Переименовать')
                                                    ,name: 'ren'
                                                    ,listeners: {
                                                        click: function(o){
                                                            var data = DS.gel(this.parent().obj).getData();
                                                            var fileId = data.id;
                                                            DS.create({
                                                                DStype: 'window',
                                                                position: 'auto',
                                                                destroyOnClose: true,
                                                                reqWidth: 300,
                                                                items: [
                                                                    [
                                                                        'title',
                                                                        {
                                                                            DStype: 'html',
                                                                            html: '<span style="cursor: default">Переименовать</span>'
                                                                        },
                                                                        '->',
                                                                        {
                                                                            DStype: 'window-button-close'
                                                                        }
                                                                    ],
                                                                    {
                                                                        DStype: 'form-panel'
                                                                        ,items: [
                                                                            {
                                                                                DStype: 'list-layout'
                                                                                ,items: [
                                                                                    {
                                                                                        DStype: 'textfield'
                                                                                        ,label: 'Имя файла'
                                                                                        ,name: 'filename'
                                                                                    }
                                                                                    ,{
                                                                                        DStype: 'button'
                                                                                        ,label: 'Сохранить'
                                                                                        ,listeners: {
                                                                                            click: function(){
                                                                                                var form = this.getForm();
                                                                                                var data = form.getFields();
                                                                                                var bad = false;
                                                                                                data.filename = data.filename.trim();
                                                                                                if(!data.filename){
                                                                                                    form.find('=filename')[0].AddError('Необходимо ввести имя файла');
                                                                                                    bad = true;
                                                                                                }
                                                                                                if(!editor.renameFile(fileId, data.filename)){
                                                                                                    form.find('=filename')[0].AddError('Файл с таким именем уже существует');
                                                                                                    bad = true;
                                                                                                }

                                                                                                if(!bad){
                                                                                                    form.parent().close();
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                ]
                                                                            }
                                                                        ]
                                                                    }
                                                                ]
                                                            }).open().find('form-panel')[0].setFields({filename: editor.getFileName(fileId)});
                                                        }
                                                    }
                                                }
                                                ,{
                                                    text: _('Удалить')
                                                    ,name: 'del'
                                                    ,listeners: {
                                                        click: function(o){
                                                            var data = DS.gel(this.parent().obj).getData();
                                                            DS.confirm('Вы действительно хотите удалить этот файл? Это действие нельзя отменить.', function(){
                                                                editor.removeFile(data.id);
                                                            });
                                                            console.warn(data);
                                                        }
                                                    }
                                                }
                                            ]
                                        })
                                    }
                                ]
                            }
                            ,{
                                DStype: 'div'
                                // ,blockstyle: 'background-color: rgba(0,0,255,0.3);position: absolute;top: 0; left: 300px; width: 10px; bottom: 0; cursor: ew-resize;'
                                ,id: 'editor_area_drag'
                            }
                            ,{
                                DStype: 'div'
                                ,blockstyle: 'position: absolute;top: 6px; left: 210px; right: 0; bottom: 0'
                                ,id: 'editor_area_right'
                                ,items: [
                                    {
                                        DStype: 'div'
                                        ,blockstyle: 'position: absolute; top: 0; left: 0; height: 30px; right: 0;'
                                        ,name: 'tabs_header'
                                        /* ,items: [
                                            '<div class="editor_tab changed">main.cpp* <i></i></div>'
                                            ,'<div class="editor_tab active">main.cpp <i></i></div>'
                                            ,'<div class="editor_tab">main.h <i></i></div>'
                                        ] */
                                    }
                                    ,{
                                        DStype: 'div'
                                        ,blockstyle: 'position: absolute; top: 30px; left: 0; bottom: 0; right: 0;' // background-color: rgba(255,0,0,0.3);
                                        ,name: 'tabs_code'
                                        ,items: ['Выберите файл или создайте новый']
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });


            (function(){
                var isResising = false;
                var mposX = 0;
                var dposX = 0;

                var divLeft = DS.gid('element-editor_area_left');
                var divDrag = DS.gid('element-editor_area_drag');
                var divRight = DS.gid('element-editor_area_right');

                DS.addEvent(divDrag, 'mousedown', function(event){
                    isResising = true;
                    console.log(event);
                    mposX = event.clientX;
                    dposX = parseInt(DS.css(divDrag, 'left'));
                    event.stopPropagation();
                });

                DS.addEvent(window, 'mouseup', function(event){
                    isResising = false;
                });

                DS.addEvent(window, 'mousemove', function(event){
                    if(isResising){
                        var left = (event.clientX - mposX + dposX);
                        if(left < 100){
                            left = 100;
                        }
                        if(left > 600){
                            left = 600;
                        }
                        DS.css(divDrag, 'left', left+'px');
                        DS.css(divLeft, 'width', left+'px');
                        DS.css(divRight, 'left', (left + 10)+'px');
                    }
                });

            })();
        };

        var initEditor = function(){
            editor = new (function(){
                var files = [];

                var tabs = [];
                var activeTab = -1;

                window.tabs = tabs;

                var tabs_header = rootWidget.find('=tabs_header')[0].getObject();
                var tabs_code = rootWidget.find('=tabs_code')[0].getObject();

                this.createFile = function(name, folder, content, open, noUpdate){
                    for(var i = 0, l = files.length; i < l; ++i){
                        if(files[i] && files[i].name == name){
                            DS.msg('Файл с таким именем уже существует', 'red');
                            return;
                        }
                    }

                    if(folder < 0){
                        folder = 1;
                        var ext = name.substr(name.lastIndexOf('.') + 1);
                        switch(ext){
                            case 'h':
                            case 'hpp':
                                folder = 0;
                                break;
                        }
                    }

                    files.push({
                        name: name
                        ,folder: folder
                        ,content: formatFragment(content)
                    });

                    if(open){
                        this.openFile(files.length - 1, true);
                    }

                    if(!noUpdate){
                        this.updateFilesTree();
                    }
                };

                this.updateFilesTree = function(){
                    var _folders = [];

                    for(var i = 0, l = folders.length; i < l; ++i){
                        _folders.push({
                            title: folders[i]
                            ,opened: true
                            ,menuconf: DS.util.htmlescape(DS.JSON.encode({_default: false, add: true}))
                            ,data: {
                                isFolder: true
                                ,id: 'f_'+i
                            }
                            ,items: []
                        });
                    }

                    for(var i = 0, l = files.length; i < l; ++i){
                        var file = files[i];
                        if(file){
                            _folders[file.folder].items.push({
                                title: file.name
                                ,menuconf: DS.util.htmlescape(DS.JSON.encode({_default: false, del: true, ren: true, copy: true}))
                                ,data: {
                                    isFile: true
                                    ,id: i
                                }
                                ,items: []
                            });
                        }
                    }

                    var edt = rootWidget.find('=files_tree')[0];
                    edt.config._savedItems = _folders;
                    edt = edt.reRender();
                    edt.parent().childrens[0] = edt;
                };

                this.openFile = function(id, doSave){
                    for(var i = 0, l = tabs.length; i < l; ++i){
                        if(tabs[i] && tabs[i].fileId == id){
                            this.activateTab(i);
                            return;
                        }
                    }

                    var elTab = document.createElement('div');
                    //<div class="editor_tab changed">main.cpp* <i></i></div>
                    elTab.className = 'editor_tab';
                    elTab.appendChild(document.createTextNode(files[id].name+' '));
                    var cls = document.createElement('i');
                    elTab.appendChild(cls);

                    DS.addEvent(elTab, 'click', (function(tid){return(function(){
                        this.activateTab(tid);
                    }.bind(this));}.bind(this))(tabs.length));

                    DS.addEvent(cls, 'click', (function(tid){return(function(e){
                        this.closeTab(tid);
                        e.stopPropagation();
                    }.bind(this));}.bind(this))(tabs.length), true);

                    tabs_header.appendChild(elTab);

                    var div = document.createElement('div');
                    div.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0;';
                    tabs_code.appendChild(div);

                    var edt = CodeMirror(div, {
                        mode: "text/x-csrc"
                        ,indentWithTabs: true
                        ,lineNumbers: true
                        ,indentUnit: 4
                        ,lineWiseCopyCut: true
                        ,resetSelectionOnContextMenu: false
                        ,styleActiveLine: true
                        ,matchBrackets: true
                        ,autoEnabled: true
                        ,gutters: ["CodeMirror-linenumbers", "CodeMirror-lint-markers"]
                        ,extraKeys: {
                            "Ctrl-Space": "autocomplete"
                            ,"Ctrl-D": function(cm){
                                console.warn(cm);
                                var selectedText = cm.getSelection(); // Need to grab the Active Selection
                                if(selectedText){
                                    var head = cm.getCursor('head');
                                    var anchor = cm.getCursor('anchor');
                                    cm.replaceSelection(selectedText + selectedText);
                                    cm.focus();
                                    cm.setSelection(head, anchor);
                                }
                                else{
                                    window.cm = cm;
                                    var cursor = cm.getCursor();
                                    selectedText = cm.getLine(cursor.line);
                                    var oldLine = cursor.line;
                                    var oldCh = cursor.ch;
                                    cursor.ch = selectedText.length;
                                    cm.replaceSelection('\n'+selectedText);
                                    cm.focus();
                                    cm.setCursor(oldLine, oldCh);
                                }
                            }

                            /* ,"'('": function(cm) {
                                cm.autoFormat(cm, '(');
                            },
                            "')'": function(cm) {
                                cm.autoFormat(cm, ')');
                            },
                            "'\''": function(cm) {
                                cm.autoFormat(cm, '\'');
                            },
                            "'\"'": function(cm) {
                                cm.autoFormat(cm, '\"');
                            },
                            "'{'": function(cm) {
                                cm.autoFormat(cm, '{');
                            },
                            "'['": function(cm) {
                                cm.autoFormat(cm, '[');
                            },
                            "']'": function(cm) {
                                cm.autoFormat(cm, ']');
                            }, */
                            /* "Enter": function(cm) {
                                cm.autoFormat(cm, '13');
                            },
                            "Backspace": function(cm) {
                                cm.autoFormat(cm, '12');
                            }, */
                            /* "Ctrl-D": function(cm) {
                                cm.autoFormat(cm, 'CtrlD');
                            }, */
                            /* "Ctrl-Up": function(cm) {
                                cm.autoFormat(cm, 'CtrlUp');
                            },
                            "Ctrl-Down": function(cm) {
                                cm.autoFormat(cm, 'CtrlDown');
                            }, */
                            /* "Shift-Ctrl-Down": function(cm) {
                                cm.autoFormat(cm, 'CtrlShiftDown');
                            } */
                        }
                        ,value: formatFragment(files[id].content)
                        ,theme: userTheme || 'vs'
                        ,lint: {
                            getAnnotations: function(code, updateLinting, options){
                                //debugger;

                                var listFiles = [];

                                for(var i = 0, l = tabs.length; i < l; ++i){
                                    if(tabs[i]){
                                        files[tabs[i].fileId].content = tabs[i].editor.getValue()
                                    }
                                }

                                for(var i = 0, l = files.length; i < l; ++i){
                                    if(files[i]){
                                        listFiles.push([files[i].name, files[i].content]);
                                    }
                                }

                                DS.ARM.getCodeLint(idTask, files[id].name, listFiles, function(d){
                                    if(d.success){
                                        var list = [];
                                        for(var i = 0, l = d.data.length; i < l; ++i){
                                            var el = d.data[i];
                                            list.push({
                                                from: CodeMirror.Pos(el[2] - 1, el[3] - 1)
                                                ,to: CodeMirror.Pos(el[4] - 1, el[5])
                                                ,message: el[1]
                                                ,severity: el[0] == 0 ? 'warning' : 'error'
                                            });
                                            // [0/1 (w/e), "msg", LineFrom, CharFrom, LineTo, CharTo]
                                        }
                                        updateLinting(list);
                                    }
                                });
                                // console.info(code, options);
                                // DS.ARM.getCodeLint
                                // updateLinting([{from: CodeMirror.Pos(1, 1),to: CodeMirror.Pos(1, 7),message: 'error',severity:'warning'}]);
                                // var found =[];
                                // var start_line = 3, end_line = 3, start_char = 2, end_char = 5;
                                // found.push({
                                // from: CodeMirror.Pos(start_line - 1, start_char),
                                // to: CodeMirror.Pos(end_line - 1, end_char),
                                // message: 'error'
                                // });
                                // console.error(found);
                                // window.updateLinting = updateLinting;
                                // window.found = found;
                                // window.cm = cm;
                                // updateLinting(cm, found);
                            }
                            ,'async': true
                        }
                    });


                    edt.on('change', (function(tid){return(function(e){
                        this.updateTabs();
                    }.bind(this));}.bind(this))(tabs.length));




                    edt.on('copy', function(o, e){
                        // console.warn(e, q, w);
                        DS.page.cb.onCopy(e.target.value);
                        // lastCopied = e.target.value;
                    });

                    edt.on('cut', function(o, e){
                        //DS.alert(e.target.value, 'cut');
                        // lastCopied = e.target.value;
                        DS.page.cb.onCopy(e.target.value);
                    });

                    edt.on('save', (function(tid){return(function(d){
                        var cm = d.cm;
                        var content = files[tabs[tid].fileId].content = cm.getValue();
                        cm.doc.markClean();
                        this.updateTabs();
                        this.onSave && this.onSave(files[tabs[tid].fileId].name, content, d.cb);
                    }.bind(this));}.bind(this))(tabs.length));

                    tabs.push({
                        fileId: id
                        ,elTab: elTab
                        ,elTabContent: div
                        ,editor: edt
                    });

                    this.activateTab(tabs.length - 1);

                    if(doSave){
                        // edt.doc.changeGeneration(true);
                        this.onSave && this.onSave(files[tabs[tabs.length - 1].fileId].name, files[tabs[tabs.length - 1].fileId].content);
                    }
                };

                this.activateTab = function(id){
                    activeTab = id;
                    this.updateTabs();

                    // load editor
                };

                this.getFileName = function(id){
                    return(files[id] && files[id].name);
                };

                this.removeFile = function(id){
                    if(!files[id]){
                        return;
                    }
                    for(var i = 0, l = tabs.length; i < l; ++i){
                        if(tabs[i] && tabs[i].fileId == id){
                            this.closeTab(i);
                            break;
                        }
                    }
                    this.onRemove(files[id].name);
                    files[id] = false;

                    this.updateFilesTree();
                }

                this.renameFile = function(id, new_name){
                    if(!files[id]){
                        return(false);
                    }

                    for(var i = 0, l = files.length; i < l; ++i){
                        if(files[i] && files[i].name == new_name){
                            DS.msg('Файл с таким именем уже существует', 'red');
                            return(false);
                        }
                    }

                    this.onRename(files[id].name, new_name);
                    files[id].name = new_name;

                    this.updateTabs();
                    this.updateFilesTree();

                    return(true);
                };

                this.cloneFile = function(id, new_name){
                    if(!files[id]){
                        return(false);
                    }

                    for(var i = 0, l = files.length; i < l; ++i){
                        if(files[i] && files[i].name == new_name){
                            DS.msg('Файл с таким именем уже существует', 'red');
                            return(false);
                        }
                    }

                    this.createFile(new_name, files[id].folder, files[id].content, true);
                    return(true)
                };

                this.closeTab = function(id){
                    if(activeTab == id){
                        activeTab = -1;
                    }

                    var fn = function(){
                        tabs_header.removeChild(tabs[id].elTab);
                        tabs_code.removeChild(tabs[id].elTabContent);
                        tabs[id] = false;
                        this.updateTabs();
                    }.bind(this);

                    if(!tabs[id].editor.doc.isClean()){
                        DS.confirm('Имеются несохраненные изменения. Закрыть?', fn);
                    }
                    else{
                        fn();
                    }
                };

                this.updateTabs = function(){
                    for(var i = 0, l = tabs.length; i < l; ++i){
                        var tab = tabs[i];
                        if(tab){
                            DS.util[!tab.editor.doc.isClean() ? 'addClass' : 'removeClass'](tab.elTab, 'changed');
                            DS.util[i == activeTab ? 'addClass' : 'removeClass'](tab.elTab, 'active');
                            DS.css(tab.elTabContent, 'display', [i == activeTab ? 'block' : 'none']);

                            tab.elTab.firstChild.textContent = files[tab.fileId].name+(!tab.editor.doc.isClean() ? '*' : '')+' ';
                        }
                    }
                };

                this.setTheme = function(theme){
                    for(var i = 0, l = tabs.length; i < l; ++i){
                        tabs[i] && tabs[i].editor.setOption('theme', theme);
                    }

                    userTheme = theme;
                };

                this.saveAll = function(cb){
                    var count = tabs.length;
                    if(!count){
                        cb && cb();
                        return;
                    }
                    for(var i = 0, l = count; i < l; ++i){
                        if(tabs[i]){
                            CodeMirror.signal(tabs[i].editor, 'save', {cm: tabs[i].editor, cb: function(){
                                    if(!--count){
                                        cb && cb();
                                    }
                                }});
                        }
                        else{
                            if(!--count){
                                cb && cb();
                            }
                        }
                    }
                };

                this.closeAll = function(){
                    for(var i = 0, l = tabs.length; i < l; ++i){
                        tabs[i] && this.closeTab(i);
                    }
                };

                this.clear = function(){
                    this.closeAll();

                    tabs = [];
                    files = [];

                    this.updateFilesTree();
                };

                this.refresh = function(){
                    for(var i = 0, l = tabs.length; i < l; ++i){
                        tabs[i] && tabs[i].editor.refresh();
                    }
                };

                this.foreach = function(cb){
                    for(var i = 0, l = files.length; i < l; ++i){
                        files[i] && cb(files[i]);
                    }
                };

                this.onSave = function(name, code, cb){
                    DS.ARM.saveTaskFile(idTask, name, code, function(d){
                        if(d.success){
                            DS.msg('Файл '+DS.util.htmlescape(name)+' успешно сохранен', 'green');
                        }
                        else{
                            DS.msg('Не удалось сохранить файл '+DS.util.htmlescape(name), 'red');
                        }
                        cb && cb(d);
                    });
                };

                /* this.getCM = function(tab){
                    return(tabs[tab].editor);
                }; */

                this.onRemove = function(name){
                    DS.ARM.removeTaskFile(idTask, name, function(d){
                        if(d.success){
                            DS.msg('Файл '+DS.util.htmlescape(name)+' успешно удален', 'green');
                        }
                        else{
                            DS.msg('Не удалось удалить файл '+DS.util.htmlescape(name), 'red');
                        }
                    });
                };

                this.onRename = function(old_name, new_name){
                    DS.ARM.renameTaskFile(idTask, old_name, new_name, function(d){
                        if(d.success){
                            DS.msg('Файл '+DS.util.htmlescape(name)+' успешно переименован', 'green');
                        }
                        else{
                            DS.msg('Не удалось переименовать файл '+DS.util.htmlescape(name), 'red');
                        }
                    });
                };
            })();
        };

        this.getTitle = function(){
            return('Исходный код'); // tab title
        };

        var fnModeChange = function(){
            var isDark = DS.page.userPrefs.get('arm/darkMode');
            userTheme = DS.page.userPrefs.get('task/codeTheme/'+(isDark ? 'dark' : 'bright')) || (isDark ? 'cobalt' : 'vs');

            if($menuTheme){

                var list = $menuTheme.find('checkbox');
                for(var i = 0, l = list.length; i < l; ++i){
                    list[i].checked(false);
                }

                editor.setTheme(userTheme);

                list = $menuTheme.find('topmenu-item');
                for(var i = 0, l = list.length; i < l; ++i){
                    if(list[i].config.text == userTheme){
                        list[i].find('checkbox')[0].checked(true);
                        break;
                    }
                }
            }

        };

        var _hasFiles = false;
        // Initialize all required stuff, use `element` as render root
        this.initialize = function(element){
            idTask = DS.page.getTaskField('id');

            CodeMirror.commands.save = function(editor){
                CodeMirror.signal(editor, 'save', {cm: editor, cb: function(){}});
            };

            document.body.appendChild(cmStyle);
            initWidget(element);
            initEditor();
            //cobalt
            var isDark = DS.page.userPrefs.get('arm/darkMode');
            userTheme = DS.page.userPrefs.get('task/codeTheme/'+(isDark ? 'dark' : 'bright')) || (isDark ? 'cobalt' : 'vs');
            var menuItems = [];
            for(var i = 0, l = themes.length; i < l; ++i){
                menuItems.push({
                    text: themes[i]
                    ,icon: {
                        DStype: 'checkbox'
                        ,value: userTheme == themes[i]
                    }
                    ,listeners: {
                        click: function(){
                            var list = this.find('!checkbox');
                            for(var j = 0, jl = list.length; j < jl; ++j){
                                list[j].checked(false);
                            }
                            var cb = this.find('checkbox')[0];
                            var isDark = DS.page.userPrefs.get('arm/darkMode');
                            DS.page.userPrefs.set('task/codeTheme/'+(isDark ? 'dark' : 'bright'), this.config.text);
                            DS.page.userPrefs.save();
                            cb.checked(true);

                            editor.setTheme(this.config.text);
                        }
                    }
                });
            }

            DS.addEvent(DS, 'darkmode/deactivate', fnModeChange);
            DS.addEvent(DS, 'darkmode/activate', fnModeChange);

            $menuTheme = DS.create({
                DStype: 'topmenu'
                ,items: menuItems
            });


            var userSize = DS.page.userPrefs.get('task/codeTheme/size') || 13;
            cmStyle.innerHTML = '.CodeMirror{font-size: '+userSize+'px}';
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
                            DS.page.userPrefs.set('task/codeTheme/size', this.config.text);
                            DS.page.userPrefs.save();
                            cb.checked(true);

                            cmStyle.innerHTML = '.CodeMirror{font-size: '+this.config.text+'px}';
                            editor && editor.refresh();
                        }
                    }
                });
            }
            $menuSize = DS.create({
                DStype: 'topmenu'
                ,items: menuItems
            });

            DS.ARM.getTaskFiles(idTask, function(d){
                if(d.success){
                    for(var i = 0, l = d.data.length; i < l; ++i){
                        _hasFiles = true;
                        editor.createFile(d.data[i].name, -1, d.data[i].file, false, true);
                        editor.updateFilesTree();
                    }
                }
            });

            // editor.createFile('main.cpp', 0, 'void main(){}', false, true);
            // editor.createFile('main.h', 1, '#ifndef _MAIN_H_');
        };

        // close task, finish all tasks and network queries, then run callback
        this.shutdown = function(callback){

            DS.removeEvent(DS, 'darkmode/deactivate', fnModeChange);
            DS.removeEvent(DS, 'darkmode/activate', fnModeChange);

            $menuSize.remove();
            $menuTheme.remove();
            editor.saveAll(function(){

                editor.closeAll();
                document.body.removeChild(cmStyle);
                rootWidget.remove();

                callback();
            });
        };

        var HandleF5 = function(e){
            if(e.key == 'F5'){
                PromptTestRun(e.shiftKey);
            }
        };

        // called after page show
        this.show = function(){
            topMenuTheme = DS.page.topMenu.addButton('Тема');
            $menuTheme.attach(topMenuTheme, 'click');

            topMenuSize = DS.page.topMenu.addButton('Шрифт');
            $menuSize.attach(topMenuSize, 'click');

            topMenuRun = DS.page.topMenu.addButton('<img src="/static/images/start-icon.png" style="height: 22px;vertical-align: middle;"> Запуск');
            topMenuRunP = DS.page.topMenu.addButton('<img src="/static/images/start-icon.png" style="height: 22px;vertical-align: middle;"> Запуск с параметрами');
            DS.addEvent(topMenuRun, 'click', function(e){
                PromptTestRun(e.shiftKey);
            });
            topMenuRun.title = 'F5';

            DS.addEvent(topMenuRunP, 'click', function(e){
                PromptTestRun(true);
            });
            topMenuRun.title = 'F6';

            DS.addEvent(window, 'keyup', HandleF5);

            if(!DS.page.getTaskField('is_code_available') && !_hasFiles){
                DS.alert('Редактирование кода будет доступно после того, как предыдущая задача будет сдана');
            }
        };
        // called before page hide
        this.hide = function(){
            DS.page.topMenu.removeButton(topMenuTheme);
            DS.page.topMenu.removeButton(topMenuSize);
            DS.page.topMenu.removeButton(topMenuRun);
            DS.page.topMenu.removeButton(topMenuRunP);

            DS.removeEvent(window, 'keyup', HandleF5);
        };

        this.getScripts = function(){
            return([
                'CodeMirror/lib/codemirror.js',
                'CodeMirror/mode/clike/clike.js',
                'CodeMirror/addon/hint/show-hint.js',
                'CodeMirror/addon/hint/anyword-hint.js',
                'CodeMirror/addon/edit/matchbrackets.js',
                'CodeMirror/addon/edit/auto-format.js',
                'CodeMirror/addon/lint/lint.js',
            ]);
        };

        this.getStyles = function(){
            var list = [
                'CodeMirror/lib/codemirror.css',
                'CodeMirror/addon/hint/show-hint.css',
                'CodeMirror/addon/lint/lint.css',
                'css/modules/task-code.css',
            ];
            for(var i = 0, l = themes.length; i < l; ++i){
                if(themes[i] != 'default'){
                    list.push('CodeMirror/theme/'+themes[i]+'.css');
                }
            }

            return({
                both: list
                ,light: [
                    // 'css/modules/task-light.css'
                ]
                ,dark: [
                    // 'css/modules/task-dark.css'
                ]
            });
        };

        this.saveAll = function(cb){
            editor.saveAll(cb);
        };
    });
});
