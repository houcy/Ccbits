/**
 * 加载与保存块数据
 */
'use strict';

// Create a namespace.
var BlocklyStorage = {};
//请求数据地址
BlocklyStorage.STORAGE_URL = 'https://glowing-fire-4998.firebaseio.com';

BlocklyStorage.isLinkUrl = function () {
  var op = ['openModal', 'close'];
  return window.location.hash.length > 1 && op.indexOf(window.location.hash.substring(1)) === -1;
};

/**
 * localStorage备份代码块。
 * @param {!Blockly.WorkspaceSvg} workspace Workspace.
 * @private
 */
BlocklyStorage.backupBlocks_ = function (workspace) {
  if ('localStorage' in window) {
    var xml = Blockly.Xml.workspaceToDom(workspace);
    //获取当前URL,不包括哈希。
    var url = window.location.origin;
    window.localStorage.setItem(url, Blockly.Xml.domToText(xml));
  }
};

/**
 * 绑定localStorage备份卸载事件函数。
 * @param {Blockly.WorkspaceSvg} opt_workspace Workspace.
 */
BlocklyStorage.backupOnUnload = function (opt_workspace) {
  var workspace = opt_workspace || Blockly.getMainWorkspace();
  window.addEventListener('unload',
    function () {
      if (!BlocklyStorage.isLinkUrl()) {
        BlocklyStorage.backupBlocks_(workspace);
      }
    }, false);
};

/**
 * 从localStorage恢复代码块。
 * @param {Blockly.WorkspaceSvg} opt_workspace Workspace.
 */
BlocklyStorage.restoreBlocks = function (opt_workspace) {
  var url = window.location.origin;
  if ('localStorage' in window && window.localStorage[url]) {
    var workspace = opt_workspace || Blockly.getMainWorkspace();
    var xml = Blockly.Xml.textToDom(window.localStorage[url]);
    Blockly.Xml.domToWorkspace(xml, workspace);
  }
};

/**
 * 保存块数据到数据库 并近回一个包含xml的链接
 * @param {Blockly.WorkspaceSvg} opt_workspace Workspace.
 */
BlocklyStorage.link = function (opt_workspace) {
  var workspace = opt_workspace || Blockly.getMainWorkspace();
  var xml = Blockly.Xml.workspaceToDom(workspace);
  var data = Blockly.Xml.domToText(xml);
  BlocklyStorage.makeRequest_('/blockly', 'xml', data, workspace);
};

/**
 * 从数据库中检索XML文本使用给定的key
 * @param {string} key Key to XML, obtained from href.
 * @param {Blockly.WorkspaceSvg} opt_workspace Workspace.
 */
BlocklyStorage.retrieveXml = function (key, opt_workspace) {
  var workspace = opt_workspace || Blockly.getMainWorkspace();
  BlocklyStorage.makeRequest_('/blockly', 'key', key, workspace);
};

/**
 * Global reference to current AJAX request.
 * @type {XMLHttpRequest}
 * @private
 */
BlocklyStorage.httpRequest_ = null;

/**
 * 发出一个新的AJAX请求。
 * @param {string} url URL to fetch.
 * @param {string} name Name of parameter.
 * @param {string} content Content of parameter.
 * @param {!Blockly.WorkspaceSvg} workspace Workspace.
 * @private
 */
BlocklyStorage.makeRequest_ = function (url, name, content, workspace) {
  if (BlocklyStorage.httpRequest_) {
    // AJAX call is in-flight.
    BlocklyStorage.httpRequest_.abort();
  }
  BlocklyStorage.httpRequest_ = new XMLHttpRequest();
  BlocklyStorage.httpRequest_.name = name;
  BlocklyStorage.httpRequest_.onreadystatechange =
    BlocklyStorage.handleRequest_;
  switch (name) {
    //使用post请求json数据
  case 'xml':
    BlocklyStorage.httpRequest_.open('POST',
      BlocklyStorage.STORAGE_URL + url + '.json');
    BlocklyStorage.httpRequest_.setRequestHeader('Content-Type',
      'application/x-www-form-urlencoded');
    BlocklyStorage.httpRequest_.send(JSON.stringify({
      xml: content
    }));
    break;
    //使用get请求
  case 'key':
    BlocklyStorage.httpRequest_.open('GET',
      BlocklyStorage.STORAGE_URL + url + '/' + content + '.json');
    BlocklyStorage.httpRequest_.send();
    break;
  }
  BlocklyStorage.httpRequest_.workspace = workspace;
};

/**
 * AJAX调用的回调函数
 * @private
 */
BlocklyStorage.handleRequest_ = function () {
  if (BlocklyStorage.httpRequest_.readyState == 4) {
    if (BlocklyStorage.httpRequest_.status != 200) {
      BlocklyStorage.alert(BlocklyStorage.HTTPREQUEST_ERROR + '\n' +
        'httpRequest_.status: ' + BlocklyStorage.httpRequest_.status);
    } else {
      var data = BlocklyStorage.httpRequest_.responseText.trim();
      if (BlocklyStorage.httpRequest_.name == 'xml') {
        data = JSON.parse(data).name;
        window.location.hash = data;
        BlocklyStorage.alert(BlocklyStorage.LINK_ALERT.replace('%1',
          window.location.href));
      } else if (BlocklyStorage.httpRequest_.name == 'key') {
        if (!data.length) {
          BlocklyStorage.alert(BlocklyStorage.HASH_ERROR.replace('%1',
            window.location.hash));
        } else {
          data = JSON.parse(data).xml;
          BlocklyStorage.loadXml_(data, BlocklyStorage.httpRequest_.workspace);
        }
      }
      BlocklyStorage.monitorChanges_(BlocklyStorage.httpRequest_.workspace);
    }
    BlocklyStorage.httpRequest_ = null;
  }
};

/**
 * 开始监控工作区。 如果模式为 XML,
 * 清除来自URL的key.  停止检测
 * @param {!Blockly.WorkspaceSvg} workspace Workspace.
 * @private
 */
BlocklyStorage.monitorChanges_ = function (workspace) {
  var startXmlDom = Blockly.Xml.workspaceToDom(workspace);
  var startXmlText = Blockly.Xml.domToText(startXmlDom);
  //工作区改变时
  function change() {
    var xmlDom = Blockly.Xml.workspaceToDom(workspace);
    var xmlText = Blockly.Xml.domToText(xmlDom);
    if (startXmlText != xmlText) {
      history.pushState('', document.title,
        window.location.pathname + window.location.search);
      workspace.removeChangeListener(bindData);
    }
  }
  //绑定改变数据
  var bindData = workspace.addChangeListener(change);
};

/**
 * 加载来自xml的块数据
 * @param {string} xml Text representation of XML.
 * @param {!Blockly.WorkspaceSvg} workspace Workspace.
 * @private
 */
BlocklyStorage.loadXml_ = function (xml, workspace) {
  try {
    xml = Blockly.Xml.textToDom(xml);
  } catch (e) {
    BlocklyStorage.alert(BlocklyStorage.XML_ERROR + '\nXML: ' + xml);
    return;
  }
  //清晰的工作区,以避免合并.
  workspace.clear();
  Blockly.Xml.domToWorkspace(xml, workspace);
};

/**
 * 给用户一个文本消息
 * Designed to be overridden if an app has custom dialogs, or a butter bar.
 * @param {string} message Text to alert.
 */
BlocklyStorage.alert = function (message) {
  window.alert(message);
};
