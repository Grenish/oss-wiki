
# OSS Wiki

OSS Wiki is an open-source, collaborative documentation platform built with Next.js and Fumadocs. It empowers communities to create, manage, and share high-quality technical documentation with ease. OSS Wiki is designed for open-source projects, teams, and knowledge bases that value transparency, contribution, and modern web standards.

## Features

- **Modern Documentation Engine:** Powered by [Next.js](https://nextjs.org/) and [Fumadocs](https://fumadocs.dev/), supporting fast, SEO-friendly, and interactive docs.
- **MDX Support:** Write documentation in Markdown with React components for rich, dynamic content.
- **Full-Text Search:** Built-in search API for instant, relevant results.
- **Customizable Layouts:** Easily adapt the look and feel to your project's branding.
- **Open Contribution Model:** Simple, transparent contribution workflow for all users.
- **Type-Safe Content:** Uses [Zod](https://zod.dev/) schemas for frontmatter and metadata validation.
- **Contributor Tracking:** Automatically display contributors for each documentation page.

## Project Structure

- `app/` — Next.js app directory (routes, layouts, API, docs, etc.)
- `lib/` — Shared logic, content source adapters, and layout utilities
- `components/` — UI components and documentation widgets
- `content/` — MDX documentation files
- `source.config.ts` — Fumadocs/MDX configuration and schema definitions

### Key Routes

| Route                          | Description                                 |
| ------------------------------ | ------------------------------------------- |
| `/`                            | Home/Landing page                           |
| `/docs`                        | Main documentation hub                      |
| `/api/search`                  | Search API endpoint                         |
| `/og/docs/[...slug]`           | Open Graph image generation for docs        |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [bun](https://bun.sh/) (preferred), or [npm](https://www.npmjs.com/) / [yarn](https://yarnpkg.com/)

### Installation

Clone the repository:

```bash
git clone https://github.com/Grenish/oss-wiki.git
cd oss-wiki
```

Install dependencies (using bun is recommended):

```bash
bun install
# or
npm install
# or
yarn install
```

### Running the Development Server

```bash
bun dev
# or
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app.

## Contribution Guide

We welcome contributions of all kinds! Please see [CONTRIBUTIONS.md](./CONTRIBUTIONS.md) for detailed guidelines on how to get involved, report bugs, suggest features, and submit pull requests.

### Quick Contribution Steps

1. Fork and clone the repository
2. Create a new branch for your feature or fix
3. Make your changes and commit with a descriptive message
4. Push your branch and open a Pull Request

## Contributor Tracking

OSS Wiki now includes a Contributor Tracker that automatically displays contributors for each documentation page. This feature uses the GitHub API to fetch commit history for each documentation file.

### How It Works

1. Each documentation page can display a list of contributors who have made commits to that specific page.
2. The system fetches contributor data from the GitHub API and caches it for performance.
3. Contributors are displayed with their avatar, username, contribution count, and last commit date.

### Using the Contributor Tracker

To add a contributor tracker to any documentation page, simply include the following component in your MDX file:

```mdx
<ContributorTracker docPath="path/to/your/document.mdx" />
```

If you omit the `docPath` prop, it will automatically use the current document's path.

### API Endpoints

- `/api/contributors?docPath=path/to/document.mdx` - Fetch contributors for a specific document
- `/api/test-contributors` - Test endpoint to verify the API is working

## Configuration & Customization

- **Content Source:** Edit `lib/source.ts` and `source.config.ts` to customize content loading and schema.
- **Layouts:** Adjust layouts in `lib/layout.shared.tsx` and `app/docs/layout.tsx`.
- **UI Components:** Update or add components in `components/` as needed.
- **Styling:** Modify `app/global.css` and use [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.

## License

OSS Wiki is [MIT licensed](./LICENSE).

---

Made with ❤️ by the OSS Wiki community.