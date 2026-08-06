package utils

import "testing"

// CN must behave like shadcn's cn(): the classes it keeps come out in the
// order they went in, so merging over an already merged string is a no-op. The
// pairs below are the ones that lose a class as soon as the order is dropped,
// a shorthand and its longhand: the shorthand has to stay in front.
func TestCNOrder(t *testing.T) {
	tests := []struct {
		name string
		in   []string
		want string
	}{
		{
			name: "shorthand before longhand survives",
			in:   []string{"p-2 pb-11"},
			want: "p-2 pb-11",
		},
		{
			name: "longhand before shorthand loses",
			in:   []string{"pb-11 p-2"},
			want: "p-2",
		},
		{
			name: "the command menu content class",
			in:   []string{"top-[15%] translate-y-0 sm:max-w-lg rounded-xl border-none bg-clip-padding p-2 pb-11 shadow-2xl ring-4"},
			want: "top-[15%] translate-y-0 sm:max-w-lg rounded-xl border-none bg-clip-padding p-2 pb-11 shadow-2xl ring-4",
		},
		{
			name: "margin shorthand and longhand",
			in:   []string{"m-4 mt-2"},
			want: "m-4 mt-2",
		},
		{
			name: "axis shorthand and side",
			in:   []string{"px-4 pl-8"},
			want: "px-4 pl-8",
		},
		{
			name: "radius shorthand and side",
			in:   []string{"rounded-md rounded-t-none"},
			want: "rounded-md rounded-t-none",
		},
		{
			name: "border width shorthand and side",
			in:   []string{"border border-b-4"},
			want: "border border-b-4",
		},
		{
			name: "inset shorthand and side",
			in:   []string{"inset-0 top-4"},
			want: "inset-0 top-4",
		},
		{
			name: "last of a conflict wins",
			in:   []string{"bg-red-500 bg-blue-500"},
			want: "bg-blue-500",
		},
		{
			name: "the later argument wins",
			in:   []string{"bg-red-500", "bg-blue-500"},
			want: "bg-blue-500",
		},
		{
			name: "a repeated class keeps one place, the last",
			in:   []string{"p-2 flex p-2"},
			want: "flex p-2",
		},
		{
			name: "classes that do not conflict keep their order",
			in:   []string{"inline-flex items-center gap-2 rounded-md text-sm font-medium"},
			want: "inline-flex items-center gap-2 rounded-md text-sm font-medium",
		},
		{
			name: "unknown classes keep their place between tailwind ones",
			in:   []string{"peer p-2 group/item text-sm"},
			want: "peer p-2 group/item text-sm",
		},
		{
			name: "arbitrary value wins over the scale value",
			in:   []string{"p-2 p-[3px]"},
			want: "p-[3px]",
		},
		{
			name: "scale value wins over the arbitrary one",
			in:   []string{"p-[3px] p-2"},
			want: "p-2",
		},
		{
			name: "arbitrary values keep their order",
			in:   []string{"top-[15%] w-[calc(100%-2rem)] bg-[#123456]"},
			want: "top-[15%] w-[calc(100%-2rem)] bg-[#123456]",
		},
		{
			name: "an arbitrary variant does not conflict with the bare class",
			in:   []string{"has-[:checked]:bg-primary bg-muted"},
			want: "has-[:checked]:bg-primary bg-muted",
		},
		{
			name: "a modifier does not conflict with the bare class",
			in:   []string{"hover:p-2 p-4"},
			want: "hover:p-2 p-4",
		},
		{
			name: "the same modifier does conflict",
			in:   []string{"hover:p-2 hover:p-4"},
			want: "hover:p-4",
		},
		{
			name: "breakpoint and base stay side by side",
			in:   []string{"w-full md:w-48 lg:w-40 xl:w-64"},
			want: "w-full md:w-48 lg:w-40 xl:w-64",
		},
		{
			name: "important does not conflict with the plain class",
			in:   []string{"p-2! p-4"},
			want: "p-2! p-4",
		},
		{
			name: "important conflicts with important",
			in:   []string{"p-2! p-4!"},
			want: "p-4!",
		},
		{
			name: "the v4 variable shorthand conflicts",
			in:   []string{"px-(--card-spacing) px-4"},
			want: "px-4",
		},
		{
			name: "the v4 variable shorthand survives as itself",
			in:   []string{"px-4 px-(--card-spacing)"},
			want: "px-(--card-spacing)",
		},
		{
			name: "empty arguments drop out",
			in:   []string{"", "flex p-2", ""},
			want: "flex p-2",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CN(tt.in)
			if got != tt.want {
				t.Errorf("CN(%q) = %q, want %q", tt.in, got, tt.want)
			}
			// The second pass is the one that used to lose classes: a
			// component merges its own defaults, a page merges the result
			// again. Merging merged output has to change nothing.
			if again := CN(got); again != got {
				t.Errorf("CN(%q) = %q, want it unchanged", got, again)
			}
		})
	}
}

// The reported failure, spelled out: two passes over a shorthand and its
// longhand used to end at "p-2".
func TestCNTwoPassesKeepLonghand(t *testing.T) {
	first := CN("p-2 pb-11")
	second := CN(first)
	if second != "p-2 pb-11" {
		t.Fatalf("second pass = %q, want %q (first pass was %q)", second, "p-2 pb-11", first)
	}
}

// TestCNClsxInputs covers the clsx flattening: conditionals, nested lists
// and empties, like shadcn's cn() accepts.
func TestCNClsxInputs(t *testing.T) {
	got := CN(
		"base",
		nil,
		"",
		[]string{"item-a", "", "item-b"},
		[]any{"nested", []string{"deep"}},
		map[string]bool{"on": true, "off": false},
	)
	want := "base item-a item-b nested deep on"
	if got != want {
		t.Errorf("CN clsx inputs = %q, want %q", got, want)
	}
	if got := CN("p-2", map[string]bool{"p-4": true}); got != "p-4" {
		t.Errorf("CN conditional conflict = %q, want %q", got, "p-4")
	}
}
