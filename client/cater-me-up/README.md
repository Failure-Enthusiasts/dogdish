This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, enter into the correct directory:

```bash
cd client/cater-me-up
```

second, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

This project uses [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for client-side unit and component tests.

Tests for utility functions are located in the `src/__tests__` directory.
Component tests are located in the `src/components/__tests__` directory.

The test environment is configured to use [SWC (Speedy Web Compiler)](https://swc.rs/) for transforming TypeScript and JSX. This ensures fast test execution and compatibility with the Next.js and Turbopack build process, as Babel has been removed from the testing pipeline.

You can run the tests using the following npm scripts:

- **Run all tests:**
  ```bash
  npm test
  ```

- **Run tests in watch mode:**
  This will re-run tests when files change.
  ```bash
  npm run test:watch
  ```

- **Generate a coverage report:**
  This will output a coverage summary to the console and create an HTML report in the `coverage/` directory.
  ```bash
  npm run test:cov
  ```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
