; body:json  →  JSON
(body_json
  (text_block (text_content) @injection.content)
  (#set! injection.language "json"))

; body:graphql:vars  →  JSON
(body_graphql_vars
  (text_block (text_content) @injection.content)
  (#set! injection.language "json"))

; body:graphql  →  GraphQL
(body_graphql
  (text_block (text_content) @injection.content)
  (#set! injection.language "graphql"))

; body:xml  →  XML
(body_xml
  (text_block (text_content) @injection.content)
  (#set! injection.language "xml"))

; body:sparql  →  SPARQL (falls back gracefully if parser absent)
(body_sparql
  (text_block (text_content) @injection.content)
  (#set! injection.language "sparql"))

; script:pre-request / script:post-response / tests  →  JavaScript
(script_pre_request
  (text_block (text_content) @injection.content)
  (#set! injection.language "javascript"))

(script_post_response
  (text_block (text_content) @injection.content)
  (#set! injection.language "javascript"))

(tests
  (text_block (text_content) @injection.content)
  (#set! injection.language "javascript"))

; docs  →  Markdown
(docs
  (text_block (text_content) @injection.content)
  (#set! injection.language "markdown"))
