// babel-plugin-inline-import turns `.sql` imports into string literals at
// compile time. TypeScript doesn't know that — this ambient declaration
// teaches it so `import migrations from './drizzle/migrations'` typechecks.
declare module '*.sql' {
  const content: string;
  export default content;
}
