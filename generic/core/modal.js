/**
 * Modal window constructor
 * @param {string} path             Iframe src
 * @param {string} title            Modal window title
 * @param {Object} editorAttributes Editor attributes (width, height)...
 * @ignore
 */
function ModalWindow(path, editorAttributes) {

    var ua = navigator.userAgent.toLowerCase();
    var isAndroid = ua.indexOf("android") > -1;
    var isIOS = ((ua.indexOf("ipad") > -1) || (ua.indexOf("iphone") > -1));
    this.iosSoftkeyboardOpened = false;
    this.iosMeasureUnit = ua.indexOf("crios") == -1 ? "%" : "vh";
    this.iosDivHeight = "100" + this.iosMeasureUnit;

    var deviceWidth = window.outerWidth;
    var deviceHeight = window.outerHeight;

    var landscape = deviceWidth > deviceHeight;
    var portrait = deviceWidth < deviceHeight;

    var iframeAttributes  = {};
    iframeAttributes['width'] = editorAttributes.split(' ').join('').split(',')[0].split("=")[1];
    iframeAttributes['height'] = editorAttributes.split(' ').join('').split(',')[1].split("=")[1];
    iframeAttributes['src'] = path;

    var isMobile = (landscape && iframeAttributes['height'] > deviceHeight) || (portrait && iframeAttributes['width'] > deviceWidth) ? true : false;

    // Device object properties.

    var deviceProperties = {};
    deviceProperties['orientation'] = landscape ? 'landscape' : 'portait';
    deviceProperties['isAndroid'] = isAndroid ? true : false;
    deviceProperties['isIOS'] = isIOS ? true : false;
    deviceProperties['isMobile'] = isMobile;
    deviceProperties['isDesktop'] = !isMobile && !isIOS && !isAndroid;

    this.deviceProperties = deviceProperties;
    this.properties = {
        created : false,
        state : '',
        previousState : '',
        deviceProperties: deviceProperties,
        position : {bottom: 0, right: 10},
        size :  {height: 338, width: 580}
    }

    this.properties.iframeAttributes = iframeAttributes;
    this.modalHeight = parseInt(this.properties.iframeAttributes['height']);
    this.modalWidth = parseInt(this.properties.iframeAttributes['width']);

    this.title = '';

    var attributes = {};

    attributes['class'] = 'wrs_modal_overlay';
    var modalOverlayDiv = wrs_createElement('div', attributes);
    this.overlayDiv = modalOverlayDiv;

    attributes['class'] = 'wrs_modal_title_bar';
    var barModalDiv = wrs_createElement('div', attributes);
    this.titleBardDiv = barModalDiv;

    attributes = {};
    attributes['class'] = 'wrs_modal_title';
    var titleModalDiv = wrs_createElement('div', attributes);
    titleModalDiv.innerHTML = this.title;
    this.titleDiv = titleModalDiv;

    attributes = {};
    attributes['class'] = 'wrs_modal_close_button';
    attributes['title'] = strings['close'];
    var closeModalDiv = wrs_createElement('a', attributes);
    closeModalDiv.setAttribute('role','button');
    this.closeDiv = closeModalDiv;

    attributes = {};
    attributes['class'] = 'wrs_modal_stack_button';
    attributes['title'] = "Exit full-screen";
    var stackModalDiv = wrs_createElement('a', attributes);
    stackModalDiv.setAttribute('role','button');
    this.stackDiv = stackModalDiv;

    attributes = {};
    attributes['class'] = 'wrs_modal_maximize_button';
    attributes['title'] = strings['fullscreen'];
    var maximizeModalDiv = wrs_createElement('a', attributes);
    maximizeModalDiv.setAttribute('role','button');
    this.maximizeDiv = maximizeModalDiv;

    attributes = {};
    attributes['class'] = 'wrs_modal_minimize_button';
    attributes['title'] = strings['minimise'];
    var minimizeModalDiv = wrs_createElement('a', attributes);
    minimizeModalDiv.setAttribute('role','button');
    this.minimizeDiv = minimizeModalDiv;

    attributes = {};
    attributes['class'] = 'wrs_modal_dialogContainer';
    var containerDiv = wrs_createElement('div', attributes);
    this.containerDiv = containerDiv;

    attributes = {};
    attributes['id'] = 'wrs_modal_iframe_id';
    attributes['class'] = 'wrs_modal_iframe';
    attributes['title'] = 'MathType modal window';
    attributes['src'] = iframeAttributes['src'];
    attributes['frameBorder'] = "0";
    var iframeModal = wrs_createElement('iframe', attributes);
    this.iframe = iframeModal;

    attributes = {};
    attributes['class'] = 'wrs_modal_iframeContainer';
    var iframeModalContainer = wrs_createElement('div', attributes);
    this.iframeContainer = iframeModalContainer;

    // We create iframe inside _wrs_conf_path origin.
    this.iframeOrigin = this.getOriginFromUrl(_wrs_conf_path);

    this.lastImageWasNew = true;

    this.toolbar = null;
}

