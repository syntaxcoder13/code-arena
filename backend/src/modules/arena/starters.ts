export const STARTERS: Record<string, string> = {
  javascript: "const input = require('fs').readFileSync(0, 'utf8');\nfunction solve(input) {\n  // Write your solution.\n  return '';\n}\nprocess.stdout.write(String(solve(input)));\n",
  typescript: "declare function require(name: string): any;\ndeclare const process: any;\nconst input: string = require('fs').readFileSync(0, 'utf8');\nfunction solve(input: string): string {\n  // Write your solution.\n  return '';\n}\nprocess.stdout.write(solve(input));\n",
  python: "import sys\n\ndef solve(data):\n    # Write your solution.\n    return ''\n\nsys.stdout.write(str(solve(sys.stdin.read())))\n",
  cpp: '#include <iostream>\n#include <sstream>\n#include <string>\nusing namespace std;\nstring solve(string input) {\n  // Write your solution.\n  return "";\n}\nint main() { ostringstream input; input << cin.rdbuf(); cout << solve(input.str()); }\n',
  go: 'package main\nimport ("fmt"; "io/ioutil"; "os")\nfunc solve(input string) string {\n  // Write your solution.\n  return ""\n}\nfunc main() { data, _ := ioutil.ReadAll(os.Stdin); fmt.Print(solve(string(data))) }\n',
};
