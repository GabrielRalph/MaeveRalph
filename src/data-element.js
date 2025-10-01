
const DEBUG = false;
function getDataFromPath(path, data, key) {
    let value = null;
    
    if (typeof path === "string" && path !== "") {
        if (path === "key" && key !== null) {
            value = key;
        } else if (path === ".") {
            value = data;
        } else {
            let paths = path.split(".");
            value = data;
            for (let p of paths) {
                value = value[p];
                if (value === undefined) {
                    value = null;
                    break;
                }
            }
        }
    }
    return value;
}
    
function templateString(string, data, key=null) {
    return string.replace(/\{\{(.*?)\}\}/g, (_, token) => {
        let path = token.trim();
        let value = getDataFromPath(path, data, key);
        if (value === null) {
            value = DEBUG ? path + " not found" : "";
        }
        return value;
    });
}

function templateElement(element, data, key=null) {
    console.log("templateElement", element, data, key);
    
    if (element instanceof Text) {
        let newValue = templateString(element.nodeValue, data);
        if (newValue !== element.nodeValue) {
            element.nodeValue = newValue;
        }
    } else if (element instanceof DVElement) {
        console.log("DVElement", element);
        
        let value = element.getAttribute("value");
        value = getDataFromPath(value, data, key);
        console.log("value", value);
        
        if (value !== null) {
            element.value = value;
        }
    } else {
        let elementAttributes = element.attributes;
        for (let attr of elementAttributes) {
            let attrName = attr.name;
            let attrValue = attr.value;
            let newValue = templateString(attrValue, data, key);
            if (newValue !== attrValue) {
                element.setAttribute(attrName, newValue);
            }
        }
        for (let child of element.childNodes) {
            templateElement(child, data, key);
        }
    }
}

function cloneNode(node) {
    let copy = node.cloneNode(false);
    if (node instanceof DVElement) {
        copy.template = node.template;
        copy.value = node.value;
    }
    for (let child of node.childNodes) {
        copy.appendChild(cloneNode(child));
    }
    return copy;
}

class DVElement extends HTMLElement {
    constructor() {
        super();
        this._value = null;
    }


    connectedCallback() {
        console.log("connectedCallback", this);
        
        if (!Array.isArray(this.template)) {
            this.template = []
            for (let element of this.children) {
                this.template.push(cloneNode(element));
            }
        }
        this.value = this._value;
    }

    set value(value) {
        this._value = value;
        if (this.isConnected) {
            this.innerHTML = "";
            this.onValue(value);
        }
    }

    get value() {
        return this._value;
    }
}

class ForListElement extends DVElement {
    constructor() {
        super();
        console.log("ForListElement", this);
        
    }


    onValue(value) {
        for (let key in value) {
            for (let element of this.template) {
                let newElement = cloneNode(element);
                templateElement(newElement, value[key], key);
                this.appendChild(newElement);
            }
        }
    }
}

class DataElement extends DVElement {
    constructor() {
        super();
    }

    onValue(value) {
        console.log(this.template);
        
        for (let element of this.template) {
            let newElement = cloneNode(element);
            templateElement(newElement, value);
            this.appendChild(newElement);
        }
    }
}


customElements.define('for-list', ForListElement);
customElements.define('data-element', DataElement);