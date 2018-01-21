/**
 * 使用严格的语法
 */
'use strict';
/**
 * 创建一个名称空间。
 */
var Code = {};
/**
 * 定义语言
 */
Code.LANGUAGE_NAME = {
    'zh-hans': '简体中文',
    'en': 'English',
    'zh-hant': '正體中文'
};

/**
 * 语言列表
 */
Code.LANGUAGE_LTR = ['zh-hans', 'en', 'zh-hant'];

/**
 * 代码工作区为空
 */
Code.workspace = null;
//获取URL参数
Code.getStringParamFromUrl = function(name, defaultValue) {
    var val = location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
    return val ? decodeURIComponent(val[1].replace(/\+/g, '%20')) : defaultValue;
};

// 获取代码语言
Code.getLang = function() {
    var lang = Code.getStringParamFromUrl('lang', '');
    if (Code.LANGUAGE_NAME[lang] === undefined) {
        //默认为简体中文.
        lang = 'zh-hans';
    }
    return lang;
};
// 获取语言
Code.LANG = Code.getLang();

//判定当前语言是否是从左到右
Code.isLtr = function() {
    return Code.LANGUAGE_LTR.indexOf(Code.LANG) != -1;
};
// 加载块
Code.loadBlocks = function(defaultXml) {
    try {
        //首次读取session存储
        var loadOnce = window.sessionStorage.loadOnceBlocks;
    } catch(e) {
        var loadOnce = null;
    }
    if ('BlocklyStorage' in window && window.location.hash.length > 1) {
        //查找本地是否有 BlocklyStorage
        BlocklyStorage.retrieveXml(window.location.hash.substring(1));
    } else if (loadOnce) {
        //语言切换存储块进行重载。
        delete window.sessionStorage.loadOnceBlocks;
        var xml = Blockly.Xml.textToDom(loadOnce);
        Blockly.Xml.domToWorkspace(xml, Code.workspace);
    } else if (defaultXml) {
        //加载默认开始块
        var xml = Blockly.Xml.textToDom(defaultXml);
        Blockly.Xml.domToWorkspace(xml, Code.workspace);
    } else if ('BlocklyStorage' in window) {
        // 在一个单独的线程中保存块，以便后面使用
        window.setTimeout(BlocklyStorage.restoreBlocks, 0);
    }
};
// 语言变更函数
Code.changeLanguage = function() {
    if (typeof Blockly != 'undefined' && window.sessionStorage) {
        var xml = Blockly.Xml.workspaceToDom(Code.workspace);
        //读取xml数据
        var text = Blockly.Xml.domToText(xml);
        //存储到本地session中
        window.sessionStorage.loadOnceBlocks = text;
    }
    //获取语言下拉列表对象
    var languageMenu = document.getElementById('languageMenu');
    // 进行URI编码
    var newLang = encodeURIComponent(
        //获取下拉列表值
        languageMenu.options[languageMenu.selectedIndex].value);
    var search = window.location.search;
    if (search.length <= 1) {
        search = '?lang=' + newLang;
    } else if (search.match(/[?&]lang=[^&]*/)) {
        search = search.replace(/([?&]lang=)[^&]*/, '$1' + newLang);
    } else {
        search = search.replace(/\?/, '?lang=' + newLang + '&');
    }
    window.location = window.location.protocol + '//' +
        window.location.host + window.location.pathname + search;
};
//代码点击事件
Code.bindClick = function(el, func) {
    if (typeof el == 'string') {
        el = document.getElementById(el);
    }
    // 添加点击与触摸事件
    el.addEventListener('click', func, true);
    el.addEventListener('touchend', func, true);
};

/**
 * 加载css文件与js文件
 */
Code.importPrettify = function() {
    //<link rel="stylesheet" href="../prettify.css">
    //<script src="../prettify.js"></script>
    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', 'style/prettify.css');
    document.head.appendChild(link);
    var script = document.createElement('script');
    script.setAttribute('src', 'js/prettify.js');
    document.head.appendChild(script);
};
// 获取盒子大小与坐标
Code.getBBox_ = function(element) {
    var height = element.offsetHeight;
    var width = element.offsetWidth;
    var x = 0;
    var y = 0;
    do {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = element.offsetParent;
    } while (element);
    return {
        height: height,
        width: width,
        x: x,
        y: y
    };
};

//定义语言选项卡
// Code.TABS_ = ['blocks', 'javascript', 'python', 'xml'];
// 选定代码块
// Code.selected = 'blocks';


// // 内容渲染
// Code.renderContent = function() {
//     //获取所选代内容
//     var content = document.getElementById('content_' + Code.selected);
//     //初始化面板
//     if (content.id == 'content_xml') {
//         var xmlTextarea = document.getElementById('content_xml');
//         var xmlDom = Blockly.Xml.workspaceToDom(Code.workspace);
//         var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
//         xmlTextarea.value = xmlText;
//         xmlTextarea.focus();
//     } else if (content.id == 'content_javascript') {
//         var code = Blockly.JavaScript.workspaceToCode(Code.workspace);
//         content.textContent = code;
//         if (typeof prettyPrintOne == 'function') {
//             code = content.innerHTML;
//             code = prettyPrintOne(code, 'js');
//             content.innerHTML = code;
//         }
//     } else if (content.id == 'content_python') {
//         code = Blockly.Python.workspaceToCode(Code.workspace);
//         content.textContent = code;
//         if (typeof prettyPrintOne == 'function') {
//             code = content.innerHTML;
//             code = prettyPrintOne(code, 'py');
//             content.innerHTML = code;
//         }
//     }
// };

