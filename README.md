TagLang
=======

    taglang
        is(value="a language")
        with()
            <a handful of nifty features>
        and_some_more_text
            <[
                The truth:
                    IT'S AWESOME
                This block will be 4 lines when parsed (3 newlines)
                with only one indent on the line "IT'S AWESOME"
            >

Here are a parser and associated tooling I'm working on. Both are a work in progress.

Basically it's a (very) minimal form of XML or JSON to suit my needs.

It is an extensible language for specifying any kind of document in a hierarchal form that is primarily human readable. It differs from other languages by using minimal syntax (which is increasingly all the rage so I guess it's not different at all! ;D) along with indentation to signal parentage.

The big advantage of this language is that it is basically XML but super fast to type, easy to read, and has good support for reams and reams of multi-line formatted strings.

If you stumbled across here and are like "this is awesome!" but you want something tested and with good support, I believe YAML fits a similar bill. I wish you luck. ;)

Specification
-------------
(until I write a real spec, but this probably suffices for sane humans)
Here's what a document looks like:

    element(attribute="value" another-attribute="another value")
        empty()
            child-element
            sibling
        note-well
            here are(pos="verb") some more children(pos="noun")
                unexpected
            golly(note="we are still going!")

Every document must have a single root element. In this example that is <code>element</code>.

Every element can have a set of attributes. Attributes are an unordered, () delimited, space-separated list of key-value pairs. Every key must be a valid identifier. Each key may have an optional value, which is a string enclosed in single or double quotes following an equal sign. Attributes must be separated by at least one space. An element's attributes can appear anywhere on the line after the element name, allowing you to put spaces between element names and the following parentheses. Here are examples:

    inventory(apples="3" bananas="5")
    example ( spacing="I like a lot" )
    single_quotes( this='okay' )
    empty_attribs(meaning="the following attributes have no values" example flags)

Attributes can continue over several lines but attribute values cannot:

    this_is_valid (
        hello="interjection"
        world="noun"
    )
    this_is_not ( stupidity="I think I'm a multi-line attribute
       but really I'm just illegal syntax"
    )

Every element can have children. An element's children appear on the following lines but have increased indentation. Indentation just means an increase in leading whitespace. If the parent is indented 6 spaces, it's children must all be indented the same, but that indentation can be 7 spaces, 8, 9, 10, etc. A dedent/unindent signals the closing of the parent element, but the new indentation level must line up with the intended siblings. Example:

    family
        alpha
        beta
        delta
            gamma
        omega

Above, <code>family</code> has 4 children, and <code>delta</code> has one. Family is the parent of <code>alpha</code>, <code>beta</code>, <code>delta</code>, and <code>omega</code>. Note that things can get a little bit crazy:

    illuminati
        whose children are these
            what about this
        america

Take heed because "what about this" is actually three elements who all have the same parent: <code>these</code>. The above corresponds to the more explicit:

    illuminati
        whose
        children
        are
        these
            what
            about
            this
        america

There are also two types of text elements:

    text_example
        <the single line keep-all-the-spacing kind>(hello="they can have attributes too")
            and children
        <[
            and the really freaky do-some-weird-formatting mumbo-jumbo kind
                really, I'm not kidding.
        >
        
Text elements are  first-class elements like any other; they can have attributes, children, siblings, parents, etc. The first example above enclosed in < and > is parsed verbatim. Newlines, carriage returns (ew), spaces, and tabs are preserved. They are utf-8 strings. They can span multiple lines:

    <
        hello world
      >
      
This will become an element containing the string: <code>"\n    hello world\n  "</code>.

Multi-line elements are denoted by <[ and > (the closing ">" should not have a "]"). Leading and trailing whitespace are trimmed. Newlines within the block are preserved, however indentation is modified. All indentation will be preserved relative to the first line of text in the block.

In the example below, "and the really..." is indented 8 spaces, so the first 8 spaces of every line after that will be removed. Since the second lines is indented 12 spaces, it will be parsed as if it had 4 spaces. Negative indentation is bumped up to the first line.

    <[
        and the really freaky do-some-weird-formatting mumbo-jumbo kind
            really, I'm not kidding.
    >
    
becomes <code>"and the really freaky do-some-weird-formatting mumbo-jumbo kind\n    really, I'm not kidding."</code> Generally you will want to have a newline after the opening "<[". If you do not, the indentation will only be the number of spaces between "<[" and the first non whitespace character (I won't like it, either). *In the future it may change to absolute positioning of the first character, which would have a more intuitive effect, I think.*

Have fun.

Identifiers
-----------
I don't know what this means yet, but for now don't do anything crazy: don't start them with numbers, they CAN include dashes or underscores, and nonascii letters are okay. Stray away from other syntax symbols like =, "", '', <>, (), and []
