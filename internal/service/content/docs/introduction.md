---
title: "Introduction"
description: "templui is a set of beautifully-designed, accessible components and a code distribution platform. Works with Go, templ and your favorite AI models. Open Source. Open Code."
order: 1
---

**This is not a component library. It is how you build your component library.**

You know how most traditional component libraries work: you install a package with `go get`, import the components, and use them in your app.

This approach works well until you need to customize a component to fit your design system or require one that isn't included in the library. **Often, you end up wrapping library components, writing workarounds to override styles, or mixing components from different libraries with incompatible APIs.**

This is what templui aims to solve. It is built around the following principles:

- **Open Code:** The top layer of your component code is open for modification.
- **Composition:** Every component uses a common, composable interface, making them predictable.
- **Distribution:** A flat-file schema and command-line tool make it easy to distribute components.
- **Beautiful Defaults:** Carefully chosen default styles, so you get great design out-of-the-box.
- **AI-Ready:** Open code for LLMs to read, understand, and improve.

## Open Code

templui hands you the actual component code. You have full control to customize and extend the components to your needs. This means:

- **Full Transparency:** You see exactly how each component is built.
- **Easy Customization:** Modify any part of a component to fit your design and functionality requirements.
- **AI Integration:** Access to the code makes it straightforward for LLMs to read, understand, and even improve your components.

_In a typical library, if you need to change a button's behavior, you have to override styles or wrap the component. With templui, you simply edit the button code directly._

<Callout className="mt-6">

**How do I pull upstream updates in an Open Code approach?** The behavior core of every component is ported from headless sources like Base UI into its script and kept current by the CLI: fixes arrive through `templui add` and the upgrade command. The topmost layer, the one closest to your design system, is not coupled with that implementation. It stays open for modification.

</Callout>

## Composition

Every component in templui shares a common, composable interface. **If a component does not exist, we bring it in, make it composable, and adjust its style to match and work with the rest of the design system.**

_A shared, composable interface means it's predictable for both your team and LLMs. You are not learning different APIs for every new component. Even for third-party ones._

## Distribution

templui is also a code distribution system. It defines a schema for components and a CLI to distribute them.

- **Schema:** A flat-file structure that defines the components, their dependencies, and properties.
- **CLI:** A command-line tool to distribute and install components across projects.

_You can use the schema to distribute your components to other projects or have AI generate completely new components based on existing schema._

## Beautiful Defaults

templui comes with a large collection of components that have carefully chosen default styles. They are designed to look good on their own and to work well together as a consistent system:

- **Good Out-of-the-Box:** Your UI has a clean and minimal look without extra work.
- **Unified Design:** Components naturally fit with one another. Each component is built to match the others, keeping your UI consistent.
- **Easily Customizable:** If you want to change something, it's simple to override and extend the defaults.

## AI-Ready

The design of templui makes it easy for AI tools to work with your code. Its open code and consistent API allow AI models to read, understand, and even generate new components.

_An AI model can learn how your components work and suggest improvements or even create new components that integrate with your existing design._

templui is the templ pendant of [shadcn/ui](https://ui.shadcn.com) and follows its principles. If you prefer plain Go imports without copying code, that exists as a templui extra: the [Import Workflow](/docs/import-workflow).
