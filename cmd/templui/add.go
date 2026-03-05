package main

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// runAdd handles the 'add' command logic.
func runAdd(args []string, commandArg string, force bool, installed bool) {
	targetRef := getDefaultRef()
	commandRefProvided := false

	// Parse optional @ref from the command argument.
	if strings.Contains(commandArg, "@") {
		parts := strings.SplitN(commandArg, "@", 2)
		if len(parts) == 2 && parts[0] == "add" && parts[1] != "" {
			targetRef = parts[1]
			commandRefProvided = true
			fmt.Printf("Using specified ref from command: %s\n", targetRef)
		} else {
			fmt.Printf("Error: Invalid format '%s'. Use 'add' or 'add@<ref>'.\n", commandArg)
			return
		}
	} else if commandArg != "add" {
		fmt.Printf("Error: Unknown command '%s'. Did you mean 'add'?\n", commandArg)
		showHelp(nil, getDefaultRef())
		return
	}

	remainingArgs := args[1:]

	// Ensure component arguments are provided after the command.
	if len(remainingArgs) == 0 && !installed {
		fmt.Println("Error: No component(s) specified after 'add'.")
		fmt.Println("Usage: templui add[@<ref>] <component>... | * | templui --installed add[@<ref>]")
		return
	}

	// Disallow combining --installed with explicit component names.
	if installed && len(remainingArgs) > 0 {
		fmt.Println("Error: Cannot combine --installed with explicit component names.")
		fmt.Println("Usage: templui --installed add[@<ref>]")
		return
	}

	// Load user configuration.
	config, err := loadConfig()
	if err != nil {
		fmt.Printf("Error loading config: %v\n", err)
		return
	}

	// Parse component arguments (start from the second non-flag argument).
	componentsToInstallNames := []string{}
	isInstallAll := false

	if installed {
		names, err := getInstalledComponentNames(config.ComponentsDir)
		if err != nil {
			fmt.Printf("Error detecting installed components: %v\n", err)
			return
		}
		if len(names) == 0 {
			fmt.Println("No installed components found in", config.ComponentsDir)
			return
		}
		componentsToInstallNames = names
	} else {
		firstCompArg := remainingArgs[0]
		if firstCompArg == "*" {
			if len(remainingArgs) > 1 { // Only '*' allowed after 'add[*]' command.
				fmt.Println("Error: '*' must be the only component argument after 'add'.")
				fmt.Println("Usage: templui add[@<ref>] *")
				return
			}
			isInstallAll = true
		} else {
			// Parse individual component names.
			for _, arg := range remainingArgs {
				// Disallow @ref on individual components if ref was given with the command.
				if strings.Contains(arg, "@") {
					compName := strings.SplitN(arg, "@", 2)[0]
					if commandRefProvided {
						fmt.Printf("Warning: Ignoring '@...' for component '%s' because ref '%s' was specified with the 'add' command.\n", compName, targetRef)
						componentsToInstallNames = append(componentsToInstallNames, compName)
					} else {
						// Enforce specifying the ref only with the 'add' command itself.
						fmt.Printf("Error: Specify the ref with the 'add' command (e.g., 'add@%s %s'), not on individual components like '%s'.\n", targetRef, compName, arg)
						return
					}
				} else {
					componentsToInstallNames = append(componentsToInstallNames, arg)
				}
			}
		}
	}

	// Fetch the registry for the target ref.
	fmt.Printf("\n📦 Using ref: %s\n", targetRef)
	fmt.Printf("🔍 Fetching component registry from ref '%s'...\n", targetRef)
	registry, err := fetchRegistry(targetRef)
	if err != nil {
		if strings.Contains(err.Error(), "status code 404") {
			fmt.Printf("❌ Error fetching registry: %v\n", err)
			fmt.Printf("   Check if the ref '%s' exists and contains the file '%s'.\n", targetRef, registryPath)
			fmt.Printf("   Registry URL attempted: %s%s/%s\n", rawContentBaseURL, targetRef, registryPath)
		} else {
			fmt.Printf("❌ Error fetching registry: %v\n", err)
		}
		return
	}
	fmt.Printf("✅ Using components from templui registry (ref: %s)\n", targetRef)

	// Build a map for quick component lookup.
	componentMap := make(map[string]ComponentDef)
	for _, comp := range registry.Components {
		componentMap[comp.Name] = comp
	}

	// If '*' was requested, get all component names from the registry.
	if isInstallAll {
		fmt.Printf("\n🚀 Preparing to install all %d components...\n", len(registry.Components))
		componentsToInstallNames = []string{}
		for _, comp := range registry.Components {
			componentsToInstallNames = append(componentsToInstallNames, comp.Name)
		}
	}

	fmt.Print("\n" + strings.Repeat("─", 50) + "\n")
	fmt.Printf("🔧 INSTALLING COMPONENTS\n")
	fmt.Printf("%s\n", strings.Repeat("─", 50))

	// Track installed state and required utils for this run.
	installedComponents := make(map[string]bool)
	requiredUtils := make(map[string]bool)

	// Install each requested component and its dependencies.
	for _, componentName := range componentsToInstallNames {
		compDef, exists := componentMap[componentName]
		if !exists {
			fmt.Printf("❌ Component '%s' not found in registry for ref '%s'.\n", componentName, targetRef)
			fmt.Println("Available components in this registry:")
			for _, availableComp := range registry.Components {
				fmt.Printf("   • %s\n", availableComp.Name)
			}
			continue // Skip to next requested component
		}

		// Pass the force flag down to the installation function.
		err = installComponent(config, compDef, componentMap, targetRef, installedComponents, requiredUtils, force)
		if err != nil {
			fmt.Printf("❌ Error installing component %s: %v\n", componentName, err)
			// Decide whether to continue or stop on error
		}
	}

	// Install all collected required utils.
	if len(requiredUtils) > 0 {
		fmt.Printf("\n🛠️  Installing required utils...\n")
		utilsToInstallPaths := []string{}
		for utilPath := range requiredUtils {
			utilsToInstallPaths = append(utilsToInstallPaths, utilPath)
		}
		// Pass the force flag down.
		err = installUtils(config, utilsToInstallPaths, targetRef, force)
		if err != nil {
			fmt.Printf("❌ Error installing utils: %v\n", err)
		}
	}

	fmt.Print("\n" + strings.Repeat("─", 50) + "\n")
	fmt.Printf("✅ INSTALLATION COMPLETED\n")
	fmt.Printf("%s\n", strings.Repeat("─", 50))

	// Check if any installed components have JavaScript
	hasJSComponents := false
	for compName := range installedComponents {
		if comp, exists := componentMap[compName]; exists && comp.HasJS {
			hasJSComponents = true
			break
		}
	}

	if hasJSComponents {
		fmt.Println("\n💡 Tip: Some components require JavaScript. Make sure to include @component.Script() in your layout!")
	}
}

