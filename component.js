if (typeof module != 'undefined' && module.exports && typeof HTMLParser == 'undefined') {
    HTMLParser = 
        require(__dirname + '/bower_components/HTMLParser/htmlparser.class.js');
    // jQuery Mock...
    $ = {
        'ajax': (ajaxObj) => {
            ajaxObj = Object.assign({}, {
                'url': '',
                'success': () => {}
            }, ajaxObj);
            try {
                ajaxObj.success(require('fs')
                    .readFileSync(ajaxObj.url, 'UTF8'));
            } catch(e) {}
        }
    };
} else if (typeof HTMLParser == 'undefined') {
    console.error('HTMLParser is undefined while trying to load Component');
}

/**
 * Renders a model onto a template literal string.  Renders the rendered text.
 * @param {Object} model An object to render into the templateLiteral.
 * @param {String} templateLiteral A template literal string to render.
 * @return {String} An evaluated template literal, using the model as input.
 */
function render(model, templateLiteral) {
    let __null__ = '';
    // declare the vars in function scope needed for our replacement
    for (let key in model) {
        let value;
        value = model[key];
        
        try {eval('var ' + key + ' = value; ');} catch(e) {}
    }
    
    return eval('String.raw`' + templateLiteral + '`');
}

/**
 * For some HTMLElement, evaluates in order the script tags within that HTML.
 * @param {HTMLElement} element The element under which to render scripts.
 */
function renderScripts(element) {
    element.querySelectorAll('script').forEach((src) => {
        eval(src.innerText);
    });
}

/**
 * Class fetches a filename and stores it in a "ShadowDOM".  Allows the
 * component the be repeated.  Performs rendering using template literals.  
 * Uses dirty checking algorithm to isolate DOM updates.
 * @class
 */
class Component {
    /**
     * @param {String} name The name of the component.
     * @param {String|HTMLElement} selector The selector to insert the 
     * component into.
     * @param {String} src The filename to obtain the component source from.
     */
    constructor(name, selector, src = '') {
        if (typeof selector == 'string' &&
            document.querySelectorAll(selector).length > 1) {
            document.querySelectorAll(selector).forEach((el) => {
                new Component(name, el, src);
            });
            return;
        } else if (selector == 'string') {
            selector = document.querySelector(selector);
        }

        if (!selector) {
            console.error('Component inserted without a valid parent.');
            return null;
        }
        
        /** {HTMLElement} The parent node for this component. */
        this.parent = selector;
        
        // Calls the static initialize function.
        Component.initialize(name, src).then(this.render.bind(this));

        /** {Promise} The promise that resolves when the component file is loaded */
        this.initialized = Component.promises[name];

        // Calls render after initialization.
        this.initialized.then(this.render.bind(this));
        
        /** {Object} The model to render the DOM with. */
        this.model = {};

        /** {Object} Internal model we check against. */
        this.__model__ = {};
        
        /** {String} The name of the component. */
        this.name = name;
    }

    /**
     * Retruns the results of a querySelector for the context of this component.
     * @param {String} query The query to run in context of this component.
     * @returns {Array|HTMLElement} Returns the querySelector scoped to the
     * component's root element.
     */
    find(query) {
        try {
            let arr = [];
            this.element.querySelectorAll(query).forEach((element) => {
                arr.push(element);
            });
            if (arr.length == 1) {
                return arr[0];
            }
            return arr;
        } catch(e) {
            return [];
        }
    }

    /**
     * Returns the invalidated model.
     * @return {Object} The invalidated model object.
     */
    invalidated() {
        let invalidated = [];
        // declare the vars in function scope needed for our replacement
        for (let key in this.model) {
            if (!this.__model__.hasOwnProperty(key)) {
                // If new model data...
                invalidated.push(key);
            } else if ((typeof this.model[key] == 'string' || 
                typeof this.model[key] == 'number') &&
                (!this.__model__.hasOwnProperty(key) ||
                this.model[key] != this.__model__[key])) {
                // If number or string don't match...
                invalidated.push(key);
            } else if (typeof this.model[key] != 'function' && 
                typeof this.__model__[key] != 
                typeof this.model[key]) {
                // If non-function type and does not match type...
                invalidated.push(key);
            } else {
                // If function type, and function results don't match...
                try {
                    if (this.__model__.hasOwnProperty(key) &&
                    typeof this.model[key] == 'function' &&
                    this.__model__[key] != this.model[key]()) {
                        invalidated.push(key);
                    }
                } catch(e) {}
            }
        }

        return invalidated;
    }

    /**
     * The default initialization function.  The component is constructed with
     * the new DOM node.
     */
    initialize() {
        this.initialized = true;
    }

