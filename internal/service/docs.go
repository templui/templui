package service

import (
	"embed"
	"fmt"
	"os"
	"path/filepath"

	"github.com/templui/templui/internal/markdown"
	"github.com/templui/templui/internal/ui/modules"
	"github.com/templui/templui/internal/ui/examples"
)

//go:embed all:content/docs
var contentFS embed.FS

// readContent prefers the on-disk source in development, so markdown edits
// show up on reload without recompiling the embedded copy. Falls back to
// the embed for built binaries.
func readContent(path string) ([]byte, error) {
	if b, err := os.ReadFile(filepath.Join("internal/service", path)); err == nil {
		return b, nil
	}
	return contentFS.ReadFile(path)
}

type DocsService struct {
	parser *markdown.Parser
}

type DocPage struct {
	Slug        string
	Title       string
	Description string
	Order       int
	Content     string
	TOC         []modules.TableOfContentsItem
}

func NewDocsService() *DocsService {
	return &DocsService{
		parser: markdown.NewParser(),
	}
}

// ComponentDocPage is a component doc authored as markdown with shortcodes
// (the shadcn mdx pendant).
type ComponentDocPage struct {
	Slug        string
	Title       string
	Description string
	Segments    []markdown.Segment
	TOC         []modules.TableOfContentsItem
}

// HasComponentPage reports whether a markdown source exists for the slug.
func (s *DocsService) HasComponentPage(slug string) bool {
	_, err := readContent(filepath.Join("content/docs/components", slug+".md"))
	return err == nil
}

// GetComponentPage loads a component doc (markdown + shortcodes) by slug.
func (s *DocsService) GetComponentPage(slug string) (*ComponentDocPage, error) {
	source, err := readContent(filepath.Join("content/docs/components", slug+".md"))
	if err != nil {
		return nil, fmt.Errorf("failed to read component doc: %w", err)
	}
	segments, meta, toc, err := s.parser.ParseSegments(source)
	if err != nil {
		return nil, fmt.Errorf("failed to parse component doc: %w", err)
	}
	page := &ComponentDocPage{Slug: slug, Segments: segments, TOC: toc}
	if title, ok := meta["title"].(string); ok {
		page.Title = title
	}
	if desc, ok := meta["description"].(string); ok {
		page.Description = desc
	}
	return page, nil
}

// GetPage loads and parses a markdown document by slug
func (s *DocsService) GetPage(slug string) (*DocPage, error) {
	// Construct file path
	mdPath := filepath.Join("content/docs", slug+".md")

	// Read markdown file (disk in dev, embed in builds)
	content, err := readContent(mdPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read markdown file: %w", err)
	}

	// Parse with frontmatter
	html, meta, err := s.parser.ParseWithFrontmatter(content)
	if err != nil {
		return nil, fmt.Errorf("failed to parse markdown: %w", err)
	}

	// Extract table of contents
	toc := s.parser.ExtractTableOfContents(content)

	// Extract metadata
	page := &DocPage{
		Slug:    slug,
		Content: string(html),
		TOC:     toc,
	}

	if title, ok := meta["title"].(string); ok {
		page.Title = title
	}
	if desc, ok := meta["description"].(string); ok {
		page.Description = desc
	}
	if order, ok := meta["order"].(int); ok {
		page.Order = order
	}

	return page, nil
}

// GetComponentPageSource returns the markdown of a component doc for the
// exported <slug>.md view: like shadcn, ComponentPreview shortcodes are
// expanded to the demo source as fenced code blocks.
func (s *DocsService) GetComponentPageSource(slug string) ([]byte, error) {
	source, err := readContent(filepath.Join("content/docs/components", slug+".md"))
	if err != nil {
		return nil, err
	}
	return markdown.ExpandPreviewShortcodes(source, func(name string) ([]byte, bool) {
		entry, ok := examples.Registry[name]
		if !ok {
			return nil, false
		}
		code, err := examples.TemplFiles.ReadFile(entry.File)
		if err != nil {
			return nil, false
		}
		return code, true
	}), nil
}