ModalWindow.prototype.create = function() {
    this.titleBardDiv.appendChild(this.closeDiv);
    this.titleBardDiv.appendChild(this.stackDiv);
    this.titleBardDiv.appendChild(this.maximizeDiv);
    this.titleBardDiv.appendChild(this.minimizeDiv);
    this.titleBardDiv.appendChild(this.titleDiv);
    this.iframeContainer.appendChild(this.iframe);

    wrs_addEvent(this.overlayDiv, 'mouseup', function (e) {
        if (typeof(_wrs_modalWindow) !== 'undefined' && _wrs_modalWindow != null) {
            _wrs_modalWindow.fireEditorEvent('mouseup');
        }
    });

    if (this.deviceProperties['isDesktop']) {
        this.containerDiv.appendChild(this.titleBardDiv);
    }
    this.containerDiv.appendChild(this.iframeContainer);
    // Check if browser has scrollBar before modal has modified.
    this.recalculateScrollBar();

    document.body.appendChild(this.containerDiv);
    document.body.appendChild(this.overlayDiv);

    wrs_addEvent(this.closeDiv, 'click', function(){
        _wrs_popupWindow.postMessage({'objectName' : 'checkCloseCondition'}, this.iframeOrigin);
    }.bind(this));

    if (this.deviceProperties['isDesktop']) { // Desktop.
        this.maximizeDiv.addEventListener('click', this.maximizeModalWindow.bind(this), true);
        this.stackDiv.addEventListener('click', this.stackModalWindow.bind(this), true);
        this.minimizeDiv.addEventListener('click', this.minimizeModalWindow.bind(this), true);
        this.createModalWindowDesktop();
        this.createResizeButtons();
        if (_wrs_conf_modalWindow) {
            this.addListeners();
        }
    }
    else if (this.deviceProperties['isAndroid']) {
        this.createModalWindowAndroid();
    }
    else if (this.deviceProperties['isIOS'] && !this.deviceProperties['isMobile']) {
        this.createModalWindowIos();
    }
    _wrs_popupWindow = this.iframe.contentWindow;
    this.properties.open = true;
    this.properties.created = true;

    // Maximize window only when the configuration is set and the device is not ios or android.
    if (this.deviceProperties['isDesktop'] && typeof _wrs_conf_modalWindow != "undefined" && _wrs_conf_modalWindow && _wrs_conf_modalWindowFullScreen) {
            this.maximizeModalWindow();
    }
    this.popup = new PopUpMessage(strings);
}

/**
 * Method to create resize buttons in modal DOM
 * @ignore
 */
ModalWindow.prototype.createResizeButtons = function() {
    // This is a definition of Resize Button Bottom-Right
    this.resizerBR = document.createElement('div');
    this.resizerBR.className  = 'wrs_bottom_right_resizer';
    this.resizerBR.innerHTML = '◢';
    // This is a definition of Resize Button Top-Left
    this.resizerTL = document.createElement('div');
    this.resizerTL.className  = 'wrs_bottom_left_resizer';
    // Append resize buttons to modal
    this.containerDiv.appendChild(this.resizerBR);
    this.titleBardDiv.appendChild(this.resizerTL);
    // Add events to resize on click and drag
    wrs_addEvent(this.resizerBR, 'mousedown', this.activateResizeStateBR.bind(this));
    wrs_addEvent(this.resizerTL, 'mousedown', this.activateResizeStateTL.bind(this));
}
/**
 * Method to initialize variables for Bottom-Right resize button
 * @param {event} ev mouse
 * @ignore
 */
ModalWindow.prototype.activateResizeStateBR = function(ev) {
    this.initializeResizeProperties(ev, false);
}

/**
 * Method to initialize variables for Top-Left resize button
 * @param {event} ev mouse
 * @ignore
 */
ModalWindow.prototype.activateResizeStateTL = function(ev) {
    this.initializeResizeProperties(ev, true);
}

/**
 * Common method to initialize variables at resize
 * @param {event} ev mouse
 * @ignore
 */
ModalWindow.prototype.initializeResizeProperties = function(ev, leftOption) {
    // Apply class for disable involuntary select text when drag.
    wrs_addClass(document.body, 'wrs_noselect');
    this.resizeDataObject = {
        x: this.eventClient(ev).X,
        y: this.eventClient(ev).Y
    };
    // Save Initial state of modal to compare on drag and obtain the difference.
    this.initialWidth = parseInt(this.containerDiv.style.width);
    this.initialHeight = parseInt(this.containerDiv.style.height);
    if (!leftOption) {
        this.initialRight = parseInt(this.containerDiv.style.right);
        this.initialBottom = parseInt(this.containerDiv.style.bottom);
    } else {
        this.leftScale = true;
    }
    if (!this.initialRight){
        this.initialRight = 0;
    }
    if (!this.initialBottom){
        this.initialBottom = 0;
    }
    // Disable mouse events on editor when we start to drag modal.
    this.iframe.style['pointer-events'] = 'none';
    document.body.style['user-select'] = 'none';
    // Needed for IE11 for apply disabled mouse events on editor because iexplorer need a dinamic object to apply this property.
    if (this.isIE11()) {
        this.iframe.style['position'] = 'relative';
    }
    // Prevent lost mouse events into other iframes
    // Activate overlay div to prevent mouse events behind modal
    if (_wrs_modalWindow.properties.state != "maximized") {
        this.overlayDiv.style.display = "";
    }
}