    /**
     * Initializes the component by associating a component name with a file.
     * @param {String} name The name of the component.
     * @param {String} src The source file.
     * @param {String} classname (Optional) The class to initialize for this 
     * component name.  If no classname defined, initializes as a Component.
     * @todo If classname is not defined as a Class object, then store as a 
     * string.  During runtime, if wrap initialization in try/catch and if 
     * catch, then initialize classname string as Component instead.
     * @return {Promise} A promise that resolves when the component source file
     * is retrieved.
     */
    static initialize(name, src = '', classname = 'Component') {
        if (Component.components[name]) {
            // The component is already defined...
            return new Promise((resolve, reject) => {
                resolve(Component.components[name]);
            });
        }
        if (src.length > 0) {
            // Load the src file...
            Component.promises[name] = (new Promise((resolve, reject) => {
                // TODO: use native XHRequest
                $.ajax({
                    url: src,
                    success: function(s) {
                        resolve(s);
                    }
                });
            }));
            Component.promises[name].then((contents) => {
                Component.components[name] = {
                    contents: contents,
                    classname: classname
                }
            });
        } else {
            // Display error message...
        }
        return Component.promises[name];
    }

    /**
     * Replaces the contents, wrapping template literals in a "safe" execution
     * environment, i.e. an eval'd try/catch block that outputs an empty string
     * by default.  This allows a template to safely display nothing when no
     * data is supplied.
     * 
     * Given an offset array, function will also log the offsets of template 
     * literals in the contents string containing invalidated model values.
     * @todo Log the errors to an output mechanism/object.
     * @param {String} contents The contents to replace.
     * @param {Object} model The invalidated model.
     * @param {Array} offsets (Optional) If provided, is stored with offsets
     * of invalidated model data in the content string.
     * @return {String} The replaced string.
     */
    static replaceContents(contents, model, offsets = []) {
        let invalidated, itr, regex, str1, str2;
        itr = 0;
        str1 = '${eval(\'try {';
        str2 = '} catch(e){__null__}\')}';
        contents.replace(/\$\{(.*)\}/g, function(match, p1, offset) {
            invalidated = false;
            for (let label of model) {
                // Backspace escape $ and _ in label names...
                label = label.replace(/([\$\_])/g, '\\$1');
                regex = new RegExp('(^|[\s\;])+(' + label + 
                    ')([^\w\_\$]|$)+', 'g');
                if (p1.match(regex) != null) {
                    invalidated = true;
                }
            }
            if (invalidated) {
                // Calculates the offset and stores it...
                offsets.push(offset + itr * (str1.length + str2.length));
            }
            itr++;
            return str1 + p1 + str2;
        });

        return contents;
    }

    /**
     * Rebuilds the DOM, rendering the DOM contents as a template literal.
     * @param {String} contents (Optional) The contents to render.
     */
    render() {
        let element, invalidated, nextOffset, offset, offsets, path;

        // Store the contents into a local string...
        contents = this.contents;

        // Get the invalidated model...
        invalidated = this.invalidated();

        offsets = [];
        contents = Component.replaceContents(contents, invalidated, offsets);

        // Dump contents into dummy element...
        element = document.createElement(Component.toElementName(this.name));
        element.innerHTML = contents;
        
        if (!this.element) {
            // Initialize a brand new element...
            this.element = document.createElement(
                    Component.toElementName(this.name));
            this.element.datasets['instanceId'] = this.id;
            // Element receives rendered content....
            this.element.innerHTML = render(this.model, contents);
            this.parent.appendChild(this.element);
        } else {
            // Update existing element in DOM...
            for (offset of offsets) {
                // Get the offset XPath...
                path = HTMLParser.rebuildNode(contents, 
                    offset);
                // TODO: revise to use component ID
                let queryElement = this.element.querySelector(':scope>' + path);
                if (queryElement) {
                    queryElement.outerHTML = 
                        render(this.model, 
                            element.querySelector(':scope>' + path).outerHTML);
                    renderScripts(this.element.querySelector(':scope>' + path));
                }
            }
        }
        
        // Save the model...
        this.saveModel();

        if (!this.initialized) {
            this.initialize();
            this.initialized = true; // In case override forgets to call super...
        } else {
            this.update();
        }
    }
    
    /**
     * Removes the element from the DOM.
     */
    remove() {
        this.element.remove();
    }

    /**
     * Saves information related to the component.
     */
    save() {

    }

    /**
     * Saves the current model to the internal copy used to check 
     * invalidation.
     */
    saveModel() {
        let key, modelCopy;
        modelCopy = this.model;
        for (key in this.model) {
            if (typeof this.model[key] == 'function') {
                try {
                    modelCopy[key] = this.model[key]();
                } catch(e){}
            }
        }

        this.__model__ = Object.assign({}, modelCopy);
    }

    /**
     * Turns a camelCase name into an element-name, 
     * e.g. camelCase -> camel-case.
     * @param {String} name A camel case name.
     * @return {String} An element formatted name.
     */
    static toElementName(name) {
        return name.replace(/([A-Z]+)/g, '-$1').toLowerCase()
            .replace(/\s+/g, '-');
    }

    /**
     * Update the component, usually coincides with a model change and a render.
     */
    update() {

    }
}

Component.components = {};
Component.numInstances = 0;
Component.promises = {};

if (typeof module != 'undefined' && module.exports) {
    module.exports = Component;
}