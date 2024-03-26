void function (window, document, undefined) {

    /**
     * @description: 最少列数
     */
    let MIN_COLUMN_COUNT = 1;
    /**
     * @description: 格子宽度
     */
    let COLUMN_WIDTH = 220;
    /**
     * @description: 格子的填充
     */
    let CELL_PADDING = 26;
    /**
   * @description: 格子之间的垂直间隙
   */
    let GAP_HEIGHT = 15;
    /**
     * @description: 格子之间的水平间隙
     */
    let GAP_WIDTH = 15;
    /**
     * @description: 确定单元格是否离视口太远
     */
    let THRESHOLD = 2000;
    /**
     * @description: 每列高度的array
     */
    let columnHeights;
    /**
     * @description: 每列个数
     */
    let columnCount;
    /**
     * @description: 弹出通知计时器
     */
    let noticeDelay;
    /**
     * @description: 计时器大小
     */
    let resizeDelay;
    /**
     * @description: 滚动计时器
     */
    let scrollDelay;
    /**
     * @description: 管理单元格状态
     */
    let managing = false;

    /**
     * @description: 加载单元格状态
     */
    let loading = false;

    let noticeContainer = document.getElementById('notice');
    let cellsContainer = document.getElementById('cells');

    // 浏览器兼容,根据不同浏览器在实现 JavaScript 的 DOM 操作和事件处理上存在一些差异
    let addEvent = function (element, type, handler) {
        // Chrome、Firefox、Safari 
        if (element.addEventListener) {
            addEvent = function (element, type, handler) {
                element.addEventListener(type, handler, false);
            };
        }
        // IE,要不要都无所谓，已经被淘汰了
        else if (element.attachEvent) {
            addEvent = function (element, type, handler) {
                element.attachEvent('on' + type, handler);
            };
        }
        // 传统
        else {
            addEvent = function (element, type, handler) {
                element['on' + type] = handler;
            };
        }
        addEvent(element, type, handler);
    };

    // 获取数组的最小值，然后在下面插入图片
    let getMinVal = function (arr) {
        return Math.min.apply(Math, arr);
    };

    // 获取数组的最大值
    let getMaxVal = function (arr) {
        return Math.max.apply(Math, arr);
    };

    /**
     * @description: 获取数组中最小值的索引
     * @param {array} arr
     * @return {number} key
     * @author: pan
     */
    let getMinKey = function (arr) {
        let key = 0;
        let min = arr[0];
        for (let i = 1, len = arr.length; i < len; i++) {
            if (arr[i] < min) {
                key = i;
                min = arr[i];
            }
        }
        return key;
    };

    // 点赞弹窗
    let updateNotice = function (event) {
        clearTimeout(noticeDelay);
        let e = event || window.event;
        let target = e.target || e.srcElement;
        if (target.tagName == 'SPAN') {
            let targetTitle = target.parentNode.tagLine;
            noticeContainer.innerHTML = (target.className == 'like' ? 'Liked ' : 'Marked ') + '<strong>' + targetTitle + '</strong>';
            noticeContainer.className = 'on';
            noticeDelay = setTimeout(function () {
                noticeContainer.className = 'off';
            }, 2000);
        }
    };



    /**
     * @description: 根据页面的宽度计算列数，
     * @return {number} 列数 
     * @author: pan
     */
    let getColumnCount = function () {
        // 返回参数的最大值：为了设置每行最少的列数 
        // Math.floor向下取整，返回整列
        return Math.max(MIN_COLUMN_COUNT, Math.floor((document.body.offsetWidth + GAP_WIDTH) / (COLUMN_WIDTH + GAP_WIDTH)));
    };

    // 重置列高度和数组
    let resetHeights = function (count) {
        columnHeights = [];
        for (let i = 0; i < count; i++) {
            columnHeights.push(0);
        }
        cellsContainer.style.width = (count * (COLUMN_WIDTH + GAP_WIDTH) - GAP_WIDTH) + 'px';
    };


    // 模拟ajax请求,后期换成自己的接口
    let appendCellsDemo = function (num) {
        if (loading) {
            // 防抖
            return;
        }
        let fragment = document.createDocumentFragment();
        let cells = [];
        let images = [];
        // let images = [0, 286, 143, 270, 143, 190, 285, 152, 275, 285, 285, 128, 281, 242, 339, 236, 157, 286, 259, 267, 137, 253, 127, 190, 190, 225, 269, 264, 272, 126, 265, 287, 269, 125, 285, 190, 314, 141, 119, 274, 274, 285, 126, 279, 143, 266, 279, 600, 276, 285, 182, 143, 287, 126, 190, 285, 143, 241, 166, 240, 190];
        for (let j = 0; j < num; j++) {
            let key = Math.floor(Math.random() * 10) + 1;
            let cell = document.createElement('div');
            cell.className = 'cell pending';
            cell.tagLine = 'demo img ' + key;
            cells.push(cell);
            cell.innerHTML = `
            <p><a href="#"><img src="img/${key}.jpg" height="${images[key]}" width="190" /></a></p>
            <h2><a href="#">demo img ${key}</a></h2>
            <span class="like">点赞</span>
            <span class="mark">收藏</span>
          `
            fragment.appendChild(cell);
        }
        // Faking network latency.
        setTimeout(function () {
            loading = false;
            cellsContainer.appendChild(fragment);
            adjustCells(cells);
        }, 1000);
    };

    // 定位新的单元格和更新高度
    let adjustCells = function (cells, reflow) {
        let columnIndex;
        let columnHeight;
        for (let j = 0, k = cells.length; j < k; j++) {
            // 将单元格插入到最小的地方
            columnIndex = getMinKey(columnHeights);
            columnHeight = columnHeights[columnIndex];
            cells[j].style.height = (cells[j].offsetHeight - CELL_PADDING) + 'px';
            cells[j].style.left = columnIndex * (COLUMN_WIDTH + GAP_WIDTH) + 'px';
            cells[j].style.top = columnHeight + 'px';
            columnHeights[columnIndex] = columnHeight + GAP_HEIGHT + cells[j].offsetHeight;
            if (!reflow) {
                cells[j].className = 'cell ready';
            }
        }
        cellsContainer.style.height = getMaxVal(columnHeights) + 'px';
        manageCells();
    };

    //如果在调整大小后需要计算新的列数据。  

    let reflowCells = function () {
        // 计算调整大小后的新列计数。

        columnCount = getColumnCount();
        if (columnHeights.length != columnCount) {
            // 重置列高度和容器宽度的数组。
            resetHeights(columnCount);
            adjustCells(cellsContainer.children, true);
        } else {
            manageCells();
        }
    };

    // 从dom中切换单元格的内容，取决于他们的视窗的偏移量，能节省内存
    let manageCells = function () {
        // 变更状态，防止重复请求
        managing = true;

        let cells = cellsContainer.children;
        let viewportTop = (document.body.scrollTop || document.documentElement.scrollTop) - cellsContainer.offsetTop;
        let viewportBottom = (window.innerHeight || document.documentElement.clientHeight) + viewportTop;

        // Remove cells' contents if they are too far away from the viewport. Get them back if they are near.
        // TODO: remove the cells from DOM should be better :<
        // 移除单元格
        for (let i = 0, l = cells.length; i < l; i++) {
            if ((cells[i].offsetTop - viewportBottom > THRESHOLD) || (viewportTop - cells[i].offsetTop - cells[i].offsetHeight > THRESHOLD)) {
                if (cells[i].className === 'cell ready') {
                    cells[i].fragment = cells[i].innerHTML;
                    cells[i].innerHTML = '';
                    cells[i].className = 'cell shadow';
                }
            } else {
                if (cells[i].className === 'cell shadow') {
                    cells[i].innerHTML = cells[i].fragment;
                    cells[i].className = 'cell ready';
                }
            }
        }
        
          // 如果单元格的高度小于窗口高度就加载图片
    if(viewportBottom > getMinVal(columnHeights)) {
        appendCellsDemo(columnCount); 
      }
        
        
        managing = false;
    };

    // Add 500ms throttle to window scroll.
    let delayedScroll = function () {
        clearTimeout(scrollDelay);
        if (!managing) {
            // Avoid managing cells for unnecessity.
            scrollDelay = setTimeout(manageCells, 500);
        }
    };

    // 窗口布局变化
    let delayedResize = function () {
        clearTimeout(resizeDelay);
        resizeDelay = setTimeout(reflowCells, 500);
    };

    // 初始化布局
    let init = function () {
        // 添加其他监听
        addEvent(cellsContainer, 'click', updateNotice);
        addEvent(window, 'resize', delayedResize);
        addEvent(window, 'scroll', delayedScroll);

        // 初始化列高度和容器宽度
        columnCount = getColumnCount();
        resetHeights(columnCount);

        // 首次加载窗口
        manageCells();
    };

    // Ready to go!
    addEvent(window, 'load', init);

}(window, document);