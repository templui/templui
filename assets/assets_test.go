package assets

import "testing"

func TestBlockFixtureAssetsAreEmbedded(t *testing.T) {
	for _, path := range []string{"img/shadcn.jpg"} {
		data, err := Assets.ReadFile(path)
		if err != nil {
			t.Fatalf("read %s: %v", path, err)
		}
		if len(data) == 0 {
			t.Fatalf("%s is empty", path)
		}
	}
}