ModalWindow.prototype.open = function() {

    if (this.deviceProperties['isIOS'] || this.deviceProperties['isAndroid'] || this.deviceProperties['isMobile']) {
        // Due to editor wait we need to wait until editor focus.
        setTimeout(function() { _wrs_modalWindow.hideKeyboard() }, 300);
    }

    if (this.properties.open == true || this.properties.created) {

        if (this.properties.open == true) {
            this.updateToolbar();
            if (_wrs_isNewElement) {
                this.updateMathMLContent();
                this.lastImageWasNew = true;
            }
            else {
                this.setMathMLWithCallback(wrs_mathmlDecode(_wrs_temporalImage.getAttribute(_wrs_conf_imageMathmlAttribute)));
                this.lastImageWasNew = false;
            }
        }
        else {
            this.containerDiv.style.visibility = '';
            this.containerDiv.style.opacity = '';
            this.containerDiv.style.display = '';
            this.overlayDiv.style.visibility = '';
            this.overlayDiv.style.display = '';

            this.properties.open = true;

            this.updateToolbar();

            if (_wrs_isNewElement) {
                this.updateMathMLContent();
                this.lastImageWasNew = true;
            } else {
                this.setMathMLWithCallback(wrs_mathmlDecode(_wrs_temporalImage.getAttribute(_wrs_conf_imageMathmlAttribute)));
                this.lastImageWasNew = false;
            }

            if (!this.properties.deviceProperties.isAndroid && !this.properties.deviceProperties.isIOS) {
                this.restoreStateModalWindow();
            }
        }

        // Maximize window only when the configuration is set and the device is not ios or android.
        if (this.deviceProperties['isDesktop'] && typeof _wrs_conf_modalWindow != "undefined" && _wrs_conf_modalWindow && _wrs_conf_modalWindowFullScreen) {
            this.maximizeModalWindow();
        }

        if (this.deviceProperties['isIOS']) {
            this.iosSoftkeyboardOpened = false;
            this.setIframeContainerHeight("100" + this.iosMeasureUnit);
        }
    } else {
        var title = wrs_int_getCustomEditorEnabled() != null ? wrs_int_getCustomEditorEnabled().title : 'MathType';
        _wrs_modalWindow.setTitle(title);
        this.create();
    }

}

/**
 * It put correct toolbar depending if exist other custom toolbars at the same time (e.g: Chemistry)
 * @ignore
 */
ModalWindow.prototype.updateToolbar = function() {
    if (customEditor = wrs_int_getCustomEditorEnabled()) {
        var toolbar = customEditor.toolbar ? customEditor.toolbar : _wrs_int_wirisProperties['toolbar'];
        _wrs_modalWindow.setTitle(customEditor.title);
        if (this.toolbar == null || this.toolbar != toolbar) {
            this.setToolbar(toolbar);
        }
    } else {
        var toolbar = this.checkToolbar();
        _wrs_modalWindow.setTitle('MathType');
        if (this.toolbar == null || this.toolbar != toolbar) {
            this.setToolbar(toolbar);
            wrs_int_disableCustomEditors();
        }
    }
}

/**
 * It returns correct toolbar depending on the configuration local or serverside.
 * @ignore
 */
ModalWindow.prototype.checkToolbar = function() {
    var toolbar = (typeof _wrs_conf_editorParameters == 'undefined' || typeof _wrs_conf_editorParameters['toolbar'] == 'undefined') ? 'general' : _wrs_conf_editorParameters['toolbar'];
    if(toolbar == 'general'){
        toolbar = (typeof _wrs_int_wirisProperties == 'undefined' || typeof _wrs_int_wirisProperties['toolbar'] == 'undefined') ? 'general' : _wrs_int_wirisProperties['toolbar'];
    }
    return toolbar;
}

/**
 * It controls cases where is needed to set an empty mathml or copy the current mathml value.
 * @ignore
 */
ModalWindow.prototype.updateMathMLContent = function() {
    if (this.properties.deviceProperties.isAndroid || this.properties.deviceProperties.isIOS) {
        this.setMathMLWithCallback('<math><semantics><annotation encoding="application/json">[]</annotation></semantics></math>"');
    } else {
        this.setMathMLWithCallback('<math/>');
    }
}

ModalWindow.prototype.isOpen = function() {
    return this.properties.open;
}

/**
 * Closes modal window and restores viewport header.
 * @ignore
 */
ModalWindow.prototype.close = function() {
    this.saveModalProperties();
    // Set disabled focus to prevent lost focus.
    this.setMathML('<math/>',true);
    this.overlayDiv.style.visibility = 'hidden';
    this.containerDiv.style.visibility = 'hidden';
    this.containerDiv.style.display = 'none';
    this.containerDiv.style.opacity = '0';
    this.overlayDiv.style.display = 'none';
    this.properties.open = false;
    wrs_int_disableCustomEditors();
    setTimeout(
        function() {
            if (typeof _wrs_currentEditor != 'undefined' && _wrs_currentEditor) {
                _wrs_currentEditor.focus();
            }
        }, 100);
    _wrs_popupWindow.postMessage({'objectName' : 'editorClose'}, this.iframeOrigin);
}

/**
 * Util function for know if user is using iexplorer v11.
 * @return {boolean} return true if browser is iexplorer v11 or false in others.
 * @ignore
 */
ModalWindow.prototype.isIE11 = function() {
    if (navigator.userAgent.search("Msie/") >= 0 || navigator.userAgent.search("Trident/") >= 0 || navigator.userAgent.search("Edge/") >= 0 ) {
        return true;
    }
    return false;
}

ModalWindow.prototype.addClass = function(cls) {
    wrs_addClass(this.overlayDiv, cls);
    wrs_addClass(this.titleBardDiv, cls);
    wrs_addClass(this.overlayDiv, cls);
    wrs_addClass(this.containerDiv, cls);
    wrs_addClass(this.iframeContainer, cls);
    wrs_addClass(this.iframe, cls);
    wrs_addClass(this.stackDiv, cls);
    wrs_addClass(this.minimizeDiv, cls);
    wrs_addClass(this.maximizeDiv, cls);
}

