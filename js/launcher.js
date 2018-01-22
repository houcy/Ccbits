/*
{
  data: {
    html: '...',
    css: '...',
    js: '...'
  },
  jsPreprocessor: 'jsx',
  modes: 'js,output'
}
*/

+(function (window, document, location) {

  'use strict';

  var parser = new window.DOMParser();
  //加载模板
  function loadTemplate(url, callback) {
    //创建链接对象
    var link = document.createElement('link'),
        //获取脚本元素
      tag = document.getElementsByTagName('script')[0];
    //使用import引入页面
    link.rel = 'import';
    link.href = url;
    //加载数据
    link.onload = function () {
      var imp = link.import,
        head = imp.querySelector('#head'),
        body = imp.querySelector('#body'),
        css = imp.querySelector('#css');

      callback({
        head: head ? head.innerHTML.trim() : '',
        body: body ? body.innerHTML.trim() : '',
        css: css ? css.innerHTML.trim() : ''
      });
    };
    //插入在节点前
    tag.parentNode.insertBefore(link, tag);
  }
  //添加html结构标记
  function assembleHtml(head, body, css, js) {
    var html = '<!doctype html>\n<html>\n\n';

    html += ('<head>' +
      (head ? '\n  ' + head + '\n' : '') +
      (css ? '\n  <style>' + css + '</style>\n' : '') +
      '</head>\n\n');
    html += ('<body>' +
      (body ? '\n  ' + body + '\n' : '') +
      (js ? '\n  <script>' + js + '</script>\n' : '') +
      '</body>\n\n');

    return html;
  }
  //数据提交
  function post(url, data) {
    var form = document.createElement("form");

    form.action = url;
    form.method = 'POST';
    if (data) {
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          var input = document.createElement("textarea");
          input.name = key;
          input.value = encodeURIComponent(typeof data[key] === "object" ? JSON.stringify(data[key]) : data[key]);
          form.appendChild(input);
        }
      }
    }
    form.style.display = 'none';

    document.body.appendChild(form);
    form.submit();
  }

  function translate(html, msg) {
    var $wrap = $('<div/>', {
      html: html
    });

    $wrap.find('[data-translation]').each(function () {
      $(this).html(msg[$(this).data('translation')]).removeAttr('data-translation');
    });

    return $wrap.wrap('<div/>').parent().html();
  }
//在head区插入内容
  function injectDependencies(headStr) {
    var head = parser.parseFromString(headStr, 'text/html').head;

    head.querySelectorAll('script').forEach(function (sc) {
      sc.src = appendBaseURL(sc.getAttribute('src'));
    });
    head.querySelectorAll('link').forEach(function (link) {
      link.href = appendBaseURL(link.getAttribute('href'));
    });

    return head.innerHTML;
  }
  //插入图片
  function injectMedia(bodyStr) {
    var body = parser.parseFromString(bodyStr, 'text/html').body;

    body.querySelectorAll('img').forEach(function (img) {
      img.src = appendBaseURL(img.getAttribute('src'));
    });

    return body.innerHTML;
  }
  //追加地址
  function appendBaseURL(url) {
    var urlc = url.toLowerCase();
    if (urlc.indexOf('//') !== 0 &&
      urlc.indexOf('http://') !== 0 &&
      urlc.indexOf('https://') !== 0) {
      url = location.origin + url;
    }
    return url;
  }
  //运行
  var launchers = {
    //添加配置
    jsfiddle: function (config) {
      var data = config.data;
      //获取配置数据
      var jsPreprocessorMap = {
        jsx: 3
      };

      data.wrap = 'b';
      if (config.jsPreprocessor) {
        data.panel_js = jsPreprocessorMap[config.jsPreprocessor];
      }
      data.html = assembleHtml(data.head, data.body);
      //提交数据 http://jsfiddle.net/ 在线调试网页
      post('//jsfiddle.net/api/post/library/pure/', data);
    },
    //代码编写
    codepen: function (config) {
      var data = config.data;
      var jsPreprocessorMap = {
        jsx: 'babel'
      };

      if (config.jsPreprocessor) {
        data.js_pre_processor = jsPreprocessorMap[config.jsPreprocessor];
      }
      data.html = assembleHtml(data.head, data.body);
      //提交数据 网站前端设计开发平台是一个针对网站前端代码设计的开发工具
      post('//codepen.io/pen/define/', {
        data: data
      });
    },
    //
    jsbin: function (config) {
      var data = config.data;

      if (config.jsPreprocessor) {
        data[config.jsPreprocessor] = data.js;
        delete data.js;
      }
      data.html = assembleHtml(data.head, data.body);
      config.modes = config.modes || 'html,css,js,output';
      //编译
      post('//bin.webduino.io?' + config.modes, data);
    },
    //沙箱
    sandbox: function (frame, data) {
      var code = assembleHtml(data.head, data.body, data.css, data.js);
      console.log(code);
      //窗体加载事件
      frame.addEventListener('load', function () {
        frame.style.display = 'block';
      }, false);
      frame.style.display = 'none';
      frame.contentWindow.document.open();
      frame.contentWindow.document.write(code);
      frame.contentWindow.document.close();
    },
    //实时显示
    liveview: function (storage, data, callback) {
      var code = assembleHtml(data.head, data.body, data.css, data.js),
        parts = (location.protocol + '//' + location.host + location.pathname).split('/');

      parts.pop();
      storage.link(code, function (err, url) {
        if (!err && url && typeof callback === 'function') {
          callback(parts.join('/') + '/live-preview.html' + '#' + url.split('#')[1]);
        }
      });
    }
  };

  window.launcher = {
    loadTemplate: loadTemplate,
    injectDependencies: injectDependencies,
    injectMedia: injectMedia,
    translate: translate,
    jsfiddle: launchers.jsfiddle,
    codepen: launchers.codepen,
    jsbin: launchers.jsbin,
    sandbox: launchers.sandbox,
    liveview: launchers.liveview
  };

}(window, window.document, window.location));
