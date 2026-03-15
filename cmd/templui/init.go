package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

// runInit handles the 'init' command logic.
func runInit(args []string, commandArg string, force bool) {
	initRef := getDefaultRef()

	// Parse optional @ref from the command argument itself.
	if strings.Contains(commandArg, "@") {
		parts := strings.SplitN(commandArg, "@", 2)
		if len(parts) == 2 && parts[0] == "init" && parts[1] != "" {
			initRef = parts[1]
			fmt.Printf("Initializing using specified ref: %s\n", initRef)
		} else {
			fmt.Printf("Error: Invalid format '%s'. Use 'init' or 'init@<ref>'.\n", commandArg)
			return
		}
	} else if commandArg != "init" {
		fmt.Printf("Error: Unknown command '%s'. Did you mean 'init'?\n", commandArg)
		showHelp(nil, getDefaultRef())
		return
	}

	// Warn about extra arguments.
	if len(args) > 1 {
		fmt.Printf("Warning: Extra arguments found after '%s'. Ignoring: %v\n", commandArg, args[1:])
	}

	initConfig(initRef, force)
}

// initConfig handles the creation of the config file and initial utils installation.
func initConfig(ref string, force bool) {
	configExists := false
	if _, err := os.Stat(configFileName); err == nil {
		configExists = true
	}

	if configExists {
		// Config exists - check if it needs repair or if force is specified
		if !force {
			// Check if existing config has missing fields
			_, err := loadConfig()
			if err != nil {
				fmt.Println("Config file exists but has issues. Use 'templui -f init' to repair missing fields and reinstall utils.")
				return
			}
			fmt.Println("Config file already exists and is complete. Use 'templui -f init' to reinstall utils if needed.")
			// Don't reinstall utils unless forced
			return
		} else {
			fmt.Println("Config file exists. Checking for missing fields and reinstalling utils (--force specified)...")

			// Try to load existing config and repair missing fields
			_, err := loadConfig()
			if err != nil {
				fmt.Println("Repairing config file with missing fields...")

				// Load partial config to see what we have
				var partialConfig Config
				if configData, readErr := os.ReadFile(configFileName); readErr == nil {
					json.Unmarshal(configData, &partialConfig)
				}

				// Prompt for missing fields
				config := promptForConfig(&partialConfig)

				// Save repaired config
				err = saveConfig(config)
				if err != nil {
					fmt.Printf("Error saving repaired config file: %v\n", err)
					return
				}
				fmt.Println("Config file repaired successfully!")
			} else {
				fmt.Println("Config file is already complete.")
			}
		}
	} else {
		// Config file does not exist, create it.
		fmt.Println("Creating new config file...")

		config := promptForConfig(nil)

		err := saveConfig(config)
		if err != nil {
			fmt.Printf("Error saving config file: %v\n", err)
			return
		}
		fmt.Println("Config file created successfully at", configFileName)
		fmt.Printf("Components will be installed to: %s\n", config.ComponentsDir)
		fmt.Printf("Utils will be installed to: %s\n", config.UtilsDir)
		fmt.Printf("Using module name: %s\n", config.ModuleName)
		fmt.Printf("JavaScript files will be saved to: %s\n", config.JSDir)
		if config.JSPublicPath != "" {
			fmt.Printf("JavaScript files will be served from: %s\n", config.JSPublicPath)
		}
	}

	// Only install utils if we created a new config or if force was specified
	if !configExists || force {
		// Install the default utilities.
		config, err := loadConfig()
		if err != nil {
			fmt.Printf("Error loading config: %v\n", err)
			return
		}

		// Install all available utils from the specified ref.
		fmt.Printf("\nAttempting to install initial utils from ref '%s'...\n", ref)
		registry, err := fetchRegistry(config.RawContentBaseURL, ref)
		if err != nil {
			if strings.Contains(err.Error(), "status code 404") {
				fmt.Printf("Warning: Could not fetch registry from ref '%s': %v\n", ref, err)
				fmt.Printf("  Check if the ref '%s' exists and contains the file '%s'.\n", ref, registryPath)
			} else {
				fmt.Printf("Warning: Could not fetch registry to install initial utils: %v\n", err)
			}
			return
		}

		if len(registry.Utils) == 0 {
			fmt.Println("No utils defined in the registry. Skipping initial utils installation.")
			return
		}

		allUtilPaths := []string{}
		fmt.Println("Found utils in registry:")
		for _, utilDef := range registry.Utils {
			allUtilPaths = append(allUtilPaths, utilDef.Path)
			fmt.Printf(" - %s\n", utilDef.Path)
		}

		// Pass the force flag from the init command.
		err = installUtils(config, allUtilPaths, ref, force)
		if err != nil {
			fmt.Printf("Error during initial utils installation: %v\n", err)
		} else {
			fmt.Println("Initial utils installation completed.")
		}
	}
}
