import { ProblemCandidate } from '../problem-candidate.types';

/** Fifth batch, hard. */
export const HARD_CANDIDATES_5: ProblemCandidate[] = [
  {
    slug: 'ways-to-break',
    title: 'Ways to Break It Up',
    statement: `Count the ways a word can be cut into known pieces.

**Input** — the first line is the word, the second line is \`N\`, then \`N\` lines
of pieces. The word may be empty.
**Output** — how many different ways the word can be written as pieces joined
end to end. A piece may be used as often as you like.

An empty word can be made in exactly one way, by using nothing.`,
    language: 'javascript',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: 'catsanddog\n5\ncat\ncats\nand\nsand\ndog', sample: true },
      { input: 'aaa\n2\na\naa', sample: true },
      { input: '\n0' },
      { input: 'abc\n1\nab' },
      { input: 'aaaa\n1\na' },
      { input: 'ab\n2\na\nb' },
      { input: 'aaaaa\n2\na\naa' },
    ],
    solutions: [
      // Ways to reach each position, built from left to right
      `const lines = require('fs').readFileSync(0, 'utf8').split('\\n');
const word = lines[0] ?? '';
const count = Number(lines[1] ?? 0);
const pieces = [];
for (let i = 0; i < count; i++) pieces.push((lines[2 + i] ?? '').trim());

const ways = new Array(word.length + 1).fill(0);
ways[0] = 1;
for (let at = 1; at <= word.length; at++) {
  for (const piece of pieces) {
    if (piece.length <= at && word.startsWith(piece, at - piece.length)) {
      ways[at] += ways[at - piece.length];
    }
  }
}
process.stdout.write(String(ways[word.length]));`,
      // A different route: recursion from each position, remembering answers
      `const rows = require('fs').readFileSync(0, 'utf8').split('\\n');
const text = rows[0] ?? '';
const howMany = Number(rows[1] ?? 0);
const parts = [];
for (let i = 0; i < howMany; i++) parts.push((rows[2 + i] ?? '').trim());

const known = new Map();
function from(at) {
  if (at === text.length) return 1;
  if (known.has(at)) return known.get(at);
  let total = 0;
  for (const part of parts) {
    if (text.startsWith(part, at)) total += from(at + part.length);
  }
  known.set(at, total);
  return total;
}
process.stdout.write(String(from(0)));`,
    ],
  },

  {
    slug: 'hidden-copies',
    title: 'Hidden Copies',
    statement: `Count how often one word hides inside another.

**Input** — two lines: the text, then the word to find. Either may be empty.
**Output** — how many ways the word can be read out of the text by picking
characters in order, skipping whatever you like.

The characters need not be next to each other, but they must keep their order.
\`rabbbit\` hides \`rabbit\` three times. An empty word is hidden once in anything.`,
    language: 'python',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: 'rabbbit\nrabbit', sample: true },
      { input: 'babgbag\nbag', sample: true },
      { input: '\n' },
      { input: 'abc\n' },
      { input: '\nabc' },
      { input: 'aaa\na' },
      { input: 'abcde\nace' },
    ],
    solutions: [
      // A table over both, filled row by row
      `import sys
lines = sys.stdin.read().split("\\n")
text = lines[0] if lines else ""
word = lines[1] if len(lines) > 1 else ""
n, m = len(text), len(word)
table = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(n + 1):
    table[i][0] = 1
for i in range(1, n + 1):
    for j in range(1, m + 1):
        table[i][j] = table[i - 1][j]
        if text[i - 1] == word[j - 1]:
            table[i][j] += table[i - 1][j - 1]
sys.stdout.write(str(table[n][m]))`,
      // A different route: one rolling row, walked from the right
      `import sys
rows = sys.stdin.read().split("\\n")
body = rows[0] if rows else ""
needle = rows[1] if len(rows) > 1 else ""
counts = [0] * (len(needle) + 1)
counts[0] = 1
for ch in body:
    for j in range(len(needle), 0, -1):
        if needle[j - 1] == ch:
            counts[j] += counts[j - 1]
sys.stdout.write(str(counts[len(needle)]))`,
    ],
  },

  {
    slug: 'kth-arrangement',
    title: 'The Kth Arrangement',
    statement: `Find one particular arrangement without listing them all.

**Input** — the first line is \`N\` (between 1 and 8), the second line is \`K\`.
**Output** — the \`K\`th arrangement of the numbers \`1\` to \`N\`, counting from
\`1\`, when every arrangement is listed in increasing order. The numbers are
separated by single spaces.

With \`N\` of 3 the order is \`1 2 3\`, \`1 3 2\`, \`2 1 3\`, \`2 3 1\`, \`3 1 2\`,
\`3 2 1\`.`,
    language: 'python',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '3\n3', sample: true },
      { input: '4\n9', sample: true },
      { input: '1\n1' },
      { input: '3\n1' },
      { input: '3\n6' },
      { input: '5\n120' },
      { input: '4\n1' },
    ],
    solutions: [
      // Choose each place in turn, from how many arrangements it skips
      `import sys
import math
lines = sys.stdin.read().split()
n = int(lines[0])
k = int(lines[1]) - 1
left = list(range(1, n + 1))
out = []
for place in range(n, 0, -1):
    block = math.factorial(place - 1)
    which = k // block
    k = k % block
    out.append(str(left.pop(which)))
sys.stdout.write(" ".join(out))`,
      // A different route: step forward to the next arrangement, K-1 times
      `import sys
parts = sys.stdin.read().split()
size = int(parts[0])
target = int(parts[1])
values = list(range(1, size + 1))

def step(seq):
    i = len(seq) - 2
    while i >= 0 and seq[i] >= seq[i + 1]:
        i -= 1
    if i < 0:
        return False
    j = len(seq) - 1
    while seq[j] <= seq[i]:
        j -= 1
    seq[i], seq[j] = seq[j], seq[i]
    seq[i + 1:] = reversed(seq[i + 1:])
    return True

for _ in range(target - 1):
    step(values)
sys.stdout.write(" ".join(str(v) for v in values))`,
    ],
  },

  {
    slug: 'insertions-to-palindrome',
    title: 'Make It Read Both Ways',
    statement: `Count the letters needed to make a word read the same backwards.

**Input** — one line of text (possibly empty).
**Output** — the smallest number of characters that must be inserted anywhere
in the line so that it reads the same in both directions.

\`ab\` needs one. \`abcba\` needs none.`,
    language: 'java',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        if (line == null) line = "";
        // your code here
    }
}
`,
    inputs: [
      { input: 'ab', sample: true },
      { input: 'abcba', sample: true },
      { input: '' },
      { input: 'aa' },
      { input: 'abcd' },
      { input: 'abcda' },
      { input: 'leetcode' },
    ],
    solutions: [
      // What is left once the longest stretch reading both ways is kept
      `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        if (line == null) line = "";
        int n = line.length();
        // needed[i][j] - insertions to fix the stretch from i to j
        int[][] needed = new int[n][n];
        for (int width = 2; width <= n; width++) {
            for (int i = 0; i + width - 1 < n; i++) {
                int j = i + width - 1;
                if (line.charAt(i) == line.charAt(j)) {
                    needed[i][j] = needed[i + 1][j - 1];
                } else {
                    needed[i][j] = 1 + Math.min(needed[i + 1][j], needed[i][j - 1]);
                }
            }
        }
        System.out.print(n == 0 ? 0 : needed[0][n - 1]);
    }
}`,
      // A different route: the length not shared with the reversed line
      `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        if (line == null) line = "";
        String backwards = new StringBuilder(line).reverse().toString();
        int n = line.length();
        int[][] shared = new int[n + 1][n + 1];
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= n; j++) {
                if (line.charAt(i - 1) == backwards.charAt(j - 1)) {
                    shared[i][j] = shared[i - 1][j - 1] + 1;
                } else {
                    shared[i][j] = Math.max(shared[i - 1][j], shared[i][j - 1]);
                }
            }
        }
        System.out.print(n - shared[n][n]);
    }
}`,
    ],
  },

  {
    slug: 'circular-best-run',
    title: 'The Best Run, Round a Circle',
    statement: `Find the best stretch when the list joins up end to end.

