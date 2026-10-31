import ts from 'typescript';
/** Structural hints, never a proof of asymptotic complexity and never used to award badges. */
export function complexityHints(code: string, language: string) {
  if (!['javascript','typescript'].includes(language)) return { kind: 'unavailable', time: 'Not inferred', space: 'Not inferred', note: 'Runtime and memory are measured by Judge0. Static complexity hints currently support JavaScript and TypeScript.' };
  const tree = ts.createSourceFile('solution.ts',code,ts.ScriptTarget.Latest,true);
  let depth = 0, maximum = 0, sort = false, allocation = false, recursive = false;
  const functions: string[] = [];
  const visit = (node: ts.Node) => {
    const loop = ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node) || ts.isWhileStatement(node) || ts.isDoStatement(node);
    if (loop) maximum = Math.max(maximum,++depth);
    const fn = ts.isFunctionDeclaration(node) && node.name ? node.name.text : null;
    if (fn) functions.push(fn);
    if (ts.isCallExpression(node)) {
      if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'sort') sort = true;
      if (ts.isIdentifier(node.expression) && functions.includes(node.expression.text)) recursive = true;
    }
    if (ts.isNewExpression(node) || ts.isArrayLiteralExpression(node) || ts.isObjectLiteralExpression(node)) allocation = true;
    ts.forEachChild(node,visit); if (loop) depth--; if (fn) functions.pop();
  };
  visit(tree);
  return { kind: 'heuristic', time: recursive ? 'Not inferred (function calls/recursion)' : maximum ? `O(n${maximum > 1 ? `^${maximum}` : ''}${sort ? ' log n' : ''}) structural estimate` : sort ? 'O(n log n) structural estimate' : 'Not inferred', space: allocation ? 'Allocation detected; growth not proven' : 'Not inferred', note: 'Assumes each visible loop runs n times. Bounds, recursion, helper functions and library calls may change this estimate. This is not a complexity proof and does not unlock achievements.' };
}
