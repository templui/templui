// Package icons provides a set of Lucide icons for use with the templ library.
package icons

import (
	"context"
	"embed"
	"fmt"
	"io"
	"strings"
	"sync"

	"github.com/a-h/templ"
)

// LucideVersion represents the version of Lucide icons used in this package.
const LucideVersion = "0.451.0"

var (
	iconContents = make(map[string]string)
	iconMutex    sync.RWMutex
)

//go:embed content/*.svg
var iconFS embed.FS

// IconProps defines the properties that can be set for an icon.
type IconProps struct {
	Name        string
	Size        string
	Color       string
	Fill        string
	Stroke      string
	StrokeWidth string // Stroke Width of Icon, Usage: "2.5"
	Class       string
}

// Icon returns a function that generates a templ.Component for the specified icon.
func Icon(name string) func(IconProps) templ.Component {
	return func(props IconProps) templ.Component {
		return templ.ComponentFunc(func(ctx context.Context, w io.Writer) (err error) {
			svg, err := generateSVG(name, props)
			if err != nil {
				return err
			}
			_, err = w.Write([]byte(svg))
			return
		})
	}
}

// UseNameProp generates a templ.Component using IconProps.Name, with fallback to "file-question" icon.
func UseNameProp(props IconProps) templ.Component {
	return templ.ComponentFunc(func(ctx context.Context, w io.Writer) (err error) {
		var svg string

		svg, err = generateSVG(props.Name, props)
		if err != nil {
			svg, err = generateSVG("file-question", props)
			if err != nil {
				return err
			}
		}
		_, err = w.Write([]byte(svg))
		return
	})

}

// generateSVG creates an SVG string for the specified icon with the given properties.
func generateSVG(name string, props IconProps) (string, error) {
	content, err := getIconContent(name)
	if err != nil {
		return "", err
	}

	size := props.Size
	if size == "" {
		size = "24"
	}

	fill := props.Fill
	if fill == "" {
		fill = "none"
	}

	stroke := props.Stroke
	if stroke == "" {
		stroke = props.Color
	}
	if stroke == "" {
		stroke = "currentColor"
	}

	strokeWidth := props.StrokeWidth
	if strokeWidth == "" {
		strokeWidth = "2"
	}

	return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="%s" viewBox="0 0 24 24" fill="%s" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round" class="%s" data-lucide="icon">%s</svg>`,
		size, size, fill, stroke, strokeWidth, props.Class, content), nil
}

// getIconContent retrieves the content of an icon, loading it if necessary.
func getIconContent(name string) (string, error) {
	iconMutex.RLock()
	content, exists := iconContents[name]
	iconMutex.RUnlock()

	if exists {
		return content, nil
	}

	iconMutex.Lock()
	defer iconMutex.Unlock()

	// Check again in case another goroutine has loaded the icon
	content, exists = iconContents[name]
	if exists {
		return content, nil
	}

	// Load the icon content
	content, err := loadIconContent(name)
	if err != nil {
		return "", err
	}

	iconContents[name] = content
	return content, nil
}

// loadIconContent reads the content of an icon from the embedded filesystem.
func loadIconContent(name string) (string, error) {
	content, err := iconFS.ReadFile(fmt.Sprintf("content/%s.svg", name))
	if err != nil {
		return "", fmt.Errorf("icon %s not found: %w", name, err)
	}
	return extractSVGContent(string(content)), nil
}

// extractSVGContent removes the outer SVG tags from the icon content.
func extractSVGContent(svgContent string) string {
	start := strings.Index(svgContent, ">") + 1
	end := strings.LastIndex(svgContent, "</svg>")
	if start == -1 || end == -1 {
		return ""
	}
	return strings.TrimSpace(svgContent[start:end])
}