**Input** — one line of integers separated by single spaces (possibly empty).
**Output** — the largest total of any run of one or more neighbouring numbers,
where the end of the list is next to its start.

Each number may be used at most once. Print \`0\` if there are no numbers.
\`5 -3 5\` gives \`10\`, from the two fives with the middle skipped.`,
    language: 'go',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	_ = reader
	fmt.Print("")
}
`,
    inputs: [
      { input: '5 -3 5', sample: true },
      { input: '1 -2 3 -2', sample: true },
      { input: '' },
      { input: '-3 -2 -3' },
      { input: '3' },
      { input: '1 2 3' },
      { input: '-2 4 -5 4 -5 9 4' },
    ],
    solutions: [
      // The best straight run, against everything except the worst run
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	nums := []int{}
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		nums = append(nums, n)
	}
	if len(nums) == 0 {
		fmt.Print(0)
		return
	}
	total := 0
	best, here := nums[0], 0
	worst, thereto := nums[0], 0
	for _, v := range nums {
		total += v
		if here < 0 {
			here = 0
		}
		here += v
		if here > best {
			best = here
		}
		if thereto > 0 {
			thereto = 0
		}
		thereto += v
		if thereto < worst {
			worst = thereto
		}
	}
	// everything taken away leaves nothing, so that case does not count
	if worst == total {
		fmt.Print(best)
		return
	}
	wrapped := total - worst
	if wrapped > best {
		fmt.Print(wrapped)
	} else {
		fmt.Print(best)
	}
}`,
      // A different route: try every start and walk once round
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	values := []int{}
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		values = append(values, n)
	}
	n := len(values)
	if n == 0 {
		fmt.Print(0)
		return
	}
	best := values[0]
	for start := 0; start < n; start++ {
		sum := 0
		for length := 1; length <= n; length++ {
			sum += values[(start+length-1)%n]
			if sum > best {
				best = sum
			}
		}
	}
	fmt.Print(best)
}`,
    ],
  },
];