// installComponent handles the installation of a single component and its dependencies.
func installComponent(
	config Config,
	comp ComponentDef,
	componentMap map[string]ComponentDef,
	ref string,
	installed map[string]bool,
	requiredUtils map[string]bool,
	force bool,
) error {
	if installed[comp.Name] {
		return nil // Already processed in this run
	}
	installed[comp.Name] = true

	fmt.Printf("\n📦 Processing component: %s (from ref: %s)\n", comp.Name, ref)

	// Install dependencies first recursively.
	for _, depName := range comp.Dependencies {
		if installed[depName] {
			continue
		}
		depComp, exists := componentMap[depName]
		if !exists {
			fmt.Printf("Warning: Dependency '%s' for component '%s' not found in registry for ref '%s'. Skipping dependency.\n", depName, comp.Name, ref)
			continue
		}
		// Pass force flag to recursive calls.
		err := installComponent(config, depComp, componentMap, ref, installed, requiredUtils, force)
		if err != nil {
			return fmt.Errorf("failed to install dependency '%s' for '%s': %w", depName, comp.Name, err)
		}
		fmt.Printf("   ✅ Installed dependency: %s\n", depName)
	}

	// Download and write component files.
	fmt.Printf("   📁 Installing files for: %s\n", comp.Name)
	repoComponentBasePath := "internal/components/"

	for _, repoFilePath := range comp.Files {
		// Determine the destination path, preserving subdirectory structure.
		var destPath string
		if strings.HasPrefix(repoFilePath, repoComponentBasePath) {
			relativePath := repoFilePath[len(repoComponentBasePath):]
			destPath = filepath.Join(config.ComponentsDir, relativePath)
		} else {
			// Fallback for unexpected paths (shouldn't happen with proper manifest).
			fmt.Printf("  Warning: File path '%s' does not start with '%s'. Placing it directly in '%s'.\n", repoFilePath, repoComponentBasePath, config.ComponentsDir)
			fileName := filepath.Base(repoFilePath)
			destPath = filepath.Join(config.ComponentsDir, fileName)
		}

		// Ensure the destination directory exists.
		compDestDir := filepath.Dir(destPath)
		err := os.MkdirAll(compDestDir, 0755)
		if err != nil {
			return fmt.Errorf("failed to create destination directory '%s': %w", compDestDir, err)
		}

		// Check if file exists and handle overwrite logic.
		fileExists := false
		if _, err := os.Stat(destPath); err == nil {
			fileExists = true
		}

		shouldWriteFile := true // Assume write unless file exists and is up-to-date or user skips.

		if fileExists {
			existingRef, _ := readFileVersion(destPath)
			if existingRef == ref {
				// File is up-to-date, but check if force flag is set
				if force {
					fmt.Printf("      ⚠️  File '%s' already up-to-date (ref: %s). Forcing overwrite.\n", destPath, ref)
				} else {
					fmt.Printf("      ℹ️  File '%s' already up-to-date (ref: %s). Skipping.\n", destPath, ref)
					shouldWriteFile = false
				}
			} else {
				// Versions differ or existing version couldn't be read.
				if force {
					fmt.Printf("      ⚠️  File '%s' exists (Version: '%s'). Forcing overwrite with ref '%s'.\n", destPath, existingRef, ref)
				} else {
					shouldOverwrite := askForOverwrite(destPath, existingRef, ref)
					if !shouldOverwrite {
						fmt.Printf("      ⏭️  Skipping overwrite for '%s'.\n", destPath)
						shouldWriteFile = false
					}
				}
			}
		}

		// Proceed with download and write only if necessary.
		if shouldWriteFile {
			fileURL := rawContentBaseURL + ref + "/" + repoFilePath
			fmt.Printf("      ⬇️  Downloading %s...\n", fileURL)
			data, err := downloadFile(fileURL)
			if err != nil {
				fileNameForError := filepath.Base(repoFilePath)
				return fmt.Errorf("failed to download file '%s' for component '%s' from %s: %w", fileNameForError, comp.Name, fileURL, err)
			}

			// Add version comment with documentation link and replace imports.
			versionComment := fmt.Sprintf("// templui component %s - version: %s installed by templui %s\n", comp.Name, ref, version)
			versionComment += fmt.Sprintf("// 📚 Documentation: https://templui.io/docs/components/%s\n", comp.Slug)
			modifiedData := append([]byte(versionComment), data...)
			if strings.HasSuffix(repoFilePath, ".templ") || strings.HasSuffix(repoFilePath, ".go") {
				modifiedData = replaceImports(modifiedData, config, comp.Name)
			}

			// Write the file.
			err = os.WriteFile(destPath, modifiedData, 0644)
			if err != nil {
				return fmt.Errorf("failed to write file '%s': %w", destPath, err)
			}
			if fileExists {
				fmt.Printf("      ✅ Overwritten %s\n", destPath)
			} else {
				fmt.Printf("      ✅ Installed %s\n", destPath)
			}
		}
	}

	// Collect required utils for later installation.
	for _, repoUtilPath := range comp.RequiredUtils {
		requiredUtils[repoUtilPath] = true
	}

	// Handle JavaScript files if component requires them
	if comp.HasJS && config.JSDir != "" {
		err := installComponentJS(config, comp, ref, force)
		if err != nil {
			return fmt.Errorf("failed to install JavaScript for component '%s': %w", comp.Name, err)
		}
	}

	return nil
}

