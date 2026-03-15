package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"strings"
)

// Config defines the structure for the .templui.json configuration file.
type Config struct {
	ComponentsDir    string `json:"componentsDir"`
	UtilsDir         string `json:"utilsDir"`
	ModuleName       string `json:"moduleName"`
	JSDir            string `json:"jsDir,omitempty"`            // Directory for component JavaScript files
	JSPublicPath     string `json:"jsPublicPath,omitempty"`     // Public path where JS files are served (e.g., "/app/assets/js")
	RawContentBaseURL string `json:"rawContentBaseURL,omitempty"` // Base URL for fetching raw file content (overrides default repo)
}

// loadConfig reads and parses the .templui.json configuration file.
// Returns an error if the config file doesn't exist or required fields are missing.
func loadConfig() (Config, error) {
	var config Config

	// Check if config file exists
	if _, err := os.Stat(configFileName); os.IsNotExist(err) {
		return config, fmt.Errorf("🚫 Config file not found!\n📁 Looking for: %s\n\n🚀 To get started, run: templui init", configFileName)
	}

	// Read and parse existing config file
	data, err := os.ReadFile(configFileName)
	if err != nil {
		return config, fmt.Errorf("error reading config file: %w", err)
	}

	err = json.Unmarshal(data, &config)
	if err != nil {
		return config, fmt.Errorf("error parsing config file: %w", err)
	}

	// Validate required fields
	var missingFields []string
	if config.ComponentsDir == "" {
		missingFields = append(missingFields, "componentsDir")
	}
	if config.UtilsDir == "" {
		missingFields = append(missingFields, "utilsDir")
	}
	if config.ModuleName == "" {
		missingFields = append(missingFields, "moduleName")
	}
	if config.JSDir == "" {
		missingFields = append(missingFields, "jsDir")
	}
	if config.JSPublicPath == "" {
		missingFields = append(missingFields, "jsPublicPath")
	}

	if len(missingFields) > 0 {
		var errorMsg strings.Builder
		errorMsg.WriteString("❌ Config file is incomplete!\n")
		errorMsg.WriteString("📋 Missing required fields:\n")
		for _, field := range missingFields {
			errorMsg.WriteString(fmt.Sprintf("   • %s\n", field))
		}
		errorMsg.WriteString("\n🔧 To fix this, run: templui -f init")
		return config, fmt.Errorf("%s", errorMsg.String())
	}

	// Apply default for optional fields
	if config.RawContentBaseURL == "" {
		config.RawContentBaseURL = defaultRawContentBaseURL
	}

	return config, nil
}

// saveConfig writes the config to .templui.json
func saveConfig(config Config) error {
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("error creating config data: %w", err)
	}
	err = os.WriteFile(configFileName, data, 0644)
	if err != nil {
		return fmt.Errorf("error saving config file: %w", err)
	}
	return nil
}

// detectModuleName tries to read the module name from go.mod.
func detectModuleName() string {
	data, err := os.ReadFile("go.mod")
	if err != nil {
		fmt.Println("Warning: Could not read go.mod to detect module name. Using default.")
		return "your/module/path" // Provide a fallback placeholder
	}
	re := regexp.MustCompile(`(?m)^\s*module\s+(\S+)`)
	matches := re.FindSubmatch(data)
	if len(matches) < 2 {
		fmt.Println("Warning: Could not parse module name from go.mod. Using default.")
		return "your/module/path"
	}
	return string(matches[1])
}

// promptForConfig interactively prompts user for configuration values
func promptForConfig(existingConfig *Config) Config {
	reader := bufio.NewReader(os.Stdin)
	config := Config{}

	if existingConfig != nil {
		config = *existingConfig
	}

	// Components directory
	if config.ComponentsDir == "" {
		fmt.Printf("Enter the directory for components [components]: ")
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)
		if input == "" {
			config.ComponentsDir = "components"
		} else {
			config.ComponentsDir = strings.TrimPrefix(input, "/")
		}
	}

	// Utils directory
	if config.UtilsDir == "" {
		fmt.Printf("Enter the directory for utils [utils]: ")
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)
		if input == "" {
			config.UtilsDir = "utils"
		} else {
			config.UtilsDir = strings.TrimPrefix(input, "/")
		}
	}

	// Module name
	if config.ModuleName == "" {
		defaultModuleName := detectModuleName()
		fmt.Printf("Enter your Go module name [%s]: ", defaultModuleName)
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)
		if input == "" {
			config.ModuleName = defaultModuleName
		} else {
			config.ModuleName = input
		}
	}

	// JS directory
	if config.JSDir == "" {
		fmt.Printf("Enter the directory for JavaScript files [assets/js]: ")
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)
		if input == "" {
			config.JSDir = "assets/js"
		} else {
			config.JSDir = strings.TrimPrefix(input, "/")
		}
	}

	// JS public path
	if config.JSPublicPath == "" {
		defaultPublicPath := "/" + config.JSDir
		fmt.Printf("Enter the public path for serving JS files [%s]: ", defaultPublicPath)
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)
		if input == "" {
			config.JSPublicPath = defaultPublicPath
		} else {
			config.JSPublicPath = input
		}
	}

	return config
}
