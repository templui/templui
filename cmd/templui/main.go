package main

import (
	"flag"
	"fmt"
	"path/filepath"
	"runtime/debug"
	"strings"
)

const (
	configFileName = ".templui.json"
	registryPath   = "internal/registry/registry.json" // Path to the registry within the repository
	// Default base URL for fetching raw file content.
	defaultRawContentBaseURL = "https://raw.githubusercontent.com/templui/templui/"
)

// getVersion returns the version from build info or dev version for local builds.
func getVersion() string {
	if info, ok := debug.ReadBuildInfo(); ok {
		// Real version (e.g., v0.100.0 or pseudo-version for commit installs)
		if info.Main.Version != "" && info.Main.Version != "(devel)" {
			return info.Main.Version
		}

		// Dev mode: Show Git commit + dirty flag
		var revision, modified string
		for _, setting := range info.Settings {
			if setting.Key == "vcs.revision" {
				if len(setting.Value) >= 7 {
					revision = setting.Value[:7] // Short hash
				} else {
					revision = setting.Value
				}
			}
			if setting.Key == "vcs.modified" {
				modified = setting.Value
			}
		}

		if revision != "" {
			if modified == "true" {
				return fmt.Sprintf("dev-%s-dirty", revision)
			}
			return fmt.Sprintf("dev-%s", revision)
		}
	}
	return "dev"
}

// version of the tool (automatically detected from build info).
var version = getVersion()

// getDefaultRef returns the current stable version
func getDefaultRef() string {
	return version
}

// Flags defined for the command line interface.
var (
	forceOverwrite = flag.Bool("force", false, "Force overwrite existing files without asking")
	versionFlag    = flag.Bool("version", false, "Show installer version")
	helpFlag       = flag.Bool("help", false, "Show this help message")
	installedFlag  = flag.Bool("installed", false, "Update all currently installed components")
)

func main() {
	flag.Usage = func() {
		showHelp(nil, getDefaultRef())
	}
	flag.Parse()

	// Handle version display.
	if *versionFlag {
		fmt.Printf("templUI %s\n", version)
		return
	}

	// Handle help display.
	if *helpFlag {
		fmt.Println("Fetching registry for help...")
		registry, err := fetchRegistry(defaultRawContentBaseURL, getDefaultRef())
		if err != nil {
			fmt.Println("Could not fetch component list for help:", err)
			showHelp(nil, getDefaultRef())
		} else {
			showHelp(&registry, getDefaultRef())
		}
		return
	}

	args := flag.Args()

	if len(args) == 0 {
		fmt.Println("No command specified.")
		showHelp(nil, getDefaultRef())
		return
	}

	commandArg := args[0]

	// Route to appropriate command handler
	switch {
	case strings.HasPrefix(commandArg, "init"):
		runInit(args, commandArg, *forceOverwrite)
	case strings.HasPrefix(commandArg, "add"):
		runAdd(args, commandArg, *forceOverwrite, *installedFlag)
	case strings.HasPrefix(commandArg, "list"):
		runList(args, commandArg)
	case strings.HasPrefix(commandArg, "upgrade"):
		runUpgrade(args, commandArg)
	default:
		fmt.Printf("Error: Unknown command '%s'\n", commandArg)
		showHelp(nil, getDefaultRef())
	}
}

// showHelp displays the command usage instructions.
func showHelp(registry *Registry, refUsedForHelp string) {
	fmt.Println("templUI " + version + " - The UI Kit for templ" + "\n")
	fmt.Println("Usage:")
	fmt.Println("  templui init[@<ref>]                    - Initialize config and install utils from <ref>")
	fmt.Println("  templui --force init[@<ref>]            - Force reinitialize and repair incomplete config")
	fmt.Println("  templui add[@<ref>] <comp>...           - Add or update component(s) from specified <ref>")
	fmt.Println("  templui add[@<ref>] \"*\"               - Add all components from specified <ref>")
	fmt.Println("  templui --installed add[@<ref>]         - Update all currently installed components")
	fmt.Println("  templui list[@<ref>]                    - List available components and utils from <ref>")
	fmt.Println("  templui upgrade[@<ref>]                 - Upgrades the cli to <ref> or latest if no <ref> was given")
	fmt.Println("  templui --version                       - Show installer version")
	fmt.Println("  templui --help                          - Show this help message")
	fmt.Println("\n<ref> can be a branch name, tag name, or commit hash.")
	fmt.Printf("If no <ref> is specified, components are fetched from the default ref (currently '%s').\n", refUsedForHelp)
	fmt.Println("\nFlags:")
	flag.PrintDefaults()

	// Show component/util list only if --help was used and registry was fetched.
	if registry != nil {
		if len(registry.Components) > 0 {
			fmt.Printf("\nAvailable components in registry (fetched from ref '%s'):\n", refUsedForHelp)
			for _, comp := range registry.Components {
				desc := comp.Description
				if len(desc) > 60 {
					desc = desc[:57] + "..."
				}
				fmt.Printf("  - %-15s: %s\n", comp.Name, desc)
			}
		} else {
			fmt.Printf("\nNo components found in registry for ref '%s'.\n", refUsedForHelp)
		}
		if len(registry.Utils) > 0 {
			fmt.Printf("\nAvailable utils in ref '%s':\n", refUsedForHelp)
			for _, util := range registry.Utils {
				utilName := filepath.Base(util.Path)
				if util.Description != "" {
					desc := util.Description
					if len(desc) > 50 {
						desc = desc[:47] + "..."
					}
					fmt.Printf("  - %-20s : %s\n", utilName, desc)
				} else {
					fmt.Printf("  - %s\n", utilName)
				}
			}
		}
	} else {
		fmt.Println("\nUse 'templui list' or 'templui list@<ref>' to see available components and utils.")
	}
}