// installUtils handles the installation of required utility files.
func installUtils(config Config, utilPaths []string, ref string, force bool) error {
	if len(utilPaths) == 0 {
		return nil
	}

	utilsBaseDestDir := config.UtilsDir
	fmt.Printf("Ensuring utils are installed in: %s (from ref: %s)\n", utilsBaseDestDir, ref)
	repoUtilBasePath := "internal/utils/"

	// Ensure base utils directory exists.
	err := os.MkdirAll(utilsBaseDestDir, 0755)
	if err != nil {
		return fmt.Errorf("failed to create base utils directory '%s': %w", utilsBaseDestDir, err)
	}

	for _, repoUtilPath := range utilPaths {
		// Determine destination path, preserving subdirectory structure.
		var destPath string
		if strings.HasPrefix(repoUtilPath, repoUtilBasePath) {
			relativePath := repoUtilPath[len(repoUtilBasePath):]
			destPath = filepath.Join(utilsBaseDestDir, relativePath)
		} else {
			fmt.Printf("  Warning: Util path '%s' does not start with '%s'. Placing it directly in '%s'.\n", repoUtilPath, repoUtilBasePath, utilsBaseDestDir)
			fileName := filepath.Base(repoUtilPath)
			destPath = filepath.Join(utilsBaseDestDir, fileName)
		}

		// Ensure the specific util directory exists.
		utilDestDir := filepath.Dir(destPath)
		err := os.MkdirAll(utilDestDir, 0755)
		if err != nil {
			return fmt.Errorf("failed to create destination utils directory '%s': %w", utilDestDir, err)
		}

		// Check if file exists and handle overwrite logic.
		fileExists := false
		if _, err := os.Stat(destPath); err == nil {
			fileExists = true
		}

		shouldWriteFile := true

		if fileExists {
			existingRef, _ := readFileVersion(destPath)
			if existingRef == ref {
				fmt.Printf("  Info: Util file '%s' already up-to-date (ref: %s). Skipping.\n", destPath, ref)
				shouldWriteFile = false
			} else {
				if force {
					fmt.Printf("  Info: Util file '%s' exists (Version: '%s'). Forcing overwrite with ref '%s'.\n", destPath, existingRef, ref)
				} else {
					shouldOverwrite := askForOverwrite(destPath, existingRef, ref)
					if !shouldOverwrite {
						fmt.Printf("  Info: Skipping overwrite for '%s'.\n", destPath)
						shouldWriteFile = false
					}
				}
			}
		}

		if shouldWriteFile {
			fileURL := rawContentBaseURL + ref + "/" + repoUtilPath
			fmt.Printf("   Downloading util %s...\n", fileURL)
			data, err := downloadFile(fileURL)
			if err != nil {
				fileNameForError := filepath.Base(repoUtilPath)
				return fmt.Errorf("failed to download util '%s' from %s: %w", fileNameForError, fileURL, err)
			}

			// Add version comment and replace imports.
			utilNameForComment := filepath.Base(repoUtilPath)
			versionComment := fmt.Sprintf("// templui util %s - version: %s installed by templui %s\n", utilNameForComment, ref, version)
			modifiedData := append([]byte(versionComment), data...)
			if strings.HasSuffix(repoUtilPath, ".go") {
				modifiedData = replaceImports(modifiedData, config, "")
				// Replace package name to match the destination directory name
				targetPkgName := filepath.Base(utilsBaseDestDir)
				modifiedData = bytes.Replace(modifiedData, []byte("package utils"), []byte("package "+targetPkgName), 1)
			}

			// Write the file.
			err = os.WriteFile(destPath, modifiedData, 0644)
			if err != nil {
				return fmt.Errorf("failed to write util file '%s': %w", destPath, err)
			}
			if fileExists {
				fmt.Printf("   Overwritten %s\n", destPath)
			} else {
				fmt.Printf("   Installed %s\n", destPath)
			}
		}
	}

	return nil
}

