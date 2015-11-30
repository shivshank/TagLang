var taglang = {
    create: function(name, args) {
        var that = Object.create(this);
        that._name = name;
        that.attributes = args || {};
        that._children = [];
        that.parent = null;
        
        return that;
    },
    load: function(json) {
        var that = this.create(json.name, json.attributes),
            i, child;
            
        if (json.children === undefined) {
            return that;
        }
        
        for (i=0; i < json.children.length; i+=1) {
            child = this.load(json.children[i]);
            child.parent = that;
            that._children.push(child);
        }
        return that;
    },
    value: function(val) {
        if (val === undefined) {
            return this._name;
        }
        this._name = val;
        return this;
    },
    attrib: function(k, v) {
        if (v === undefined) {
            return this.attributes[k];
        }
        this.attributes[k] = v;
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
        if (!this.parent) {
            return null;
        }
        var i = this.parent.indexOf(this) + 1;
        
        if (i > this.parent.children().length) {
            return null;
        }
        
        return this.parent.child(i);
    },
    prev: function() {
        if (!this.parent) {
            return null;
        }
        var i = this.parent.indexOf(this) - 1;
        
        if (i < 0) {
            return null;
        }
        
        return this.parent.child(i);
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
        for (i in this.attributes) {
            if (this.attributes.hasOwnProperty(i)) {
                o.push(i + "=\"" + this.attributes[i] + "\"");
            }
        }
        o.push(")");
        return o.join(" ");
    },
    toTagLang: function(indent) {
        indent = indent || 0;
        var leading = "", s, i;
        for(i=0; i < indent; i+=1) {
            leading += "\t";
        }
        s = [leading + this._name + this.attributeString()];

        for (i=0; i < this._children.length; i+=1) {
            s.push( this._children[i].toTagLang(indent + 1) );
        }
        return s.join("\n");
    },
    toString: function() {
        return "{" + this._name + this.attributes.toString()
            + "( .. " + this._children.length + " .. )}";
    }
}