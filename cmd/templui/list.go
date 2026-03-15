package main

import (
	"fmt"
	"path/filepath"
	"strings"
)

// runList handles the 'list' command logic.
func runList(args []string, commandArg string) {
	listRef := getDefaultRef()

	// Parse optional @ref from the command argument.
	if strings.Contains(commandArg, "@") {
		parts := strings.SplitN(commandArg, "@", 2)
		if len(parts) == 2 && parts[0] == "list" && parts[1] != "" {
			listRef = parts[1]
			fmt.Printf("Listing components using specified ref: %s\n", listRef)
		} else {
			fmt.Printf("Error: Invalid format '%s'. Use 'list' or 'list@<ref>'.\n", commandArg)
			return
		}
	} else if commandArg != "list" {
		fmt.Printf("Error: Unknown command '%s'. Did you mean 'list'?\n", commandArg)
		showHelp(nil, getDefaultRef())
		return
	}

	// Warn about extra arguments.
	if len(args) > 1 {
		fmt.Printf("Warning: Extra arguments found after '%s'. Ignoring: %v\n", commandArg, args[1:])
	}

	err := listComponents(listRef)
	if err != nil {
		fmt.Printf("Error listing components: %v\n", err)
	}
}

// listComponents fetches the registry and lists available components and utils.
func listComponents(ref string) error {
	fmt.Printf("Fetching component registry from ref '%s'...\n", ref)
	registry, err := fetchRegistry(defaultRawContentBaseURL, ref)
	if err != nil {
		if strings.Contains(err.Error(), "status code 404") {
			return fmt.Errorf("could not fetch registry: ref '%s' not found or does not contain '%s'", ref, registryPath)
		}
		return fmt.Errorf("could not fetch registry: %w", err)
	}

	fmt.Printf("\nAvailable components in ref '%s':\n", ref)
	if len(registry.Components) == 0 {
		fmt.Println("  No components found in this registry.")
	} else {
		// Print components.
		for _, comp := range registry.Components {
			desc := comp.Description
			if len(desc) > 45 {
				desc = desc[:42] + "..."
			}

			jsStatus := ""
			if comp.HasJS {
				jsStatus = " [JS]"
			}

			fmt.Printf("  - %-20s : %s%s\n", comp.Name, desc, jsStatus)
		}
	}

	// Print utils.
	if len(registry.Utils) > 0 {
		fmt.Printf("\nAvailable utils in ref '%s':\n", ref)
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

	return nil
}