// installComponentJS handles the installation of JavaScript files for a component
// and automatically adds Script() template at the end of .templ files
func installComponentJS(config Config, comp ComponentDef, ref string, force bool) error {
	jsFileName := comp.Name + ".min.js"
	// Load from component directory instead of component_scripts
	jsSourceURL := rawContentBaseURL + ref + "/internal/components/" + comp.Name + "/" + jsFileName
	jsDestPath := filepath.Join(config.JSDir, jsFileName)

	// Ensure JS directory exists
	err := os.MkdirAll(config.JSDir, 0755)
	if err != nil {
		return fmt.Errorf("failed to create JS directory '%s': %w", config.JSDir, err)
	}

	// Check if JS file exists and handle overwrite logic
	fileExists := false
	if _, err := os.Stat(jsDestPath); err == nil {
		fileExists = true
	}

	shouldWriteJS := true
	if fileExists && !force {
		fmt.Printf("   JavaScript file '%s' already exists. Overwrite? (y/N): ", jsDestPath)
		var response string
		fmt.Scanln(&response)
		shouldWriteJS = strings.ToLower(strings.TrimSpace(response)) == "y"
	}

	if shouldWriteJS {
		fmt.Printf("   Downloading JavaScript: %s\n", jsSourceURL)
		jsData, err := downloadFile(jsSourceURL)
		if err != nil {
			return fmt.Errorf("failed to download JS file from %s: %w", jsSourceURL, err)
		}

		err = os.WriteFile(jsDestPath, jsData, 0644)
		if err != nil {
			return fmt.Errorf("failed to write JS file '%s': %w", jsDestPath, err)
		}

		if fileExists {
			fmt.Printf("   Overwritten %s\n", jsDestPath)
		} else {
			fmt.Printf("   Installed %s\n", jsDestPath)
		}
	}

	// Add Script() template to .templ files
	err = addScriptTemplateToFiles(config, comp, jsFileName)
	if err != nil {
		return fmt.Errorf("failed to add Script() template: %w", err)
	}

	return nil
}

