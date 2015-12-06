var taglang = {
    create: function(tagName, isTextNode, args) {
        var that = Object.create(this);
        that._tag = tagName;
        that._attributes = args || {};
        that._children = [];
        that._parent = null;
        that._isText = isTextNode || false;
        
        return that;
    },
    load: function(json) {
        var that = this.create(json.tag, json.isText, json.attributes),
            i, child;
            
        if (json.children === undefined) {
            return that;
        }
        
        for (i=0; i < json.children.length; i+=1) {
            child = this.load(json.children[i]);
            child._parent = that;
            that._children.push(child);
        }
        return that;
    },
    tag: function(val) {
        if (val === undefined) {
            return this._tag;
        }
        this._tag = val;
        return this;
    },
    attr: function(k, v) {
        if (v === undefined) {
            return this._attributes[k];
        }
        this._attributes[k] = v;
        return this;
    },
    children: function() {
        return this._children;
    },
    child: function(i) {
        return this._children[i];
    },
    indexOf: function(i) {
        return this._children.indexOf(i);
    },
    next: function() {
        if (!this._parent) {
            return null;
        }
        var i = this._parent.indexOf(this) + 1;
        
        if (i > this._parent._children.length) {
            return null;
        }
        
        return this._parent.child(i);
    },
    prev: function() {
        if (!this._parent) {
            return null;
        }
        var i = this._parent.indexOf(this) - 1;
        
        if (i < 0) {
            return null;
        }
        
        return this._parent.child(i);
    },
    parent: function(p) {
        if (p) {
            this._parent = p;
            return this;
        }
        return this._parent;
    },
    append: function(c) {
        c.parent(this);
        this._children.push(c);
    },
    appendTo: function(parent) {
        this._parent.remove(this);
        parent.append(this);
    },
    remove: function(child) {
        if (this.indexOf(child) === -1) {
            return false;
        }
        this._children.splice(this.indexOf(child), 1);
        child.parent(null);
        return true;
    },
    first: function() {
        return this._children[0];
    },
    last: function() {
        return this._children[this._children.length - 1];
    },
    each: function(cb) {
        var i;
        for (i=0; i < this._children.length; i+=1) {
            if (cb(this._children[i], i, this._children) === false) {
                break;
            }
        }
    },
    attributeString: function() {
        var i, o = ["("];
        for (i in this._attributes) {
            if (this._attributes.hasOwnProperty(i)) {
                o.push(i + "=\"" + this._attributes[i] + "\"");
            }
        }
        o.push(")");
        return o.join(" ");
    },
    isText: function() {
        return this._isText;
    },
    matches: function(selector) {
        var tokens = this.parseSelector(selector),
            i, head = this;
        
        for(i=tokens.length - 1; i >= 0; i-=1) {
            //console.log("Reading", tokens[i].type, head.isText());
            switch(tokens[i].type) {
            case "Element":
                if (tokens[i].value !== head.tag()) return false;
                break;
            case "Wildcard":
                break;
            case "Child":
                // we are going backwards, so go up!
                head = head.parent();
                if (head === null) {
                    return false;
                }
                break;
            case "Sibling":
                // we are going backwards, so go to the previous
                head = head.prev();
                if (head === null) {
                    return false;
                }
                break;
            case "TextNode":
                if (head.isText() === false) return false;
                break;
            default:
                throw "Unknown selector: " + selector;
            }
        }
        
        return true;
    },
    select: function(selector) {
        var tokens = this.parseSelector(selector),
            result = null,
            queue = [this],
            current;
        
        // breadth first search
        while (queue.length > 0 && result === null) {
            current = queue.splice(0, 1)[0];
            
            // will match self
            if (current.matches(selector)) {
                result = current;
            }
            
            // add the children
            current.each(function(i) {
                queue.push(i);
            });
        }
        
        return result;
    },
    contains: function(selector) {
        return this.select(selector) !== null;
    },
    toTagLang: function(indent) {
        indent = indent || 0;
        var leading = "", s, i;
        for(i=0; i < indent; i+=1) {
            leading += "\t";
        }
        s = [leading + this._tag + this.attributeString()];

        for (i=0; i < this._children.length; i+=1) {
            s.push( this._children[i].toTagLang(indent + 1) );
        }
        return s.join("\n");
    },
    toString: function() {
        return "{" + this._name + this._attributes.toString()
            + "( .. " + this._children.length + " .. )}";
    },
    parseSelector: function(selector) {
        // split everything by spaces
        var tokens = selector.match(/[\w]+|<>|[\>\+\*]/g),
            i;
        
        tokens = tokens.map(function(i) {
            var t;
            if (i === "<>") {
                t = "TextNode";
            } else if (i === "*") {
                t = "Wildcard";
            } else if (i === "+") {
                t = "Sibling";
            } else if (i === ">") {
                t = "Child";
            } else {
                t = "Element";
            }
            return {value: i, type: t};
        });
        
        // validate to make sure things are in order
        // first and last nodes must be Wildcard, Element, or TextNode
        if(["Wildcard", "Element", "TextNode"].indexOf(tokens[0].type) === -1) {
            throw "Selector must begin with tag specifier";
        }

        for (i=1; i < tokens.length; i+=2) {
            if (tokens[i].type !== "Child" && tokens[i].type !== "Sibling") {
                throw "Selector must be composed of alternating specifiers";
            }
        }
        i = tokens.length - 1;
        // check the last token
        if(["Wildcard", "Element", "TextNode"].indexOf(tokens[i].type) === -1) {
            throw "Selector must end with tag specifier";
        }
        
        return tokens;
    }
}