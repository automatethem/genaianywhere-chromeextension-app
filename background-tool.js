import { sleep, todayStr, capturePartialScreen, captureFullScreen, captureScrollScreen } from './capture-screen-util.js';

const getSelectedText = async () => {
  const currentTabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = currentTabs[0];

  let [{ result: text }] = await chrome.scripting.executeScript({
    target: { tabId: currentTab.id },
    function: () => {
      const selection = window.getSelection();
      return selection ? selection.toString() : "";
    },
  });
  // 예시: 문장 끝 구두점 뒤에 개행 추가
  // . 또는 ! 또는 ? 뒤에 개행 문자 추가
  text = text.replace(/([.!?])\s*/g, "$1\n");
  return text;
};

const copySelectedText = async () => {
  const text = await getSelectedText();

  const currentTabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = currentTabs[0];

  await chrome.scripting.executeScript({
    target: { tabId: currentTab.id },
    args: [text],
    func: (text) => {
      console.log("copySelectedText", text);
      //navigator.clipboard.writeText(text);
      //클립보드 작업을 위해서는 문서가 포커스된 상태여야 합니다.
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  });  
};

const copyPageUrl = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 콘텐츠 스크립트를 통해 클립보드에 복사
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [tab.url],
    func: (url) => {
      console.log("copyPageUrl", url);
      //navigator.clipboard.writeText(url);
      //클립보드 작업을 위해서는 문서가 포커스된 상태여야 합니다.
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  });
};

const copyPageReferer = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
  // 콘텐츠 스크립트를 통해 클립보드에 복사
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [],
    func: () => {
      const referer = document.referrer;
      //navigator.clipboard.writeText(referer);
      //클립보드 작업을 위해서는 문서가 포커스된 상태여야 합니다.
      const textArea = document.createElement('textarea');
      textArea.value = referer;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  });
};

const disableRightClickProtection = async () => {
  // 현재 활성화된 탭을 가져옴
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 페이지의 텍스트를 가져옴
  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      if (window.subvaAllowRightClick === undefined) {
          // https://greasyfork.org/en/scripts/23772-absolute-enable-right-click-copy/code
          window.subvaAllowRightClick = function (dom) {
              (function GetSelection() {
                  var Style = dom.createElement('style');
                  Style.type = 'text/css';
                  var TextNode = '*{user-select:text!important;-webkit-user-select:text!important;}';
                  if (Style.styleSheet) {
                      Style.styleSheet.cssText = TextNode;
                  }
                  else {
                      Style.appendChild(dom.createTextNode(TextNode));
                  }
                  dom.getElementsByTagName('head')[0].appendChild(Style);
              })();

              (function SetEvents() {
                  var events = ['copy', 'cut', 'paste', 'select', 'selectstart'];
                  for (var i = 0; i < events.length; i++)
                      dom.addEventListener(events[i], function (e) {
                          e.stopPropagation();
                      }, true);
              })();

              (function RestoreEvents() {
                  var n = null;
                  var d = document;
                  var b = dom.body;
                  var SetEvents = [d.oncontextmenu = n, d.onselectstart = n, d.ondragstart = n, d.onmousedown = n];
                  var GetEvents = [b.oncontextmenu = n, b.onselectstart = n, b.ondragstart = n, b.onmousedown = n, b.oncut = n, b.oncopy = n, b.onpaste = n];
              })();

              (function RightClickButton() {
                  setTimeout(function () {
                      dom.oncontextmenu = null;
                  }, 2000);
                  function EventsCall(callback) {
                      this.events = ['DOMAttrModified', 'DOMNodeInserted', 'DOMNodeRemoved', 'DOMCharacterDataModified', 'DOMSubtreeModified'];
                      this.bind();
                  }

                  EventsCall.prototype.bind = function () {
                      this.events.forEach(function (event) {
                          dom.addEventListener(event, this, true);
                      }.bind(this));
                  };
                  EventsCall.prototype.handleEvent = function () {
                      this.isCalled = true;
                  };
                  EventsCall.prototype.unbind = function () {
                      this.events.forEach(function (event) {
                      }.bind(this));
                  };
                  function EventHandler(event) {
                      this.event = event;
                      this.contextmenuEvent = this.createEvent(this.event.type);
                  }

                  EventHandler.prototype.createEvent = function (type) {
                      var target = this.event.target;
                      var event = target.ownerDocument.createEvent('MouseEvents');
                      event.initMouseEvent(type, this.event.bubbles, this.event.cancelable,
                          target.ownerDocument.defaultView, this.event.detail,
                          this.event.screenX, this.event.screenY, this.event.clientX, this.event.clientY,
                          this.event.ctrlKey, this.event.altKey, this.event.shiftKey, this.event.metaKey,
                          this.event.button, this.event.relatedTarget);
                      return event;
                  };
                  EventHandler.prototype.fire = function () {
                      var target = this.event.target;
                      var contextmenuHandler = function (event) {
                          event.preventDefault();
                      }.bind(this);
                      target.dispatchEvent(this.contextmenuEvent);
                      this.isCanceled = this.contextmenuEvent.defaultPrevented;
                  };
                  window.addEventListener('contextmenu', handleEvent, true);
                  function handleEvent(event) {
                      event.stopPropagation();
                      event.stopImmediatePropagation();
                      var handler = new EventHandler(event);
                      window.removeEventListener(event.type, handleEvent, true);
                      var EventsCallBback = new EventsCall(function () {
                      });
                      handler.fire();
                      window.addEventListener(event.type, handleEvent, true);
                      if (handler.isCanceled && (EventsCallBback.isCalled))
                          event.preventDefault();
                  }
              })();

              // function KeyPress(e) {
              // 	if (e.altKey && e.ctrlKey) {
              // 		if (confirm("Activate Absolute Right Click Mode!") === true) {
              // 			Absolute_Mod();
              // 		}
              // 	}
              // }
              // dom.addEventListener("keydown", KeyPress);

              (function Absolute_Mod() {
                  var events = ['contextmenu', 'copy', 'cut', 'paste', 'mouseup', 'mousedown', 'keyup', 'keydown', 'drag', 'dragstart', 'select', 'selectstart'];
                  for (var i = 0; i < events.length; i++) {
                      dom.addEventListener(events[i], function (e) {
                          e.stopPropagation();
                      }, true);
                  }
              })();
          };

  //		window.subvaAllowRightClick(document);

          function runAll(w) {
              try {
                  window.subvaAllowRightClick(w.document);
              } catch (e) {
              }
              for (var i = 0; i < w.frames.length; i++) {
                  runAll(w.frames[i]);
              }
          }
      }
      runAll(window);
    }
  });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSelectedText") {
    (async () => {
      const text = await getSelectedText();
      sendResponse(text);
    })();
    return true;
  }
  else if (message.action === "copySelectedText") {
    (async () => {
      await copySelectedText();
      sendResponse("copySelectedText response");
    })();
    return true;
  }
  else if (message.action === "copyPageUrl") {
    (async () => {
      await copyPageUrl();
      sendResponse("copyPageUrl response");
    })();
    return true;
  }
  else if (message.action === "copyPageReferer") {
    (async () => {
      await copyPageReferer();
      sendResponse("copyPageReferer response");
    })();
    return true;
  }
  else if (message.action === "disableRightClickProtection") {
    (async () => {
      await disableRightClickProtection();
      sendResponse("disableRightClickProtection response");
    })();
    return true;
  }
});

