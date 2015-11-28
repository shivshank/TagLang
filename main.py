class Element:
    def __init__(self, parent, name, **kwargs):
        self.name = name
        self.attributes = {}
        for k, v in kwargs.items():
            self.attributes[k] = v
        self.children = []
        self.parent = parent
        if parent is not None:
            parent.children.append(self)
    def __str__(self):
        return self.toString(0)
    def __repr__(self):
        if len(self.children) > 0:
            return "{" + self.name + str(self.attributes) + " [...] }"
        else:
            return "{" + self.name + str(self.attributes) + " }"
    def attributeString(self):
        if len(self.attributes.keys()) == 0:
            return ""

        o = []
        
        for k, v in self.attributes.items():
            if v is None:
                o.append(k)
            else:
                o.append(k + '="' + v + '"')

        return '(' + ' '.join(o) + ')'
    def toString(self, indent):
        o = [indent * '\t' + self.name + self.attributeString()]
        for child in self.children:
            o.append(child.toString(indent+1))
        
        return '\n'.join(o)

class TextNode(Element):
    def __init__(self, parent, text, **kwargs):
        super().__init__(parent, text, **kwargs)
    def __str__(self):
        return self.toString(0)
    def toString(self, indent):
        name = repr(self.name)[1:-1]
        o = [indent * '\t' + '<' + name + '>' + self.attributeString()]
        for child in self.children:
            o.append(child.toString(indent+1))
        
        return '\n'.join(o)

class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        # eof will be true when next() pops the last token
        self.eof = False if len(tokens) > 0 else True
        self.next()
        # self.head is the element under construction
        self.head = None
        # self.parent is the current head's parent
        self.parent = None
        self.errors = []
        self.indents = [0]
    def identifier(self):
        if " " in self.current: return False
        if self.current[0].isdigit(): return False
        if "<" in self.current: return False
        if ">" in self.current: return False
        r = self.current
        self.next()
        return r
    def attributeValue(self):
        if self.current != "\"" and self.current != "'":
            self.error("Syntax: attribute values must be enclosed in quotes");
            return None
        starter = self.current
        self.next()
        
        value = ""
        while self.current != starter:
            if self.current.find("\n") != -1:
                self.error("Syntax: attribute values cannot contain newlines")
                return None
            value += self.current
            self.next()
        self.next()
        
        return value
    def attribute(self):
        # whitespace inside attributes is ignored
        key = self.identifier()
        if not key:
            self.error("Syntax: expected attribute identifier")
            return None, None
        
        # consume any whitespace
        self.whitespace()
        
        # if we don't have an equals sign, attribute exists but has no value
        if self.current != "=":
            return key, None
        self.next()
        
        # consume any whitespace
        self.whitespace()

        value = self.attributeValue()
        if not value:
            return None, None
            
        return key, value
    def attributes(self):
        # if there are attributes here, then current == "("
        if self.current != "(": return False
        self.next()
        attribs = {}
        
        # consume any whitespace that may be here
        ws = self.whitespace()
        
        # appears we had empty parentheses
        if self.current == ")":
            self.next()
            return attribs

        while True: 
            key, value = self.attribute()
            if key is not None:
                # value can be anything returned, including None
                attribs[key] = value
            else:
                # break if there was an error
                break
            # consume whitespace
            # (this may be leading up to parenthesis or next attribute)
            ws = self.whitespace()
            if self.current == ")":
                break

        # next token MUST be right parenthesis to complete attribute list
        if self.current != ")":
            self.error("Syntax: Expected ) after attributes list")
            return False
        self.next()
        
        return attribs
    def whitespace(self):
        if self.eof: return False
        if self.current[0] not in ("\n", " "): return False
        r = self.current
        self.next()
        return r
    def _getIndent(self, t):
        return t.split("\n")[-1].count(" ")
    def textNode(self):
        if self.current != "<": return False
        self.next()
        
        multiline = False
        if self.current == "[":
            # then we have a multi-line text node
            self.next()
            multiline = True

        escaped = False
        text = ""
        while self.current != ">" or escaped:
            escaped = False
            if self.current == "\\":
                escaped = True
            else:
                text += self.current
            self.next()
        self.next()
        
        if multiline:
            # take off the spaces between <[ and \n, remove \n, and trim the end
            text = text.lstrip(" \t").lstrip("\n").rstrip()
            length = len(text)
            text = text.lstrip()
            # how many spaces did we remove?
            indent = length - len(text)
            lines = text.split("\n")
            out = []
            for i in lines:
                if len(i) - len(i.lstrip()) > indent:
                    out.append(i[indent:])
                else:
                    out.append(i.lstrip())
            text = "\n".join(out)

        return text
    def element(self):
        if self.indents[-1] == 0 and self.head is not None:
            self.error("Syntax: document has multiple roots")
            return False
            
        # if we did not find an element, assume it's a text node
        elementName = self.identifier()
        if not elementName:
            elementName = self.textNode()
            if not elementName:
                self.error("Syntax: expected element or text node")
                return False
            self.head = TextNode(self.parent, elementName)
        else:
            self.head = Element(self.parent, elementName)

        # element identifier can be followed by attributes, elements, or indent
        
        ws = self.whitespace()
        # if there is no whitespace or there is but it does not contain newline
        if not ws or (ws and "\n" not in ws):
            # then the next token COULD be attributes
            attribs = self.attributes()
            # (n.b {} == False, hence "is not False")
            if attribs is not False:
                self.head.attributes = attribs
                # if there are attributes, check for whitespace after them
                ws = self.whitespace()
        
        if self.eof:
            return True
            
        # ws represents the whitespace after the self.head element
        # there must be whitespace between two elements
        if not ws:
            self.error("Syntax: whitespace required between elements")
            return False
        
        # if there is no newline, then next element is a sibling
        if '\n' not in ws:
            self.element()
            return True
            
        # otherwise there was a newline; check for indentation
        # (if there is different indentation, next element cannot be a sibling)
        i = self._getIndent(ws)
        if i > self.indents[-1]:
            self.indents.append(i)
            self.parent = self.head
        elif i < self.indents[-1]:
            if i not in self.indents:
                self.error("Syntax: indent does not match any indent level")
                return False
            while self.indents[-1] != i:
                self.indents.pop()
                self.parent = self.parent.parent

        self.element()
        return True
    def next(self):
        if len(self.tokens) == 0:
            self.current = None
            self.eof = True
            return False
        self.current = self.tokens.pop()
        return True
    def error(self, message):
        self.errors.append(message)
    def parse(self):
        result = self.element()
        
        if result:
            # find the root element
            while self.head.parent is not None:
                self.head = self.head.parent

        return self.head, self.errors

