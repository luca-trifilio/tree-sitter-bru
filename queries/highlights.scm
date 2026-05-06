; Block keywords (meta, get, post, body:json, script:pre-request, …)
(keyword) @keyword

; Dictionary entries
(pair key: (key) @property)
(pair value: (value) @string)

; Disabled marker (~)
(disabled_marker) @comment

; URL-ish values  (best-effort: falls back to @string if unsupported)
((pair
   key: (key) @_k
   value: (value) @string.special.url)
 (#eq? @_k "url"))

; Comments
(comment) @comment

; Punctuation
"{" @punctuation.bracket
"}" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket
":" @punctuation.delimiter
"," @punctuation.delimiter
