// Package registry is the pendant of shadcn/src/registry: the registry-item
// schema (schema.ts), the HTTP fetchers (api.ts) and the dependency tree
// resolver (resolver.ts), reduced to what the templUI registry serves.
package registry

import (
	"bytes"
	"encoding/json"
	"fmt"
)

// OrderedMap is a JSON object that preserves key order, the pendant of a
// plain JS object. Values are strings or nested *OrderedMap (the css block
// nests, cssVars maps are flat).
type OrderedMap struct {
	Keys   []string
	Values map[string]any
}

func NewOrderedMap() *OrderedMap {
	return &OrderedMap{Values: map[string]any{}}
}

func (m *OrderedMap) Len() int {
	if m == nil {
		return 0
	}
	return len(m.Keys)
}

func (m *OrderedMap) Get(key string) (any, bool) {
	if m == nil {
		return nil, false
	}
	v, ok := m.Values[key]
	return v, ok
}

func (m *OrderedMap) GetString(key string) string {
	v, _ := m.Get(key)
	s, _ := v.(string)
	return s
}

// Set inserts or updates a key. Existing keys keep their position, new keys
// append (JS object semantics).
func (m *OrderedMap) Set(key string, value any) {
	if _, ok := m.Values[key]; !ok {
		m.Keys = append(m.Keys, key)
	}
	m.Values[key] = value
}

// Merge overlays other onto m like deepmerge: nested maps merge recursively,
// strings overwrite.
func (m *OrderedMap) Merge(other *OrderedMap) {
	if other == nil {
		return
	}
	for _, key := range other.Keys {
		theirs := other.Values[key]
		if theirMap, ok := theirs.(*OrderedMap); ok {
			if mineMap, ok := m.Values[key].(*OrderedMap); ok {
				mineMap.Merge(theirMap)
				continue
			}
		}
		m.Set(key, theirs)
	}
}

func (m *OrderedMap) UnmarshalJSON(data []byte) error {
	dec := json.NewDecoder(bytes.NewReader(data))
	dec.UseNumber()
	tok, err := dec.Token()
	if err != nil {
		return err
	}
	if tok != json.Delim('{') {
		return fmt.Errorf("expected object, got %v", tok)
	}
	m.Values = map[string]any{}
	return m.decodeObject(dec)
}

func (m *OrderedMap) decodeObject(dec *json.Decoder) error {
	for dec.More() {
		keyTok, err := dec.Token()
		if err != nil {
			return err
		}
		key, ok := keyTok.(string)
		if !ok {
			return fmt.Errorf("expected object key, got %v", keyTok)
		}
		value, err := decodeValue(dec)
		if err != nil {
			return err
		}
		m.Set(key, value)
	}
	// Consume the closing brace.
	_, err := dec.Token()
	return err
}

func decodeValue(dec *json.Decoder) (any, error) {
	tok, err := dec.Token()
	if err != nil {
		return nil, err
	}
	switch t := tok.(type) {
	case json.Delim:
		if t == '{' {
			nested := NewOrderedMap()
			if err := nested.decodeObject(dec); err != nil {
				return nil, err
			}
			return nested, nil
		}
		return nil, fmt.Errorf("unexpected array in css/cssVars value")
	case string:
		return t, nil
	case json.Number:
		return t.String(), nil
	case bool:
		return fmt.Sprintf("%v", t), nil
	case nil:
		return "", nil
	}
	return nil, fmt.Errorf("unexpected token %v", tok)
}

// ItemVars is the registryItemCssVarsSchema pendant.
type ItemVars struct {
	Theme *OrderedMap `json:"theme"`
	Light *OrderedMap `json:"light"`
	Dark  *OrderedMap `json:"dark"`
}

func (v *ItemVars) Empty() bool {
	return v == nil || (v.Theme.Len() == 0 && v.Light.Len() == 0 && v.Dark.Len() == 0)
}

// ItemFile is a files[] entry.
type ItemFile struct {
	Path    string `json:"path"`
	Content string `json:"content"`
	Type    string `json:"type"`
	Target  string `json:"target"`
}

// ItemConfig is the config block of a registry:base item, the source of the
// components.json fields written on init/apply.
type ItemConfig struct {
	Style       string `json:"style"`
	IconLibrary string `json:"iconLibrary"`
	RTL         *bool  `json:"rtl"`
	MenuColor   string `json:"menuColor"`
	MenuAccent  string `json:"menuAccent"`
	Tailwind    *struct {
		BaseColor string `json:"baseColor"`
	} `json:"tailwind"`
}

// Item is the registryItemSchema pendant, reduced to the fields the templUI
// registry serves.
type Item struct {
	Schema               string      `json:"$schema"`
	Extends              string      `json:"extends"`
	Name                 string      `json:"name"`
	Type                 string      `json:"type"`
	Title                string      `json:"title"`
	Description          string      `json:"description"`
	Dependencies         []string    `json:"dependencies"`
	RegistryDependencies []string    `json:"registryDependencies"`
	Files                []ItemFile  `json:"files"`
	CSSVars              *ItemVars   `json:"cssVars"`
	CSS                  *OrderedMap `json:"css"`
	Config               *ItemConfig `json:"config"`
	Docs                 string      `json:"docs"`
}

// Tree is the registryResolvedItemsTreeSchema pendant: every resolved item
// merged into one install plan.
type Tree struct {
	Dependencies []string
	Files        []ItemFile
	CSSVars      *ItemVars
	CSS          *OrderedMap
	Docs         string
	// HasThemeItem reports a registry:theme/style/base item in the payload,
	// the shouldOverwriteCssVars trigger.
	HasThemeItem bool
	// FontDependencies are font-* registryDependencies. The templUI registry
	// has no font items (shadcn installs fontsource npm packages, which have
	// no Go pendant), so the CLI collects them and prints instructions.
	FontDependencies []string
}

// Index is the registry.json root (the fields the CLI uses).
type Index struct {
	Name  string `json:"name"`
	Items []struct {
		Name  string `json:"name"`
		Type  string `json:"type"`
		Files []struct {
			Path string `json:"path"`
			Type string `json:"type"`
		} `json:"files"`
	} `json:"items"`
}