/**
 * 页面初始化
 */
Code.init = function() {
    //----------------------------语言区
    //初始化语言
    Code.initLanguage();
    //加载方向
    var ltr = Code.isLtr();
    //--------------------------窗口事件区
    //重置大小
    var onresize = function(e) {
        var blocks=document.getElementById("content_blocks");
        //获取div宽度
        var width=blocks.offsetWidth;
        console.log(width);
    };
    //添加窗口重置事件
    window.addEventListener('resize', onresize, false);

    //获取工具盒子的所有内容
    var toolboxText = document.getElementById('toolbox').outerHTML;
    //通过正则替换内容
    toolboxText = toolboxText.replace(/{(\w+)}/g,
        function(m, p1) {return MSG[p1]});

    //-------------------------加载块内容
    //获取块的dom对象
    var toolboxXml = Blockly.Xml.textToDom(toolboxText);
    //在工作区中加入块
    Code.workspace = Blockly.inject('content_blocks',
        {grid:
            {spacing: 25,
                length: 3,
                colour: '#ccc',
                snap: true},
            media: 'media/',
            ltr: ltr,
            toolbox: toolboxXml,
            zoom:
                {controls: true,
                    wheel: true}
        });

    //显示块内容
    document.getElementById('content_blocks').style.visibility ='visible';
    Code.workspace.setVisible(true);
    Blockly.svgResize(Code.workspace);
    //------------------------------------------


    //---------------------------------底部导航事件
    //编程
    Code.bindClick('program',function() {
        //显示块
        document.getElementById('content_blocks').style.visibility ='visible';
        document.getElementById('content_code').style.visibility ='hidden';
    });
};

//代码
Code.bindClick('code',function() {
    //隐藏块
    document.getElementById('content_blocks').style.visibility ='hidden';
    document.getElementById('content_code').style.visibility ='visible';
    //显示编辑的代码
    var content = document.getElementById('content_code');
    //获取代码
    var code =  Blockly.JavaScript.workspaceToCode(Code.workspace);
    content.textContent = code;
    if (typeof prettyPrintOne == 'function') {
        code = content.innerHTML;
        code = prettyPrintOne(code, 'js');
        content.innerHTML = code;
    }
});

/**
 * 执行Javascript代码
 */
//运行
Code.bindClick('run',function () {
    //代码检查
    Blockly.JavaScript.INFINITE_LOOP_TRAP = '  checkTimeout();\n';
    var timeouts = 0;
    var checkTimeout = function() {
        if (timeouts++ > 1000000) {
            throw MSG['timeout'];
        }
    };
    //获取代码
    var code = Blockly.JavaScript.workspaceToCode(Code.workspace);
    Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
    try {
        //运行代码
        eval(code);
    } catch (e) {
        alert(MSG['badCode'].replace('%1', e));
    }
});

//配置
Code.bindClick('config',function() {
    alert("配置");
});

/**
 * 初始化页面语言
 */
Code.initLanguage = function() {
    //设置HTML语言和方向。
    var ltr = Code.isLtr();
    //文档方向
    document.dir = ltr ? 'ltr' : 'rtl';
    //设定文档头信息
    document.head.parentElement.setAttribute('lang', Code.LANG);

    //语言按字母顺序排序。
    var languages = [];
    //读取所有语言信息
    for (var lang in Code.LANGUAGE_NAME) {
        languages.push([Code.LANGUAGE_NAME[lang], lang]);
    }
    //排序函数
    var comp = function(a, b) {
        // Sort based on first argument ('English', 'Русский', '简体字', etc).
        if (a[0] > b[0]) return 1;
        if (a[0] < b[0]) return -1;
        return 0;
    };
    //languages.sort(comp);
    //获取语言对象
    var languageMenu = document.getElementById('languageMenu');
    languageMenu.options.length = 0;
    //下拉列表中添加语言
    for (var i = 0; i < languages.length; i++) {
        var tuple = languages[i];
        var lang = tuple[tuple.length - 1];
        var option = new Option(tuple[0], lang);
        if (lang == Code.LANG) {
            option.selected = true;
        }
        languageMenu.options.add(option);
    }
    //添加改变语言事件
    languageMenu.addEventListener('change', Code.changeLanguage, true);

};

//加载代码语言设置.
document.write('<script src="js/msg/' + Code.LANG + '.js"></script>\n');
//加载块语言设置
document.write('<script src="msg/js/' + Code.LANG + '.js"></script>\n');

//添加载事件
window.addEventListener('load', Code.init);
