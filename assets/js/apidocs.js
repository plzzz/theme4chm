YUI().use(['api-list','history-hash'],
function (Y) {
	var modify	=	{
		
		
	
		/*
			临时保存 tabView.selected 对象
		*/
		selectedTab	:	null,
		
		classTabView:	null,
		
		initRoot	:	function(){
			 	var terminators = /^(?:classes|files|modules)$/,
				parts       = Y.config.win.location.href.split('/'),
				root        = [],
				i, len, part;
		
				for (i = 0, len = parts.length; i < len; i += 1) {
					
					part = parts[i]
					if (part.match(terminators)) {
						// Makes sure the path will end with a "/".
						root.push('')
						break
					}
					root.push(part)
				}
					
			if(root[root.length-1]!==''){// index.html www.some.com  filename.ext??
				 root[root.length-1]!==Y.config.win.location.host && root.pop();	 
				 root.push('')//先这样了,以后出错再改
			}
			Y.APIList.rootPath	=	root.join('/');//我不喜欢这样设置参数	
		},
		initClassTabView : function () {
				if (!Y.all('#classdocs .api-class-tab').size()) {
					return
				}
			if(this.classTabView){
				this.classTabView.destroy();
       			this.selectedTab = null	
			}
				
			this.classTabView =	new Y.TabView({
					srcNode: '#classdocs'
					})
				this.classTabView.once('selectionChange',this.onTabSelectionChange,this)//不知为何,render会触发二次事件,所以..
				this.classTabView.render()
				this.classTabView.on('selectionChange',this.onTabSelectionChange,this)
				
				this.updateTabState()
		},
		/*
			所有的 li 都是以 l 开头生成那样多的ID....
		*/
		initLineNumbers		:	function(){
			var hash      = Y.config.win.location.hash.substring(1),
				container = Y.one('#docs-main'),
				hasLines, node;
				
				// Add ids for each line number in the file source view.
				
				if(hash.charAt(0)==='l'){// chm 文件不支持 String[0] 这种数组访问模式.
					container.all('.linenums>li').each(function (lineNode, index){
						lineNode.set('id', 'l' + (index + 1))
						lineNode.addClass('file-line')
						hasLines = true;
					});
					// Scroll to the desired line.
					if (hasLines && /^l\d+$/.test(hash)) {
						if ((node = container.getById(hash))) {
							Y.config.win.scroll(0, node.getY())
						}
					}
				}
		},
		
		updateVisibility	:	function(){
			 var container = Y.one('#docs-main')
			
			container.toggleClass('hide-inherited',
            		!Y.one('#api-show-inherited').get('checked'))

			container.toggleClass('show-deprecated',
					Y.one('#api-show-deprecated').get('checked'))

			container.toggleClass('show-protected',
					Y.one('#api-show-protected').get('checked'))

			container.toggleClass('show-private',
					Y.one('#api-show-private').get('checked'))
			
			this.checkVisibility()
		},
		onTabSelectionChange	:	function(e){
			this.selectedTab	=	e.newVal;
			this.checkVisibility(e.newVal)
		},
		/*
			检察是否有可见元素,没有则加入一些提示.
		*/
		checkVisibility		:	function(tab){
			tab || (tab=this.selectedTab)
			if (!tab) { return }
		
			var panelNode = tab.get('panelNode'),
			visibleItems;
		
			// If no items are visible in the tab panel due to the current visibility
			// settings, display a message to that effect.
			visibleItems = panelNode.all('.item,.index-item').some(function (itemNode) {
				if (itemNode.getComputedStyle('display') !== 'none') {
					return true
				}
			});

			panelNode.all('.no-visible-items').remove();
		
			if (!visibleItems) {
				if (Y.one('#index .index-item')) {
					panelNode.append(
						'<div class="no-visible-items">' +
							'<p>' +
							'Some items are not shown due to the current visibility ' +
							'settings. Use the checkboxes at the upper right of this ' +
							'page to change the visibility settings.' +
							'</p>' +
						'</div>'
					);
				} else {
					panelNode.append(
						'<div class="no-visible-items">' +
							'<p>' +
							'This class doesn\'t provide any methods, properties, ' +
							'attributes, or events.' +
							'</p>' +
						'</div>'
					);
				}
			}

			// Hide index sections without any visible items.
			Y.all('.index-section').each(function (section) {
				var items        = 0,
					visibleItems = 0;
		
				section.all('.index-item').each(function (itemNode) {
					items += 1;
		
					if (itemNode.getComputedStyle('display') !== 'none') {
						visibleItems += 1;
					}
				});
		
				section.toggleClass('hidden', !visibleItems);
				section.toggleClass('no-columns', visibleItems < 4);
			});

		},
		/*
		
		*/
		updateTabState		:	function(src){
			var hash = Y.config.win.location.hash.substring(1),
        	node, tab, tabPanel;
			
			if (!this.classTabView) {
				return;
			}
		

			if (hash && (node = Y.one('#classdocs').getById(hash))) {
				if ((tabPanel = node.ancestor('.api-class-tabpanel', true))) {
					if ((tab = Y.one('#classdocs .api-class-tab.' + tabPanel.get('id')))) {
						
						if (this.classTabView.get('rendered')) {
							Y.Widget.getByNode(tab).set('selected', 1);
						} else {
							tab.addClass('yui3-tab-selected');
						}
					}
				}

       			 // Scroll to the desired element if this is a hash URL.
				if (node) {
					if (this.classTabView.get('rendered')) {
						this._scrollToNode(node,hash);
					} else {
						this.classTabView.once('renderedChange', _scrollToNodeHandler,this,node,hash);
					}
				}
   			} else {
        		tab = Y.one('#classdocs .api-class-tab.index');
				if (this.classTabView.get('rendered')) {
						 Y.Widget.getByNode(tab).set('selected', 1);
       			}else{
           			 tab.addClass('yui3-tab-selected');
        		}
   			}
		},
		
		/*
			从原updateTabState移出避免 内存泄漏问题
		*/
		_scrollToNode		:	function(node,hash){
			if (node.hasClass('protected')) {
            	Y.one('#api-show-protected').set('checked', true);
            	this.updateVisibility();
      		}

       		if (node.hasClass('private')) {
           		 Y.one('#api-show-private').set('checked', true);
           			 this.updateVisibility();
       		}

			setTimeout(function () {
				// For some reason, unless we re-get the node instance here,
				// getY() always returns 0.
				var node = Y.one('#classdocs').getById(hash);
				Y.config.win.scrollTo(0, node.getY() - 70);
			}, 50);
		},//end _scrollToNode
		_scrollToNodeHandler:  function(e,node,hash){
			this._scrollToNode(node,hash)	
		},	
		onOptionClick		:	function(e){
			modify.updateVisibility()
		}	
	};
	
	modify.initRoot()
	
	modify.initClassTabView()
	
	modify.updateVisibility()
	
	Y.one('#api-options').delegate('click', modify.onOptionClick, 'input')
	
	setTimeout(modify.initLineNumbers	,10)// 所以多点时间给 pertty print
	
	Y.on('hashchange', function (e) {modify.updateTabState('hashchange')});
	
	//ie6 7 不支持 li css content 属性
	if(Y.UA.ie && Y.UA.ie<=7){
		Y.all('.apidocs ul.inline li').each(function(node,index,list){
				if(node.previous()){
					node.insert(',','before')
				}	
		})
	} 
	
})