def consume(source, pos, whileTrue):
    start = pos
    length = len(source)
    while pos < length and whileTrue(source[pos]):
        pos += 1
    
    return source[start:pos]
    
def tokenize(source, **kwargs):
    source = source.replace('\t', kwargs.get("tabSize", 4) * " ")
    
    tokens = []
    positions = [] # TODO
    length = len(source)
    pos = 0

    spaces = " \n"
    symbols = "?<>=\\()\"'"
    while pos < length:
        r = consume(source, pos, lambda t: t in (" ", "\n"))
        pos += len(r)
        if (r != ""):
            tokens.append(r)
            
        while pos < length and source[pos] in symbols:
            tokens.append(source[pos])
            pos += 1
    
        r = consume(source, pos, lambda t: t not in spaces and t not in symbols)
        pos += len(r)
        if (r != ""):
            tokens.append(r)

    return tokens, positions

def parse(source, **kwargs):
    tokens, positions = tokenize(source, **kwargs)
    tokens.reverse()
    
    p = Parser(tokens)
    result, errors = p.parse()
    if len(errors) > 0:
        print('Errors:')
        for i in errors:
            print('\t' + i)
    return result
    
if __name__ == "__main__":
    import glob
    import os.path
    
    while True:
        print("Enter a file path (glob):")
        path = input("> ")
        print("Are you sure you want to use (y/n):", path)
        if input("> ").startswith("y"):
            break

    files = glob.glob(path)

    if len(files) == 0:
        print("No files found.")

    for f in files:
        print("FILE:", f)
        with open(f, mode="rt", encoding="utf-8") as file:
            text = file.read()
            print(text)
            print()