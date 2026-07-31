// Pendant of shadcn packages/shadcn/src/styles/create-style-map.test.ts,
// plus a golden test against the vendored style-nova.css.
package inliner

import (
	"os"
	"strings"
	"testing"
)

func TestCreateStyleMap(t *testing.T) {
	css := `
/* a comment with .cn-commented { @apply hidden; } inside */
.style-test {
  .cn-a {
    @apply p-1;
    color: red; /* non-@apply declarations are ignored */
  }

  .cn-multi {
    @apply p-1;
    @apply m-1;
  }

  .cn-b, .cn-c {
    @apply px-2;
  }

  .cn-outer {
    @apply flex;

    .cn-nested {
      @apply gap-2;
    }

    &:hover .cn-hovered {
      @apply underline;
    }
  }

  .cn-no-apply {
    color: blue;
  }

  .cn-parent .cn-subject {
    @apply grid;
  }

  .cn-dup {
    @apply p-1;
  }
  .cn-dup {
    @apply p-2;
  }
}
`
	styleMap, err := CreateStyleMap(css)
	if err != nil {
		t.Fatalf("CreateStyleMap: %v", err)
	}

	want := map[string]string{
		"cn-a":       "p-1",
		"cn-multi":   "p-1 m-1", // multiple @apply directives joined in order
		"cn-b":       "px-2",    // multiple selectors per rule
		"cn-c":       "px-2",
		"cn-outer":   "flex",
		"cn-nested":  "gap-2",     // nested selectors are walked
		"cn-hovered": "underline", // & is normalized away
		"cn-subject": "grid",      // the subject is the LAST cn class
		"cn-dup":     "p-2 p-1",   // repeated matches PREPEND
	}
	for class, classes := range want {
		if got := styleMap[class]; got != classes {
			t.Errorf("styleMap[%q] = %q, want %q", class, got, classes)
		}
	}
	for _, absent := range []string{"cn-no-apply", "cn-parent", "cn-commented", "style-test"} {
		if _, ok := styleMap[absent]; ok {
			t.Errorf("styleMap unexpectedly contains %q", absent)
		}
	}
}

const novaButtonVariantDefault = "bg-primary text-primary-foreground hover:bg-primary/80"

func loadNovaStyleMap(t *testing.T) StyleMap {
	t.Helper()
	css, err := os.ReadFile("../../assets/css/styles/style-nova.css")
	if err != nil {
		t.Fatalf("read style-nova.css: %v", err)
	}
	styleMap, err := CreateStyleMap(string(css))
	if err != nil {
		t.Fatalf("CreateStyleMap(style-nova.css): %v", err)
	}
	return styleMap
}

func TestCreateStyleMapNova(t *testing.T) {
	styleMap := loadNovaStyleMap(t)

	if got := styleMap["cn-button-variant-default"]; got != novaButtonVariantDefault {
		t.Errorf("cn-button-variant-default = %q, want %q", got, novaButtonVariantDefault)
	}
	if got := styleMap["cn-button-size-icon"]; got != "size-8" {
		t.Errorf("cn-button-size-icon = %q, want %q", got, "size-8")
	}
	for class := range styleMap {
		if !strings.HasPrefix(class, "cn-") {
			t.Errorf("styleMap key %q does not start with cn-", class)
		}
	}
	if len(styleMap) < 100 {
		t.Errorf("suspiciously small style map: %d entries", len(styleMap))
	}
}
