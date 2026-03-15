package main

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// runUpgrade handles the 'upgrade' command logic.
func runUpgrade(args []string, commandArg string) {
	var ref string

	if strings.Contains(commandArg, "@") {
		parts := strings.SplitN(commandArg, "@", 2)
		if len(parts) == 2 && parts[0] == "upgrade" && parts[1] != "" {
			ref = parts[1]
			fmt.Printf("Updating templUI using specified ref: %s\n", ref)
		} else {
			fmt.Printf("Error: Invalid format '%s'. Use 'upgrade' or 'upgrade@<ref>'.\n", commandArg)
			return
		}
	}

	// Step 1: Update the CLI
	if err := updateCLI(ref); err != nil {
		fmt.Printf("Error upgrading templUI CLI: %v\n", err)
		return
	}

	// Step 2: Update utils (only if config exists)
	if err := updateUtils(ref); err != nil {
		fmt.Printf("Error updating utils: %v\n", err)
	}
}

// updateCLI attempts to install a new version of the templUI cli based on the passed in ref.
func updateCLI(ref string) error {
	if ref == "" {
		ref = "latest"
	}
	fmt.Printf("Updating templUI CLI to ref '%s'...\n", ref)
	cmd := exec.Command("go", "install", fmt.Sprintf("github.com/templui/templui/cmd/templui@%s", ref))
	output, err := cmd.Output()
	if err != nil {
		return err
	}

	fmt.Print(string(output))
	fmt.Printf("✅ Updated templUI CLI to ref '%s'\n", ref)
	return nil
}

// updateUtils updates all utils from the registry to the configured utils directory.
func updateUtils(ref string) error {
	// Check if config exists
	if _, err := os.Stat(configFileName); os.IsNotExist(err) {
		fmt.Println("No config file found. Skipping utils update. Run 'templui init' first to set up your project.")
		return nil
	}

	// Load config
	config, err := loadConfig()
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}

	// Determine ref for fetching utils
	// Use "main" as default to always get the latest utils
	utilsRef := ref
	if utilsRef == "" || utilsRef == "latest" {
		utilsRef = "main"
	}

	fmt.Printf("\nUpdating utils to ref '%s'...\n", utilsRef)

	// Fetch registry
	registry, err := fetchRegistry(config.RawContentBaseURL, utilsRef)
	if err != nil {
		return fmt.Errorf("failed to fetch registry: %w", err)
	}

	if len(registry.Utils) == 0 {
		fmt.Println("No utils defined in the registry.")
		return nil
	}

	// Collect all util paths
	allUtilPaths := []string{}
	for _, utilDef := range registry.Utils {
		allUtilPaths = append(allUtilPaths, utilDef.Path)
	}

	// Install utils with force=true to ensure they get updated
	err = installUtils(config, allUtilPaths, utilsRef, true)
	if err != nil {
		return err
	}

	fmt.Println("✅ Utils updated successfully.")
	return nil
}