ModalWindow.prototype.removeClass = function(cls) {
    wrs_removeClass(this.overlayDiv, cls);
    wrs_removeClass(this.titleBardDiv, cls);
    wrs_removeClass(this.overlayDiv, cls);
    wrs_removeClass(this.containerDiv, cls);
    wrs_removeClass(this.iframeContainer, cls);
    wrs_removeClass(this.iframe, cls);
    wrs_removeClass(this.stackDiv, cls);
    wrs_removeClass(this.minimizeDiv, cls);
    wrs_removeClass(this.maximizeDiv, cls);
}

ModalWindow.prototype.setTitle = function(title) {
    this.titleDiv.innerHTML = title;
    this.title = title;

}
/**
 * Create modal dialog for desktop OS.
 * @ignore
 */
ModalWindow.prototype.createModalWindowDesktop = function() {
    this.addClass('wrs_modal_desktop');
    this.stackModalWindow();
}

/**
 * Create modal dialog for non mobile android devices.
 * @ignore
 */

ModalWindow.prototype.createModalWindowAndroid = function() {
    this.addClass('wrs_modal_android');
    window.addEventListener('resize', function (e) {
        if (_wrs_conf_modalWindow) {
            _wrs_modalWindow.orientationChangeAndroidSoftkeyboard();
        }
    });
}

/**
 * Create modal dialog for iOS devices.
 * @ignore
 */

ModalWindow.prototype.createModalWindowIos = function() {
    this.addClass('wrs_modal_ios');
    // Refresh the size when the orientation is changed
    window.addEventListener('resize', function (e) {
        if (_wrs_conf_modalWindow) {
            _wrs_modalWindow.orientationChangeIosSoftkeyboard();
        }
    });
}

/**
 * Restore previous state, position and size of previous stacked modal window
 * @ignore
 */

ModalWindow.prototype.restoreStateModalWindow = function() {
    if (this.properties.state == 'maximized') {
        // Reseting states for prevent return to stack state.
        this.maximizeModalWindow();
    } else if (this.properties.state == 'minimized') {
        // Reseting states for prevent return to stack state.
        this.properties.state = this.properties.previousState;
        this.properties.previousState = '';
        this.minimizeModalWindow();
    } else {
        this.stackModalWindow();
    }
}

ModalWindow.prototype.stackModalWindow = function () {
    this.properties.previousState = this.properties.state;
    this.properties.state = 'stack';
    this.overlayDiv.style.background = "rgba(0,0,0,0)";
    this.removeClass('wrs_maximized');
    this.minimizeDiv.title = "Minimise";
    this.removeClass('wrs_minimized');
    this.addClass('wrs_stack');

    this.restoreModalProperties();
    // Sending sizes to iframe
    if (typeof _wrs_popupWindow != 'undefined' && _wrs_popupWindow) {
        this.containerDiv.style.position = "fixed";
        this.setResizeButtonsVisibility();
        this.applyIframeSize();
    }
    // Need recalculate position of actual modal because window can was changed in fullscreenmode
    this.recalculateScrollBar();
    this.recalculatePosition();
    this.recalculateScale();
    if (typeof _wrs_popupWindow != 'undefined' && _wrs_popupWindow) {
        this.focus();
    }
}

ModalWindow.prototype.minimizeModalWindow = function() {
    // Saving width, height, top and bottom parameters to restore when open
    this.saveModalProperties();
    if (this.properties.state == 'minimized' && this.properties.previousState == 'stack') {
        this.stackModalWindow();
    }
    else if (this.properties.state == 'minimized' && this.properties.previousState == 'maximized') {
        this.maximizeModalWindow();
    }
    else {
        this.removeListeners();
        this.properties.previousState = this.properties.state;
        this.properties.state = "minimized";
        this.setResizeButtonsVisibility();
        this.overlayDiv.style.background = "rgba(0,0,0,0)";
        this.minimizeDiv.title = "Maximise";

        if (wrs_containsClass(this.overlayDiv, 'wrs_stack')) {
            this.removeClass('wrs_stack');
        }
        else {
            this.removeClass('wrs_maximized');
        }
        this.addClass('wrs_minimized');
    }
}

/**
 * Maximize modal window.
 * @ignore
 */
ModalWindow.prototype.maximizeModalWindow = function() {
    // Saving width, height, top and bottom parameters to restore when open
    this.saveModalProperties();
    if (this.properties.state != 'maximized') {
        this.properties.previousState = this.properties.state;
        this.properties.state = 'maximized';
    }
    // Don't permit resize on maximize mode.
    this.setResizeButtonsVisibility();

    if (wrs_containsClass(this.overlayDiv, 'wrs_minimized')) {
        this.minimizeDiv.title = "Minimise";
        this.removeClass('wrs_minimized');
    }
    else if (wrs_containsClass(this.overlayDiv, 'wrs_stack')) {
        this.containerDiv.style.left = null;
        this.containerDiv.style.top = null;
        this.removeClass('wrs_stack');
    }
    this.overlayDiv.style.background = "rgba(0,0,0,0.8)";
    this.overlayDiv.style.display = '';
    this.addClass('wrs_maximized');

    // Set size to 80% screen with a max size.
    this.setSize(parseInt(window.innerHeight * 0.8) , parseInt(window.innerWidth * 0.8));
    var sizeModificated = false;
    if (this.containerDiv.clientHeight > 700) {
        this.containerDiv.style.height = '700px';
        sizeModificated = true;
    }
    if (this.containerDiv.clientWidth > 1200) {
        this.containerDiv.style.width  = '1200px';
        sizeModificated = true;
    }

    // Setting modal position in center on screen.
    this.setPosition(window.innerHeight / 2 - this.containerDiv.offsetHeight / 2, window.innerWidth / 2 - this.containerDiv.offsetWidth / 2);
    this.recalculateScale();
    this.recalculatePosition();
    this.applyIframeSize();
    this.focus();
}

