package registryapi

import (
	"bytes"
	"encoding/json"
	"fmt"
)

// Vars is an insertion-ordered string map, the pendant of a plain JS object
// holding CSS variables. JS object spreads keep the first-seen key position
// and update values in place; Set mirrors that so the merged theme JSON
// serializes in exactly the key order of shadcn's output.
type Vars struct {
	keys   []string
	values map[string]string
}

func NewVars() *Vars {
	return &Vars{values: map[string]string{}}
}

// Set inserts or updates a key. An existing key keeps its position (JS spread
// semantics); a new key is appended.
func (v *Vars) Set(key, value string) {
	if _, ok := v.values[key]; !ok {
		v.keys = append(v.keys, key)
	}
	v.values[key] = value
}

func (v *Vars) Get(key string) (string, bool) {
	val, ok := v.values[key]
	return val, ok
}

func (v *Vars) Len() int {
	if v == nil {
		return 0
	}
	return len(v.keys)
}

// Clone returns an independent copy, order included.
func (v *Vars) Clone() *Vars {
	c := NewVars()
	if v == nil {
		return c
	}
	for _, k := range v.keys {
		c.Set(k, v.values[k])
	}
	return c
}

// Merge overlays other onto a clone of v ({...v, ...other}).
func (v *Vars) Merge(other *Vars) *Vars {
	c := v.Clone()
	if other != nil {
		for _, k := range other.keys {
			c.Set(k, other.values[k])
		}
	}
	return c
}

func (v *Vars) MarshalJSON() ([]byte, error) {
	var buf bytes.Buffer
	buf.WriteByte('{')
	for i, k := range v.keys {
		if i > 0 {
			buf.WriteByte(',')
		}
		key, err := json.Marshal(k)
		if err != nil {
			return nil, err
		}
		val, err := json.Marshal(v.values[k])
		if err != nil {
			return nil, err
		}
		buf.Write(key)
		buf.WriteByte(':')
		buf.Write(val)
	}
	buf.WriteByte('}')
	return buf.Bytes(), nil
}

func (v *Vars) UnmarshalJSON(data []byte) error {
	v.keys = nil
	v.values = map[string]string{}

	dec := json.NewDecoder(bytes.NewReader(data))
	tok, err := dec.Token()
	if err != nil {
		return err
	}
	if d, ok := tok.(json.Delim); !ok || d != '{' {
		return fmt.Errorf("registryapi: Vars must be a JSON object, got %v", tok)
	}
	for dec.More() {
		keyTok, err := dec.Token()
		if err != nil {
			return err
		}
		key, ok := keyTok.(string)
		if !ok {
			return fmt.Errorf("registryapi: Vars key must be a string, got %v", keyTok)
		}
		valTok, err := dec.Token()
		if err != nil {
			return err
		}
		val, ok := valTok.(string)
		if !ok {
			return fmt.Errorf("registryapi: Vars value for %q must be a string, got %v", key, valTok)
		}
		v.Set(key, val)
	}
	return nil
}

// CSS is an insertion-ordered map with arbitrary JSON values, the pendant of
// the nested css object of a registry item ({"@import ...": {}, "@layer
// base": {...}}). Values may be nested *CSS, *Vars, or any marshalable value.
type CSS struct {
	keys   []string
	values map[string]any
}

func NewCSS() *CSS {
	return &CSS{values: map[string]any{}}
}

func (c *CSS) Set(key string, value any) *CSS {
	if _, ok := c.values[key]; !ok {
		c.keys = append(c.keys, key)
	}
	c.values[key] = value
	return c
}

func (c *CSS) MarshalJSON() ([]byte, error) {
	var buf bytes.Buffer
	buf.WriteByte('{')
	for i, k := range c.keys {
		if i > 0 {
			buf.WriteByte(',')
		}
		key, err := json.Marshal(k)
		if err != nil {
			return nil, err
		}
		val, err := json.Marshal(c.values[k])
		if err != nil {
			return nil, err
		}
		buf.Write(key)
		buf.WriteByte(':')
		buf.Write(val)
	}
	buf.WriteByte('}')
	return buf.Bytes(), nil
}
