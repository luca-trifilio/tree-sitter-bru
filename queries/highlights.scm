; Block headers
(block_name) @keyword

; Punctuation
"{" @punctuation.bracket
"}" @punctuation.bracket
":" @punctuation.delimiter

; Dictionary entries
(entry
  key: (key) @property)

(entry
  value: (value) @string)

; Disabled marker (~ prefix on dictionary keys)
(disabled_marker) @comment.warning

; Comments
(comment) @comment

; URL-ish values get an extra hint where possible (best-effort: matched
; downstream by the editor's @string.special.url, falls back to @string).
((entry
   key: (key) @_k
   value: (value) @string.special.url)
 (#match? @_k "^url$"))
