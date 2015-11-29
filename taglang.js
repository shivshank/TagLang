var taglang = {
    create: function(name, args) {
        var that = Object.create(this);
        that.name = name;
        that.attributes = args || {};
        that.children = [];
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
            that.children.push(child);
        }
        return that;
    },
    value: function(val) {
        if (val === undefined) {
            return this.name;
        }
        this.name = val;
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
        return this.children;
    },
    child: function(i) {
        return this.children[i];
    },
    each: function(cb) {
        var i;
        for (i=0; i < this.children; i+=1) {
            if (cb(this.children[i], i, this.children) === false) {
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
        s = [leading + this.name + this.attributeString()];

        for (i=0; i < this.children.length; i+=1) {
            s.push( this.children[i].toTagLang(indent + 1) );
        }
        return s.join("\n");
    },
    toString: function() {
        return "{" + this.name + this.attributes.toString()
            + "( .. " + this.children.length + " .. )}";
    }
}