/**
 * Set modal size.
 * @param  {integer} height set a height of modal with an integer
 * @param  {integer} width set a width of modal with an integer
 * @ignore
 */
ModalWindow.prototype.setSize = function(height, width) {
    this.containerDiv.style.height = height + 'px';
    this.containerDiv.style.width = width + 'px';
    this.applyIframeSize();
}

/**
 * Set modal position.
 * @param  {integer} bottom set a bottom of div modal with an integer
 * @param  {integer} right set a right of div modal with an integer
 * @ignore
 */
ModalWindow.prototype.setPosition = function(bottom, right) {
    this.containerDiv.style.bottom = bottom + 'px';
    this.containerDiv.style.right = right + 'px';
}

/**
 * Save actual parameters of opened modal (like size and position...) to restore when modal will open.
 * @ignore
 */
ModalWindow.prototype.saveModalProperties = function() {
    // Saving values of modal only when modal is in stack state.
    if (this.properties.state == 'stack') {
        this.properties.position.bottom = parseInt(this.containerDiv.style.bottom);
        this.properties.position.right = parseInt(this.containerDiv.style.right);
        this.properties.size.width = parseInt(this.containerDiv.style.width);
        this.properties.size.height = parseInt(this.containerDiv.style.height);
    }
}

/**
 * Restore previous parameters values of closed modal (like size and position) and apply this parameters in actual modal.
 * @ignore
 */
ModalWindow.prototype.restoreModalProperties = function() {
    if (this.properties.state == 'stack') {
        // Restoring Bottom and Right values from last modal
        this.setPosition(this.properties.position.bottom, this.properties.position.right);
        // Restoring Height and Left values from last modal
        this.setSize(this.properties.size.height, this.properties.size.width);
    }
}

/**
 * Set modal size.
 * @ignore
 */
ModalWindow.prototype.applyIframeSize = function() {
    this.iframeContainer.style.width = this.containerDiv.clientWidth + 'px';
    this.iframeContainer.style.height = this.containerDiv.clientHeight - 38 + 'px';
    this.iframe.style.width = parseInt(this.iframeContainer.style.width) - 12 + 'px';
    this.iframe.style.height = this.iframeContainer.style.height;
    if ( typeof _wrs_popupWindow != 'undefined') {
        _wrs_popupWindow.postMessage({'objectName' : 'editorResize', 'arguments': [_wrs_modalWindow.iframeContainer.offsetHeight - 10]}, this.iframeOrigin);
    }
}

/**
 * Active and disable visibility of resize buttons in modal window depend on state.
 * @ignore
 */
ModalWindow.prototype.setResizeButtonsVisibility = function() {
    if (this.properties.state == 'stack') {
        this.resizerTL.style.visibility = 'visible';
        this.resizerBR.style.visibility = 'visible';
    }
    else {
        this.resizerTL.style.visibility = 'hidden';
        this.resizerBR.style.visibility = 'hidden';
    }
}

/**
 * Makes an object draggable adding mouse and touch events.
 * @ignore
 */
ModalWindow.prototype.addListeners = function() {
    // Mouse events.
    wrs_addEvent(document.body, 'mousedown', this.startDrag.bind(this));
    wrs_addEvent(window, 'mouseup', this.stopDrag.bind(this));
    wrs_addEvent(document, 'mouseup', this.stopDrag.bind(this));
    wrs_addEvent(document, 'mousemove', this.drag.bind(this));
    wrs_addEvent(window, 'resize', this.onWindowResize.bind(this));
}

/**
 * Removes draggable events from an object.
 * @ignore
 */
ModalWindow.prototype.removeListeners = function() {
    // Mouse events.
    wrs_removeEvent(document.body, 'mousedown', this.startDrag);
    wrs_removeEvent(window, 'mouseup', this.stopDrag);
    wrs_removeEvent(document, 'mouseup', this.stopDrag);
    wrs_removeEvent(document.getElementsByClassName("wrs_modal_iframe")[0], 'mouseup', this.stopDrag);
    wrs_removeEvent(document, 'mousemove', this.drag);
    wrs_removeEvent(window, 'resize', this.onWindowResize);
}


/**
 * Returns mouse or touch coordinates (on touch events ev.ClientX doesn't exists)
 * @param {event} ev mouse or touch event
 * @return {object} with the X and Y coordinates.
 * @ignore
 */
ModalWindow.prototype.eventClient = function(ev) {
    if (typeof(ev.clientX) == 'undefined' && ev.changedTouches) {
        var client = {
            X : ev.changedTouches[0].clientX,
            Y : ev.changedTouches[0].clientY
        };
        return client;
    }
    else {
        client = {
            X : ev.clientX,
            Y : ev.clientY
        };
        return client;
    }
}


/**
 * Set the overlay div display
 *
 * @param {event} ev touchstart or mousedown event.
 * @ignore
 */
ModalWindow.prototype.setOverlayDiv = function(ev) {
    this.overlayDiv.style.display = '';
}

/**
 * Start drag function: set the object _wrs_dragDataObject with the draggable object offsets coordinates.
 * when drag starts (on touchstart or mousedown events).
 *
 * @param {event} ev touchstart or mousedown event.
 * @ignore
 */