// addScriptTemplateToFiles adds Script() template at the end of .templ files
func addScriptTemplateToFiles(config Config, comp ComponentDef, jsFileName string) error {
	repoComponentBasePath := "internal/components/"

	for _, repoFilePath := range comp.Files {
		if !strings.HasSuffix(repoFilePath, ".templ") {
			continue // Only process .templ files
		}

		// Determine the destination path
		var destPath string
		if strings.HasPrefix(repoFilePath, repoComponentBasePath) {
			relativePath := repoFilePath[len(repoComponentBasePath):]
			destPath = filepath.Join(config.ComponentsDir, relativePath)
		} else {
			fileName := filepath.Base(repoFilePath)
			destPath = filepath.Join(config.ComponentsDir, fileName)
		}

		// Check if file exists
		if _, err := os.Stat(destPath); os.IsNotExist(err) {
			continue // Skip if .templ file doesn't exist
		}

		// Read the current file content
		content, err := os.ReadFile(destPath)
		if err != nil {
			return fmt.Errorf("failed to read .templ file '%s': %w", destPath, err)
		}

		contentStr := string(content)

		// Create the web path for the JavaScript file
		// Use jsPublicPath if set, otherwise fallback to "/" + jsDir
		var webPath string
		if config.JSPublicPath != "" {
			// Use configured public path
			webPath = strings.TrimSuffix(config.JSPublicPath, "/") + "/" + jsFileName
		} else {
			// Fallback to jsDir (backward compatible)
			webPath = "/" + filepath.ToSlash(filepath.Join(config.JSDir, jsFileName))
		}

		// Create the Script() template with correct templ syntax, nonce support, and cache busting
		scriptTemplate := fmt.Sprintf(`templ Script() {
	<script defer nonce={ templ.GetNonce(ctx) } src={ utils.ScriptURL("%s") }></script>
}`, webPath)

		newContent, action := upsertScriptTemplate(contentStr, scriptTemplate)

		// Write the updated content
		err = os.WriteFile(destPath, []byte(newContent), 0644)
		if err != nil {
			return fmt.Errorf("failed to write updated .templ file '%s': %w", destPath, err)
		}
		fmt.Printf("   %s Script() template in %s\n", action, destPath)
	}

	return nil
}

func upsertScriptTemplate(content, scriptTemplate string) (string, string) {
	scriptDecl := "templ Script()"
	idx := strings.Index(content, scriptDecl)
	if idx == -1 {
		return strings.TrimSpace(content) + "\n\n" + scriptTemplate + "\n", "Added"
	}

	openRel := strings.Index(content[idx:], "{")
	if openRel == -1 {
		return strings.TrimSpace(content) + "\n\n" + scriptTemplate + "\n", "Added"
	}

	open := idx + openRel
	depth := 0
	end := -1
	for i := open; i < len(content); i++ {
		switch content[i] {
		case '{':
			depth++
		case '}':
			depth--
			if depth == 0 {
				end = i + 1
				i = len(content)
			}
		}
	}

	if end == -1 {
		return strings.TrimSpace(content) + "\n\n" + scriptTemplate + "\n", "Added"
	}

	head := strings.TrimRight(content[:idx], " \t\r\n")
	tail := strings.TrimLeft(content[end:], " \t\r\n")

	updated := head + "\n\n" + scriptTemplate + "\n"
	if tail != "" {
		updated += "\n" + tail + "\n"
	}

	return updated, "Updated"
}

// getInstalledComponentNames returns the names of all installed components
// by listing subdirectories in the components directory.
func getInstalledComponentNames(componentsDir string) ([]string, error) {
	entries, err := os.ReadDir(componentsDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read components directory '%s': %w", componentsDir, err)
	}
	var names []string
	for _, entry := range entries {
		if entry.IsDir() {
			names = append(names, entry.Name())
		}
	}
	return names, nil
}
