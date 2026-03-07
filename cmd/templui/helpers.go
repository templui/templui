package main

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strings"
)

// versionRegex extracts the version ref from the component/util file comment.
var versionRegex = regexp.MustCompile(`(?m)^\s*//\s*templui\s+(?:component|util)\s+.*\s+-\s+version:\s+(\S+)`)

// readFileVersion reads the version ref from the comment in the first line of a file.
func readFileVersion(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil // File not existing is not an error here.
		}
		return "", fmt.Errorf("failed to open file %s: %w", filePath, err)
	}
	defer file.Close()

	// Read only the first line.
	scanner := bufio.NewScanner(file)
	if scanner.Scan() {
		line := scanner.Text()
		matches := versionRegex.FindStringSubmatch(line)
		if len(matches) > 1 {
			return matches[1], nil // Return the captured ref.
		}
	}

	if err := scanner.Err(); err != nil {
		return "", fmt.Errorf("error scanning file %s: %w", filePath, err)
	}

	return "", nil // No version comment found.
}

// askForOverwrite prompts the user to confirm overwriting an existing file.
func askForOverwrite(filePath, oldRef, newRef string) bool {
	reader := bufio.NewReader(os.Stdin)

	oldVersionStr := oldRef
	if oldVersionStr == "" {
		oldVersionStr = "<unknown or no comment>"
	}

	fmt.Printf("  Confirm: File '%s' (Existing Version: %s) differs from requested ref '%s'. Overwrite? [y/N]: ",
		filePath, oldVersionStr, newRef)

	input, err := reader.ReadString('\n')
	if err != nil {
		fmt.Printf("\nError reading input: %v. Assuming No.\n", err)
		return false
	}

	input = strings.ToLower(strings.TrimSpace(input))
	return input == "y"
}

// replaceImports rewrites templui component/util imports to the user's configured module paths.
// Expected repository paths are under "github.com/templui/templui/components/..." and
// "github.com/templui/templui/utils...".
func replaceImports(data []byte, config Config, context string) []byte {
	content := string(data)
	// Pattern to find "github.com/templui/templui/..." imports and capture the
	// path part so we can map components/utils imports to user-defined folders.
	internalImportPattern := `"github.com/templui/templui/([^"]+)"`
	re := regexp.MustCompile(internalImportPattern)

	modified := false // Flag to track if any replacement occurred

	newContent := re.ReplaceAllStringFunc(content, func(originalFullImport string) string {
		// originalFullImport is like: "github.com/templui/templui/components/icon" (with quotes)
		// submatches[0] is originalFullImport
		// submatches[1] is the captured group, e.g., "components/icon" or "utils"
		submatches := re.FindStringSubmatch(originalFullImport)
		if len(submatches) < 2 {
			return originalFullImport // Should not happen if regex matches
		}
		repoRelativePath := submatches[1]

		var newImportPath string
		if strings.HasPrefix(repoRelativePath, "components/") {
			// For "components/icon", new path is "config.ModuleName/config.ComponentsDir/icon"
			componentName := strings.TrimPrefix(repoRelativePath, "components/")
			newImportPath = fmt.Sprintf("%s/%s/%s", config.ModuleName, config.ComponentsDir, componentName)
			modified = true
		} else if repoRelativePath == "utils" || strings.HasPrefix(repoRelativePath, "utils/") {
			// For "utils", new path is "config.ModuleName/config.UtilsDir"
			// For "utils/sub", new path is "config.ModuleName/config.UtilsDir/sub"
			utilSubPath := strings.TrimPrefix(repoRelativePath, "utils") // "" or "/sub"
			utilSubPath = strings.TrimPrefix(utilSubPath, "/")           // "sub" or ""

			if utilSubPath == "" {
				newImportPath = fmt.Sprintf("%s/%s", config.ModuleName, config.UtilsDir)
			} else {
				newImportPath = fmt.Sprintf("%s/%s/%s", config.ModuleName, config.UtilsDir, utilSubPath)
			}
			modified = true
		} else {
			// Path doesn't match known structures, return original.
			return originalFullImport
		}
		return fmt.Sprintf(`"%s"`, newImportPath)
	})

	if modified { // Use the flag to log
		logPrefix := "    ->"
		if context != "" {
			logPrefix = fmt.Sprintf("    -> [%s]", context)
		}
		fmt.Printf("%s Adjusted import paths according to .templui.json config.\n", logPrefix)
	}

	return []byte(newContent)
}
