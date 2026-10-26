import { ProblemCandidate } from '../problem-candidate.types';

/** Fifth batch, medium. */
export const MEDIUM_CANDIDATES_5: ProblemCandidate[] = [
  {
    slug: 'valid-address',
    title: 'Is That an Address',
    statement: `Decide whether a line is a valid four part address.

**Input** — one line of text (possibly empty).
**Output** — \`true\` or \`false\`.

A valid address is four numbers joined by three dots. Each number is between
\`0\` and \`255\`, holds only digits, and may not start with a \`0\` unless it is
exactly \`0\`. Nothing else may appear, not even spaces.`,
    language: 'javascript',
    difficulty: 'medium',
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: '192.168.1.1', sample: true },
      { input: '256.1.1.1', sample: true },
      { input: '' },
      { input: '0.0.0.0' },
      { input: '01.1.1.1' },
      { input: '1.2.3' },
      { input: '255.255.255.255' },
      { input: '1.1.1.1.' },
    ],
    solutions: [
      // Split on the dots and judge each part
      `const line = require('fs').readFileSync(0, 'utf8').replace(/\\n$/, '');
const parts = line.split('.');
let ok = parts.length === 4;
if (ok) {
  for (const part of parts) {
    if (!/^\\d+$/.test(part)) { ok = false; break; }
    if (part.length > 1 && part[0] === '0') { ok = false; break; }
    if (Number(part) > 255) { ok = false; break; }
  }
}
process.stdout.write(ok ? 'true' : 'false');`,
      // A different route: one pattern describing the whole thing
      `const text = require('fs').readFileSync(0, 'utf8').replace(/\\n$/, '');
const part = '(25[0-5]|2[0-4]\\\\d|1\\\\d\\\\d|[1-9]\\\\d|\\\\d)';
const whole = new RegExp('^' + part + '\\\\.' + part + '\\\\.' + part + '\\\\.' + part + '$');
process.stdout.write(whole.test(text) ? 'true' : 'false');`,
    ],
  },

  {
    slug: 'pascal-triangle',
    title: 'Pascal Triangle',
    statement: `Print the first rows of Pascal's triangle.

**Input** — one integer \`N\`, zero or more.
**Output** — \`N\` lines. The first is \`1\`; every later row starts and ends with
\`1\`, and each number in between is the sum of the two above it. Numbers on a
row are separated by single spaces.

\`N\` of zero produces no output.`,
    language: 'python',
    difficulty: 'medium',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '5', sample: true },
      { input: '1', sample: true },
      { input: '0' },
      { input: '2' },
      { input: '3' },
      { input: '6' },
      { input: '8' },
    ],
    solutions: [
      // Each row built from the one before it
      `import sys
n = int(sys.stdin.read().strip())
rows = []
previous = []
for r in range(n):
    row = [1] * (r + 1)
    for c in range(1, r):
        row[c] = previous[c - 1] + previous[c]
    rows.append(" ".join(str(v) for v in row))
    previous = row
sys.stdout.write("\\n".join(rows))`,
      // A different route: each number worked out on its own
      `import sys
count = int(sys.stdin.read().strip())
lines = []
for r in range(count):
    row = []
    value = 1
    for c in range(r + 1):
        row.append(str(value))
        value = value * (r - c) // (c + 1)
    lines.append(" ".join(row))
sys.stdout.write("\\n".join(lines))`,
    ],
  },

  {
    slug: 'bracket-depth',
    title: 'How Deep Do They Nest',
    statement: `Measure how deeply brackets are nested.

**Input** — one line that may hold \`(\`, \`[\`, \`{\`, their closing partners, and
any other characters (possibly empty).
**Output** — the deepest level of nesting, or \`-1\` if the brackets do not
close properly.

Brackets close properly when every one is closed by its matching kind, in the
right order. Characters that are not brackets are ignored.`,
    language: 'python',
    difficulty: 'medium',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '((()))', sample: true },
      { input: '(]', sample: true },
      { input: '' },
      { input: '([{}])' },
      { input: '()()' },
      { input: '(((' },
      { input: 'a(b[c]d)e' },
    ],
    solutions: [
      // A stack, watching how tall it gets
      `import sys
line = sys.stdin.read().rstrip("\\n")
pairs = {")": "(", "]": "[", "}": "{"}
stack = []
deepest = 0
broken = False
for ch in line:
    if ch in "([{":
        stack.append(ch)
        deepest = max(deepest, len(stack))
    elif ch in pairs:
        if not stack or stack.pop() != pairs[ch]:
            broken = True
            break
if stack:
    broken = True
sys.stdout.write("-1" if broken else str(deepest))`,
      // A different route: a running level, plus a separate check of the kinds
      `import sys
text = sys.stdin.read().rstrip("\\n")
opens = "([{"
closes = ")]}"
level = 0
best = 0
kinds = []
ok = True
for ch in text:
    if ch in opens:
        kinds.append(ch)
        level += 1
        if level > best:
            best = level
    elif ch in closes:
        if level == 0 or opens.index(kinds[-1]) != closes.index(ch):
            ok = False
            break
        kinds.pop()
        level -= 1
if level != 0:
    ok = False
sys.stdout.write(str(best) if ok else "-1")`,
    ],
  },

  {
    slug: 'sort-three-colours',
    title: 'Three Colours',
    statement: `Put a line of zeros, ones and twos in order.

**Input** — one line holding only \`0\`, \`1\` and \`2\`, separated by single spaces
(possibly empty).
**Output** — the same values in increasing order, separated by single spaces.`,
    language: 'java',
    difficulty: 'medium',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // your code here
    }
}
`,
    inputs: [
      { input: '2 0 2 1 1 0', sample: true },
      { input: '2 0 1', sample: true },
      { input: '' },
      { input: '0' },
      { input: '1 1 1' },
      { input: '2 2 0 0' },
      { input: '1 0' },
    ],
    solutions: [
      // Count how many of each, then write them out
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int[] howMany = new int[3];
        while (scanner.hasNextInt()) howMany[scanner.nextInt()]++;
        StringBuilder out = new StringBuilder();
        for (int colour = 0; colour < 3; colour++) {
            for (int i = 0; i < howMany[colour]; i++) {
                if (out.length() > 0) out.append(' ');
                out.append(colour);
            }
        }
        System.out.print(out);
    }
}`,
      // A different route: three pointers, moving each value into place
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        List<Integer> values = new ArrayList<>();
        while (scanner.hasNextInt()) values.add(scanner.nextInt());
        int low = 0;
        int at = 0;
        int high = values.size() - 1;
        while (at <= high) {
            int v = values.get(at);
            if (v == 0) {
                Collections.swap(values, low, at);
                low++;
                at++;
            } else if (v == 2) {
                Collections.swap(values, at, high);
                high--;
            } else {
                at++;
            }
        }
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) out.append(' ');
            out.append(values.get(i));
        }
        System.out.print(out);
    }
}`,
    ],
  },

  {
    slug: 'where-it-belongs',
    title: 'Where It Belongs',
    statement: `Find where a number sits in a sorted list.