//capture screen

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "capturePartialScreen") {
      (async function() {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const tab = tabs[0]; 
          
          await chrome.tabs.update(tab.id, { url: "https://www.naver.com/" });
          await sleep(2000);            

          //const filename = 'outputs/partial-screen.png';
          const filename = 'partial-screen.png';
          const dataUrl = await capturePartialScreen(tab, '#shortcutArea > ul > li:nth-child(1) > a');
          await chrome.downloads.download({ url: dataUrl, filename: filename });

          sendResponse('capturePartialScreen response');
      })();
      return true;
  }
  else if (request.action === "captureFullScreen") {
      (async function() {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const tab = tabs[0];
          //const filename = 'outputs/full-screen.png';
          const filename = 'full-screen.png';
          const dataUrl = await captureFullScreen(tab);
          await chrome.downloads.download({ url: dataUrl, filename: filename });
          
          sendResponse('captureFullScreen response');
      })();
      return true;
  }
  else if (request.action === "captureScrollScreen") {
      (async function() {
          // 작업 시작 시 "작업중" 뱃지 표시
          chrome.action.setBadgeText({ text: "작업중" });
          chrome.action.setBadgeBackgroundColor({ color: "yellow" }); // 노란색 배경
        
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const tab = tabs[0];
          //const filename = 'outputs/scroll-screen.png';
          const filename = 'scroll-screen.png';
          const dataUrl = await captureScrollScreen(tab);
          await chrome.downloads.download({ url: dataUrl, filename: filename });

          // 작업 완료 후 뱃지 제거
          chrome.action.setBadgeText({ text: "" });

          sendResponse('captureScrollScreen response');
      })();
      return true;
  }
});

//captureScrollScreen 함수 사용을 위헤 background.js 에 아래 코드 추가 필요
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "captureVisibleTab") {
      (async function() {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const tab = tabs[0];
          const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
          //const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
          //const dataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' });
          sendResponse(dataUrl);
      })();
      return true;
  }
});