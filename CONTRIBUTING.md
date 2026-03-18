# Contributing to templUI

First off, thank you for considering contributing to templUI! We're excited to have you join our community.

## Development Setup

### Prerequisites

- Go 1.24 or higher
- Node.js (for Tailwind CSS and esbuild)
- [Task](https://taskfile.dev) - Cross-platform task runner

Install Task:

```bash
go install github.com/go-task/task/v3/cmd/task@latest
```

### Development Workflow

Start the development server:

```bash
task dev
```

This runs all watchers in parallel:

- `templ` - Template generation with integrated server and hot reload
- `tailwindcss` - CSS compilation
- `shiki-highlighter` - Syntax highlighting service
- `esbuild` - JavaScript minification for component scripts

See available tasks:

```bash
task --list
```

### Testing CLI changes against your fork

Set `TEMPLUI_REPO` in your shell before running the CLI:

```bash
task install-templui

# current shell session
export TEMPLUI_REPO=your-github-user/templui
templui add@your-branch button

# one command
TEMPLUI_REPO=your-github-user/templui templui add@your-branch button
```

## Our Vision and Your Contributions

templUI is an open-source project that aims to provide value to the Go community. We want to be transparent about our long-term vision:

1. We may explore opportunities to monetize aspects of templUI or offer premium services related to it in the future.
2. All contributions to this repository are subject to the MIT License, which allows for commercial use.
3. By contributing to templUI, you agree that your contributions may be used in both open-source and potential future commercial aspects of the project.
4. We value every contribution and will always strive to maintain a strong, open-source core that benefits the entire community.

We believe this approach allows us to sustainably develop and maintain templUI while keeping it open and accessible to all. If you have any questions or concerns about this, please reach out to us before contributing.

## How Can I Contribute?

### Reporting Bugs

- Use a clear and descriptive title for the issue to identify the problem.
- Describe the exact steps which reproduce the problem in as many details as possible.
- Provide specific examples to demonstrate the steps.

### Suggesting Enhancements

- Use a clear and descriptive title for the issue to identify the suggestion.
- Provide a step-by-step description of the suggested enhancement in as many details as possible.
- Explain why this enhancement would be useful to most templUI users.

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Follow the [Go style guide](https://golang.org/doc/effective_go.html)
- End all files with a newline
- Avoid platform-dependent code

## Style Guides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less

### Go Style Guide

Follow the official Go style guide and common practices in the Go community.

## Additional Notes

### Issue and Pull Request Labels

This section lists the labels we use to help us track and manage issues and pull requests.

- `bug` - Issues for bugs in the code
- `enhancement` - Issues for new features or improvements
- `documentation` - Issues related to documentation
- `good first issue` - Good for newcomers

## Recognition

We're committed to giving proper credit and recognition to all contributors. Your contributions, whether they're improvements to documentation, bug fixes, or new features, are invaluable to the growth and success of templUI.

Thank you for contributing to templUI and helping make it a great tool for the Go community!
