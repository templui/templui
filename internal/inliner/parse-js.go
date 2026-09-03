package inliner

import (
	"fmt"
	"io"

	parse "github.com/tdewolff/parse/v2"
	"github.com/tdewolff/parse/v2/js"
)

// TransformJavaScriptStyle expands cn-* classes in JavaScript string literals
// through the same transformer pipeline used for templ sources. JavaScript has
// its own lexer so regular expressions and template expressions stay code.
func TransformJavaScriptStyle(source string, styleMap StyleMap, opts Options) (string, error) {
	sourceFile, err := parseJavaScriptSourceFile(source)
	if err != nil {
		return "", err
	}

	for _, transformer := range transformers {
		transformer(sourceFile, styleMap, opts)
	}

	return sourceFile.getText(), nil
}

func parseJavaScriptSourceFile(source string) (*sourceFile, error) {
	lexer := js.NewLexer(parse.NewInputString(source))
	f := &sourceFile{}
	var previous js.TokenType
	previousSet := false

	appendCode := func(data []byte) {
		if len(data) == 0 {
			return
		}
		last := len(f.segments) - 1
		if last >= 0 && f.segments[last].kind == segmentCode {
			f.segments[last].text += string(data)
			return
		}
		f.segments = append(f.segments, segment{kind: segmentCode, text: string(data)})
	}

	for {
		tokenType, data := lexer.Next()
		if tokenType == js.ErrorToken {
			err := lexer.Err()
			if err == io.EOF {
				break
			}
			return nil, fmt.Errorf("inliner: parse JavaScript: %w", err)
		}

		if tokenType == js.DivToken || tokenType == js.DivEqToken {
			if regExpAllowed(previous, previousSet) {
				tokenType, data = lexer.RegExp()
				if tokenType == js.ErrorToken {
					return nil, fmt.Errorf("inliner: parse JavaScript regular expression: %w", lexer.Err())
				}
			}
		}

		switch tokenType {
		case js.StringToken:
			if len(data) < 2 {
				return nil, fmt.Errorf("inliner: malformed JavaScript string literal")
			}
			quote := data[0]
			text := string(data[1 : len(data)-1])
			if quote == '\'' && len(extractCnClasses(text)) > 0 {
				return nil, fmt.Errorf("inliner: cn-* markers require a double-quoted JavaScript string: %s", data)
			}
			f.segments = append(f.segments, segment{kind: segmentStringLiteral, quote: quote, text: text})
		case js.TemplateToken:
			if len(data) < 2 {
				return nil, fmt.Errorf("inliner: malformed JavaScript template literal")
			}
			f.segments = append(f.segments, segment{kind: segmentStringLiteral, quote: '`', text: string(data[1 : len(data)-1])})
		case js.CommentToken, js.CommentLineTerminatorToken:
			f.segments = append(f.segments, segment{kind: segmentComment, text: string(data)})
		default:
			appendCode(data)
		}

		if tokenType != js.WhitespaceToken && tokenType != js.LineTerminatorToken && tokenType != js.CommentToken && tokenType != js.CommentLineTerminatorToken {
			previous = tokenType
			previousSet = true
		}
	}

	return f, nil
}

func regExpAllowed(previous js.TokenType, previousSet bool) bool {
	if !previousSet {
		return true
	}
	if js.IsOperator(previous) {
		if previous == js.IncrToken || previous == js.DecrToken {
			return false
		}
		return true
	}
	if js.IsPunctuator(previous) {
		return previous != js.CloseParenToken && previous != js.CloseBracketToken
	}

	switch previous {
	case js.ReturnToken,
		js.TypeofToken,
		js.InstanceofToken,
		js.InToken,
		js.OfToken,
		js.NewToken,
		js.DeleteToken,
		js.VoidToken,
		js.ThrowToken,
		js.CaseToken,
		js.DoToken,
		js.ElseToken,
		js.YieldToken,
		js.AwaitToken:
		return true
	default:
		return false
	}
}