ModalWindow.prototype.startDrag = function(ev) {
    if (this.properties.state == 'minimized') {
        return;
    }
    if (ev.target.className == 'wrs_modal_title') {
        if(typeof this.dragDataObject === 'undefined' || this.dragDataObject === null) {
            ev = ev || event;
            // Save first click mouse point on screen
            this.dragDataObject = {
                x: this.eventClient(ev).X,
                y: this.eventClient(ev).Y
            };
            // Reset last drag position when start drag
            this.lastDrag = {
                x: "0px",
                y: "0px"
            };
            // Init right and bottom values for window modal if it isn't exist.
            if(this.containerDiv.style.right == ''){
                this.containerDiv.style.right = "0px";
            }
            if(this.containerDiv.style.bottom == ''){
                this.containerDiv.style.bottom = "0px";
            }
            // Disable mouse events on editor when we start to drag modal.
            this.iframe.style['pointer-events'] = 'none';
            // Needed for IE11 for apply disabled mouse events on editor because iexplorer need a dinamic object to apply this property.
            if (this.isIE11()) {
                this.iframe.style['position'] = 'relative';
            }
            // Apply class for disable involuntary select text when drag.
            wrs_addClass(document.body, 'wrs_noselect');
            // Obtain screen limits for prevent overflow.
            this.limitWindow = this.getLimitWindow();
            // Prevent lost mouse events into other iframes
            // Activate overlay div to prevent mouse events behind modal
            if (_wrs_modalWindow.properties.state != "maximized") {
                this.overlayDiv.style.display = "";
            }
        }
    }

}

/**
 * Updates_wrs_dragDataObject with the draggable object coordinates when the draggable object is being moved.
 *
 * @param {event} ev touchmouve or mousemove events.
 * @ignore
 */
ModalWindow.prototype.drag = function(ev) {
    if (this.dragDataObject) {
        ev.preventDefault();
        ev = ev || event;
        // Calculate max and min between actual mouse position and limit of screeen. It restric the movement of modal into window.
        var limitY = Math.min(this.eventClient(ev).Y + window.pageYOffset,this.limitWindow.minPointer.y + window.pageYOffset);
        limitY = Math.max(this.limitWindow.maxPointer.y + window.pageYOffset,limitY);
        var limitX = Math.min(this.eventClient(ev).X + window.pageXOffset,this.limitWindow.minPointer.x + window.pageXOffset);
        limitX = Math.max(this.limitWindow.maxPointer.x + window.pageXOffset,limitX);
        // Substract limit with first position to obtain relative pixels increment to the anchor point.
        var dragX = limitX - this.dragDataObject.x + "px";
        var dragY = limitY - this.dragDataObject.y + "px";
        // Save last valid position of modal before window overflow.
        this.lastDrag = {
            x: dragX,
            y:dragY
        };
        // This move modal with hadware acceleration.
        this.containerDiv.style.transform = "translate3d(" + dragX + "," + dragY + ",0)";
        this.containerDiv.style.position = 'absolute';
    }
    if (this.resizeDataObject) {
        var limitX = Math.min(this.eventClient(ev).X,window.innerWidth - this.scrollbarWidth - 7);
        var limitY = Math.min(this.eventClient(ev).Y,window.innerHeight - 7);
        if (limitX < 0) {
            limitX = 0;
        }

        if (limitY < 0) {
            limitY = 0;
        }

        var scaleMultiplier;
        if (this.leftScale) {
            scaleMultiplier = -1;
        }
        else {
            scaleMultiplier = 1;
        }
        this.containerDiv.style.width = this.initialWidth + scaleMultiplier * (limitX - this.resizeDataObject.x) + 'px';
        this.containerDiv.style.height = this.initialHeight + scaleMultiplier * (limitY - this.resizeDataObject.y) + 'px';
        if (!this.leftScale) {
            if (this.resizeDataObject.x - limitX - this.initialWidth < -580) {
                this.containerDiv.style.right = this.initialRight - (limitX - this.resizeDataObject.x) + 'px';
            }
            else {
                this.containerDiv.style.right  = this.initialRight + this.initialWidth - 580 + "px";
                this.containerDiv.style.width = "580px";
            }
            if (this.resizeDataObject.y - limitY < this.initialHeight - 338) {
                this.containerDiv.style.bottom = this.initialBottom - (limitY - this.resizeDataObject.y) + 'px';
            }
            else {
                this.containerDiv.style.bottom  = this.initialBottom + this.initialHeight - 338 + "px";
                this.containerDiv.style.height = "338px";
            }
        }
        this.recalculateScale();
        this.recalculatePosition();
    }
}
/**
 * Get limits of actual window to limit modal movement
 * @return {Object} Object containing mouseX and mouseY are coordinates of actual mouse on screen.
 * @ignore
 */
