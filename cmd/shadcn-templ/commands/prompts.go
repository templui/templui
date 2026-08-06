// Small shared prompt/log helpers, the pendant of the prompts and logger
// libraries the reference commands use.
package commands

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// confirm asks a y/N question on stdin, defaulting to no.
func confirm(message string) bool {
	fmt.Printf("%s [y/N]: ", message)
	reader := bufio.NewReader(os.Stdin)
	input, err := reader.ReadString('\n')
	if err != nil {
		return false
	}
	return strings.EqualFold(strings.TrimSpace(input), "y")
}

// logf prints unless silent.
func logf(silent bool, format string, args ...any) {
	if silent {
		return
	}
	fmt.Printf(format, args...)
}

// writeFile writes a file, creating parent directories.
func writeFile(path, content string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	return os.WriteFile(path, []byte(content), 0o644)
}
