(function(tester, tl, undefined) {
    // tl should be a taglang implementation
    
    tester.interface = {
            /*
                Create an interface object that can be used to test objects for
                    conformity.
            */
        create: function(name, fields, methods) {
            var that = Object.create(this);
            that.name = name;
            that.fields = fields || [];
            that.methods = methods || [];

            return that;
        },
            /*
                Test to see if an object implements all of the methods
                    and properties specified by the interface.
            */
        test: function(obj, log) {
            var i, messages = [],
                field, method;
            
            for (i=0; i < this.fields.length; i+=1) {
                field = this.fields[i];
                if (obj[field] === undefined) {
                    messages.push("Field " + field + " is not defined");
                    if (log) {
                        console.log("Field", field, "is not defined", obj);
                    }
                }
            }
            
            for (i=0; i < this.methods.length; i+=1) {
                method = this.methods[i];
                if (obj[method] === undefined
                    || typeof obj[method] !== "function") {
                    messages.push("Method " + method + " is not defined");
                    if (log) {
                        console.log("Method", method, "is not defined in", obj);
                    }
                }
            }
            
            return messages;
        },
            /*
                Get methods and properties of obj that are not defined in this
                    interface.
            */
        getExtra: function(obj) {
            var f = [], m = [], i;
            
            // a user may implement an interface via prototypes
            //  so we cannot use hasOwnProperty here
            for (i in obj) {
                if (this.fields.indexOf(i) === -1 && typeof obj[i] !== "function") {
                    f.push(i);
                } else 
                if (this.methods.indexOf(i) === -1
                    && typeof obj[i] === "function") {
                    m.push(i);
                }
            }
            
            return {
                fields: f,
                methods: m
            };
        },
        method: function(name) {
            this.methods.push(name);
            return this;
        },
        field: function(name) {
            this.fields.push(name);
            return this;
        }
    };
    
    tester.test = function(log) {
        return api.test(tl, log);
    };
    
    var api = tester.api = tester.interface.create("Taglang API")
        .method( "isText" )     // true if tag is a TextNode
        .method( "tag" )        // get the tag name/value
        .method( "attr" )       // attr() -> {attributes}
                                // attr(key) -> value
                                // attr(key, value) sets key to value
        .method( "children" )   // get an array of children
        .method( "child" )      // get the nth child; null if none
        .method( "next" )       // get the next child; null if none
        .method( "prev" )       // get the previous child; null if none
        .method( "parent" )     // get the parent of this tag
        .method( "each" )       // shorthand for iterating over this.children
        .method( "matches" )    // matches( selector )
                                //   -> true if this is matched by selector
        .method( "contains" )   // contains( selector )
                                //   -> true if contains a child that is matched
                                //      by selector
        .method( "append" )     // append a child to this
        .method( "appendTo" )   // append this to the argument
        .method( "remove" )     // remove a child
        .method( "first" )      // get the first child
        .method( "last" )       // get the last child
        .method( "select" )     // get the element that matches selector
    ;
    
}(window.taglangAPI = window.taglangAPI || {}, window.taglang));
// write "taglangAPI.test()" to test the taglang object for compliance