ModalWindow.prototype.getLimitWindow = function() {
    // Obtain dimentions of window page.
    var maxWidth = window.innerWidth;
    var maxHeight = window.innerHeight;

    // Calculate relative position of mouse point into window.
    var offSetToolbarY = (this.containerDiv.offsetHeight + parseInt(this.containerDiv.style.bottom)) - (maxHeight - (this.dragDataObject.y - window.pageXOffset));
    var offSetToolbarX = maxWidth - this.scrollbarWidth - (this.dragDataObject.x - window.pageXOffset) - parseInt(this.containerDiv.style.right);

    // Calculate limits with sizes of window, modal and mouse position.
    var minPointerY = maxHeight - this.containerDiv.offsetHeight + offSetToolbarY;
    var maxPointerY = this.titleDiv.offsetHeight - (this.titleDiv.offsetHeight - offSetToolbarY);
    var minPointerX = maxWidth - offSetToolbarX - this.scrollbarWidth;
    var maxPointerX = (this.containerDiv.offsetWidth - offSetToolbarX);
    var minPointer = {x: minPointerX,y: minPointerY};
    var maxPointer = {x: maxPointerX,y: maxPointerY};
    return {minPointer : minPointer, maxPointer:maxPointer};
}
/**
 * Get Scrollbar width size of browser
 * @ignore
 */
ModalWindow.prototype.getScrollBarWidth = function() {
    // Create a paragraph with full width of page.
    var inner = document.createElement('p');
    inner.style.width = "100%";
    inner.style.height = "200px";

    // Create a hidden div to compare sizes.
    var outer = document.createElement('div');
    outer.style.position = "absolute";
    outer.style.top = "0px";
    outer.style.left = "0px";
    outer.style.visibility = "hidden";
    outer.style.width = "200px";
    outer.style.height = "150px";
    outer.style.overflow = "hidden";
    outer.appendChild(inner);

    document.body.appendChild(outer);
    var widthOuter = inner.offsetWidth;

    // Change type overflow of paragraph for measure scrollbar.
    outer.style.overflow = 'scroll';
    var widthInner = inner.offsetWidth;

    // If measure is the same, we compare with internal div.
    if (widthOuter == widthInner) {
        widthInner = outer.clientWidth;
    }
    document.body.removeChild(outer);

    return (widthOuter - widthInner);
}

/**
 * Set the _wrs_dragDataObject to null when the drag finish (touchend or mouseup events).
 *
 * @param {event} ev touchend or mouseup event.
 * @ignore
 */
ModalWindow.prototype.stopDrag = function(ev) {
    // Due to we have multiple events that call this function, we need only to execute the next modifiers one time,
    // when the user stops to drag and dragDataObject is not null (the object to drag is attached).
    if (this.dragDataObject || this.resizeDataObject) {
        // If modal doesn't change, it's not necessary to set position with interpolation
        if(this.containerDiv.style.position != 'fixed'){
            this.containerDiv.style.position = 'fixed';
            // Fixed position makes the coords relative to the main window. So that, we need to transform
            // the absolute coords to relative.
            this.containerDiv.style.transform = '';
            if (this.dragDataObject) {
                this.containerDiv.style.right = parseInt(this.containerDiv.style.right) - parseInt(this.lastDrag.x) + pageXOffset + "px";
                this.containerDiv.style.bottom = parseInt(this.containerDiv.style.bottom) - parseInt(this.lastDrag.y) + pageYOffset + "px";
            }
        }
        // We make focus on editor after drag modal windows to prevent lose focus.
        this.focus();
        // Restore mouse events on iframe
        this.iframe.style['pointer-events'] = 'auto';
        document.body.style['user-select'] = '';
        // Restore static state of iframe if we use iexplorer
        if (this.isIE11()) {
            this.iframe.style['position'] = null;
        }
        // Active text select event
        wrs_removeClass(document.body, 'wrs_noselect');
        // Disable overlay for click behind modal
        if (_wrs_modalWindow.properties.state != "maximized") {
            this.overlayDiv.style.display = "none";
        }
    }
    this.dragDataObject = null;
    this.resizeDataObject = null;
    this.initialWidth = null;
    this.leftScale = null;
}

/**
 * Recalculating scale for modal when resize browser window
 *
 * @ignore
 */
ModalWindow.prototype.onWindowResize = function() {
    this.recalculateScrollBar();
    this.recalculatePosition();
    this.recalculateScale();
}

/**
 * Recalculating position for modal when resize browser window
 *
 * @ignore
 */
ModalWindow.prototype.recalculatePosition = function() {
    this.containerDiv.style.right = Math.min(parseInt(this.containerDiv.style.right), window.innerWidth - this.scrollbarWidth - this.containerDiv.offsetWidth) + "px";
    if(parseInt(this.containerDiv.style.right) < 0) {
        this.containerDiv.style.right = "0px";
    }
    this.containerDiv.style.bottom = Math.min(parseInt(this.containerDiv.style.bottom), window.innerHeight - this.containerDiv.offsetHeight) + "px";
    if(parseInt(this.containerDiv.style.bottom) < 0) {
        this.containerDiv.style.bottom = "0px";
    }
}

/**
 * Recalculating scale for modal when resize browser window
 *
 * @ignore
 */
ModalWindow.prototype.recalculateScale = function() {
    var sizeModificated = false;
    if (parseInt(this.containerDiv.style.width) > 580) {
        this.containerDiv.style.width = Math.min(parseInt(this.containerDiv.style.width), window.innerWidth - this.scrollbarWidth) + "px";
        sizeModificated = true;
    }
    else {
        this.containerDiv.style.width = "580px";
        sizeModificated = true;
    }
    if (parseInt(this.containerDiv.style.height) > 338) {
        this.containerDiv.style.height = Math.min(parseInt(this.containerDiv.style.height), window.innerHeight) + "px";
        sizeModificated = true;
    }
    else {
        this.containerDiv.style.height = "338px";
        sizeModificated = true;
    }
    if (sizeModificated) {
        this.applyIframeSize();
    }
}

/**
 * Recalculating width of scrollBar browser
 *
 * @ignore
 */
