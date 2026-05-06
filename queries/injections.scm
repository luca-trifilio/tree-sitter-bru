; Embed JSON inside body:json { ... } and body:graphql:vars { ... }
((text_block
   name: (block_name) @_n
   content: (text_content) @injection.content)
 (#match? @_n "^body:json$|^body:graphql:vars$")
 (#set! injection.language "json"))

; Embed GraphQL inside body:graphql { ... }
((text_block
   name: (block_name) @_n
   content: (text_content) @injection.content)
 (#eq? @_n "body:graphql")
 (#set! injection.language "graphql"))

; Embed XML inside body:xml { ... }
((text_block
   name: (block_name) @_n
   content: (text_content) @injection.content)
 (#eq? @_n "body:xml")
 (#set! injection.language "xml"))

; Embed JS inside script:* and tests { ... }
((text_block
   name: (block_name) @_n
   content: (text_content) @injection.content)
 (#match? @_n "^script(:.*)?$|^tests$")
 (#set! injection.language "javascript"))

; Embed Markdown inside docs { ... }
((text_block
   name: (block_name) @_n
   content: (text_content) @injection.content)
 (#eq? @_n "docs")
 (#set! injection.language "markdown"))