**Input** — the first line is the number to place, the second line is distinct
integers in increasing order, separated by single spaces (possibly empty).
**Output** — the position the number holds, counting from \`0\`, or the position
it would take if it were inserted.`,
    language: 'go',
    difficulty: 'medium',
    starterCode: `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var target int
	fmt.Fscan(reader, &target)
	// your code here
}
`,
    inputs: [
      { input: '5\n1 3 5 6', sample: true },
      { input: '2\n1 3 5 6', sample: true },
      { input: '7\n1 3 5 6' },
      { input: '0\n1 3 5 6' },
      { input: '1\n' },
      { input: '3\n3' },
      { input: '4\n1 2 3' },
    ],
    solutions: [
      // Halve the range until it closes
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var target int
	fmt.Fscan(reader, &target)
	nums := []int{}
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		nums = append(nums, n)
	}
	low, high := 0, len(nums)
	for low < high {
		middle := (low + high) / 2
		if nums[middle] < target {
			low = middle + 1
		} else {
			high = middle
		}
	}
	fmt.Print(low)
}`,
      // A different route: count how many are smaller
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var wanted int
	fmt.Fscan(reader, &wanted)
	smaller := 0
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		if n < wanted {
			smaller++
		}
	}
	fmt.Print(smaller)
}`,
    ],
  },
];