ModalWindow.prototype.recalculateScrollBar = function() {
    this.hasScrollBar = window.innerWidth > document.documentElement.clientWidth;
    if(this.hasScrollBar){
        this.scrollbarWidth = this.getScrollBarWidth();
    }
    else {
        this.scrollbarWidth = 0;
    }
}

/**
 * Hide soft keyboards on IOS systems.
 * @ignore
 */
ModalWindow.prototype.hideKeyboard = function() {
    document.activeElement.blur();
}


/**
 * Returns the origin (i.e protocol + hostname + port) from an url string.
 * This method is used to get the iframe window origin to allow postMessages.
 * @param  {string} url url string
 * @return {string}     origin string
 * @ignore
 */
ModalWindow.prototype.getOriginFromUrl = function(url) {
    var parser = document.createElement('a');
    parser.href = url;
    return parser.protocol.indexOf('//') == -1 ? parser.protocol + '//' + parser.host : parser.protocol + parser.host;
}

/**
 * Enable safe cross-origin comunication between plugin and MathType services. We can't call directly
 * MathType editor methods because the content iframe could be in a different domain.
 * We use postMessage method to create a wrapper between modal window and editor.
 *
 */

/**
 * Set a MathML into editor.
 * @param {string} mathml MathML string.
 * @ignore
 */
ModalWindow.prototype.setMathML = function(mathml, focusDisabled) {
    _wrs_popupWindow.postMessage({'objectName' : 'editor', 'methodName' : 'setMathML', 'arguments': [mathml]}, this.iframeOrigin);
    // Check if focus is not necessary when clean modal on close
    if (!focusDisabled){
        this.focus();
    }
}
/**
 * Set a MathML into editor and call function in back.
 * @param {string} mathml MathML string.
 * @ignore
 */
ModalWindow.prototype.setMathMLWithCallback = function(mathml) {
    _wrs_popupWindow.postMessage({'objectName' : 'editorCallback', 'arguments': [mathml]}, this.iframeOrigin);
    this.focus();
}

/**
 * Set a toolbar into editor.
 * @param {string} toolbar toolbar name.
 * @ignore
 */
ModalWindow.prototype.setToolbar = function(toolbar) {
    this.toolbar = toolbar;
    _wrs_popupWindow.postMessage({'objectName' : 'editor', 'methodName' : 'setParams', 'arguments': [{'toolbar' : toolbar}]}, this.iframeOrigin);
}

/**
 * Set focus on editor.
 * @ignore
 */
ModalWindow.prototype.focus = function() {
    // Focus on iframe explicit
    // We add this focus in iframe beacuse tiny3 have a problem with focus in chrome and it can't focus iframe automaticly
    if (navigator.userAgent.search("Chrome/") >= 0 && navigator.userAgent.search('Edge') == -1) {
        this.iframe.focus();
    }
    _wrs_popupWindow.postMessage({'objectName' : 'editor', 'methodName' : 'focus', 'arguments': null}, this.iframeOrigin);
}


/**
 * Fires editor event
 * @param  {string} eventName event name
 * @ignore
 */
ModalWindow.prototype.fireEditorEvent = function(eventName) {
    _wrs_popupWindow.postMessage({'objectName' : 'editorEvent', 'eventName' : eventName, 'arguments': null}, this.iframeOrigin);
}

/**
 * Returns true when the device is on portrait mode.
 * @ignore
 */
ModalWindow.prototype.portraitMode = function () {
    return window.innerHeight > window.innerWidth;
}

/**
 * Change container sizes when the keyboard is opened on iOS.
 * @ignore
 */
ModalWindow.prototype.openedIosSoftkeyboard = function () {
    if (!this.iosSoftkeyboardOpened && this.iosDivHeight != null &&this.iosDivHeight == "100" + this.iosMeasureUnit) {
        if (this.portraitMode()) {
            this.setIframeContainerHeight("63" + this.iosMeasureUnit);
        }
        else {
            this.setIframeContainerHeight("40" + this.iosMeasureUnit);
        }
    }
    this.iosSoftkeyboardOpened = true;
}

/**
 * Change container sizes when the keyboard is closed on iOS.
 * @ignore
 */
ModalWindow.prototype.closedIosSoftkeyboard = function () {
    this.iosSoftkeyboardOpened = false;
    this.setIframeContainerHeight("100" + this.iosMeasureUnit);
}

/**
 * Change container sizes when orientation is changed on iOS.
 * @ignore
 */
ModalWindow.prototype.orientationChangeIosSoftkeyboard = function () {
    if (this.iosSoftkeyboardOpened) {
        if (this.portraitMode()) {
            this.setIframeContainerHeight("63" + this.iosMeasureUnit);
        }
        else {
            this.setIframeContainerHeight("40" + this.iosMeasureUnit);
        }
    }
    else {
        this.setIframeContainerHeight("100" + this.iosMeasureUnit);
    }
}

/**
 * Change container sizes when orientation is changed on Android.
 * @ignore
 */
ModalWindow.prototype.orientationChangeAndroidSoftkeyboard = function () {
    this.setIframeContainerHeight("100%");
}

/**
 * Set iframe container height.
 * @ignore
 */
ModalWindow.prototype.setIframeContainerHeight = function (height) {
    this.iosDivHeight = height;
    _wrs_modalWindow.iframeContainer.style.height = height;
    _wrs_popupWindow.postMessage({'objectName' : 'editorResize', 'arguments': [_wrs_modalWindow.iframeContainer.offsetHeight - 10]}, this.iframeOrigin);
}
